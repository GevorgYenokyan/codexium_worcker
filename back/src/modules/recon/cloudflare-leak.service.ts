import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PassiveDnsCache } from './models/passive-dns-cache.model';
import * as dns from 'dns';
import * as tls from 'tls';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { CDN_RANGES, KNOWN_PLATFORM_RANGES } from './data/ip-ranges';

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveSoa = promisify(dns.resolveSoa);
const dnsResolveCaa = promisify(dns.resolveCaa);
const dnsReverse = promisify(dns.reverse);

// ─── CDN Types ────────────────────────────────────────────────────────────────
export type CdnProvider =
  | 'Cloudflare'
  | 'Fastly'
  | 'CloudFront'
  | 'Akamai'
  | 'Sucuri'
  | 'BunnyCDN'
  | 'KeyCDN'
  | 'Incapsula';

// ─── CDN IP ranges ────────────────────────────────────────────────────────────
// prettier-ignore

// ─── Known public platform IP ranges (NOT origin servers) ────────────────────
// These are well-known infrastructure IPs that will NEVER be an origin server
// for a domain behind a CDN. Leaking them from robots.txt/sitemap links is
// a false positive — the site just embeds links to these platforms.
// prettier-ignore

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Minimum chars of body to fetch for vhost fingerprinting
const VHOST_BODY_BYTES = 8192;

// ─── Subdomains commonly NOT proxied through CDNs ─────────────────────────────
const BYPASS_SUBDOMAINS = [
  'mail',
  'smtp',
  'pop',
  'imap',
  'mx',
  'mx1',
  'mx2',
  'ftp',
  'sftp',
  'ftps',
  'cpanel',
  'whm',
  'webdisk',
  'direct',
  'origin',
  'server',
  'host',
  'raw',
  'vpn',
  'ssh',
  'remote',
  'rdp',
  'git',
  'autodiscover',
  'autoconfig',
  'dev',
  'staging',
  'test',
  'api',
  'shop',
  'store',
  'old',
  'legacy',
  'panel',
  'admin',
  'portal',
  'status',
  'monitor',
];

// ─── Result interfaces ────────────────────────────────────────────────────────

export interface LeakedIp {
  ip: string;
  source: string;
  isCdn: boolean;
  confidence: 'high' | 'medium' | 'low';
  ptrHostname?: string | null;
  // NEW: result of virtual-host probe
  vhostMatch?: boolean | null; // null = not attempted / firewall blocked
  knownPlatform?: string | null; // non-null = filtered out (Google, Facebook…)
}

export interface MxRecord {
  exchange: string;
  priority: number;
  ips: string[];
  isCdn: boolean;
  cdnProvider: CdnProvider | null;
}

export interface BypassSubdomain {
  subdomain: string;
  ips: string[];
  isCdn: boolean;
  cdnProvider: CdnProvider | null;
}

export interface SslCertInfo {
  subject: string;
  issuer: string;
  fingerprint256: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  subjectAltNames: string[];
}

export interface PassiveDnsRecord {
  hostname: string;
  ip: string;
  source: string;
}

export interface FaviconInfo {
  hash: number;
  md5: string;
  fetched: boolean;
  searchUrl: string;
}

export interface CaaInfo {
  caas: string[];
  hasDirectCert: boolean;
}

export interface HeaderProbeResult {
  leakedHeaders: Record<string, string>;
  serverHint: string | null;
}

// NEW: what the vhost fingerprinter collected from the canonical domain
interface DomainFingerprint {
  title: string | null;
  bodyHash: string | null;
  statusCode: number | null;
  server: string | null;
}

export interface CdnLeakResult {
  domain: string;
  isCdn: boolean;
  cdnProvider: CdnProvider | null;
  cdnIps: string[];

  leakedIps: LeakedIp[];
  spfIps: string[];
  mxIps: MxRecord[];
  bypassSubdomains: BypassSubdomain[];
  passiveDns: PassiveDnsRecord[];
  sslCert: SslCertInfo | null;
  certRelatedDomains: string[];
  favicon: FaviconInfo | null;

  caaInfo: CaaInfo;
  headerProbe: HeaderProbeResult;
  soaIps: string[];
  dmarcIps: string[];
  bimiIps: string[];
  robotsIps: string[];

  // NEW: IPs that were collected but discarded as known public platforms
  filteredPlatformIps: Array<{ ip: string; label: string; source: string }>;

  confidence: 'high' | 'medium' | 'low' | 'not_found';
  summary: string;
  recommendations: string[];
  scannedAt: string;
}

// ─── Module-level helpers ─────────────────────────────────────────────────────

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
}

function ipInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/');
    const mask = ~((1 << (32 - parseInt(bits))) - 1);
    return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
  } catch {
    return false;
  }
}

function detectCdn(ip: string): CdnProvider | null {
  for (const { cidr, provider } of CDN_RANGES) {
    if (ipInCidr(ip, cidr)) return provider;
  }
  return null;
}

function isCdnIp(ip: string): boolean {
  return detectCdn(ip) !== null;
}

// Returns the platform label if this IP belongs to a well-known public platform
// (Google, Facebook, etc.) that should never be an origin server.
function getKnownPlatformLabel(ip: string): string | null {
  for (const { cidr, label } of KNOWN_PLATFORM_RANGES) {
    if (ipInCidr(ip, cidr)) return label;
  }
  return null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CloudflareLeakService {
  private readonly logger = new Logger(CloudflareLeakService.name);

  constructor(
    @InjectModel(PassiveDnsCache)
    private passiveDnsCacheRepo: typeof PassiveDnsCache,
  ) {}

  async findRealIp(domain: string): Promise<CdnLeakResult> {
    this.logger.log(`CDN leak check: ${domain}`);

    const wildcardIps = await this.detectWildcardIps(domain);
    if (wildcardIps.size > 0) {
      this.logger.warn(
        `Wildcard DNS on ${domain}: ${[...wildcardIps].join(', ')}`,
      );
    }

    const [
      mainIps,
      mxRecords,
      spfIps,
      bypassResults,
      passiveDns,
      sslCert,
      certRelatedDomains,
      favicon,
      soaIps,
      dmarcIps,
      caaInfo,
      bimiIps,
      robotsIps,
      headerProbe,
    ] = await Promise.all([
      this.resolveMainDomain(domain),
      this.checkMxRecords(domain),
      this.checkSpfRecord(domain),
      this.checkBypassSubdomains(domain, wildcardIps),
      this.fetchPassiveDns(domain),
      this.fetchSslCert(domain),
      this.findCertRelatedDomains(domain),
      this.fetchFaviconHash(domain),
      this.checkSoaRecord(domain),
      this.checkDmarcRecord(domain),
      this.checkCaaRecords(domain),
      this.checkBimiRecord(domain),
      this.checkRobotsAndSitemap(domain),
      this.probeResponseHeaders(domain),
    ]);

    const cdnIps = mainIps.filter((ip) => isCdnIp(ip));
    const isCdn = cdnIps.length > 0 && cdnIps.length === mainIps.length;
    const cdnProvider = cdnIps.length > 0 ? detectCdn(cdnIps[0]) : null;

    // ── Collect raw candidates ───────────────────────────────────────────────
    interface RawCandidate {
      ip: string;
      source: string;
      confidence: LeakedIp['confidence'];
    }
    const rawCandidates: RawCandidate[] = [];

    const pushCandidate = (
      ip: string,
      source: string,
      confidence: LeakedIp['confidence'],
    ) => {
      if (this.isValidPublicIp(ip) && !isCdnIp(ip)) {
        rawCandidates.push({ ip, source, confidence });
      }
    };

    for (const mx of mxRecords) {
      for (const ip of mx.ips) pushCandidate(ip, `MX (${mx.exchange})`, 'high');
    }
    for (const ip of spfIps) pushCandidate(ip, 'SPF record', 'high');
    for (const sub of bypassResults) {
      if (!sub.isCdn) {
        for (const ip of sub.ips)
          pushCandidate(ip, `Subdomain (${sub.subdomain})`, 'medium');
      }
    }
    for (const rec of passiveDns)
      pushCandidate(rec.ip, `Passive DNS (${rec.source})`, 'medium');
    for (const ip of soaIps) pushCandidate(ip, 'SOA record', 'high');
    for (const ip of dmarcIps) pushCandidate(ip, 'DMARC rua/ruf', 'high');
    for (const ip of bimiIps) pushCandidate(ip, 'BIMI record', 'medium');
    for (const ip of robotsIps)
      pushCandidate(ip, 'robots.txt/sitemap', 'medium');

    if (headerProbe.serverHint) {
      const hintIps = await this.resolveHostSafe(headerProbe.serverHint);
      for (const ip of hintIps)
        pushCandidate(
          ip,
          `Response header hint (${headerProbe.serverHint})`,
          'high',
        );
    }

    // ── Step 1: filter known public platform IPs ─────────────────────────────
    const filteredPlatformIps: CdnLeakResult['filteredPlatformIps'] = [];
    const passedCandidates: RawCandidate[] = [];

    for (const c of rawCandidates) {
      const platformLabel = getKnownPlatformLabel(c.ip);
      if (platformLabel) {
        // Only add to filtered list once per IP
        if (!filteredPlatformIps.find((f) => f.ip === c.ip)) {
          filteredPlatformIps.push({
            ip: c.ip,
            label: platformLabel,
            source: c.source,
          });
          this.logger.debug(
            `Filtered out ${c.ip} (${c.source}) — belongs to ${platformLabel}`,
          );
        }
      } else {
        passedCandidates.push(c);
      }
    }

    // ── Step 2: deduplicate passed candidates by IP ───────────────────────────
    const leakedMap = new Map<string, LeakedIp>();
    for (const c of passedCandidates) {
      const existing = leakedMap.get(c.ip);
      leakedMap.set(c.ip, {
        ip: c.ip,
        source: existing ? `${existing.source}, ${c.source}` : c.source,
        isCdn: false,
        confidence: existing ? 'high' : c.confidence,
        ptrHostname: existing?.ptrHostname ?? null,
        vhostMatch: null,
        knownPlatform: null,
      });
    }

    // ── Step 3: PTR enrichment ────────────────────────────────────────────────
    let leakedIps = await this.enrichWithPtr([...leakedMap.values()], domain);

    // Upgrade confidence when PTR hostname belongs to target domain
    for (const leak of leakedIps) {
      if (
        leak.ptrHostname &&
        (leak.ptrHostname.endsWith(`.${domain}`) || leak.ptrHostname === domain)
      ) {
        leak.confidence = 'high';
      }
    }

    // ── Step 4: virtual-host fingerprint probe ────────────────────────────────
    // Only probe IPs that are NOT obviously mail/infrastructure servers
    // (MX IPs from known mail providers are real leaks but NOT the web origin)
    if (isCdn && leakedIps.length > 0) {
      const domainFp = await this.fetchDomainFingerprint(domain);
      if (domainFp) {
        leakedIps = await this.vhostProbeAll(leakedIps, domain, domainFp);
      }
    }

    // ── Overall confidence ────────────────────────────────────────────────────
    let confidence: CdnLeakResult['confidence'] = 'not_found';
    if (leakedIps.length > 0) {
      const hasConfirmed = leakedIps.some((l) => l.vhostMatch === true);
      const hasHigh = leakedIps.some((l) => l.confidence === 'high');
      confidence =
        hasConfirmed || hasHigh
          ? 'high'
          : leakedIps.length >= 2
            ? 'medium'
            : 'low';
    }

    return {
      domain,
      isCdn,
      cdnProvider,
      cdnIps,

      leakedIps,
      spfIps,
      mxIps: mxRecords,
      bypassSubdomains: bypassResults,
      passiveDns,
      sslCert,
      certRelatedDomains,
      favicon,

      caaInfo,
      headerProbe,
      soaIps,
      dmarcIps,
      bimiIps,
      robotsIps,
      filteredPlatformIps,

      confidence,
      summary: this.buildSummary(
        isCdn,
        cdnProvider,
        leakedIps,
        certRelatedDomains.length,
        caaInfo,
      ),
      recommendations: this.buildRecommendations(
        isCdn,
        cdnProvider,
        leakedIps,
        sslCert,
        favicon,
        caaInfo,
        headerProbe,
      ),
      scannedAt: new Date().toISOString(),
    };
  }

  // ─── 1. Main domain ───────────────────────────────────────────────────────

  private async resolveMainDomain(domain: string): Promise<string[]> {
    try {
      return await Promise.race([
        dnsResolve4(domain),
        new Promise<string[]>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]);
    } catch {
      return [];
    }
  }

  // ─── 2. MX records ───────────────────────────────────────────────────────

  private async checkMxRecords(domain: string): Promise<MxRecord[]> {
    try {
      const mxList = await Promise.race([
        dnsResolveMx(domain),
        new Promise<dns.MxRecord[]>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]);
      const results = await Promise.all(
        mxList.map(async (mx) => {
          const ips = await this.resolveHostSafe(mx.exchange);
          const provider = ips.length > 0 ? detectCdn(ips[0]) : null;
          return {
            exchange: mx.exchange,
            priority: mx.priority,
            ips,
            isCdn: ips.every((ip) => isCdnIp(ip)),
            cdnProvider: provider,
          };
        }),
      );
      return results.filter((r) => r.ips.length > 0);
    } catch {
      return [];
    }
  }

  // ─── 3. SPF record ───────────────────────────────────────────────────────

  private async checkSpfRecord(domain: string): Promise<string[]> {
    try {
      const txt = await Promise.race([
        dnsResolveTxt(domain),
        new Promise<string[][]>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]);
      const flat = txt.flat().join(' ');
      const ips: string[] = [];
      const ip4 = flat.match(/ip4:([\d./]+)/gi) ?? [];
      for (const m of ip4) {
        const ip = m.replace(/ip4:/i, '').split('/')[0];
        if (this.isValidPublicIp(ip)) ips.push(ip);
      }
      const includes = flat.match(/include:(\S+)/gi) ?? [];
      const resolved = await Promise.all(
        includes
          .slice(0, 3)
          .map((inc) => this.resolveHostSafe(inc.replace(/include:/i, ''))),
      );
      ips.push(...resolved.flat());
      return [...new Set(ips)];
    } catch {
      return [];
    }
  }

  // ─── 4. Wildcard DNS detection ────────────────────────────────────────────

  private async detectWildcardIps(domain: string): Promise<Set<string>> {
    const probe = `cdn-leak-probe-${Date.now()}.${domain}`;
    try {
      const ips = await Promise.race([
        dnsResolve4(probe),
        new Promise<string[]>((_, rej) =>
          setTimeout(() => rej(new Error()), 3_000),
        ),
      ]);
      return new Set(ips);
    } catch {
      return new Set();
    }
  }

  // ─── 5. Bypass subdomains ─────────────────────────────────────────────────

  private async checkBypassSubdomains(
    domain: string,
    wildcardIps: Set<string>,
  ): Promise<BypassSubdomain[]> {
    const results: BypassSubdomain[] = [];
    const BATCH = 10;
    for (let i = 0; i < BYPASS_SUBDOMAINS.length; i += BATCH) {
      const batch = BYPASS_SUBDOMAINS.slice(i, i + BATCH);
      const resolved = await Promise.all(
        batch.map(async (prefix) => {
          const fqdn = `${prefix}.${domain}`;
          const ips = await this.resolveHostSafe(fqdn);
          if (!ips.length) return null;
          if (wildcardIps.size > 0 && ips.every((ip) => wildcardIps.has(ip)))
            return null;
          const provider = detectCdn(ips[0]);
          return {
            subdomain: fqdn,
            ips,
            isCdn: ips.every((ip) => isCdnIp(ip)),
            cdnProvider: provider,
          };
        }),
      );
      results.push(...(resolved.filter(Boolean) as BypassSubdomain[]));
    }
    return results;
  }

  // ─── 6. Passive DNS (cached, 4 sources) ──────────────────────────────────

  private async fetchPassiveDns(domain: string): Promise<PassiveDnsRecord[]> {
    const cached = await this.passiveDnsCacheRepo.findOne({
      where: { domain },
    });
    if (cached) {
      const age = Date.now() - new Date(cached.updatedAt).getTime();
      if (age < CACHE_TTL_MS) {
        await cached.increment('hitCount');
        this.logger.log(
          `Passive DNS cache hit for ${domain} (hits: ${cached.hitCount + 1})`,
        );
        return JSON.parse(cached.records) as PassiveDnsRecord[];
      }
    }
    const records = await this.fetchFromAllPassiveSources(domain);
    if (cached) {
      cached.records = JSON.stringify(records);
      cached.source = 'multi';
      cached.hitCount = 1;
      await cached.save();
    } else {
      await this.passiveDnsCacheRepo.create({
        domain,
        records: JSON.stringify(records),
        source: 'multi',
        hitCount: 1,
      });
    }
    return records;
  }

  private async fetchFromAllPassiveSources(
    domain: string,
  ): Promise<PassiveDnsRecord[]> {
    const [htRecords, crtRecords, anubisRecords, columbusRecords] =
      await Promise.allSettled([
        this.fetchHackerTarget(domain),
        this.fetchCrtShIps(domain),
        this.fetchAnubisDB(domain),
        this.fetchColumbusProject(domain),
      ]);
    const all: PassiveDnsRecord[] = [];
    if (htRecords.status === 'fulfilled') all.push(...htRecords.value);
    if (crtRecords.status === 'fulfilled') all.push(...crtRecords.value);
    if (anubisRecords.status === 'fulfilled') all.push(...anubisRecords.value);
    if (columbusRecords.status === 'fulfilled')
      all.push(...columbusRecords.value);
    const seen = new Set<string>();
    return all.filter((r) => {
      if (seen.has(r.ip)) return false;
      seen.add(r.ip);
      return true;
    });
  }

  private async fetchHackerTarget(domain: string): Promise<PassiveDnsRecord[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(
        `https://api.hackertarget.com/hostsearch/?q=${domain}`,
        {
          signal: controller.signal,
          headers: { 'User-Agent': 'SecurityScanner/1.0' },
        },
      );
      clearTimeout(timer);
      if (!res.ok) return [];
      const text = await res.text();
      if (text.includes('API count exceeded') || text.includes('error')) {
        this.logger.warn(`HackerTarget rate limit reached for ${domain}`);
        return [];
      }
      const records: PassiveDnsRecord[] = [];
      for (const line of text.split('\n')) {
        const parts = line.trim().split(',');
        if (parts.length < 2) continue;
        const [hostname, ip] = parts;
        if (
          hostname &&
          ip &&
          this.isValidPublicIp(ip.trim()) &&
          !isCdnIp(ip.trim())
        ) {
          records.push({
            hostname: hostname.trim(),
            ip: ip.trim(),
            source: 'HackerTarget',
          });
        }
      }
      this.logger.log(`HackerTarget: ${records.length} records for ${domain}`);
      return records;
    } catch {
      return [];
    }
  }

  private async fetchCrtShIps(domain: string): Promise<PassiveDnsRecord[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(
        `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
        { signal: controller.signal, headers: { Accept: 'application/json' } },
      );
      clearTimeout(timer);
      if (!res.ok) return [];
      const data: Array<{ name_value: string }> = await res.json();
      const subdomains = new Set<string>();
      for (const entry of data) {
        for (const line of entry.name_value.split('\n')) {
          const name = line.trim().toLowerCase().replace(/^\*\./, '');
          if (name.endsWith(`.${domain}`) || name === domain)
            subdomains.add(name);
        }
      }
      const records: PassiveDnsRecord[] = [];
      const BATCH = 10;
      const subList = [...subdomains].slice(0, 50);
      for (let i = 0; i < subList.length; i += BATCH) {
        const batch = subList.slice(i, i + BATCH);
        const resolved = await Promise.allSettled(
          batch.map(async (sub) => {
            const ips = await this.resolveHostSafe(sub);
            return ips
              .filter((ip) => !isCdnIp(ip))
              .map((ip) => ({ hostname: sub, ip, source: 'crt.sh' }));
          }),
        );
        for (const r of resolved) {
          if (r.status === 'fulfilled') records.push(...r.value);
        }
      }
      this.logger.log(`crt.sh: ${records.length} non-CDN IPs for ${domain}`);
      return records;
    } catch {
      return [];
    }
  }

  private async fetchAnubisDB(domain: string): Promise<PassiveDnsRecord[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(`https://jldc.me/anubis/subdomains/${domain}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SecurityScanner/1.0' },
      });
      clearTimeout(timer);
      if (!res.ok) return [];
      const subdomains: string[] = await res.json();
      if (!Array.isArray(subdomains)) return [];
      const records: PassiveDnsRecord[] = [];
      const BATCH = 10;
      for (let i = 0; i < Math.min(subdomains.length, 30); i += BATCH) {
        const batch = subdomains.slice(i, i + BATCH);
        const resolved = await Promise.allSettled(
          batch.map(async (sub) => {
            const ips = await this.resolveHostSafe(sub);
            return ips
              .filter((ip) => !isCdnIp(ip))
              .map((ip) => ({ hostname: sub, ip, source: 'AnubisDB' }));
          }),
        );
        for (const r of resolved) {
          if (r.status === 'fulfilled') records.push(...r.value);
        }
      }
      this.logger.log(`AnubisDB: ${records.length} non-CDN IPs for ${domain}`);
      return records;
    } catch {
      return [];
    }
  }

  private async fetchColumbusProject(
    domain: string,
  ): Promise<PassiveDnsRecord[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(
        `https://columbus.elmasy.com/api/subdomains/${domain}`,
        {
          signal: controller.signal,
          headers: { 'User-Agent': 'SecurityScanner/1.0' },
        },
      );
      clearTimeout(timer);
      if (!res.ok) return [];
      const subdomains: string[] = await res.json();
      if (!Array.isArray(subdomains)) return [];
      const records: PassiveDnsRecord[] = [];
      const BATCH = 10;
      for (let i = 0; i < Math.min(subdomains.length, 40); i += BATCH) {
        const batch = subdomains.slice(i, i + BATCH);
        const resolved = await Promise.allSettled(
          batch.map(async (sub) => {
            const ips = await this.resolveHostSafe(sub);
            return ips
              .filter((ip) => !isCdnIp(ip))
              .map((ip) => ({ hostname: sub, ip, source: 'Columbus' }));
          }),
        );
        for (const r of resolved) {
          if (r.status === 'fulfilled') records.push(...r.value);
        }
      }
      this.logger.log(`Columbus: ${records.length} non-CDN IPs for ${domain}`);
      return records;
    } catch {
      return [];
    }
  }

  // ─── 7. SSL Certificate ───────────────────────────────────────────────────

  private fetchSslCert(domain: string): Promise<SslCertInfo | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 8_000);
      try {
        const socket = tls.connect(
          {
            host: domain,
            port: 443,
            servername: domain,
            rejectUnauthorized: false,
          },
          () => {
            clearTimeout(timer);
            const cert = socket.getPeerCertificate(true);
            socket.destroy();
            if (!cert?.subject) {
              resolve(null);
              return;
            }
            const sans: string[] = [];
            if (cert.subjectaltname) {
              const m = cert.subjectaltname.match(/DNS:[^,]+/g) ?? [];
              sans.push(...m.map((s) => s.replace('DNS:', '').trim()));
            }
            resolve({
              subject: cert.subject?.CN ?? 'Unknown',
              issuer: cert.issuer?.CN ?? 'Unknown',
              fingerprint256: cert.fingerprint256 ?? '',
              serialNumber: cert.serialNumber ?? '',
              validFrom: cert.valid_from ?? '',
              validTo: cert.valid_to ?? '',
              subjectAltNames: sans,
            });
          },
        );
        socket.on('error', () => {
          clearTimeout(timer);
          resolve(null);
        });
      } catch {
        clearTimeout(timer);
        resolve(null);
      }
    });
  }

  // ─── 8. Cert-related domains (crt.sh) ────────────────────────────────────

  private async findCertRelatedDomains(domain: string): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(
        `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
        { signal: controller.signal, headers: { Accept: 'application/json' } },
      );
      clearTimeout(timer);
      if (!res.ok) return [];
      const data: Array<{ name_value: string }> = await res.json();
      const seen = new Set<string>();
      for (const entry of data) {
        for (const line of entry.name_value.split('\n')) {
          const name = line.trim().toLowerCase().replace(/^\*\./, '');
          if (name && !name.includes(domain) && name.includes('.'))
            seen.add(name);
        }
      }
      return [...seen].slice(0, 20);
    } catch {
      return [];
    }
  }

  // ─── 9. Favicon hash (Shodan mmh3) ───────────────────────────────────────

  private async fetchFaviconHash(domain: string): Promise<FaviconInfo | null> {
    for (const path of ['/favicon.ico', '/favicon.png']) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6_000);
        const res = await fetch(`https://${domain}${path}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        clearTimeout(timer);
        if (!res.ok || res.status === 404) continue;
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('image') && !ct.includes('octet')) continue;
        const bytes: any = Buffer.from(await res.arrayBuffer());
        const md5 = crypto.createHash('md5').update(bytes).digest('hex');
        const hash = this.mmh3(bytes.toString('base64'));
        return {
          hash,
          md5,
          fetched: true,
          searchUrl: `https://www.shodan.io/search?query=http.favicon.hash%3A${hash}`,
        };
      } catch {
        continue;
      }
    }
    return null;
  }

  // ─── 10. SOA record ───────────────────────────────────────────────────────

  private async checkSoaRecord(domain: string): Promise<string[]> {
    try {
      const soa: any = await Promise.race([
        dnsResolveSoa(domain),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]);
      const rname = soa.rname.replace(/\.$/, '');
      const hostPart = rname.replace(/^[^.]+\./, '');
      if (!hostPart || !hostPart.includes('.')) return [];
      const ips = await this.resolveHostSafe(hostPart);
      this.logger.log(`SOA rname host ${hostPart}: ${ips}`);
      return ips;
    } catch {
      return [];
    }
  }

  // ─── 11. DMARC rua/ruf ───────────────────────────────────────────────────

  private async checkDmarcRecord(domain: string): Promise<string[]> {
    try {
      const txt = await Promise.race([
        dnsResolveTxt(`_dmarc.${domain}`),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]);
      const flat = txt.flat().join(' ');
      const emails = flat.match(/(?:rua|ruf)=mailto:[^@]+@([^;,\s]+)/gi) ?? [];
      const hosts = [
        ...new Set(
          emails.map((e) => e.replace(/.*@/, '').replace(/[;,\s].*/, '')),
        ),
      ];
      const resolved = await Promise.all(
        hosts.map((h) => this.resolveHostSafe(h)),
      );
      return resolved.flat();
    } catch {
      return [];
    }
  }

  // ─── 12. CAA records ─────────────────────────────────────────────────────

  private async checkCaaRecords(domain: string): Promise<CaaInfo> {
    try {
      const caa = await Promise.race([
        dnsResolveCaa(domain),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]);
      const caas = caa.map((r: any) => r.value);
      const directCAs = [
        'letsencrypt.org',
        'acme-v02.api.letsencrypt.org',
        'zerossl.com',
        'buypass.com',
      ];
      const hasDirectCert = caas.some((c) =>
        directCAs.some((d) => c.includes(d)),
      );
      if (hasDirectCert)
        this.logger.log(
          `CAA on ${domain} allows direct cert issuance: ${caas}`,
        );
      return { caas, hasDirectCert };
    } catch {
      return { caas: [], hasDirectCert: false };
    }
  }

  // ─── 13. BIMI record ─────────────────────────────────────────────────────

  private async checkBimiRecord(domain: string): Promise<string[]> {
    try {
      const txt = await Promise.race([
        dnsResolveTxt(`default._bimi.${domain}`),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error()), 4_000),
        ),
      ]);
      const flat = txt.flat().join(' ');
      const urlMatch = flat.match(/l=https?:\/\/([^\/\s;]+)/i);
      if (!urlMatch) return [];
      return await this.resolveHostSafe(urlMatch[1]);
    } catch {
      return [];
    }
  }

  // ─── 14. robots.txt / sitemap ─────────────────────────────────────────────

  private async checkRobotsAndSitemap(domain: string): Promise<string[]> {
    const ips: string[] = [];
    const paths = ['/robots.txt', '/sitemap.xml', '/sitemap_index.xml'];
    for (const path of paths) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5_000);
        const res = await fetch(`https://${domain}${path}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        clearTimeout(timer);
        if (!res.ok) continue;
        const text = await res.text();
        const urlMatches =
          text.match(/https?:\/\/([a-z0-9._-]+\.[a-z]{2,})/gi) ?? [];
        for (const urlStr of urlMatches) {
          try {
            const host = new URL(urlStr).hostname;
            if (host === domain || host.endsWith(`.${domain}`)) continue;
            const resolved = await this.resolveHostSafe(host);
            ips.push(...resolved.filter((ip) => !isCdnIp(ip)));
          } catch {
            continue;
          }
        }
      } catch {
        continue;
      }
    }
    return [...new Set(ips)];
  }

  // ─── 15. Response headers probe ──────────────────────────────────────────

  private async probeResponseHeaders(
    domain: string,
  ): Promise<HeaderProbeResult> {
    const LEAK_HEADERS = [
      'x-backend-server',
      'x-served-by',
      'x-origin-server',
      'x-real-server',
      'x-upstream',
      'server-timing',
      'x-powered-by',
      'x-varnish',
      'via',
    ];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6_000);
      const res = await fetch(`https://${domain}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'manual',
      });
      clearTimeout(timer);
      const leaked: Record<string, string> = {};
      for (const h of LEAK_HEADERS) {
        const val = res.headers.get(h);
        if (val) leaked[h] = val;
      }
      const st = res.headers.get('server-timing') ?? '';
      const hostMatch = st.match(
        /(?:upstream-host|origin|backend)=([a-z0-9._-]+\.[a-z]{2,})/i,
      );
      return {
        leakedHeaders: leaked,
        serverHint: hostMatch ? hostMatch[1] : null,
      };
    } catch {
      return { leakedHeaders: {}, serverHint: null };
    }
  }

  // ─── 16. PTR reverse DNS enrichment ──────────────────────────────────────

  private async enrichWithPtr(
    leaks: LeakedIp[],
    _domain: string,
  ): Promise<LeakedIp[]> {
    return Promise.all(
      leaks.map(async (leak) => {
        try {
          const hostnames = await Promise.race([
            dnsReverse(leak.ip),
            new Promise<never>((_, rej) =>
              setTimeout(() => rej(new Error()), 3_000),
            ),
          ]);
          return { ...leak, ptrHostname: hostnames[0] ?? null };
        } catch {
          return { ...leak, ptrHostname: null };
        }
      }),
    );
  }

  // ─── NEW 17. Domain fingerprint — fetch canonical response for comparison ──
  // We grab title + first N bytes of body hash from the real domain URL.
  // This is our "expected" response to compare against direct-IP probes.

  private async fetchDomainFingerprint(
    domain: string,
  ): Promise<DomainFingerprint | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(`https://${domain}/`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/2.0)',
        },
      });
      clearTimeout(timer);
      if (!res.ok) return null;

      const buf = await res.arrayBuffer();
      const body = Buffer.from(buf).toString('utf8', 0, VHOST_BODY_BYTES);
      const titleMatch = body.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
      const bodyHash = crypto
        .createHash('md5')
        .update(body.slice(0, 2048))
        .digest('hex');

      return {
        title: titleMatch ? titleMatch[1].trim() : null,
        bodyHash,
        statusCode: res.status,
        server: res.headers.get('server'),
      };
    } catch {
      return null;
    }
  }

  // ─── NEW 18. Virtual-host probe — confirm origin by matching fingerprint ───
  // For each candidate IP we make an HTTP/HTTPS request with Host: domain
  // and compare the response against the canonical fingerprint.
  //
  // Why this works: the origin server serves the same content regardless of
  // whether the request arrives via Cloudflare or directly. If the title/body
  // hash matches → this IP is serving the domain → confirmed origin.
  //
  // Why firewall isn't a problem: if the connection is blocked we get null
  // (vhostMatch: null) and leave the IP in the results with its existing
  // confidence level. We only UPGRADE confidence on a positive match;
  // we never DISCARD an IP because of a failed probe.

  private async vhostProbeAll(
    leaks: LeakedIp[],
    domain: string,
    fp: DomainFingerprint,
  ): Promise<LeakedIp[]> {
    return Promise.all(
      leaks.map(async (leak) => {
        // Skip probing known mail server IPs — they serve SMTP, not HTTP.
        // Heuristic: source contains "MX" and PTR points to a mail provider.
        const isMxSource = leak.source.toLowerCase().includes('mx');
        const ptrIsMail = leak.ptrHostname
          ? /mail|smtp|mx|secureserver|mailru|mail\.ru/i.test(leak.ptrHostname)
          : false;
        if (isMxSource && ptrIsMail) {
          return { ...leak, vhostMatch: null };
        }

        const match = await this.probeVhost(leak.ip, domain, fp);
        const upgraded = match === true ? 'high' : leak.confidence;
        return { ...leak, vhostMatch: match, confidence: upgraded };
      }),
    );
  }

  private async probeVhost(
    ip: string,
    domain: string,
    fp: DomainFingerprint,
  ): Promise<boolean | null> {
    // Try HTTPS first, fall back to HTTP
    for (const scheme of ['https', 'http']) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6_000);

        const res = await fetch(`${scheme}://${ip}/`, {
          signal: controller.signal,
          headers: {
            Host: domain,
            'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/2.0)',
          },
          // Don't verify cert — the IP won't have a valid cert for the domain
          // Node fetch uses the global dispatcher; for undici/native fetch we
          // need to bypass TLS validation via a custom dispatcher:
          ...this.buildTlsSkipInit(),
        });
        clearTimeout(timer);

        if (!res.ok && res.status !== 301 && res.status !== 302) continue;

        const buf = await res.arrayBuffer();
        const body = Buffer.from(buf).toString('utf8', 0, VHOST_BODY_BYTES);

        // Match 1: title tag identical
        const titleMatch = body.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
        const probeTitle = titleMatch ? titleMatch[1].trim() : null;
        if (fp.title && probeTitle && fp.title === probeTitle) {
          this.logger.log(`vhost probe: title match on ${ip} for ${domain}`);
          return true;
        }

        // Match 2: body hash of first 2 KB identical
        const probeHash = crypto
          .createHash('md5')
          .update(body.slice(0, 2048))
          .digest('hex');
        if (fp.bodyHash && probeHash === fp.bodyHash) {
          this.logger.log(
            `vhost probe: body hash match on ${ip} for ${domain}`,
          );
          return true;
        }

        // Match 3: status code matches and server header identical
        if (
          fp.statusCode === res.status &&
          fp.server &&
          res.headers.get('server') === fp.server
        ) {
          this.logger.log(
            `vhost probe: status+server match on ${ip} for ${domain}`,
          );
          return true;
        }

        // Received a response but no fingerprint match → not the origin
        return false;
      } catch {
        // Connection refused, timeout, TLS error → can't determine
        continue;
      }
    }
    // All schemes failed (firewall, filtered port) → inconclusive
    return null;
  }

  // Returns extra fetch init options to skip TLS verification when probing
  // raw IPs. Works with Node.js built-in fetch (>=18) via undici dispatcher.
  private buildTlsSkipInit(): RequestInit {
    try {
      // undici is Node's built-in fetch implementation
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Agent } = require('undici');
      return {
        dispatcher: new Agent({ connect: { rejectUnauthorized: false } }),
      } as any;
    } catch {
      // undici not available or wrong environment — TLS errors will just
      // cause the catch block to fall through to HTTP
      return {};
    }
  }

  // ─── MurmurHash3 32-bit (Shodan-compatible) ───────────────────────────────

  private mmh3(str: string): number {
    const data = Buffer.from(str, 'utf8');
    const len = data.length;
    let h1 = 0;
    const c1 = 0xcc9e2d51,
      c2 = 0x1b873593;
    let i = 0;
    while (i <= len - 4) {
      let k =
        (data[i] & 0xff) |
        ((data[i + 1] & 0xff) << 8) |
        ((data[i + 2] & 0xff) << 16) |
        ((data[i + 3] & 0xff) << 24);
      k = Math.imul(k, c1);
      k = (k << 15) | (k >>> 17);
      k = Math.imul(k, c2);
      h1 ^= k;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
      i += 4;
    }
    let k = 0;
    switch (len & 3) {
      case 3:
        k ^= (data[i + 2] & 0xff) << 16; // falls through
      case 2:
        k ^= (data[i + 1] & 0xff) << 8; // falls through
      case 1:
        k ^= data[i] & 0xff;
        k = Math.imul(k, c1);
        k = (k << 15) | (k >>> 17);
        k = Math.imul(k, c2);
        h1 ^= k;
    }
    h1 ^= len;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;
    return h1 | 0;
  }

  // ─── Shared helpers ───────────────────────────────────────────────────────

  private async resolveHostSafe(host: string): Promise<string[]> {
    try {
      const ips = await Promise.race([
        dnsResolve4(host),
        new Promise<string[]>((_, rej) =>
          setTimeout(() => rej(new Error()), 3_000),
        ),
      ]);
      return ips.filter((ip) => this.isValidPublicIp(ip));
    } catch {
      return [];
    }
  }

  private isValidPublicIp(ip: string): boolean {
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;
    return !/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.)/.test(ip);
  }

  private buildSummary(
    isCdn: boolean,
    cdnProvider: CdnProvider | null,
    leaked: LeakedIp[],
    certDomains: number,
    caaInfo: CaaInfo,
  ): string {
    if (!isCdn)
      return 'Domain is NOT behind a CDN — real IP is directly visible.';
    const cdnName = cdnProvider ?? 'CDN';
    if (leaked.length === 0) {
      const parts = [`Domain is behind ${cdnName}. No IP leaks found.`];
      if (certDomains > 0)
        parts.push(`Found ${certDomains} cert-related domain(s).`);
      if (caaInfo.hasDirectCert)
        parts.push(
          `CAA record allows direct cert issuance — origin may be reachable on port 443.`,
        );
      return parts.join(' ');
    }
    const confirmed = leaked.filter((l) => l.vhostMatch === true);
    const sources = [...new Set(leaked.map((l) => l.source))].join('; ');
    const confirmNote =
      confirmed.length > 0
        ? ` ${confirmed.length} IP(s) confirmed as web origin via vhost probe.`
        : '';
    return `Behind ${cdnName} but ${leaked.length} real IP(s) found via: ${sources}.${confirmNote}`;
  }

  private buildRecommendations(
    isCdn: boolean,
    cdnProvider: CdnProvider | null,
    leaked: LeakedIp[],
    cert: SslCertInfo | null,
    favicon: FaviconInfo | null,
    caaInfo: CaaInfo,
    headerProbe: HeaderProbeResult,
  ): string[] {
    const recs: string[] = [];
    if (!isCdn) {
      recs.push('Domain is not behind a CDN — origin IP is directly exposed.');
      return recs;
    }
    if (cert) {
      recs.push(
        `Search Shodan by SSL serial: https://www.shodan.io/search?query=ssl.cert.serial%3A${cert.serialNumber}`,
      );
    }
    if (favicon) {
      recs.push(`Search Shodan by favicon hash: ${favicon.searchUrl}`);
    }
    if (caaInfo.hasDirectCert) {
      recs.push(
        `CAA record permits direct cert issuance (e.g. Let's Encrypt). ` +
          `The origin server likely has port 443 open — try scanning found IPs directly.`,
      );
    }
    if (Object.keys(headerProbe.leakedHeaders).length > 0) {
      const names = Object.keys(headerProbe.leakedHeaders).join(', ');
      recs.push(
        `Origin is leaking response headers: ${names}. ` +
          `Configure ${cdnProvider ?? 'your CDN'} to strip these before forwarding responses.`,
      );
    }
    const confirmedOrigins = leaked.filter((l) => l.vhostMatch === true);
    if (confirmedOrigins.length > 0) {
      recs.push(
        `Confirmed origin IP(s): ${confirmedOrigins.map((l) => l.ip).join(', ')}. ` +
          `These IPs respond to HTTP requests for ${leaked[0]?.source?.split(' ')[0] ?? 'the domain'} — ` +
          `they are the actual web origin servers.`,
      );
    }
    if (leaked.length > 0) {
      recs.push(
        `Real IP(s) found. To fix: proxy ALL subdomains through ${cdnProvider ?? 'your CDN'}, ` +
          `use ${cdnProvider ?? 'CDN'} email routing instead of direct MX, ` +
          `remove direct IPs from SPF/DMARC records, ` +
          `ensure mail subdomains (mx, smtp, mail) are not publicly resolvable.`,
      );
    }
    return recs;
  }
}

// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/sequelize';
// import { PassiveDnsCache } from './models/passive-dns-cache.model';
// import * as dns from 'dns';
// import * as tls from 'tls';
// import * as crypto from 'crypto';
// import { promisify } from 'util';

// const dnsResolve4 = promisify(dns.resolve4);
// const dnsResolveMx = promisify(dns.resolveMx);
// const dnsResolveTxt = promisify(dns.resolveTxt);

// // ─── CDN Types ────────────────────────────────────────────────────────────────
// export type CdnProvider =
//   | 'Cloudflare'
//   | 'Fastly'
//   | 'CloudFront'
//   | 'Akamai'
//   | 'Sucuri'
//   | 'BunnyCDN'
//   | 'KeyCDN'
//   | 'Incapsula';

// interface CdnRange {
//   cidr: string;
//   provider: CdnProvider;
// }

// // ─── CDN IP ranges ────────────────────────────────────────────────────────────
// // prettier-ignore
// const CDN_RANGES: CdnRange[] = [
//   // Cloudflare (AS13335) https://www.cloudflare.com/ips-v4
//   { cidr: '173.245.48.0/20',  provider: 'Cloudflare' },
//   { cidr: '103.21.244.0/22',  provider: 'Cloudflare' },
//   { cidr: '103.22.200.0/22',  provider: 'Cloudflare' },
//   { cidr: '103.31.4.0/22',    provider: 'Cloudflare' },
//   { cidr: '141.101.64.0/18',  provider: 'Cloudflare' },
//   { cidr: '108.162.192.0/18', provider: 'Cloudflare' },
//   { cidr: '190.93.240.0/20',  provider: 'Cloudflare' },
//   { cidr: '188.114.96.0/20',  provider: 'Cloudflare' },
//   { cidr: '197.234.240.0/22', provider: 'Cloudflare' },
//   { cidr: '198.41.128.0/17',  provider: 'Cloudflare' },
//   { cidr: '162.158.0.0/15',   provider: 'Cloudflare' },
//   { cidr: '104.16.0.0/13',    provider: 'Cloudflare' },
//   { cidr: '104.24.0.0/14',    provider: 'Cloudflare' },
//   { cidr: '172.64.0.0/13',    provider: 'Cloudflare' },
//   { cidr: '131.0.72.0/22',    provider: 'Cloudflare' },

//   // Fastly (AS54113) https://api.fastly.com/public-ip-list
//   { cidr: '23.235.32.0/20',   provider: 'Fastly' },
//   { cidr: '43.249.72.0/22',   provider: 'Fastly' },
//   { cidr: '103.244.50.0/24',  provider: 'Fastly' },
//   { cidr: '103.245.222.0/23', provider: 'Fastly' },
//   { cidr: '104.156.80.0/20',  provider: 'Fastly' },
//   { cidr: '140.248.64.0/18',  provider: 'Fastly' },
//   { cidr: '146.75.0.0/17',    provider: 'Fastly' },
//   { cidr: '151.101.0.0/16',   provider: 'Fastly' },
//   { cidr: '157.52.64.0/18',   provider: 'Fastly' },
//   { cidr: '167.82.0.0/17',    provider: 'Fastly' },
//   { cidr: '172.111.64.0/18',  provider: 'Fastly' },
//   { cidr: '185.31.16.0/22',   provider: 'Fastly' },
//   { cidr: '199.27.72.0/21',   provider: 'Fastly' },
//   { cidr: '199.232.0.0/16',   provider: 'Fastly' },

//   // AWS CloudFront https://ip-ranges.amazonaws.com/ip-ranges.json (CLOUDFRONT service)
//   { cidr: '13.32.0.0/15',     provider: 'CloudFront' },
//   { cidr: '13.35.0.0/16',     provider: 'CloudFront' },
//   { cidr: '52.84.0.0/15',     provider: 'CloudFront' },
//   { cidr: '54.182.0.0/16',    provider: 'CloudFront' },
//   { cidr: '54.192.0.0/16',    provider: 'CloudFront' },
//   { cidr: '54.230.0.0/16',    provider: 'CloudFront' },
//   { cidr: '54.239.128.0/18',  provider: 'CloudFront' },
//   { cidr: '64.252.64.0/18',   provider: 'CloudFront' },
//   { cidr: '64.252.128.0/18',  provider: 'CloudFront' },
//   { cidr: '70.132.0.0/18',    provider: 'CloudFront' },
//   { cidr: '130.176.0.0/16',   provider: 'CloudFront' },
//   { cidr: '143.204.0.0/16',   provider: 'CloudFront' },
//   { cidr: '205.251.192.0/19', provider: 'CloudFront' },
//   { cidr: '205.251.249.0/24', provider: 'CloudFront' },
//   { cidr: '216.137.32.0/19',  provider: 'CloudFront' },

//   // Akamai (AS20940)
//   { cidr: '2.16.0.0/13',      provider: 'Akamai' },
//   { cidr: '23.0.0.0/12',      provider: 'Akamai' },
//   { cidr: '23.192.0.0/11',    provider: 'Akamai' },
//   { cidr: '23.32.0.0/11',     provider: 'Akamai' },
//   { cidr: '23.64.0.0/14',     provider: 'Akamai' },
//   { cidr: '23.72.0.0/13',     provider: 'Akamai' },
//   { cidr: '72.246.0.0/15',    provider: 'Akamai' },
//   { cidr: '88.221.0.0/16',    provider: 'Akamai' },
//   { cidr: '92.122.0.0/15',    provider: 'Akamai' },
//   { cidr: '95.100.0.0/15',    provider: 'Akamai' },
//   { cidr: '96.16.0.0/15',     provider: 'Akamai' },
//   { cidr: '104.64.0.0/10',    provider: 'Akamai' },
//   { cidr: '118.214.0.0/16',   provider: 'Akamai' },
//   { cidr: '173.222.0.0/15',   provider: 'Akamai' },
//   { cidr: '184.24.0.0/13',    provider: 'Akamai' },

//   // Sucuri / GoDaddy WAF (AS30148)
//   { cidr: '192.88.134.0/23',  provider: 'Sucuri' },
//   { cidr: '185.93.228.0/22',  provider: 'Sucuri' },
//   { cidr: '66.248.200.0/22',  provider: 'Sucuri' },
//   { cidr: '208.109.0.0/22',   provider: 'Sucuri' },

//   // BunnyCDN (AS34248)
//   { cidr: '185.152.66.0/24',  provider: 'BunnyCDN' },
//   { cidr: '185.152.67.0/24',  provider: 'BunnyCDN' },

//   // KeyCDN (AS47583)
//   { cidr: '91.195.240.0/22',  provider: 'KeyCDN' },
//   { cidr: '94.31.27.0/24',    provider: 'KeyCDN' },

//   // Imperva / Incapsula (AS19551)
//   { cidr: '149.126.72.0/21',  provider: 'Incapsula' },
//   { cidr: '192.230.64.0/19',  provider: 'Incapsula' },
//   { cidr: '45.64.64.0/22',    provider: 'Incapsula' },
// ];

// // Cache TTL: 24 hours — passive DNS data is stable enough
// const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// // ─── Module-level helpers ─────────────────────────────────────────────────────

// function detectCdn(ip: string): CdnProvider | null {
//   for (const { cidr, provider } of CDN_RANGES) {
//     if (ipInCidr(ip, cidr)) return provider;
//   }
//   return null;
// }

// function isCdnIp(ip: string): boolean {
//   return detectCdn(ip) !== null;
// }

// function ipInCidr(ip: string, cidr: string): boolean {
//   try {
//     const [range, bits] = cidr.split('/');
//     const mask = ~((1 << (32 - parseInt(bits))) - 1);
//     return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
//   } catch {
//     return false;
//   }
// }

// function ipToInt(ip: string): number {
//   return ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
// }

// // ─── Subdomains commonly NOT proxied through CDNs ─────────────────────────────
// const BYPASS_SUBDOMAINS = [
//   'mail',
//   'smtp',
//   'pop',
//   'imap',
//   'mx',
//   'mx1',
//   'mx2',
//   'ftp',
//   'sftp',
//   'ftps',
//   'cpanel',
//   'whm',
//   'webdisk',
//   'direct',
//   'origin',
//   'server',
//   'host',
//   'raw',
//   'vpn',
//   'ssh',
//   'remote',
//   'rdp',
//   'git',
//   'autodiscover',
//   'autoconfig',
//   'dev',
//   'staging',
//   'test',
//   'api',
//   'shop',
//   'store',
//   'old',
//   'legacy',
//   'panel',
//   'admin',
//   'portal',
//   'status',
//   'monitor',
// ];

// // ─── Result interfaces ────────────────────────────────────────────────────────

// export interface LeakedIp {
//   ip: string;
//   source: string;
//   isCdn: boolean;
//   confidence: 'high' | 'medium' | 'low';
// }

// export interface MxRecord {
//   exchange: string;
//   priority: number;
//   ips: string[];
//   isCdn: boolean;
//   cdnProvider: CdnProvider | null;
// }

// export interface BypassSubdomain {
//   subdomain: string;
//   ips: string[];
//   isCdn: boolean;
//   cdnProvider: CdnProvider | null;
// }

// export interface SslCertInfo {
//   subject: string;
//   issuer: string;
//   fingerprint256: string;
//   serialNumber: string;
//   validFrom: string;
//   validTo: string;
//   subjectAltNames: string[];
// }

// export interface PassiveDnsRecord {
//   hostname: string;
//   ip: string;
//   source: string;
// }

// export interface FaviconInfo {
//   hash: number;
//   md5: string;
//   fetched: boolean;
//   searchUrl: string;
// }

// export interface CdnLeakResult {
//   domain: string;
//   // CDN detection
//   isCdn: boolean;
//   cdnProvider: CdnProvider | null;
//   cdnIps: string[];

//   // Leaks
//   leakedIps: LeakedIp[];
//   spfIps: string[];
//   mxIps: MxRecord[];
//   bypassSubdomains: BypassSubdomain[];
//   passiveDns: PassiveDnsRecord[];
//   sslCert: SslCertInfo | null;
//   certRelatedDomains: string[];
//   favicon: FaviconInfo | null;
//   // Summary
//   confidence: 'high' | 'medium' | 'low' | 'not_found';
//   summary: string;
//   recommendations: string[];
//   scannedAt: string;
// }

// // ─── Service ──────────────────────────────────────────────────────────────────

// @Injectable()
// export class CloudflareLeakService {
//   private readonly logger = new Logger(CloudflareLeakService.name);

//   constructor(
//     @InjectModel(PassiveDnsCache)
//     private passiveDnsCacheRepo: typeof PassiveDnsCache,
//   ) {}

//   async findRealIp(domain: string): Promise<CdnLeakResult> {
//     this.logger.log(`CDN leak check: ${domain}`);

//     // Detect wildcard DNS first — same problem as in recon scan:
//     // *.domain.com resolves everything to CDN IPs, making bypass checks useless
//     const wildcardIps = await this.detectWildcardIps(domain);
//     if (wildcardIps.size > 0) {
//       this.logger.warn(
//         `Wildcard DNS on ${domain}: ${[...wildcardIps].join(', ')}`,
//       );
//     }

//     const [
//       mainIps,
//       mxRecords,
//       spfIps,
//       bypassResults,
//       passiveDns,
//       sslCert,
//       certRelatedDomains,
//       favicon,
//     ] = await Promise.all([
//       this.resolveMainDomain(domain),
//       this.checkMxRecords(domain),
//       this.checkSpfRecord(domain),
//       this.checkBypassSubdomains(domain, wildcardIps),
//       this.fetchPassiveDns(domain),
//       this.fetchSslCert(domain),
//       this.findCertRelatedDomains(domain),
//       this.fetchFaviconHash(domain),
//     ]);

//     // Detect CDN
//     const cdnIps = mainIps.filter((ip) => isCdnIp(ip));
//     const isCdn = cdnIps.length > 0 && cdnIps.length === mainIps.length;
//     const cdnProvider = cdnIps.length > 0 ? detectCdn(cdnIps[0]) : null;

//     // Collect leaked (non-CDN) IPs
//     const leakedMap = new Map<string, LeakedIp>();

//     const addLeak = (
//       ip: string,
//       source: string,
//       confidence: LeakedIp['confidence'],
//     ) => {
//       if (!this.isValidPublicIp(ip) || isCdnIp(ip)) return;
//       const existing = leakedMap.get(ip);
//       leakedMap.set(ip, {
//         ip,
//         source: existing ? `${existing.source}, ${source}` : source,
//         isCdn: false,
//         confidence: existing ? 'high' : confidence,
//       });
//     };

//     for (const mx of mxRecords) {
//       for (const ip of mx.ips) addLeak(ip, `MX (${mx.exchange})`, 'high');
//     }
//     for (const ip of spfIps) addLeak(ip, 'SPF record', 'high');
//     for (const sub of bypassResults) {
//       if (!sub.isCdn) {
//         for (const ip of sub.ips)
//           addLeak(ip, `Subdomain (${sub.subdomain})`, 'medium');
//       }
//     }
//     for (const rec of passiveDns) {
//       addLeak(rec.ip, `Passive DNS (${rec.source})`, 'medium');
//     }

//     const leakedIps = [...leakedMap.values()];

//     let confidence: CdnLeakResult['confidence'] = 'not_found';
//     if (leakedIps.length > 0) {
//       confidence = leakedIps.some((l) => l.confidence === 'high')
//         ? 'high'
//         : leakedIps.length >= 2
//           ? 'medium'
//           : 'low';
//     }

//     return {
//       domain,
//       isCdn,
//       cdnProvider,
//       cdnIps,

//       leakedIps,
//       spfIps,
//       mxIps: mxRecords,
//       bypassSubdomains: bypassResults,
//       passiveDns,
//       sslCert,
//       certRelatedDomains,
//       favicon,
//       confidence,
//       summary: this.buildSummary(
//         isCdn,
//         cdnProvider,
//         leakedIps,
//         certRelatedDomains.length,
//       ),
//       recommendations: this.buildRecommendations(
//         isCdn,
//         cdnProvider,
//         leakedIps,
//         sslCert,
//         favicon,
//       ),
//       scannedAt: new Date().toISOString(),
//     };
//   }

//   // ─── 1. Main domain ───────────────────────────────────────────────────────

//   private async resolveMainDomain(domain: string): Promise<string[]> {
//     try {
//       return await Promise.race([
//         dnsResolve4(domain),
//         new Promise<string[]>((_, rej) =>
//           setTimeout(() => rej(new Error()), 5_000),
//         ),
//       ]);
//     } catch {
//       return [];
//     }
//   }

//   // ─── 2. MX records ───────────────────────────────────────────────────────

//   private async checkMxRecords(domain: string): Promise<MxRecord[]> {
//     try {
//       const mxList = await Promise.race([
//         dnsResolveMx(domain),
//         new Promise<dns.MxRecord[]>((_, rej) =>
//           setTimeout(() => rej(new Error()), 5_000),
//         ),
//       ]);

//       const results = await Promise.all(
//         mxList.map(async (mx) => {
//           const ips = await this.resolveHostSafe(mx.exchange);
//           const provider = ips.length > 0 ? detectCdn(ips[0]) : null;
//           return {
//             exchange: mx.exchange,
//             priority: mx.priority,
//             ips,
//             isCdn: ips.every((ip) => isCdnIp(ip)),
//             cdnProvider: provider,
//           };
//         }),
//       );

//       return results.filter((r) => r.ips.length > 0);
//     } catch {
//       return [];
//     }
//   }

//   // ─── 3. SPF record ───────────────────────────────────────────────────────

//   private async checkSpfRecord(domain: string): Promise<string[]> {
//     try {
//       const txt = await Promise.race([
//         dnsResolveTxt(domain),
//         new Promise<string[][]>((_, rej) =>
//           setTimeout(() => rej(new Error()), 5_000),
//         ),
//       ]);

//       const flat = txt.flat().join(' ');
//       const ips: string[] = [];

//       const ip4 = flat.match(/ip4:([\d./]+)/gi) ?? [];
//       for (const m of ip4) {
//         const ip = m.replace(/ip4:/i, '').split('/')[0];
//         if (this.isValidPublicIp(ip)) ips.push(ip);
//       }

//       const includes = flat.match(/include:(\S+)/gi) ?? [];
//       const resolved = await Promise.all(
//         includes
//           .slice(0, 3)
//           .map((inc) => this.resolveHostSafe(inc.replace(/include:/i, ''))),
//       );
//       ips.push(...resolved.flat());

//       return [...new Set(ips)];
//     } catch {
//       return [];
//     }
//   }

//   // ─── Wildcard DNS detection ──────────────────────────────────────────────────

//   private async detectWildcardIps(domain: string): Promise<Set<string>> {
//     const probe = `cdn-leak-probe-${Date.now()}.${domain}`;
//     try {
//       const ips = await Promise.race([
//         dnsResolve4(probe),
//         new Promise<string[]>((_, rej) =>
//           setTimeout(() => rej(new Error()), 3_000),
//         ),
//       ]);
//       return new Set(ips);
//     } catch {
//       return new Set();
//     }
//   }

//   // ─── 4. Bypass subdomains ─────────────────────────────────────────────────

//   private async checkBypassSubdomains(
//     domain: string,
//     wildcardIps: Set<string>,
//   ): Promise<BypassSubdomain[]> {
//     const results: BypassSubdomain[] = [];
//     const BATCH = 10;

//     for (let i = 0; i < BYPASS_SUBDOMAINS.length; i += BATCH) {
//       const batch = BYPASS_SUBDOMAINS.slice(i, i + BATCH);
//       const resolved = await Promise.all(
//         batch.map(async (prefix) => {
//           const fqdn = `${prefix}.${domain}`;
//           const ips = await this.resolveHostSafe(fqdn);
//           if (!ips.length) return null;

//           // Skip if all IPs are wildcard IPs — subdomain doesn't really exist
//           if (wildcardIps.size > 0 && ips.every((ip) => wildcardIps.has(ip))) {
//             return null;
//           }

//           const provider = detectCdn(ips[0]);
//           return {
//             subdomain: fqdn,
//             ips,
//             isCdn: ips.every((ip) => isCdnIp(ip)),
//             cdnProvider: provider,
//           };
//         }),
//       );
//       results.push(...(resolved.filter(Boolean) as BypassSubdomain[]));
//     }

//     return results;
//   }

//   // ─── 5. Passive DNS with DB cache ────────────────────────────────────────────
//   // One HackerTarget request per domain per 24h — shared across ALL users.

//   private async fetchPassiveDns(domain: string): Promise<PassiveDnsRecord[]> {
//     // Check cache first
//     const cached = await this.passiveDnsCacheRepo.findOne({
//       where: { domain },
//     });

//     if (cached) {
//       const age = Date.now() - new Date(cached.updatedAt).getTime();
//       if (age < CACHE_TTL_MS) {
//         // Cache hit — increment counter and return
//         await cached.increment('hitCount');
//         this.logger.log(
//           `Passive DNS cache hit for ${domain} (hits: ${cached.hitCount + 1})`,
//         );
//         return JSON.parse(cached.records) as PassiveDnsRecord[];
//       }
//       // Cache expired — will refresh below
//     }

//     // Cache miss or expired — fetch from HackerTarget
//     const records = await this.fetchFromHackerTarget(domain);

//     // Save/update cache regardless of result (even empty = no data available)
//     if (cached) {
//       cached.records = JSON.stringify(records);
//       cached.source = 'HackerTarget';
//       cached.hitCount = 1;
//       await cached.save();
//     } else {
//       await this.passiveDnsCacheRepo.create({
//         domain,
//         records: JSON.stringify(records),
//         source: 'HackerTarget',
//         hitCount: 1,
//       });
//     }

//     return records;
//   }

//   // ─── Multi-source passive DNS fetch ─────────────────────────────────────────
//   // Queries 3 free sources in parallel, merges and deduplicates results.
//   // If HackerTarget is rate-limited, the other sources still provide data.

//   private async fetchFromHackerTarget(
//     domain: string,
//   ): Promise<PassiveDnsRecord[]> {
//     const [htRecords, crtRecords, anubisRecords] = await Promise.allSettled([
//       this.fetchHackerTarget(domain),
//       this.fetchCrtShIps(domain),
//       this.fetchAnubisDB(domain),
//     ]);

//     const all: PassiveDnsRecord[] = [];

//     if (htRecords.status === 'fulfilled') all.push(...htRecords.value);
//     if (crtRecords.status === 'fulfilled') all.push(...crtRecords.value);
//     if (anubisRecords.status === 'fulfilled') all.push(...anubisRecords.value);

//     // Deduplicate by IP
//     const seen = new Set<string>();
//     return all.filter((r) => {
//       if (seen.has(r.ip)) return false;
//       seen.add(r.ip);
//       return true;
//     });
//   }

//   // Source 1: HackerTarget (50 req/day free, no key)
//   private async fetchHackerTarget(domain: string): Promise<PassiveDnsRecord[]> {
//     try {
//       const controller = new AbortController();
//       const timer = setTimeout(() => controller.abort(), 8_000);

//       const res = await fetch(
//         `https://api.hackertarget.com/hostsearch/?q=${domain}`,
//         {
//           signal: controller.signal,
//           headers: { 'User-Agent': 'SecurityScanner/1.0' },
//         },
//       );
//       clearTimeout(timer);

//       if (!res.ok) return [];
//       const text = await res.text();

//       if (text.includes('API count exceeded') || text.includes('error')) {
//         this.logger.warn(`HackerTarget rate limit reached for ${domain}`);
//         return [];
//       }

//       const records: PassiveDnsRecord[] = [];
//       for (const line of text.split('\n')) {
//         const parts = line.trim().split(',');
//         if (parts.length < 2) continue;
//         const [hostname, ip] = parts;
//         if (
//           hostname &&
//           ip &&
//           this.isValidPublicIp(ip.trim()) &&
//           !isCdnIp(ip.trim())
//         ) {
//           records.push({
//             hostname: hostname.trim(),
//             ip: ip.trim(),
//             source: 'HackerTarget',
//           });
//         }
//       }

//       this.logger.log(`HackerTarget: ${records.length} records for ${domain}`);
//       return records;
//     } catch {
//       return [];
//     }
//   }

//   // Source 2: crt.sh — resolve IPs from cert SANs (no rate limit, no key)
//   // Finds domains in certs → resolves their IPs → non-CDN IPs = potential origin
//   private async fetchCrtShIps(domain: string): Promise<PassiveDnsRecord[]> {
//     try {
//       const controller = new AbortController();
//       const timer = setTimeout(() => controller.abort(), 12_000);

//       const res = await fetch(
//         `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
//         { signal: controller.signal, headers: { Accept: 'application/json' } },
//       );
//       clearTimeout(timer);

//       if (!res.ok) return [];
//       const data: Array<{ name_value: string }> = await res.json();

//       // Collect unique subdomains from cert SANs
//       const subdomains = new Set<string>();
//       for (const entry of data) {
//         for (const line of entry.name_value.split('\n')) {
//           const name = line.trim().toLowerCase().replace(/^\*\./, '');
//           if (name.endsWith(`.${domain}`) || name === domain) {
//             subdomains.add(name);
//           }
//         }
//       }

//       // Resolve IPs for each subdomain and keep non-CDN ones
//       const records: PassiveDnsRecord[] = [];
//       const BATCH = 10;
//       const subList = [...subdomains].slice(0, 50);

//       for (let i = 0; i < subList.length; i += BATCH) {
//         const batch = subList.slice(i, i + BATCH);
//         const resolved = await Promise.allSettled(
//           batch.map(async (sub) => {
//             const ips = await this.resolveHostSafe(sub);
//             return ips
//               .filter((ip) => !isCdnIp(ip))
//               .map((ip) => ({ hostname: sub, ip, source: 'crt.sh' }));
//           }),
//         );
//         for (const r of resolved) {
//           if (r.status === 'fulfilled') records.push(...r.value);
//         }
//       }

//       this.logger.log(`crt.sh: ${records.length} non-CDN IPs for ${domain}`);
//       return records;
//     } catch {
//       return [];
//     }
//   }

//   // Source 3: AnubisDB — free passive DNS, no key required
//   private async fetchAnubisDB(domain: string): Promise<PassiveDnsRecord[]> {
//     try {
//       const controller = new AbortController();
//       const timer = setTimeout(() => controller.abort(), 8_000);

//       const res = await fetch(`https://jldc.me/anubis/subdomains/${domain}`, {
//         signal: controller.signal,
//         headers: { 'User-Agent': 'SecurityScanner/1.0' },
//       });
//       clearTimeout(timer);

//       if (!res.ok) return [];
//       const subdomains: string[] = await res.json();
//       if (!Array.isArray(subdomains)) return [];

//       // Resolve IPs for found subdomains
//       const records: PassiveDnsRecord[] = [];
//       const BATCH = 10;

//       for (let i = 0; i < subdomains.slice(0, 30).length; i += BATCH) {
//         const batch = subdomains.slice(i, i + BATCH);
//         const resolved = await Promise.allSettled(
//           batch.map(async (sub) => {
//             const ips = await this.resolveHostSafe(sub);
//             return ips
//               .filter((ip) => !isCdnIp(ip))
//               .map((ip) => ({ hostname: sub, ip, source: 'AnubisDB' }));
//           }),
//         );
//         for (const r of resolved) {
//           if (r.status === 'fulfilled') records.push(...r.value);
//         }
//       }

//       this.logger.log(`AnubisDB: ${records.length} non-CDN IPs for ${domain}`);
//       return records;
//     } catch {
//       return [];
//     }
//   }

//   // ─── 6. SSL Certificate ───────────────────────────────────────────────────

//   private fetchSslCert(domain: string): Promise<SslCertInfo | null> {
//     return new Promise((resolve) => {
//       const timer = setTimeout(() => resolve(null), 8_000);
//       try {
//         const socket = tls.connect(
//           {
//             host: domain,
//             port: 443,
//             servername: domain,
//             rejectUnauthorized: false,
//           },
//           () => {
//             clearTimeout(timer);
//             const cert = socket.getPeerCertificate(true);
//             socket.destroy();

//             if (!cert?.subject) {
//               resolve(null);
//               return;
//             }

//             const sans: string[] = [];
//             if (cert.subjectaltname) {
//               const m = cert.subjectaltname.match(/DNS:[^,]+/g) ?? [];
//               sans.push(...m.map((s) => s.replace('DNS:', '').trim()));
//             }

//             resolve({
//               subject: cert.subject?.CN ?? 'Unknown',
//               issuer: cert.issuer?.CN ?? 'Unknown',
//               fingerprint256: cert.fingerprint256 ?? '',
//               serialNumber: cert.serialNumber ?? '',
//               validFrom: cert.valid_from ?? '',
//               validTo: cert.valid_to ?? '',
//               subjectAltNames: sans,
//             });
//           },
//         );
//         socket.on('error', () => {
//           clearTimeout(timer);
//           resolve(null);
//         });
//       } catch {
//         clearTimeout(timer);
//         resolve(null);
//       }
//     });
//   }

//   // ─── 7. Cert-related domains (crt.sh) ────────────────────────────────────

//   private async findCertRelatedDomains(domain: string): Promise<string[]> {
//     try {
//       const controller = new AbortController();
//       const timer = setTimeout(() => controller.abort(), 12_000);

//       const res = await fetch(
//         `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
//         { signal: controller.signal, headers: { Accept: 'application/json' } },
//       );
//       clearTimeout(timer);
//       if (!res.ok) return [];

//       const data: Array<{ name_value: string }> = await res.json();
//       const seen = new Set<string>();

//       for (const entry of data) {
//         for (const line of entry.name_value.split('\n')) {
//           const name = line.trim().toLowerCase().replace(/^\*\./, '');
//           if (name && !name.includes(domain) && name.includes('.'))
//             seen.add(name);
//         }
//       }

//       return [...seen].slice(0, 20);
//     } catch {
//       return [];
//     }
//   }

//   // ─── 8. Favicon hash (Shodan mmh3) ───────────────────────────────────────

//   private async fetchFaviconHash(domain: string): Promise<FaviconInfo | null> {
//     for (const path of ['/favicon.ico', '/favicon.png']) {
//       try {
//         const controller = new AbortController();
//         const timer = setTimeout(() => controller.abort(), 6_000);

//         const res = await fetch(`https://${domain}${path}`, {
//           signal: controller.signal,
//           headers: { 'User-Agent': 'Mozilla/5.0' },
//         });
//         clearTimeout(timer);

//         if (!res.ok || res.status === 404) continue;
//         const ct = res.headers.get('content-type') ?? '';
//         if (!ct.includes('image') && !ct.includes('octet')) continue;

//         const bytes: any = Buffer.from(await res.arrayBuffer());
//         const md5 = crypto.createHash('md5').update(bytes).digest('hex');
//         const hash = this.mmh3(bytes.toString('base64'));

//         return {
//           hash,
//           md5,
//           fetched: true,
//           searchUrl: `https://www.shodan.io/search?query=http.favicon.hash%3A${hash}`,
//         };
//       } catch {
//         continue;
//       }
//     }
//     return null;
//   }

//   // ─── MurmurHash3 32-bit (Shodan-compatible) ───────────────────────────────

//   private mmh3(str: string): number {
//     const data = Buffer.from(str, 'utf8');
//     const len = data.length;
//     let h1 = 0;
//     const c1 = 0xcc9e2d51,
//       c2 = 0x1b873593;
//     let i = 0;

//     while (i <= len - 4) {
//       let k =
//         (data[i] & 0xff) |
//         ((data[i + 1] & 0xff) << 8) |
//         ((data[i + 2] & 0xff) << 16) |
//         ((data[i + 3] & 0xff) << 24);
//       k = Math.imul(k, c1);
//       k = (k << 15) | (k >>> 17);
//       k = Math.imul(k, c2);
//       h1 ^= k;
//       h1 = (h1 << 13) | (h1 >>> 19);
//       h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
//       i += 4;
//     }

//     let k = 0;
//     switch (len & 3) {
//       case 3:
//         k ^= (data[i + 2] & 0xff) << 16; // falls through
//       case 2:
//         k ^= (data[i + 1] & 0xff) << 8; // falls through
//       case 1:
//         k ^= data[i] & 0xff;
//         k = Math.imul(k, c1);
//         k = (k << 15) | (k >>> 17);
//         k = Math.imul(k, c2);
//         h1 ^= k;
//     }

//     h1 ^= len;
//     h1 ^= h1 >>> 16;
//     h1 = Math.imul(h1, 0x85ebca6b);
//     h1 ^= h1 >>> 13;
//     h1 = Math.imul(h1, 0xc2b2ae35);
//     h1 ^= h1 >>> 16;

//     return h1 | 0;
//   }

//   // ─── Helpers ──────────────────────────────────────────────────────────────

//   private async resolveHostSafe(host: string): Promise<string[]> {
//     try {
//       const ips = await Promise.race([
//         dnsResolve4(host),
//         new Promise<string[]>((_, rej) =>
//           setTimeout(() => rej(new Error()), 3_000),
//         ),
//       ]);
//       return ips.filter((ip) => this.isValidPublicIp(ip));
//     } catch {
//       return [];
//     }
//   }

//   private isValidPublicIp(ip: string): boolean {
//     if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;
//     return !/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.)/.test(ip);
//   }

//   private buildSummary(
//     isCdn: boolean,
//     cdnProvider: CdnProvider | null,
//     leaked: LeakedIp[],
//     certDomains: number,
//   ): string {
//     if (!isCdn)
//       return 'Domain is NOT behind a CDN — real IP is directly visible.';
//     if (leaked.length === 0) {
//       return (
//         `Domain is behind ${cdnProvider ?? 'CDN'}. No IP leaks found.` +
//         (certDomains > 0 ? ` Found ${certDomains} cert-related domain(s).` : '')
//       );
//     }
//     const sources = [...new Set(leaked.map((l) => l.source))].join('; ');
//     return `Behind ${cdnProvider ?? 'CDN'} but ${leaked.length} real IP(s) found via: ${sources}.`;
//   }

//   private buildRecommendations(
//     isCdn: boolean,
//     cdnProvider: CdnProvider | null,
//     leaked: LeakedIp[],
//     cert: SslCertInfo | null,
//     favicon: FaviconInfo | null,
//   ): string[] {
//     const recs: string[] = [];

//     if (!isCdn) {
//       recs.push('Domain is not behind a CDN — origin IP is directly exposed.');
//       return recs;
//     }

//     if (cert) {
//       recs.push(
//         `Search Shodan by SSL serial: https://www.shodan.io/search?query=ssl.cert.serial%3A${cert.serialNumber}`,
//       );
//     }

//     if (favicon) {
//       recs.push(`Search Shodan by favicon hash: ${favicon.searchUrl}`);
//     }

//     if (leaked.length > 0) {
//       recs.push(
//         `Real IP(s) found. To fix: proxy ALL subdomains through ${cdnProvider ?? 'your CDN'}, ` +
//           `use ${cdnProvider ?? 'CDN'} email routing instead of direct MX, ` +
//           `remove direct IPs from SPF record.`,
//       );
//     }

//     return recs;
//   }
// }
