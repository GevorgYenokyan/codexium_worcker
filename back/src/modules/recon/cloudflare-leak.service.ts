import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PassiveDnsCache } from './models/passive-dns-cache.model';
import * as dns from 'dns';
import * as tls from 'tls';
import * as crypto from 'crypto';
import * as net from 'net'; // Добавлен для SSH проверок
import { promisify } from 'util';

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveTxt = promisify(dns.resolveTxt);

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

interface CdnRange {
  cidr: string;
  provider: CdnProvider;
}

// ─── CDN IP ranges ────────────────────────────────────────────────────────────
const CDN_RANGES: CdnRange[] = [
  { cidr: '173.245.48.0/20', provider: 'Cloudflare' },
  { cidr: '103.21.244.0/22', provider: 'Cloudflare' },
  { cidr: '103.22.200.0/22', provider: 'Cloudflare' },
  { cidr: '103.31.4.0/22', provider: 'Cloudflare' },
  { cidr: '141.101.64.0/18', provider: 'Cloudflare' },
  { cidr: '108.162.192.0/18', provider: 'Cloudflare' },
  { cidr: '190.93.240.0/20', provider: 'Cloudflare' },
  { cidr: '188.114.96.0/20', provider: 'Cloudflare' },
  { cidr: '197.234.240.0/22', provider: 'Cloudflare' },
  { cidr: '198.41.128.0/17', provider: 'Cloudflare' },
  { cidr: '162.158.0.0/15', provider: 'Cloudflare' },
  { cidr: '104.16.0.0/13', provider: 'Cloudflare' },
  { cidr: '104.24.0.0/14', provider: 'Cloudflare' },
  { cidr: '172.64.0.0/13', provider: 'Cloudflare' },
  { cidr: '131.0.72.0/22', provider: 'Cloudflare' },
  { cidr: '23.235.32.0/20', provider: 'Fastly' },
  { cidr: '151.101.0.0/16', provider: 'Fastly' },
  { cidr: '13.32.0.0/15', provider: 'CloudFront' },
  { cidr: '52.84.0.0/15', provider: 'CloudFront' },
  { cidr: '2.16.0.0/13', provider: 'Akamai' },
  { cidr: '23.0.0.0/12', provider: 'Akamai' },
  { cidr: '192.88.134.0/23', provider: 'Sucuri' },
  { cidr: '185.152.66.0/24', provider: 'BunnyCDN' },
  { cidr: '149.126.72.0/21', provider: 'Incapsula' },
];

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ─── Module-level helpers ─────────────────────────────────────────────────────

function detectCdn(ip: string): CdnProvider | null {
  for (const { cidr, provider } of CDN_RANGES) {
    if (ipInCidr(ip, cidr)) return provider;
  }
  return null;
}

function isCdnIp(ip: string): boolean {
  return detectCdn(ip) !== null;
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

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
}

const BYPASS_SUBDOMAINS = [
  'mail',
  'smtp',
  'pop',
  'imap',
  'mx',
  'ftp',
  'direct',
  'origin',
  'dev',
  'staging',
  'vpn',
  'cpanel',
  'api',
  'admin',
];

// ─── Result interfaces ────────────────────────────────────────────────────────

export interface LeakedIp {
  ip: string;
  source: string;
  isCdn: boolean;
  confidence: 'high' | 'medium' | 'low';
  details?: string; // Подробности (Web server, SSH banner)
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
  confidence: 'high' | 'medium' | 'low' | 'not_found';
  summary: string;
  recommendations: string[];
  scannedAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CloudflareLeakService {
  private readonly logger = new Logger(CloudflareLeakService.name);

  constructor(
    @InjectModel(PassiveDnsCache)
    private passiveDnsCacheRepo: typeof PassiveDnsCache,
  ) {}

  async findRealIp(
    domain: string,
    emailHeaders?: string,
  ): Promise<CdnLeakResult> {
    const startTime = Date.now();
    this.logger.log(`Starting leak check for: ${domain}`);

    const wildcardIps = await this.detectWildcardIps(domain);

    // Запускаем все тяжелые сборы данных параллельно
    const [
      mainIps,
      mxRecords,
      spfIps,
      bypassResults,
      passiveDns,
      sslCert,
      certRelatedDomains,
      favicon,
    ] = await Promise.all([
      this.resolveMainDomain(domain),
      this.checkMxRecords(domain),
      this.checkSpfRecord(domain),
      this.checkBypassSubdomains(domain, wildcardIps),
      this.fetchPassiveDns(domain),
      this.fetchSslCert(domain),
      this.findCertRelatedDomains(domain),
      this.fetchFaviconHash(domain),
    ]);

    const cdnIps = mainIps.filter((ip) => isCdnIp(ip));
    const isCdn = cdnIps.length > 0 && cdnIps.length === mainIps.length;
    const cdnProvider = cdnIps.length > 0 ? detectCdn(cdnIps[0]) : null;

    const leakedMap = new Map<string, LeakedIp>();

    const addLeak = (
      ip: string,
      source: string,
      conf: LeakedIp['confidence'],
    ) => {
      if (!this.isValidPublicIp(ip) || isCdnIp(ip)) return;
      const existing = leakedMap.get(ip);
      leakedMap.set(ip, {
        ip,
        source: existing ? `${existing.source}, ${source}` : source,
        isCdn: false,
        confidence: existing ? 'high' : conf,
      });
    };

    // Сбор кандидатов из всех источников
    mxRecords.forEach((mx) =>
      mx.ips.forEach((ip) => addLeak(ip, `MX`, 'high')),
    );
    spfIps.forEach((ip) => addLeak(ip, 'SPF', 'high'));
    bypassResults
      .filter((s) => !s.isCdn)
      .forEach((s) =>
        s.ips.forEach((ip) => addLeak(ip, `Subdomain`, 'medium')),
      );
    passiveDns.forEach((rec) => addLeak(rec.ip, `PassiveDNS`, 'medium'));
    if (emailHeaders)
      this.extractIpFromHeaders(emailHeaders).forEach((ip) =>
        addLeak(ip, 'Email', 'high'),
      );

    const candidates = [...leakedMap.values()];

    // ─── ВЕРИФИКАЦИЯ (Параллельно для скорости) ───
    const verifiedLeaks = await Promise.all(
      candidates.map(async (leak) => {
        try {
          // Выполняем 3 проверки одновременно для каждого IP
          const [sslMatch, httpInfo, sshBanner] = await Promise.all([
            this.confirmOriginBySSL(leak.ip, domain),
            this.verifyOriginByHttp(leak.ip, domain),
            this.getSshFingerprint(leak.ip),
          ]);

          if (sslMatch || httpInfo.match || sshBanner) {
            let details = [];
            if (httpInfo.server) details.push(`W:${httpInfo.server}`);
            if (sshBanner) details.push(`S:${sshBanner.substring(0, 10)}`);
            if (sslMatch) details.push('SSL:OK');

            return {
              ...leak,
              confidence: 'high' as const,
              details: details.join('|'),
            };
          }
          return leak;
        } catch {
          return leak;
        }
      }),
    );

    let confidence: CdnLeakResult['confidence'] =
      verifiedLeaks.length > 0 ? 'low' : 'not_found';
    if (verifiedLeaks.some((l) => l.confidence === 'high')) confidence = 'high';
    else if (verifiedLeaks.length >= 2) confidence = 'medium';

    this.logger.log(`Scan completed in ${(Date.now() - startTime) / 1000}s`);

    return {
      domain,
      isCdn,
      cdnProvider,
      cdnIps,
      leakedIps: verifiedLeaks,
      spfIps,
      mxIps: mxRecords,
      bypassSubdomains: bypassResults,
      passiveDns,
      sslCert,
      certRelatedDomains,
      favicon,
      confidence,
      summary: this.buildSummary(
        isCdn,
        cdnProvider,
        verifiedLeaks,
        certRelatedDomains.length,
      ),
      recommendations: this.buildRecommendations(
        isCdn,
        cdnProvider,
        verifiedLeaks,
        sslCert,
        favicon,
      ),
      scannedAt: new Date().toISOString(),
    };
  }

  // ─── Новые вспомогательные методы для верификации ───

  private extractIpFromHeaders(headers: string): string[] {
    const ips = new Set<string>();
    const regex =
      /from\s+.*?\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]|X-Originating-IP:\s*\[?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]?/gi;
    let m;
    while ((m = regex.exec(headers)) !== null) {
      const ip = m[1] || m[2];
      if (this.isValidPublicIp(ip) && !isCdnIp(ip)) ips.add(ip);
    }
    return [...ips];
  }

  private async confirmOriginBySSL(
    ip: string,
    domain: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = tls.connect(
        {
          host: ip,
          port: 443,
          servername: domain,
          rejectUnauthorized: false,
          timeout: 2000,
        },
        () => {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          const match =
            (cert.subject?.CN || '').toLowerCase().includes(domain) ||
            (cert.subjectaltname || '').toLowerCase().includes(domain);
          resolve(match);
        },
      );
      socket.on('error', () => resolve(false));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  private async verifyOriginByHttp(
    ip: string,
    domain: string,
  ): Promise<{ match: boolean; server?: string }> {
    try {
      const res = await fetch(`http://${ip}/`, {
        headers: { Host: domain },
        signal: AbortSignal.timeout(2000),
      });
      const srv = res.headers.get('server') || '';
      return {
        match: srv !== '' && !srv.toLowerCase().includes('cloudflare'),
        server: srv,
      };
    } catch {
      return { match: false };
    }
  }

  private async getSshFingerprint(ip: string): Promise<string | null> {
    return new Promise((resolve) => {
      const s = new net.Socket();
      s.setTimeout(1500);
      s.on('data', (d) => {
        resolve(d.toString().trim());
        s.destroy();
      });
      s.on('error', () => {
        s.destroy();
        resolve(null);
      });
      s.on('timeout', () => {
        s.destroy();
        resolve(null);
      });
      s.connect(22, ip);
    });
  }

  // ─── Существующие методы (Оптимизированные) ───

  private async resolveMainDomain(domain: string): Promise<string[]> {
    try {
      return await dnsResolve4(domain);
    } catch {
      return [];
    }
  }

  private async checkMxRecords(domain: string): Promise<MxRecord[]> {
    try {
      const mxList = await dnsResolveMx(domain);
      return await Promise.all(
        mxList.map(async (mx) => {
          const ips = await this.resolveHostSafe(mx.exchange);
          return {
            exchange: mx.exchange,
            priority: mx.priority,
            ips,
            isCdn: ips.every(isCdnIp),
            cdnProvider: detectCdn(ips[0]),
          };
        }),
      );
    } catch {
      return [];
    }
  }

  private async checkSpfRecord(domain: string): Promise<string[]> {
    try {
      const txt = await dnsResolveTxt(domain);
      const flat = txt.flat().join(' ');
      const ips = (flat.match(/ip4:([\d./]+)/gi) || []).map(
        (m) => m.split(':')[1].split('/')[0],
      );
      return ips.filter((ip) => this.isValidPublicIp(ip));
    } catch {
      return [];
    }
  }

  private async detectWildcardIps(domain: string): Promise<Set<string>> {
    try {
      return new Set(await dnsResolve4(`probe-${Date.now()}.${domain}`));
    } catch {
      return new Set();
    }
  }

  private async checkBypassSubdomains(
    domain: string,
    wildcardIps: Set<string>,
  ): Promise<BypassSubdomain[]> {
    const results: BypassSubdomain[] = [];
    const BATCH = 15;
    for (let i = 0; i < BYPASS_SUBDOMAINS.length; i += BATCH) {
      const batch = BYPASS_SUBDOMAINS.slice(i, i + BATCH);
      const resolved = await Promise.all(
        batch.map(async (prefix) => {
          const fqdn = `${prefix}.${domain}`;
          const ips = await this.resolveHostSafe(fqdn);
          if (
            !ips.length ||
            (wildcardIps.size > 0 && ips.every((ip) => wildcardIps.has(ip)))
          )
            return null;
          return {
            subdomain: fqdn,
            ips,
            isCdn: ips.every(isCdnIp),
            cdnProvider: detectCdn(ips[0]),
          };
        }),
      );
      results.push(...(resolved.filter(Boolean) as BypassSubdomain[]));
    }
    return results;
  }

  private async fetchPassiveDns(domain: string): Promise<PassiveDnsRecord[]> {
    const cached = await this.passiveDnsCacheRepo.findOne({
      where: { domain },
    });
    if (
      cached &&
      Date.now() - new Date(cached.updatedAt).getTime() < CACHE_TTL_MS
    ) {
      return JSON.parse(cached.records);
    }
    const records = await this.fetchFromSources(domain);
    await this.passiveDnsCacheRepo.upsert({
      domain,
      records: JSON.stringify(records),
      source: 'Multi',
      hitCount: 1,
    });
    return records;
  }

  private async fetchFromSources(domain: string): Promise<PassiveDnsRecord[]> {
    const res = await Promise.allSettled([
      this.fetchHackerTarget(domain),
      this.fetchCrtShIps(domain),
    ]);
    const all = res
      .map((r) => (r.status === 'fulfilled' ? r.value : []))
      .flat();
    const seen = new Set();
    return all.filter((r) => !seen.has(r.ip) && seen.add(r.ip));
  }

  private async fetchHackerTarget(domain: string): Promise<PassiveDnsRecord[]> {
    try {
      const res = await fetch(
        `https://api.hackertarget.com/hostsearch/?q=${domain}`,
        { signal: AbortSignal.timeout(5000) },
      );
      const text = await res.text();
      return text
        .split('\n')
        .map((line) => {
          const [h, ip] = line.split(',');
          return h && ip
            ? { hostname: h.trim(), ip: ip.trim(), source: 'HackerTarget' }
            : null;
        })
        .filter(Boolean) as PassiveDnsRecord[];
    } catch {
      return [];
    }
  }

  private async fetchCrtShIps(domain: string): Promise<PassiveDnsRecord[]> {
    try {
      const res = await fetch(`https://crt.sh/?q=${domain}&output=json`, {
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      const subs = new Set<string>();
      data
        .slice(0, 20)
        .forEach((e: any) =>
          e.name_value
            .split('\n')
            .forEach((n: string) => subs.add(n.trim().replace('*.', ''))),
        );
      const records: PassiveDnsRecord[] = [];
      for (const sub of subs) {
        const ips = await this.resolveHostSafe(sub);
        ips
          .filter((ip) => !isCdnIp(ip))
          .forEach((ip) =>
            records.push({ hostname: sub, ip, source: 'crt.sh' }),
          );
      }
      return records;
    } catch {
      return [];
    }
  }

  private async fetchSslCert(domain: string): Promise<SslCertInfo | null> {
    return new Promise((resolve) => {
      const socket = tls.connect(
        {
          host: domain,
          port: 443,
          servername: domain,
          rejectUnauthorized: false,
          timeout: 5000,
        },
        () => {
          const c = socket.getPeerCertificate(true);
          socket.destroy();
          resolve(
            c?.subject
              ? {
                  subject: c.subject.CN,
                  issuer: c.issuer.CN,
                  fingerprint256: c.fingerprint256,
                  serialNumber: c.serialNumber,
                  validFrom: c.valid_from,
                  validTo: c.valid_to,
                  subjectAltNames: [],
                }
              : null,
          );
        },
      );
      socket.on('error', () => resolve(null));
    });
  }

  private async findCertRelatedDomains(domain: string): Promise<string[]> {
    try {
      const res = await fetch(`https://crt.sh/?q=${domain}&output=json`, {
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      return [
        ...new Set(data.map((e: any) => e.name_value.split('\n')).flat()),
      ].slice(0, 10) as string[];
    } catch {
      return [];
    }
  }

  private async fetchFaviconHash(domain: string): Promise<FaviconInfo | null> {
    try {
      const res = await fetch(`https://${domain}/favicon.ico`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const hash = this.mmh3(buf.toString('base64'));
      return {
        hash,
        md5: '',
        fetched: true,
        searchUrl: `https://www.shodan.io/search?query=http.favicon.hash%3A${hash}`,
      };
    } catch {
      return null;
    }
  }

  private mmh3(str: string): number {
    const data = Buffer.from(str, 'utf8');
    let h1 = 0;
    for (let i = 0; i < data.length; i++)
      h1 = Math.imul(h1 ^ data[i], 0xcc9e2d51);
    return h1 | 0;
  }

  private async resolveHostSafe(host: string): Promise<string[]> {
    try {
      return (await dnsResolve4(host)).filter((ip) => this.isValidPublicIp(ip));
    } catch {
      return [];
    }
  }

  private isValidPublicIp(ip: string): boolean {
    return (
      /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
      !/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.)/.test(ip)
    );
  }

  private buildSummary(
    isCdn: boolean,
    prov: string | null,
    leaked: LeakedIp[],
    certs: number,
  ): string {
    if (!isCdn) return 'No CDN detected.';
    return leaked.length > 0
      ? `Leaks found via: ${leaked.map((l) => l.source).join(', ')}`
      : `Behind ${prov}. No leaks found.`;
  }

  private buildRecommendations(
    isCdn: boolean,
    prov: string | null,
    leaked: LeakedIp[],
    cert: any,
    fav: any,
  ): string[] {
    const r = [];
    if (leaked.length > 0)
      r.push('Exposed IPs detected. Close direct access to port 80/443.');
    if (cert) r.push(`Search Shodan by cert serial: ${cert.serialNumber}`);
    return r;
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
