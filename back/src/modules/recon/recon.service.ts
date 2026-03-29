import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import * as net from 'net';
import { promisify } from 'util';
import { CloudflareLeakService } from './cloudflare-leak.service';
import { SUBDOMAIN_WORDLIST } from './data/subdomain-wordlist';
import {
  IpInfo,
  PortResult,
  ReconScanResult,
  SubdomainEntry,
} from './interfaces/recon.interface';

const dnsResolve4 = promisify(dns.resolve4);
const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1)/;

/**
 * Top 50 Most Common Ports (Web, DB, Remote, DevTools, Infrastructure)
 */
const TOP_50_PORTS = [
  21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 465, 587, 993, 995,
  1433, 1521, 2049, 2082, 2083, 2086, 2087, 2195, 2222, 3000, 3128, 3306, 3389,
  4000, 4444, 5000, 5432, 5672, 5900, 6379, 6443, 8000, 8008, 8080, 8443, 8888,
  9000, 9090, 9200, 9300, 9443, 10000, 27017,
];

const KNOWN_SERVICES: Record<number, string> = {
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  445: 'SMB',
  465: 'SMTPS',
  587: 'SMTP',
  993: 'IMAPS',
  995: 'POP3S',
  1433: 'MSSQL',
  1521: 'Oracle',
  2375: 'Docker API',
  2376: 'Docker TLS',
  3000: 'Node/Dev',
  3306: 'MySQL',
  3389: 'RDP',
  4000: 'Dev',
  5000: 'Dev/Flask',
  5432: 'PostgreSQL',
  5900: 'VNC',
  6379: 'Redis',
  6443: 'K8s API',
  8080: 'HTTP-Alt',
  8443: 'HTTPS-Alt',
  8888: 'Jupyter',
  9200: 'Elasticsearch',
  27017: 'MongoDB',
};

const CLOUDFLARE_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
];

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
}

function isCloudflareIp(ip: string): boolean {
  for (const cidr of CLOUDFLARE_RANGES) {
    const [range, bits] = cidr.split('/');
    const mask = ~((1 << (32 - parseInt(bits))) - 1);
    if ((ipToInt(ip) & mask) === (ipToInt(range) & mask)) return true;
  }
  return false;
}

@Injectable()
export class ReconService {
  private readonly logger = new Logger(ReconService.name);

  constructor(private readonly cdnLeakService: CloudflareLeakService) {}

  // ─── Main Logic ────────────────────────────────────────────────────────────

  async scanFromPayload(
    domain: string,
    portFrom: number,
    portTo: number,
    knownRealIps: string[] = [],
  ): Promise<ReconScanResult> {
    if (portFrom >= portTo)
      throw new BadRequestException('portFrom must be < portTo');

    this.logger.log(
      `[B] Starting Smart Recon: ${domain} (${portFrom}-${portTo})`,
    );

    const wildcardIps = await this.detectWildcardIps(domain);

    let leakedRealIps: string[] = knownRealIps.filter((ip) =>
      this.isValidPublicIp(ip),
    );
    let cdnProvider: string | null = null;

    // Parallel Subdomain Discovery
    const [cdnLeakResult, ctSubdomains, bruteSubdomains] =
      leakedRealIps.length > 0
        ? [
            null,
            await this.fetchFromCertTransparency(domain),
            await this.dnsbruteforce(domain, wildcardIps),
          ]
        : await Promise.all([
            this.cdnLeakService.findRealIp(domain).catch(() => null),
            this.fetchFromCertTransparency(domain),
            this.dnsbruteforce(domain, wildcardIps),
          ]);

    if (!leakedRealIps.length && cdnLeakResult) {
      leakedRealIps = cdnLeakResult.leakedIps
        .filter((l) => !l.isCdn)
        .map((l) => l.ip);
      cdnProvider = cdnLeakResult.cdnProvider ?? null;
    }

    const allSubdomains = this.mergeSubdomainSources(
      domain,
      ctSubdomains,
      bruteSubdomains,
    );
    const resolved = await this.resolveSubdomains(allSubdomains);
    const subdomainIps = this.collectUniqueIps(resolved);
    const allRealIps = [...new Set([...leakedRealIps, ...subdomainIps])];

    // Two-Phase Scanning Logic integrated here
    const ipMap = await this.scanIpsSmart(
      allRealIps,
      resolved,
      portFrom,
      portTo,
    );

    return {
      id: 0,
      domain,
      scannedAt: new Date().toISOString(),
      hasWildcardDns: wildcardIps.size > 0,
      cdnProvider,
      leakedRealIps,
      subdomains: resolved,
      ipMap,
      portRange: { from: portFrom, to: portTo },
      summary: this.calculateSummary(
        resolved,
        ipMap,
        allRealIps,
        leakedRealIps,
      ),
    };
  }

  // ─── Smart Scanning (Two-Phase) ──────────────────────────────────────────

  private async scanIpsSmart(
    ips: string[],
    entries: SubdomainEntry[],
    portFrom: number,
    portTo: number,
  ): Promise<IpInfo[]> {
    // Limit targets to avoid worker exhaustion (top 20 real IPs)
    const targets = ips.filter((ip) => !isCloudflareIp(ip)).slice(0, 20);
    const cfTargets = ips.filter((ip) => isCloudflareIp(ip)).slice(0, 5);

    const results: IpInfo[] = [];

    for (const ip of targets) {
      this.logger.debug(`[Phase 1] Discovery for ${ip}`);
      // Phase 1: Fast scan of Top 50 ports
      const discoveryPorts = TOP_50_PORTS.filter(
        (p) => p >= portFrom && p <= portTo,
      );
      const phase1Results = await this.scanPortList(ip, discoveryPorts, 400, 0);

      // Phase 2: Deep scan of remaining range (Randomized & Stealthy)
      const remainingPorts = [];
      for (let p = portFrom; p <= portTo; p++) {
        if (!discoveryPorts.includes(p)) remainingPorts.push(p);
      }

      let phase2Results: PortResult[] = [];
      if (remainingPorts.length > 0) {
        this.logger.debug(
          `[Phase 2] Deep scan for ${ip} (${remainingPorts.length} ports)`,
        );
        const randomized = this.shuffle(remainingPorts);
        phase2Results = await this.scanPortList(ip, randomized, 500, 150);
      }

      results.push({
        address: ip,
        subdomains: entries
          .filter((e) => e.ips.includes(ip))
          .map((e) => e.subdomain),
        openPorts: [...phase1Results, ...phase2Results].sort(
          (a, b) => a.port - b.port,
        ),
        isCloudflare: false,
      });
    }

    // Add Cloudflare IPs without scanning ports
    cfTargets.forEach((ip) => {
      results.push({
        address: ip,
        subdomains: entries
          .filter((e) => e.ips.includes(ip))
          .map((e) => e.subdomain),
        openPorts: [],
        isCloudflare: true,
      });
    });

    return results;
  }

  private async scanPortList(
    ip: string,
    ports: number[],
    timeout: number,
    batchDelay: number,
  ): Promise<PortResult[]> {
    const open: PortResult[] = [];
    const BATCH_SIZE = 40;

    for (let i = 0; i < ports.length; i += BATCH_SIZE) {
      const batch = ports.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((port) =>
          this.probePort(
            ip,
            port,
            KNOWN_SERVICES[port] ?? `port-${port}`,
            timeout,
          ),
        ),
      );
      open.push(...results.filter((r) => r.status === 'open'));

      if (batchDelay > 0 && i + BATCH_SIZE < ports.length) {
        const jitter = batchDelay * (0.8 + Math.random() * 0.4); // Jitter ±20%
        await new Promise((res) => setTimeout(res, jitter));
      }
    }
    return open;
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async detectWildcardIps(domain: string): Promise<Set<string>> {
    try {
      const ips = await Promise.race([
        dnsResolve4(`wildcard-check-${Date.now()}.${domain}`),
        new Promise<string[]>((_, rej) =>
          setTimeout(() => rej(new Error()), 3000),
        ),
      ]);
      return new Set(ips);
    } catch {
      return new Set();
    }
  }

  private async fetchFromCertTransparency(domain: string): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`https://crt.sh/?q=%25.${domain}&output=json`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return [];
      const data: any[] = await res.json();
      const seen = new Set<string>();
      for (const entry of data) {
        entry.name_value.split('\n').forEach((line) => {
          const name = line.trim().toLowerCase();
          if (!name.startsWith('*') && name.endsWith(`.${domain}`))
            seen.add(name);
        });
      }
      return [...seen];
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private async dnsbruteforce(
    domain: string,
    wildcardIps: Set<string>,
  ): Promise<string[]> {
    const found: string[] = [];
    const BATCH = 50;
    for (let i = 0; i < SUBDOMAIN_WORDLIST.length; i += BATCH) {
      const batch = SUBDOMAIN_WORDLIST.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (word) => {
          const fqdn = `${word}.${domain}`;
          try {
            const ips = await Promise.race([
              dnsResolve4(fqdn),
              new Promise<string[]>((_, rej) =>
                setTimeout(() => rej(new Error()), 800),
              ),
            ]);
            if (wildcardIps.size > 0 && ips.every((ip) => wildcardIps.has(ip)))
              return null;
            return fqdn;
          } catch {
            return null;
          }
        }),
      );
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) found.push(r.value);
      });
    }
    return found;
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private probePort(
    ip: string,
    port: number,
    service: string,
    timeout: number,
  ): Promise<PortResult> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let settled = false;
      const finish = (status: 'open' | 'closed' | 'filtered') => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve({ port, service, status });
      };
      socket.setTimeout(timeout);
      socket.connect(port, ip, () => finish('open'));
      socket.on('error', () => finish('closed'));
      socket.on('timeout', () => finish('filtered'));
    });
  }

  private mergeSubdomainSources(
    domain: string,
    ctList: string[],
    bruteList: string[],
  ) {
    const ctSet = new Set(ctList);
    const bruteSet = new Set(bruteList);
    return [...new Set([...ctList, ...bruteList])]
      .filter((n) => n !== domain)
      .map((name) => ({
        name,
        source: (ctSet.has(name) && bruteSet.has(name)
          ? 'both'
          : ctSet.has(name)
            ? 'ct_logs'
            : 'dns_bruteforce') as any,
      }));
  }

  private async resolveSubdomains(entries: any[]): Promise<SubdomainEntry[]> {
    const results: SubdomainEntry[] = [];
    for (let i = 0; i < Math.min(entries.length, 150); i += 10) {
      const batch = entries.slice(i, i + 10);
      const resolved = await Promise.all(
        batch.map(async ({ name, source }) => {
          try {
            const ips = await Promise.race([
              dnsResolve4(name),
              new Promise<string[]>((_, rej) =>
                setTimeout(() => rej(new Error()), 3000),
              ),
            ]);
            const publicIps = ips.filter((ip) => !PRIVATE_IP_RE.test(ip));
            return {
              subdomain: name,
              ips: publicIps,
              isCloudflare: publicIps.every(isCloudflareIp),
              source,
              resolvedAt: new Date().toISOString(),
            };
          } catch {
            return {
              subdomain: name,
              ips: [],
              isCloudflare: false,
              source,
              resolvedAt: null,
            };
          }
        }),
      );
      results.push(...resolved);
    }
    return results;
  }

  private collectUniqueIps(entries: SubdomainEntry[]): string[] {
    const seen = new Set<string>();
    entries.forEach((e) => e.ips.forEach((ip) => seen.add(ip)));
    return [...seen];
  }

  private calculateSummary(
    resolved: SubdomainEntry[],
    ipMap: IpInfo[],
    allIps: string[],
    leaked: string[],
  ) {
    return {
      totalSubdomains: resolved.length,
      resolvedSubdomains: resolved.filter((s) => s.ips.length > 0).length,
      realSubdomains: resolved.filter(
        (s) => s.ips.length > 0 && !s.isCloudflare,
      ).length,
      uniqueIps: allIps.length,
      realIps: ipMap.filter((ip) => !ip.isCloudflare).length,
      totalOpenPorts: ipMap.reduce((a, ip) => a + ip.openPorts.length, 0),
      ctLogsFound: resolved.filter(
        (s) => s.source === 'ct_logs' || s.source === 'both',
      ).length,
      bruteforceFound: resolved.filter(
        (s) => s.source === 'dns_bruteforce' || s.source === 'both',
      ).length,
    };
  }

  private isValidPublicIp(ip: string): boolean {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && !PRIVATE_IP_RE.test(ip);
  }

  async scanIpDirect(
    ip: string,
    domain: string,
    portFrom: number,
    portTo: number,
  ) {
    if (PRIVATE_IP_RE.test(ip))
      throw new BadRequestException('Private IP not allowed');
    const openPorts = await this.scanPortList(
      ip,
      Array.from({ length: portTo - portFrom + 1 }, (_, i) => i + portFrom),
      400,
      100,
    );
    return {
      ip,
      domain,
      portRange: { from: portFrom, to: portTo },
      openPorts,
      scannedAt: new Date().toISOString(),
    };
  }
}

// import { BadRequestException, Injectable, Logger } from '@nestjs/common';
// import * as dns from 'dns';
// import * as net from 'net';
// import { promisify } from 'util';
// import { CloudflareLeakService } from './cloudflare-leak.service';
// import { SUBDOMAIN_WORDLIST } from './data/subdomain-wordlist';
// import {
//   IpInfo,
//   PortResult,
//   ReconScanResult,
//   SubdomainEntry,
// } from './interfaces/recon.interface';

// const dnsResolve4 = promisify(dns.resolve4);
// const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1)/;

// const KNOWN_SERVICES: Record<number, string> = {
//   21: 'FTP',
//   22: 'SSH',
//   23: 'Telnet',
//   25: 'SMTP',
//   53: 'DNS',
//   80: 'HTTP',
//   110: 'POP3',
//   143: 'IMAP',
//   443: 'HTTPS',
//   445: 'SMB',
//   465: 'SMTPS',
//   587: 'SMTP',
//   993: 'IMAPS',
//   995: 'POP3S',
//   1433: 'MSSQL',
//   1521: 'Oracle',
//   2375: 'Docker API',
//   2376: 'Docker TLS',
//   3000: 'Node/Dev',
//   3306: 'MySQL',
//   3389: 'RDP',
//   4000: 'Dev',
//   5000: 'Dev/Flask',
//   5432: 'PostgreSQL',
//   5900: 'VNC',
//   6379: 'Redis',
//   6443: 'K8s API',
//   8080: 'HTTP-Alt',
//   8443: 'HTTPS-Alt',
//   8888: 'Jupyter',
//   9200: 'Elasticsearch',
//   9300: 'Elasticsearch',
//   27017: 'MongoDB',
//   27018: 'MongoDB',
// };

// const CLOUDFLARE_RANGES = [
//   '173.245.48.0/20',
//   '103.21.244.0/22',
//   '103.22.200.0/22',
//   '103.31.4.0/22',
//   '141.101.64.0/18',
//   '108.162.192.0/18',
//   '190.93.240.0/20',
//   '188.114.96.0/20',
//   '197.234.240.0/22',
//   '198.41.128.0/17',
//   '162.158.0.0/15',
//   '104.16.0.0/13',
//   '104.24.0.0/14',
//   '172.64.0.0/13',
//   '131.0.72.0/22',
// ];

// function ipToInt(ip: string): number {
//   return ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
// }

// function isCloudflareIp(ip: string): boolean {
//   for (const cidr of CLOUDFLARE_RANGES) {
//     const [range, bits] = cidr.split('/');
//     const mask = ~((1 << (32 - parseInt(bits))) - 1);
//     if ((ipToInt(ip) & mask) === (ipToInt(range) & mask)) return true;
//   }
//   return false;
// }

// // ─── Server B only has two public methods ─────────────────────────────────────
// // Domain ownership verified by Server A before enqueuing.
// // No DB access — results returned to Server A via task complete.

// @Injectable()
// export class ReconService {
//   private readonly logger = new Logger(ReconService.name);

//   constructor(private readonly cdnLeakService: CloudflareLeakService) {}

//   // ─── Full recon scan (called from payload) ────────────────────────────────

//   async scanFromPayload(
//     domain: string,
//     portFrom: number,
//     portTo: number,
//     knownRealIps: string[] = [],
//   ): Promise<ReconScanResult> {
//     if (portFrom >= portTo) {
//       throw new BadRequestException('portFrom must be less than portTo');
//     }
//     if (portTo - portFrom + 1 > 10_000) {
//       throw new BadRequestException('Port range cannot exceed 10,000');
//     }

//     this.logger.log(`[B] Recon: ${domain} ports ${portFrom}-${portTo}`);

//     const wildcardIps = await this.detectWildcardIps(domain);

//     let leakedRealIps: string[] = knownRealIps.filter((ip) =>
//       this.isValidPublicIp(ip),
//     );
//     let cdnProvider: string | null = null;

//     // Run CDN leak + CT logs + bruteforce in parallel
//     const [cdnLeakResult, ctSubdomains, bruteSubdomains] =
//       leakedRealIps.length > 0
//         ? [
//             null,
//             await this.fetchFromCertTransparency(domain),
//             await this.dnsbruteforce(domain, wildcardIps),
//           ]
//         : await Promise.all([
//             this.cdnLeakService.findRealIp(domain).catch(() => null),
//             this.fetchFromCertTransparency(domain),
//             this.dnsbruteforce(domain, wildcardIps),
//           ]);

//     if (!leakedRealIps.length && cdnLeakResult) {
//       leakedRealIps = cdnLeakResult.leakedIps
//         .filter((l) => !l.isCdn)
//         .map((l) => l.ip);
//       cdnProvider = cdnLeakResult.cdnProvider ?? null;
//     }

//     const allSubdomains = this.mergeSubdomainSources(
//       domain,
//       ctSubdomains,
//       bruteSubdomains,
//     );
//     const resolved = await this.resolveSubdomains(allSubdomains);
//     const subdomainIps = this.collectUniqueIps(resolved);
//     const allRealIps = [...new Set([...leakedRealIps, ...subdomainIps])];
//     const ipMap = await this.scanIps(allRealIps, resolved, portFrom, portTo);

//     // No DB save — result returned to Server A via taskQueue.complete()
//     return {
//       id: 0,
//       domain,
//       scannedAt: new Date().toISOString(),
//       hasWildcardDns: wildcardIps.size > 0,
//       cdnProvider,
//       leakedRealIps,
//       subdomains: resolved,
//       ipMap,
//       portRange: { from: portFrom, to: portTo },
//       summary: {
//         totalSubdomains: resolved.length,
//         resolvedSubdomains: resolved.filter((s) => s.ips.length > 0).length,
//         realSubdomains: resolved.filter(
//           (s) => s.ips.length > 0 && !s.isCloudflare,
//         ).length,
//         uniqueIps: allRealIps.length,
//         realIps: ipMap.filter((ip) => !ip.isCloudflare).length,
//         totalOpenPorts: ipMap.reduce((a, ip) => a + ip.openPorts.length, 0),
//         ctLogsFound: resolved.filter(
//           (s) => s.source === 'ct_logs' || s.source === 'both',
//         ).length,
//         bruteforceFound: resolved.filter(
//           (s) => s.source === 'dns_bruteforce' || s.source === 'both',
//         ).length,
//       },
//     };
//   }

//   // ─── Direct IP port scan ──────────────────────────────────────────────────

//   async scanIpDirect(
//     ip: string,
//     domain: string,
//     portFrom: number,
//     portTo: number,
//   ): Promise<{
//     ip: string;
//     domain: string;
//     portRange: { from: number; to: number };
//     openPorts: PortResult[];
//     scannedAt: string;
//   }> {
//     if (portFrom >= portTo)
//       throw new BadRequestException('portFrom must be less than portTo');
//     if (portTo - portFrom + 1 > 10_000)
//       throw new BadRequestException('Port range cannot exceed 10,000');
//     if (PRIVATE_IP_RE.test(ip))
//       throw new BadRequestException('Private IP not allowed');

//     this.logger.log(`[B] Direct IP scan: ${ip} ports ${portFrom}-${portTo}`);

//     const openPorts = await this.scanPortRange(ip, portFrom, portTo);
//     return {
//       ip,
//       domain,
//       portRange: { from: portFrom, to: portTo },
//       openPorts,
//       scannedAt: new Date().toISOString(),
//     };
//   }

//   // ─── Private scan methods (same as Server A) ──────────────────────────────

//   private async detectWildcardIps(domain: string): Promise<Set<string>> {
//     try {
//       const ips = await Promise.race([
//         dnsResolve4(`wildcard-check-${Date.now()}.${domain}`),
//         new Promise<string[]>((_, rej) =>
//           setTimeout(() => rej(new Error()), 3_000),
//         ),
//       ]);
//       return new Set(ips);
//     } catch {
//       return new Set();
//     }
//   }

//   private async fetchFromCertTransparency(domain: string): Promise<string[]> {
//     const controller = new AbortController();
//     const timeout = setTimeout(() => controller.abort(), 15_000);
//     try {
//       const res = await fetch(`https://crt.sh/?q=%25.${domain}&output=json`, {
//         signal: controller.signal,
//         headers: { Accept: 'application/json' },
//       });
//       if (!res.ok) return [];
//       const data: Array<{ name_value: string }> = await res.json();
//       const seen = new Set<string>();
//       for (const entry of data) {
//         for (const line of entry.name_value.split('\n')) {
//           const name = line.trim().toLowerCase();
//           if (!name.startsWith('*') && name.endsWith(`.${domain}`))
//             seen.add(name);
//         }
//       }
//       return [...seen];
//     } catch {
//       return [];
//     } finally {
//       clearTimeout(timeout);
//     }
//   }

//   private async dnsbruteforce(
//     domain: string,
//     wildcardIps: Set<string>,
//   ): Promise<string[]> {
//     const found: string[] = [];
//     const BATCH = 50;

//     for (let i = 0; i < SUBDOMAIN_WORDLIST.length; i += BATCH) {
//       const batch = SUBDOMAIN_WORDLIST.slice(i, i + BATCH);
//       const results = await Promise.allSettled(
//         batch.map(async (word) => {
//           const fqdn = `${word}.${domain}`;
//           try {
//             const ips = await Promise.race([
//               dnsResolve4(fqdn),
//               new Promise<string[]>((_, rej) =>
//                 setTimeout(() => rej(new Error()), 800),
//               ),
//             ]);
//             if (wildcardIps.size > 0 && ips.every((ip) => wildcardIps.has(ip)))
//               return null;
//             return fqdn;
//           } catch {
//             return null;
//           }
//         }),
//       );
//       for (const r of results) {
//         if (r.status === 'fulfilled' && r.value) found.push(r.value);
//       }
//     }
//     return found;
//   }

//   private mergeSubdomainSources(
//     domain: string,
//     ctList: string[],
//     bruteList: string[],
//   ): Array<{ name: string; source: SubdomainEntry['source'] }> {
//     const ctSet = new Set(ctList);
//     const bruteSet = new Set(bruteList);
//     return [...new Set([...ctList, ...bruteList])]
//       .filter((n) => n !== domain)
//       .map((name) => ({
//         name,
//         source: (ctSet.has(name) && bruteSet.has(name)
//           ? 'both'
//           : ctSet.has(name)
//             ? 'ct_logs'
//             : 'dns_bruteforce') as SubdomainEntry['source'],
//       }))
//       .sort((a, b) => a.name.localeCompare(b.name));
//   }

//   private async resolveSubdomains(
//     entries: Array<{ name: string; source: SubdomainEntry['source'] }>,
//   ): Promise<SubdomainEntry[]> {
//     const results: SubdomainEntry[] = [];
//     const BATCH = 10;
//     for (let i = 0; i < Math.min(entries.length, 150); i += BATCH) {
//       const batch = entries.slice(i, i + BATCH);
//       const resolved = await Promise.all(
//         batch.map(async ({ name, source }) => {
//           try {
//             const ips = await Promise.race([
//               dnsResolve4(name),
//               new Promise<string[]>((_, rej) =>
//                 setTimeout(() => rej(new Error()), 3_000),
//               ),
//             ]);
//             const publicIps = ips.filter((ip) => !PRIVATE_IP_RE.test(ip));
//             return {
//               subdomain: name,
//               ips: publicIps,
//               isCloudflare: publicIps.every(isCloudflareIp),
//               source,
//               resolvedAt: new Date().toISOString(),
//             };
//           } catch {
//             return {
//               subdomain: name,
//               ips: [],
//               isCloudflare: false,
//               source,
//               resolvedAt: null,
//             };
//           }
//         }),
//       );
//       results.push(...resolved);
//     }
//     return results;
//   }

//   private collectUniqueIps(entries: SubdomainEntry[]): string[] {
//     const seen = new Set<string>();
//     for (const e of entries) e.ips.forEach((ip) => seen.add(ip));
//     return [...seen];
//   }

//   private async scanIps(
//     ips: string[],
//     entries: SubdomainEntry[],
//     portFrom: number,
//     portTo: number,
//   ): Promise<IpInfo[]> {
//     const realIps = ips.filter((ip) => !isCloudflareIp(ip)).slice(0, 20);
//     const cfIps = ips.filter((ip) => isCloudflareIp(ip)).slice(0, 5);

//     const realResults = await Promise.all(
//       realIps.map(async (ip) => ({
//         address: ip,
//         subdomains: entries
//           .filter((e) => e.ips.includes(ip))
//           .map((e) => e.subdomain),
//         openPorts: await this.scanPortRange(ip, portFrom, portTo),
//         isCloudflare: false,
//       })),
//     );
//     const cfResults: IpInfo[] = cfIps.map((ip) => ({
//       address: ip,
//       subdomains: entries
//         .filter((e) => e.ips.includes(ip))
//         .map((e) => e.subdomain),
//       openPorts: [],
//       isCloudflare: true,
//     }));
//     return [...realResults, ...cfResults];
//   }

//   private async scanPortRange(
//     ip: string,
//     from: number,
//     to: number,
//   ): Promise<PortResult[]> {
//     const ports: number[] = [];
//     for (let p = from; p <= to; p++) ports.push(p);
//     const open: PortResult[] = [];
//     const BATCH = 200,
//       TIMEOUT = 400;

//     for (let i = 0; i < ports.length; i += BATCH) {
//       const results = await Promise.all(
//         ports
//           .slice(i, i + BATCH)
//           .map((port) =>
//             this.probePort(
//               ip,
//               port,
//               KNOWN_SERVICES[port] ?? `port-${port}`,
//               TIMEOUT,
//             ),
//           ),
//       );
//       open.push(...results.filter((r) => r.status === 'open'));
//     }
//     return open;
//   }

//   private probePort(
//     ip: string,
//     port: number,
//     service: string,
//     timeout: number,
//   ): Promise<PortResult> {
//     return new Promise((resolve) => {
//       const socket = new net.Socket();
//       let settled = false;
//       const finish = (status: 'open' | 'closed' | 'filtered') => {
//         if (settled) return;
//         settled = true;
//         socket.destroy();
//         resolve({ port, service, status });
//       };
//       socket.setTimeout(timeout);
//       socket.connect(port, ip, () => finish('open'));
//       socket.on('error', () => finish('closed'));
//       socket.on('timeout', () => finish('filtered'));
//     });
//   }

//   private isValidPublicIp(ip: string): boolean {
//     if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;
//     return !PRIVATE_IP_RE.test(ip);
//   }
// }
