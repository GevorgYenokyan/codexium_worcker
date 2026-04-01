
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { PassiveDnsCache } from '../models/passive-dns-cache.model';
import { PassiveDnsRecord } from '../interfaces/cdn-leak.interface';
import { isCdnIp, isValidPublicIp } from '../helpers/ip.helpers';
import { DnsCollectorService } from './dns-collector.service';
import * as cheerio from 'cheerio';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PassiveDnsService {
  private readonly logger = new Logger(PassiveDnsService.name);
  private readonly otxApiKey: string;

  constructor(
    @InjectModel(PassiveDnsCache)
    private readonly passiveDnsCacheRepo: typeof PassiveDnsCache,
    private readonly dnsCollector: DnsCollectorService,
    private readonly config: ConfigService,
  ) {
    this.otxApiKey = this.config.get<string>('OTX_API_KEY') ?? '';
  }

  // ─── Public entry point (with DB cache) ──────────────────────────────────

  async fetchPassiveDns(domain: string): Promise<PassiveDnsRecord[]> {
    const cached = await this.passiveDnsCacheRepo.findOne({ where: { domain } });

    if (cached) {
      const age = Date.now() - new Date(cached.updatedAt).getTime();
      if (age < CACHE_TTL_MS) {
        await cached.increment('hitCount');
        this.logger.log(`Passive DNS cache hit for ${domain} (hits: ${cached.hitCount + 1})`);
        return JSON.parse(cached.records) as PassiveDnsRecord[];
      }
    }

    const records = await this.fetchFromAllSources(domain);

    if (cached) {
      cached.records  = JSON.stringify(records);
      cached.source   = 'multi';
      cached.hitCount = 1;
      await cached.save();
    } else {
      await this.passiveDnsCacheRepo.create({
        domain,
        records:  JSON.stringify(records),
        source:   'multi',
        hitCount: 1,
      });
    }

    return records;
  }

  // ─── Aggregator ───────────────────────────────────────────────────────────
  // Sources             | Limit/day   | Key
  // ────────────────────┼─────────────┼──────
  // HackerTarget        | 50          | no
  // crt.sh → resolve    | unlimited   | no
  // AnubisDB            | unlimited   | no
  // Columbus Project    | unlimited   | no
  // RapidDNS            | unlimited   | no    ← NEW
  // OTX AlienVault      | unlimited   | yes   ← NEW

  private async fetchFromAllSources(domain: string): Promise<PassiveDnsRecord[]> {
    const [ht, crt, anubis, columbus, rapidDns, otx] = await Promise.allSettled([
      this.fetchHackerTarget(domain),
      this.fetchCrtShIps(domain),
      this.fetchAnubisDB(domain),
      this.fetchColumbusProject(domain),
      this.fetchRapidDns(domain),       // NEW
      this.fetchOtxAlienVault(domain),  // NEW
    ]);

    const all: PassiveDnsRecord[] = [
      ...(ht.status       === 'fulfilled' ? ht.value       : []),
      ...(crt.status      === 'fulfilled' ? crt.value      : []),
      ...(anubis.status   === 'fulfilled' ? anubis.value   : []),
      ...(columbus.status === 'fulfilled' ? columbus.value : []),
      ...(rapidDns.status === 'fulfilled' ? rapidDns.value : []),
      ...(otx.status      === 'fulfilled' ? otx.value      : []),
    ];

    const seen = new Set<string>();
    return all.filter((r) => !seen.has(r.ip) && seen.add(r.ip));
  }

  // ─── Source 1: HackerTarget ───────────────────────────────────────────────

  private async fetchHackerTarget(domain: string): Promise<PassiveDnsRecord[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(
        `https://api.hackertarget.com/hostsearch/?q=${domain}`,
        { signal: controller.signal, headers: { 'User-Agent': 'SecurityScanner/1.0' } },
      );
      clearTimeout(timer);
      if (!res.ok) return [];
      const text = await res.text();
      if (text.includes('API count exceeded') || text.includes('error')) {
        this.logger.warn(`HackerTarget rate limit for ${domain}`);
        return [];
      }
      const records: PassiveDnsRecord[] = [];
      for (const line of text.split('\n')) {
        const [hostname, ip] = line.trim().split(',');
        if (hostname && ip && isValidPublicIp(ip.trim()) && !isCdnIp(ip.trim()))
          records.push({ hostname: hostname.trim(), ip: ip.trim(), source: 'HackerTarget' });
      }
      this.logger.log(`HackerTarget: ${records.length} records for ${domain}`);
      return records;
    } catch { return []; }
  }

  // ─── Source 2: crt.sh → subdomain resolve ────────────────────────────────

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
          if (name.endsWith(`.${domain}`) || name === domain) subdomains.add(name);
        }
      }

      const records: PassiveDnsRecord[] = [];
      const subList = [...subdomains].slice(0, 50);
      const BATCH   = 10;
      for (let i = 0; i < subList.length; i += BATCH) {
        const settled = await Promise.allSettled(
          subList.slice(i, i + BATCH).map(async (sub) => {
            const ips = await this.dnsCollector.resolveHostSafe(sub);
            return ips.filter((ip) => !isCdnIp(ip)).map((ip) => ({ hostname: sub, ip, source: 'crt.sh' }));
          }),
        );
        for (const r of settled)
          if (r.status === 'fulfilled') records.push(...r.value);
      }
      this.logger.log(`crt.sh: ${records.length} non-CDN IPs for ${domain}`);
      return records;
    } catch { return []; }
  }

  // ─── Source 3: AnubisDB ───────────────────────────────────────────────────

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
        const settled = await Promise.allSettled(
          subdomains.slice(i, i + BATCH).map(async (sub) => {
            const ips = await this.dnsCollector.resolveHostSafe(sub);
            return ips.filter((ip) => !isCdnIp(ip)).map((ip) => ({ hostname: sub, ip, source: 'AnubisDB' }));
          }),
        );
        for (const r of settled)
          if (r.status === 'fulfilled') records.push(...r.value);
      }
      this.logger.log(`AnubisDB: ${records.length} non-CDN IPs for ${domain}`);
      return records;
    } catch { return []; }
  }

  // ─── Source 4: Columbus Project ───────────────────────────────────────────

  private async fetchColumbusProject(domain: string): Promise<PassiveDnsRecord[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(
        `https://columbus.elmasy.com/api/subdomains/${domain}`,
        { signal: controller.signal, headers: { 'User-Agent': 'SecurityScanner/1.0' } },
      );
      clearTimeout(timer);
      if (!res.ok) return [];
      const subdomains: string[] = await res.json();
      if (!Array.isArray(subdomains)) return [];

      const records: PassiveDnsRecord[] = [];
      const BATCH = 10;
      for (let i = 0; i < Math.min(subdomains.length, 40); i += BATCH) {
        const settled = await Promise.allSettled(
          subdomains.slice(i, i + BATCH).map(async (sub) => {
            const ips = await this.dnsCollector.resolveHostSafe(sub);
            return ips.filter((ip) => !isCdnIp(ip)).map((ip) => ({ hostname: sub, ip, source: 'Columbus' }));
          }),
        );
        for (const r of settled)
          if (r.status === 'fulfilled') records.push(...r.value);
      }
      this.logger.log(`Columbus: ${records.length} non-CDN IPs for ${domain}`);
      return records;
    } catch { return []; }
  }

  // ─── Source 5: RapidDNS (NEW) ─────────────────────────────────────────────
  // Unlimited, no key. Парсинг HTML таблицы через cheerio.
  // npm i cheerio

  private async fetchRapidDns(domain: string): Promise<PassiveDnsRecord[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(`https://rapiddns.io/subdomain/${domain}?full=1`, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/120.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timer);
      if (!res.ok) return [];

      const html = await res.text();
      const $    = cheerio.load(html);
      const records: PassiveDnsRecord[] = [];

      $('table#table tbody tr').each((_i, element) => {
        const cells    = $(element).find('td');
        if (cells.length < 3) return;

        const hostname = cells.eq(0).text().trim();
        const address  = cells.eq(1).find('a').text().trim() || cells.eq(1).text().trim();
        const type     = cells.eq(2).text().trim().toUpperCase();

        if (type !== 'A') return;
        if (!address || !isValidPublicIp(address)) return;
        if (isCdnIp(address)) return;

        records.push({ hostname: hostname || domain, ip: address, source: 'RapidDNS' });
      });

      this.logger.log(`RapidDNS: ${records.length} records for ${domain}`);
      return records;
    } catch { return []; }
  }

  // ─── Source 6: OTX AlienVault (NEW) ──────────────────────────────────────
  // Requires API key, no query limits.
  // Set OTX_API_KEY in .env — if missing, source is silently skipped.

  private async fetchOtxAlienVault(domain: string): Promise<PassiveDnsRecord[]> {
    if (!this.otxApiKey) {
      this.logger.warn('OTX_API_KEY not set — skipping OTX source');
      return [];
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(
        `https://otx.alienvault.com/api/v1/indicators/domain/${encodeURIComponent(domain)}/passive_dns`,
        {
          signal: controller.signal,
          headers: {
            'X-OTX-API-KEY': this.otxApiKey,
            Accept:          'application/json',
          },
        },
      );
      clearTimeout(timer);
      if (!res.ok) return [];

      const data: any = await res.json();
      const records: PassiveDnsRecord[] = [];

      for (const entry of (data?.passive_dns ?? [])) {
        const ip       = entry?.address as string | undefined;
        const hostname = entry?.hostname as string | undefined;
        if (!ip || !hostname)        continue;
        if (!isValidPublicIp(ip))    continue;
        if (isCdnIp(ip))             continue;
        records.push({ hostname, ip, source: 'OTX AlienVault' });
      }

      this.logger.log(`OTX: ${records.length} passive DNS records for ${domain}`);
      return records;
    } catch { return []; }
  }
}


// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/sequelize';
// import { PassiveDnsCache } from '../models/passive-dns-cache.model';
// import { PassiveDnsRecord } from '../interfaces/cdn-leak.interface';
// import { isCdnIp, isValidPublicIp } from '../helpers/ip.helpers';
// import { DnsCollectorService } from './dns-collector.service';

// const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// @Injectable()
// export class PassiveDnsService {
//   private readonly logger = new Logger(PassiveDnsService.name);

//   constructor(
//     @InjectModel(PassiveDnsCache)
//     private readonly passiveDnsCacheRepo: typeof PassiveDnsCache,
//     private readonly dnsCollector: DnsCollectorService,
//   ) {}

//   async fetchPassiveDns(domain: string): Promise<PassiveDnsRecord[]> {
//     const cached = await this.passiveDnsCacheRepo.findOne({
//       where: { domain },
//     });

//     if (cached) {
//       const age = Date.now() - new Date(cached.updatedAt).getTime();
//       if (age < CACHE_TTL_MS) {
//         await cached.increment('hitCount');
//         this.logger.log(
//           `Passive DNS cache hit for ${domain} (hits: ${cached.hitCount + 1})`,
//         );
//         return JSON.parse(cached.records) as PassiveDnsRecord[];
//       }
//     }

//     const records = await this.fetchFromAllSources(domain);

//     if (cached) {
//       cached.records = JSON.stringify(records);
//       cached.source = 'multi';
//       cached.hitCount = 1;
//       await cached.save();
//     } else {
//       await this.passiveDnsCacheRepo.create({
//         domain,
//         records: JSON.stringify(records),
//         source: 'multi',
//         hitCount: 1,
//       });
//     }

//     return records;
//   }

//   private async fetchFromAllSources(
//     domain: string,
//   ): Promise<PassiveDnsRecord[]> {
//     const [ht, crt, anubis, columbus] = await Promise.allSettled([
//       this.fetchHackerTarget(domain),
//       this.fetchCrtShIps(domain),
//       this.fetchAnubisDB(domain),
//       this.fetchColumbusProject(domain),
//     ]);

//     const all: PassiveDnsRecord[] = [
//       ...(ht.status === 'fulfilled' ? ht.value : []),
//       ...(crt.status === 'fulfilled' ? crt.value : []),
//       ...(anubis.status === 'fulfilled' ? anubis.value : []),
//       ...(columbus.status === 'fulfilled' ? columbus.value : []),
//     ];

//     const seen = new Set<string>();
//     return all.filter((r) => !seen.has(r.ip) && seen.add(r.ip));
//   }

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
//         this.logger.warn(`HackerTarget rate limit for ${domain}`);
//         return [];
//       }
//       const records: PassiveDnsRecord[] = [];
//       for (const line of text.split('\n')) {
//         const [hostname, ip] = line.trim().split(',');
//         if (hostname && ip && isValidPublicIp(ip.trim()) && !isCdnIp(ip.trim()))
//           records.push({
//             hostname: hostname.trim(),
//             ip: ip.trim(),
//             source: 'HackerTarget',
//           });
//       }
//       this.logger.log(`HackerTarget: ${records.length} records for ${domain}`);
//       return records;
//     } catch {
//       return [];
//     }
//   }

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
//       const subdomains = new Set<string>();
//       for (const entry of data) {
//         for (const line of entry.name_value.split('\n')) {
//           const name = line.trim().toLowerCase().replace(/^\*\./, '');
//           if (name.endsWith(`.${domain}`) || name === domain)
//             subdomains.add(name);
//         }
//       }

//       const records: PassiveDnsRecord[] = [];
//       const subList = [...subdomains].slice(0, 50);
//       const BATCH = 10;
//       for (let i = 0; i < subList.length; i += BATCH) {
//         const settled = await Promise.allSettled(
//           subList.slice(i, i + BATCH).map(async (sub) => {
//             const ips = await this.dnsCollector.resolveHostSafe(sub);
//             return ips
//               .filter((ip) => !isCdnIp(ip))
//               .map((ip) => ({ hostname: sub, ip, source: 'crt.sh' }));
//           }),
//         );
//         for (const r of settled)
//           if (r.status === 'fulfilled') records.push(...r.value);
//       }
//       this.logger.log(`crt.sh: ${records.length} non-CDN IPs for ${domain}`);
//       return records;
//     } catch {
//       return [];
//     }
//   }

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

//       const records: PassiveDnsRecord[] = [];
//       const BATCH = 10;
//       for (let i = 0; i < Math.min(subdomains.length, 30); i += BATCH) {
//         const settled = await Promise.allSettled(
//           subdomains.slice(i, i + BATCH).map(async (sub) => {
//             const ips = await this.dnsCollector.resolveHostSafe(sub);
//             return ips
//               .filter((ip) => !isCdnIp(ip))
//               .map((ip) => ({ hostname: sub, ip, source: 'AnubisDB' }));
//           }),
//         );
//         for (const r of settled)
//           if (r.status === 'fulfilled') records.push(...r.value);
//       }
//       this.logger.log(`AnubisDB: ${records.length} non-CDN IPs for ${domain}`);
//       return records;
//     } catch {
//       return [];
//     }
//   }

//   private async fetchColumbusProject(
//     domain: string,
//   ): Promise<PassiveDnsRecord[]> {
//     try {
//       const controller = new AbortController();
//       const timer = setTimeout(() => controller.abort(), 8_000);
//       const res = await fetch(
//         `https://columbus.elmasy.com/api/subdomains/${domain}`,
//         {
//           signal: controller.signal,
//           headers: { 'User-Agent': 'SecurityScanner/1.0' },
//         },
//       );
//       clearTimeout(timer);
//       if (!res.ok) return [];
//       const subdomains: string[] = await res.json();
//       if (!Array.isArray(subdomains)) return [];

//       const records: PassiveDnsRecord[] = [];
//       const BATCH = 10;
//       for (let i = 0; i < Math.min(subdomains.length, 40); i += BATCH) {
//         const settled = await Promise.allSettled(
//           subdomains.slice(i, i + BATCH).map(async (sub) => {
//             const ips = await this.dnsCollector.resolveHostSafe(sub);
//             return ips
//               .filter((ip) => !isCdnIp(ip))
//               .map((ip) => ({ hostname: sub, ip, source: 'Columbus' }));
//           }),
//         );
//         for (const r of settled)
//           if (r.status === 'fulfilled') records.push(...r.value);
//       }
//       this.logger.log(`Columbus: ${records.length} non-CDN IPs for ${domain}`);
//       return records;
//     } catch {
//       return [];
//     }
//   }
// }
