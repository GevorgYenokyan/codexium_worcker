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

// ✅ п.4 — используем isCdnIp из helpers вместо локального дубликата
import { isCdnIp } from './helpers/ip.helpers';

const dnsResolve4 = promisify(dns.resolve4);
const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1)/;

// ✅ п.4 — CLOUDFLARE_RANGES и isCloudflareIp удалены, заменены на isCdnIp

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

// ✅ п.3 — Порты с которых читаем баннер после TCP connect
// Только те сервисы которые пишут баннер первыми без запроса от клиента
const BANNER_PORTS = new Set([
  21, // FTP:  "220 FTP server ready"
  22, // SSH:  "SSH-2.0-OpenSSH_8.x"
  25, // SMTP: "220 mail.example.com ESMTP"
  110, // POP3: "+OK Dovecot ready"
  143, // IMAP: "* OK Dovecot ready"
  3306, // MySQL: version in handshake packet
  5432, // PostgreSQL: первый пакет содержит версию
  6379, // Redis: отвечает на пустую строку
  27017, // MongoDB: отвечает на пустую строку
]);

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

    // ✅ п.2 — три probe запроса для надёжного определения wildcard DNS
    const wildcardIps = await this.detectWildcardIps(domain);

    let leakedRealIps: string[] = knownRealIps.filter((ip) =>
      this.isValidPublicIp(ip),
    );
    let cdnProvider: string | null = null;

    // ✅ п.1 — добавляем AnubisDB и Columbus параллельно к crt.sh и brute force
    const [
      cdnLeakResult,
      ctSubdomains,
      bruteSubdomains,
      anubisSubdomains,
      columbusSubdomains,
    ] =
      leakedRealIps.length > 0
        ? [
            null,
            await this.fetchFromCertTransparency(domain),
            await this.dnsbruteforce(domain, wildcardIps),
            await this.fetchFromAnubisDB(domain),
            await this.fetchFromColumbus(domain),
          ]
        : await Promise.all([
            this.cdnLeakService.findRealIp(domain).catch(() => null),
            this.fetchFromCertTransparency(domain),
            this.dnsbruteforce(domain, wildcardIps),
            this.fetchFromAnubisDB(domain), // ✅ п.1
            this.fetchFromColumbus(domain), // ✅ п.1
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
      anubisSubdomains, // ✅ п.1
      columbusSubdomains, // ✅ п.1
    );

    // ✅ п.5 — приоритизируем перед резолвингом: both → ct_logs → dns_bruteforce → external
    const prioritized = this.prioritizeSubdomains(allSubdomains);
    const resolved = await this.resolveSubdomains(prioritized);
    const subdomainIps = this.collectUniqueIps(resolved);

    // ✅ п.6 — leaked IPs в начале списка, они сканируются первыми
    const allRealIps = [
      ...leakedRealIps,
      ...[...new Set(subdomainIps)].filter((ip) => !leakedRealIps.includes(ip)),
    ];

    const ipMap = await this.scanIpsSmart(
      allRealIps,
      leakedRealIps, // ✅ п.6 — передаём leaked отдельно для приоритета
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
    leakedIps: string[], // ✅ п.6
    entries: SubdomainEntry[],
    portFrom: number,
    portTo: number,
  ): Promise<IpInfo[]> {
    // ✅ п.6 — leaked IPs гарантированно попадают в начало, остальные добираются до лимита 20
    const leakedSet = new Set(leakedIps);
    const nonCdnIps = ips.filter((ip) => !isCdnIp(ip)); // ✅ п.4

    const prioritizedTargets = [
      ...nonCdnIps.filter((ip) => leakedSet.has(ip)), // leaked первыми
      ...nonCdnIps.filter((ip) => !leakedSet.has(ip)), // остальные после
    ].slice(0, 20);

    const cfTargets = ips.filter((ip) => isCdnIp(ip)).slice(0, 5); // ✅ п.4

    const results: IpInfo[] = [];

    for (const ip of prioritizedTargets) {
      this.logger.debug(
        `[Phase 1] Discovery for ${ip} (leaked=${leakedSet.has(ip)})`,
      );

      // Phase 1: Fast scan of Top 50 ports
      const discoveryPorts = TOP_50_PORTS.filter(
        (p) => p >= portFrom && p <= portTo,
      );
      const phase1Results = await this.scanPortList(ip, discoveryPorts, 400, 0);

      // Phase 2: Deep scan of remaining range (Randomized & Stealthy)
      const remainingPorts: number[] = [];
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

    // CDN IPs — без сканирования портов
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
        const jitter = batchDelay * (0.8 + Math.random() * 0.4);
        await new Promise((res) => setTimeout(res, jitter));
      }
    }
    return open;
  }

  // ─── Subdomain sources ────────────────────────────────────────────────────

  // ✅ п.2 — три probe запроса с разными случайными субдоменами
  // Некоторые домены возвращают разные wildcard IP — нужно объединение
  private async detectWildcardIps(domain: string): Promise<Set<string>> {
    const probes = [
      `wildcard-check-${Date.now()}.${domain}`,
      `cdn-leak-probe-${Math.random().toString(36).slice(2)}.${domain}`,
      `nonexistent-${Date.now() + 1}.${domain}`,
    ];

    const results = await Promise.allSettled(
      probes.map((probe) =>
        Promise.race([
          dnsResolve4(probe),
          new Promise<string[]>((_, rej) =>
            setTimeout(() => rej(new Error()), 3_000),
          ),
        ]),
      ),
    );

    const wildcardIps = new Set<string>();
    for (const r of results) {
      if (r.status === 'fulfilled') {
        r.value.forEach((ip) => wildcardIps.add(ip));
      }
    }
    return wildcardIps;
  }

  private async fetchFromCertTransparency(domain: string): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(`https://crt.sh/?q=%25.${domain}&output=json`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return [];
      const data: any[] = await res.json();
      const seen = new Set<string>();
      for (const entry of data) {
        entry.name_value.split('\n').forEach((line: string) => {
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

  // ✅ п.1 — AnubisDB как дополнительный источник поддоменов
  private async fetchFromAnubisDB(domain: string): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(`https://jldc.me/anubis/subdomains/${domain}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SecurityScanner/1.0' },
      });
      clearTimeout(timer);
      if (!res.ok) return [];
      const data: string[] = await res.json();
      if (!Array.isArray(data)) return [];
      return data.filter((s) => s.endsWith(`.${domain}`));
    } catch {
      return [];
    }
  }

  // ✅ п.1 — Columbus Project как дополнительный источник поддоменов
  private async fetchFromColumbus(domain: string): Promise<string[]> {
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
      const data: string[] = await res.json();
      if (!Array.isArray(data)) return [];
      return data.filter((s) => s.endsWith(`.${domain}`));
    } catch {
      return [];
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

  // ─── Merge & prioritize subdomains ────────────────────────────────────────

  // ✅ п.1 + п.5 — принимает 4 источника вместо 2
  private mergeSubdomainSources(
    domain: string,
    ctList: string[],
    bruteList: string[],
    anubisList: string[],
    columbusList: string[],
  ): Array<{
    name: string;
    source: 'ct_logs' | 'dns_bruteforce' | 'both' | 'external';
  }> {
    const ctSet = new Set(ctList);
    const bruteSet = new Set(bruteList);
    const externalSet = new Set([...anubisList, ...columbusList]);

    const all = new Set([
      ...ctList,
      ...bruteList,
      ...anubisList,
      ...columbusList,
    ]);

    return [...all]
      .filter((n) => n !== domain)
      .map((name) => {
        const inCt = ctSet.has(name);
        const inBrute = bruteSet.has(name);
        const inExt = externalSet.has(name);

        let source: 'ct_logs' | 'dns_bruteforce' | 'both' | 'external';
        if (inCt && inBrute) source = 'both';
        else if (inCt) source = 'ct_logs';
        else if (inBrute) source = 'dns_bruteforce';
        else source = 'external'; // AnubisDB / Columbus
        return { name, source };
      });
  }

  // ✅ п.5 — сортировка: both → ct_logs → external → dns_bruteforce
  // Поддомены найденные несколькими источниками наиболее надёжны
  private prioritizeSubdomains(
    entries: Array<{ name: string; source: string }>,
  ): Array<{ name: string; source: any }> {
    const order: Record<string, number> = {
      both: 0,
      ct_logs: 1,
      external: 2,
      dns_bruteforce: 3,
    };
    return [...entries].sort(
      (a, b) => (order[a.source] ?? 99) - (order[b.source] ?? 99),
    );
  }

  private async resolveSubdomains(entries: any[]): Promise<SubdomainEntry[]> {
    const results: SubdomainEntry[] = [];
    // ✅ п.5 — увеличен лимит до 200 (приоритизация уже обеспечила качество)
    for (let i = 0; i < Math.min(entries.length, 200); i += 10) {
      const batch = entries.slice(i, i + 10);
      const resolved = await Promise.all(
        batch.map(async ({ name, source }) => {
          try {
            const ips = await Promise.race([
              dnsResolve4(name),
              new Promise<string[]>((_, rej) =>
                setTimeout(() => rej(new Error()), 3_000),
              ),
            ]);
            const publicIps = ips.filter((ip) => !PRIVATE_IP_RE.test(ip));
            return {
              subdomain: name,
              ips: publicIps,
              isCloudflare: publicIps.every(isCdnIp), // ✅ п.4
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

  // ─── Port probing ─────────────────────────────────────────────────────────

  // ✅ п.3 — banner grabbing на портах из BANNER_PORTS
  // Читаем первые 256 байт после подключения — большинство сервисов
  // сразу отправляют приветственный баннер без запроса от клиента.
  // Для Redis / MongoDB отправляем пустую строку чтобы получить ответ.
  private probePort(
    ip: string,
    port: number,
    service: string,
    timeout: number,
  ): Promise<PortResult> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let settled = false;
      let banner = '';

      const finish = (status: 'open' | 'closed' | 'filtered') => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve({
          port,
          service,
          status,
          // ✅ п.3 — баннер только для открытых портов, пустая строка если не получили
          banner:
            status === 'open' && banner
              ? banner.trim().slice(0, 256)
              : undefined,
        });
      };

      socket.setTimeout(timeout);

      socket.connect(port, ip, () => {
        if (!BANNER_PORTS.has(port)) {
          // Баннер не нужен — сразу закрываем
          finish('open');
          return;
        }

        // Для Redis и MongoDB отправляем пустую строку чтобы получить ответ
        if (port === 6379 || port === 27017) {
          socket.write('\r\n');
        }

        // Ждём баннер не дольше половины основного timeout
        const bannerTimer = setTimeout(() => finish('open'), timeout / 2);

        socket.once('data', (data) => {
          clearTimeout(bannerTimer);
          banner = data.toString('utf8', 0, 256);
          finish('open');
        });
      });

      socket.on('error', () => finish('closed'));
      socket.on('timeout', () => finish('filtered'));
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
