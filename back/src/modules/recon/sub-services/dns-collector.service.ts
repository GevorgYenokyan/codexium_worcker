import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';
import {
  MxRecord,
  BypassSubdomain,
  CaaInfo,
} from '../interfaces/cdn-leak.interface';
import { detectCdn, isCdnIp, isValidPublicIp } from '../helpers/ip.helpers';

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveSoa = promisify(dns.resolveSoa);
const dnsResolveCaa = promisify(dns.resolveCaa);
const dnsReverse = promisify(dns.reverse);

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

@Injectable()
export class DnsCollectorService {
  private readonly logger = new Logger(DnsCollectorService.name);

  async resolveMainDomain(domain: string): Promise<string[]> {
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

  async checkMxRecords(domain: string): Promise<MxRecord[]> {
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
          return {
            exchange: mx.exchange,
            priority: mx.priority,
            ips,
            isCdn: ips.every(isCdnIp),
            cdnProvider: ips.length > 0 ? detectCdn(ips[0]) : null,
          };
        }),
      );
      return results.filter((r) => r.ips.length > 0);
    } catch {
      return [];
    }
  }

  async checkSpfRecord(domain: string): Promise<string[]> {
    try {
      const txt = await Promise.race([
        dnsResolveTxt(domain),
        new Promise<string[][]>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]);
      const flat = txt.flat().join(' ');
      const ips: string[] = [];
      for (const m of flat.match(/ip4:([\d./]+)/gi) ?? []) {
        const ip = m.replace(/ip4:/i, '').split('/')[0];
        if (isValidPublicIp(ip)) ips.push(ip);
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

  async detectWildcardIps(domain: string): Promise<Set<string>> {
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

  async checkBypassSubdomains(
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

  async checkSoaRecord(domain: string): Promise<string[]> {
    try {
      const soa: any = await Promise.race([
        dnsResolveSoa(domain),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]);
      const hostPart = soa.rname.replace(/\.$/, '').replace(/^[^.]+\./, '');
      if (!hostPart?.includes('.')) return [];
      return this.resolveHostSafe(hostPart);
    } catch {
      return [];
    }
  }

  async checkDmarcRecord(domain: string): Promise<string[]> {
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

  async checkCaaRecords(domain: string): Promise<CaaInfo> {
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
      return { caas, hasDirectCert };
    } catch {
      return { caas: [], hasDirectCert: false };
    }
  }

  async checkBimiRecord(domain: string): Promise<string[]> {
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
      return this.resolveHostSafe(urlMatch[1]);
    } catch {
      return [];
    }
  }

  async enrichWithPtr(leaks: any[], _domain: string): Promise<any[]> {
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

  async resolveHostSafe(host: string): Promise<string[]> {
    try {
      const ips = await Promise.race([
        dnsResolve4(host),
        new Promise<string[]>((_, rej) =>
          setTimeout(() => rej(new Error()), 3_000),
        ),
      ]);
      return ips.filter(isValidPublicIp);
    } catch {
      return [];
    }
  }
}
