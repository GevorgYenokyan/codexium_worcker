import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';
import * as net from 'net';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TestResult =
  | 'VULN'
  | 'BLOCKED'
  | 'REDIRECT'
  | 'EMPTY'
  | 'TIMEOUT'
  | 'ERROR';

export type ScanMode = 'quick' | 'full';

export interface TestCase {
  name: string;
  category: string;
  result: TestResult;
  statusCode: number | string;
  latencyMs: number;
  responseSnippet: string | null;
  details: string | null;
}

export interface BannerResult {
  port: number;
  service: string;
  banner: string | null;
  softwareName: string | null;
  softwareVersion: string | null;
  os: string | null;
  risk: 'high' | 'medium' | 'low' | 'info';
  note: string | null;
  cveHint: string | null;
}

export interface DirectAccessResult {
  ip: string;
  domain: string;
  scanMode: ScanMode;
  grade: 'PROTECTED' | 'PARTIAL' | 'EXPOSED';
  score: number;
  summary: {
    total: number;
    blocked: number;
    vulnerable: number;
    redirect: number;
    empty: number;
    exposedFiles: number;
    exposedPaths: number;
    highRiskBanners: number;
  };
  tests: TestCase[];
  exposedFiles: TestCase[];
  exposedPaths: TestCase[];
  banners: BannerResult[];
  verdict: string;
  recommendations: string[];
  scannedAt: string;
  scanDurationMs: number;
}

interface RawResponse {
  ok: boolean;
  statusCode: number | string;
  headers: Record<string, string>;
  bodySnippet: string;
  contentLength: number;
  hasData: boolean;
  latencyMs: number;
  redirectTo: string | null;
  serverHeader: string | null;
}

interface OpenPort {
  port: number;
  service: string;
}

const REAL_DATA_THRESHOLD = 300;

// ─── User-Agent pool ──────────────────────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
];

// ─── Exposed files ────────────────────────────────────────────────────────────

const EXPOSED_FILES: Array<{
  path: string;
  name: string;
  priority: 1 | 2;
  severity: 'critical' | 'high' | 'medium';
}> = [
  // Critical — quick scan
  { path: '/.env', name: '.env', priority: 1, severity: 'critical' },
  {
    path: '/.env.production',
    name: '.env.production',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/.env.local',
    name: '.env.local',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/.git/config',
    name: '.git/config',
    priority: 1,
    severity: 'critical',
  },
  { path: '/.git/HEAD', name: '.git/HEAD', priority: 1, severity: 'critical' },
  {
    path: '/wp-config.php',
    name: 'wp-config.php',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/config.php',
    name: 'config.php',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/phpinfo.php',
    name: 'phpinfo.php',
    priority: 1,
    severity: 'critical',
  },
  { path: '/dump.sql', name: 'dump.sql', priority: 1, severity: 'critical' },
  {
    path: '/backup.sql',
    name: 'backup.sql',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/database.sql',
    name: 'database.sql',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/backup.zip',
    name: 'backup.zip',
    priority: 1,
    severity: 'critical',
  },
  // High — quick scan
  {
    path: '/composer.json',
    name: 'composer.json',
    priority: 1,
    severity: 'high',
  },
  {
    path: '/composer.lock',
    name: 'composer.lock',
    priority: 1,
    severity: 'high',
  },
  {
    path: '/package.json',
    name: 'package.json',
    priority: 1,
    severity: 'high',
  },
  { path: '/.DS_Store', name: '.DS_Store', priority: 1, severity: 'high' },
  {
    path: '/storage/logs/laravel.log',
    name: 'laravel.log',
    priority: 1,
    severity: 'high',
  },
  { path: '/error.log', name: 'error.log', priority: 1, severity: 'high' },
  { path: '/debug.log', name: 'debug.log', priority: 1, severity: 'high' },
  // Full scan only
  {
    path: '/.env.backup',
    name: '.env.backup',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/.env.staging',
    name: '.env.staging',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/wp-config.php.bak',
    name: 'wp-config.php.bak',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/configuration.php',
    name: 'configuration.php',
    priority: 2,
    severity: 'high',
  },
  {
    path: '/settings.php',
    name: 'settings.php',
    priority: 2,
    severity: 'high',
  },
  { path: '/config.yml', name: 'config.yml', priority: 2, severity: 'high' },
  { path: '/config.yaml', name: 'config.yaml', priority: 2, severity: 'high' },
  {
    path: '/.svn/entries',
    name: '.svn/entries',
    priority: 2,
    severity: 'high',
  },
  { path: '/.gitignore', name: '.gitignore', priority: 2, severity: 'medium' },
  {
    path: '/backup.tar.gz',
    name: 'backup.tar.gz',
    priority: 2,
    severity: 'critical',
  },
  { path: '/db.sql', name: 'db.sql', priority: 2, severity: 'critical' },
  { path: '/site.zip', name: 'site.zip', priority: 2, severity: 'critical' },
  { path: '/www.zip', name: 'www.zip', priority: 2, severity: 'critical' },
  { path: '/access.log', name: 'access.log', priority: 2, severity: 'high' },
  { path: '/yarn.lock', name: 'yarn.lock', priority: 2, severity: 'medium' },
  {
    path: '/.idea/workspace.xml',
    name: '.idea/workspace.xml',
    priority: 2,
    severity: 'medium',
  },
  {
    path: '/.vscode/settings.json',
    name: '.vscode/settings.json',
    priority: 2,
    severity: 'medium',
  },
  { path: '/info.php', name: 'info.php', priority: 2, severity: 'critical' },
  { path: '/test.php', name: 'test.php', priority: 2, severity: 'high' },
  { path: '/readme.txt', name: 'readme.txt', priority: 2, severity: 'medium' },
  {
    path: '/CHANGELOG.md',
    name: 'CHANGELOG.md',
    priority: 2,
    severity: 'medium',
  },
];

// ─── Known paths ──────────────────────────────────────────────────────────────

const KNOWN_PATHS: Array<{
  path: string;
  name: string;
  priority: 1 | 2;
  severity: 'critical' | 'high' | 'medium';
}> = [
  // Critical — quick scan
  {
    path: '/phpmyadmin/',
    name: 'phpMyAdmin',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/pma/',
    name: 'phpMyAdmin (pma)',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/wp-admin/',
    name: 'WordPress Admin',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/wp-login.php',
    name: 'WordPress Login',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/xmlrpc.php',
    name: 'WordPress XMLRPC',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/actuator/env',
    name: 'Spring Actuator: env',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/actuator/beans',
    name: 'Spring Actuator: beans',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/actuator/logfile',
    name: 'Spring Actuator: log',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/telescope',
    name: 'Laravel Telescope',
    priority: 1,
    severity: 'critical',
  },
  { path: '/graphql', name: 'GraphQL endpoint', priority: 1, severity: 'high' },
  {
    path: '/graphiql',
    name: 'GraphiQL IDE',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/swagger-ui.html',
    name: 'Swagger UI',
    priority: 1,
    severity: 'high',
  },
  { path: '/v3/api-docs', name: 'OpenAPI v3', priority: 1, severity: 'high' },
  {
    path: '/metrics',
    name: 'Prometheus metrics',
    priority: 1,
    severity: 'high',
  },
  {
    path: '/server-status',
    name: 'Apache server-status',
    priority: 1,
    severity: 'high',
  },
  { path: '/debug/pprof', name: 'Go pprof', priority: 1, severity: 'critical' },
  {
    path: '/_profiler',
    name: 'Symfony Profiler',
    priority: 1,
    severity: 'critical',
  },
  { path: '/admin', name: 'Admin panel', priority: 1, severity: 'high' },
  { path: '/horizon', name: 'Laravel Horizon', priority: 1, severity: 'high' },
  // Full scan only
  {
    path: '/phpmyadmin/index.php',
    name: 'phpMyAdmin (index)',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/myadmin/',
    name: 'phpMyAdmin (myadmin)',
    priority: 2,
    severity: 'critical',
  },
  { path: '/mysql/', name: 'MySQL panel', priority: 2, severity: 'critical' },
  {
    path: '/actuator',
    name: 'Spring Actuator',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/actuator/health',
    name: 'Spring Actuator: health',
    priority: 2,
    severity: 'medium',
  },
  {
    path: '/actuator/mappings',
    name: 'Spring Actuator: mappings',
    priority: 2,
    severity: 'high',
  },
  {
    path: '/swagger-ui/',
    name: 'Swagger UI (/)',
    priority: 2,
    severity: 'high',
  },
  {
    path: '/api/swagger.json',
    name: 'Swagger JSON',
    priority: 2,
    severity: 'high',
  },
  { path: '/api-docs', name: 'API Docs', priority: 2, severity: 'high' },
  { path: '/v2/api-docs', name: 'Swagger v2', priority: 2, severity: 'high' },
  { path: '/debug', name: 'Debug endpoint', priority: 2, severity: 'critical' },
  {
    path: '/_profiler/phpinfo',
    name: 'Symfony phpinfo',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/nginx_status',
    name: 'Nginx status',
    priority: 2,
    severity: 'high',
  },
  {
    path: '/server-info',
    name: 'Apache server-info',
    priority: 2,
    severity: 'high',
  },
  { path: '/status', name: 'Status page', priority: 2, severity: 'medium' },
  { path: '/admin/', name: 'Admin panel (/)', priority: 2, severity: 'high' },
  {
    path: '/administrator/',
    name: 'Joomla Admin',
    priority: 2,
    severity: 'critical',
  },
  { path: '/panel', name: 'Panel', priority: 2, severity: 'high' },
  { path: '/cpanel', name: 'cPanel', priority: 2, severity: 'critical' },
  {
    path: '/.well-known/security.txt',
    name: 'security.txt',
    priority: 2,
    severity: 'medium',
  },
];

// ─── Banner patterns ──────────────────────────────────────────────────────────

const BANNER_PATTERNS: Array<{
  regex: RegExp;
  software: string;
  versionGroup?: number;
  osGroup?: number;
  risk: BannerResult['risk'];
  note: string;
  cveCheck?: (version: string) => string | null;
}> = [
  {
    regex: /SSH-[\d.]+-OpenSSH_([\d.p]+)\s*([A-Za-z]+\w*)?/i,
    software: 'OpenSSH',
    versionGroup: 1,
    osGroup: 2,
    risk: 'medium',
    note: 'SSH version exposed',
    cveCheck: (v) => {
      const [major, minor] = v.split('.').map(Number);
      if (major < 8 || (major === 8 && minor < 9))
        return 'Versions < 8.9 may be affected by CVE-2023-38408';
      return null;
    },
  },
  {
    regex: /SSH-[\d.]+-dropbear_([\d.]+)/i,
    software: 'Dropbear SSH',
    versionGroup: 1,
    risk: 'medium',
    note: 'Dropbear SSH — common on embedded/IoT devices',
  },
  {
    regex: /220.*?Postfix/i,
    software: 'Postfix',
    risk: 'low',
    note: 'Postfix SMTP banner visible',
  },
  {
    regex: /220.*?Exim\s([\d.]+)/i,
    software: 'Exim',
    versionGroup: 1,
    risk: 'high',
    note: 'Exim version exposed',
    cveCheck: (v) => {
      const [major, minor] = v.split('.').map(Number);
      if (major < 4 || (major === 4 && minor < 96))
        return 'Versions < 4.96 affected by CVE-2023-42115 (RCE)';
      return null;
    },
  },
  {
    regex: /220.*?Sendmail\s([\d./]+)/i,
    software: 'Sendmail',
    versionGroup: 1,
    risk: 'medium',
    note: 'Sendmail version exposed',
  },
  {
    regex: /220.*?Microsoft ESMTP/i,
    software: 'Microsoft Exchange',
    risk: 'medium',
    note: 'Exchange SMTP banner — version hidden but product exposed',
  },
  {
    regex: /\* OK.*?Dovecot/i,
    software: 'Dovecot',
    risk: 'low',
    note: 'Dovecot IMAP/POP3 banner visible',
  },
  {
    regex: /\* OK.*?Cyrus\s([\d.]+)/i,
    software: 'Cyrus IMAP',
    versionGroup: 1,
    risk: 'low',
    note: 'Cyrus IMAP banner visible',
  },
  {
    regex: /220.*?ProFTPD\s([\d.]+)/i,
    software: 'ProFTPD',
    versionGroup: 1,
    risk: 'high',
    note: 'ProFTPD on FTP — replace with SFTP/FTPS',
    cveCheck: (v) => {
      const [major, minor, patch = 0] = v.split('.').map(Number);
      if (major === 1 && minor === 3 && patch <= 7)
        return 'ProFTPD 1.3.7 and below — check CVE-2021-46854';
      return null;
    },
  },
  {
    regex: /220.*?vsftpd\s([\d.]+)/i,
    software: 'vsftpd',
    versionGroup: 1,
    risk: 'high',
    note: 'vsftpd on FTP — replace with SFTP',
  },
  {
    regex: /220.*?FileZilla\sServer\s([\d.]+)/i,
    software: 'FileZilla Server',
    versionGroup: 1,
    risk: 'high',
    note: 'FileZilla FTP Server exposed',
  },
  {
    regex: /SSH-[\d.]+-/,
    software: 'SSH',
    risk: 'info',
    note: 'SSH service detected (vendor unknown)',
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DirectAccessService {
  private readonly logger = new Logger(DirectAccessService.name);

  async test(
    ip: string,
    domain: string,
    openPorts: OpenPort[] = [],
    mode: ScanMode = 'quick',
  ): Promise<DirectAccessResult> {
    const startedAt = Date.now();
    this.logger.log(`Direct access test [${mode}]: ${ip} / ${domain}`);

    const tests: TestCase[] = [];

    const categories = [
      () => this.testBasicAccess(ip, domain),
      () => this.testHostVariants(ip, domain),
      () => this.testXFFBypass(ip, domain),
      () => this.testCFHeaderSpoof(ip, domain),
      () => this.testSNIMismatch(ip, domain),
      () => this.testExposedFiles(ip, domain, mode),
      () => this.testKnownPaths(ip, domain, mode),
    ];

    for (const category of categories) {
      const results = await category();
      tests.push(...results);
      await this.sleepJitter(200, 150);
    }

    const banners = await this.testBannerGrab(ip, openPorts);

    return this.buildResult(ip, domain, mode, tests, banners, startedAt);
  }

  // ─── Test 1: Basic direct access ─────────────────────────────────────────

  private async testBasicAccess(
    ip: string,
    domain: string,
  ): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const http80 = await this.request({
      ip,
      port: 80,
      path: '/',
      host: domain,
    });
    results.push(this.classify('HTTP:80 direct', 'Basic Access', http80));
    await this.sleepJitter(80, 50);

    const https443 = await this.request({
      ip,
      port: 443,
      path: '/',
      host: domain,
    });
    results.push(this.classify('HTTPS:443 direct', 'Basic Access', https443));
    await this.sleepJitter(80, 50);

    for (const path of ['/api', '/health', '/robots.txt']) {
      const r = await this.request({ ip, port: 443, path, host: domain });
      results.push(this.classify(`HTTPS:443 ${path}`, 'Basic Access', r));
      await this.sleepJitter(80, 40);
    }

    return results;
  }

  // ─── Test 2: Host header variations ──────────────────────────────────────

  private async testHostVariants(
    ip: string,
    domain: string,
  ): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const variants = [
      { name: 'Host: IP directly', host: ip },
      { name: 'Host: IP:443', host: `${ip}:443` },
      { name: 'Host: domain:443', host: `${domain}:443` },
      { name: 'Host: www.domain', host: `www.${domain}` },
    ];

    for (const v of variants) {
      const r = await this.request({ ip, port: 443, path: '/', host: v.host });
      results.push(this.classify(v.name, 'Host Header', r));
      await this.sleepJitter(100, 50);
    }

    return results;
  }

  // ─── Test 3: X-Forwarded-For bypass ──────────────────────────────────────

  private async testXFFBypass(ip: string, domain: string): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const cases = [
      {
        name: 'XFF: Cloudflare IP',
        headers: { 'x-forwarded-for': '104.16.0.1' },
      },
      {
        name: 'XFF: chain with CF',
        headers: { 'x-forwarded-for': '104.16.0.1, 172.64.0.1' },
      },
      { name: 'X-Real-IP: CF', headers: { 'x-real-ip': '104.16.0.1' } },
      {
        name: 'True-Client-IP: CF',
        headers: { 'true-client-ip': '104.16.0.1' },
      },
    ];

    for (const c of cases) {
      const r = await this.request({
        ip,
        port: 443,
        path: '/',
        host: domain,
        headers: c.headers,
      });
      results.push(this.classify(c.name, 'XFF Bypass', r));
      await this.sleepJitter(100, 50);
    }

    return results;
  }

  // ─── Test 4: Cloudflare header spoofing ──────────────────────────────────

  private async testCFHeaderSpoof(
    ip: string,
    domain: string,
  ): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const cases = [
      {
        name: 'CF headers (US)',
        headers: {
          'cf-connecting-ip': '104.16.0.1',
          'cf-ray': '7d3f1234abcd-IAD',
          'cf-visitor': '{"scheme":"https"}',
          'cf-ipcountry': 'US',
          'x-forwarded-for': '104.16.0.1',
        },
      },
      {
        name: 'CF headers (EU)',
        headers: {
          'cf-connecting-ip': '172.64.0.1',
          'cf-ray': '8a4b5678efgh-LHR',
          'cf-visitor': '{"scheme":"https"}',
          'cf-ipcountry': 'DE',
        },
      },
    ];

    for (const c of cases) {
      const r = await this.request({
        ip,
        port: 443,
        path: '/',
        host: domain,
        headers: c.headers,
      });
      results.push(this.classify(c.name, 'CF Header Spoof', r));
      await this.sleepJitter(120, 60);
    }

    return results;
  }

  // ─── Test 5: SNI mismatch ─────────────────────────────────────────────────

  private async testSNIMismatch(
    ip: string,
    domain: string,
  ): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const cases = [
      { name: 'SNI=domain, Host=IP', sni: domain, host: ip },
      { name: 'SNI=IP, Host=domain', sni: ip, host: domain },
    ];

    for (const c of cases) {
      const r = await this.request({
        ip,
        port: 443,
        path: '/',
        host: c.host,
        sniOverride: c.sni,
      });
      results.push(this.classify(c.name, 'SNI Mismatch', r));
      await this.sleepJitter(100, 50);
    }

    return results;
  }

  // ─── Test 6: Exposed files ────────────────────────────────────────────────

  private async testExposedFiles(
    ip: string,
    domain: string,
    mode: ScanMode,
  ): Promise<TestCase[]> {
    const list =
      mode === 'quick'
        ? EXPOSED_FILES.filter((f) => f.priority === 1)
        : EXPOSED_FILES;

    const results: TestCase[] = [];
    const BATCH = 5;

    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH);
      for (const { path, name, severity } of batch) {
        const r = await this.request({ ip, port: 443, path, host: domain });
        results.push(this.classifyFile(name, severity, r));
        await this.sleepJitter(120, 80);
      }
      await this.sleepJitter(300, 150);
    }

    return results;
  }

  // ─── Test 7: Known paths ──────────────────────────────────────────────────

  private async testKnownPaths(
    ip: string,
    domain: string,
    mode: ScanMode,
  ): Promise<TestCase[]> {
    const list =
      mode === 'quick'
        ? KNOWN_PATHS.filter((p) => p.priority === 1)
        : KNOWN_PATHS;

    const results: TestCase[] = [];
    const BATCH = 5;

    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH);
      for (const { path, name, severity } of batch) {
        const r = await this.request({ ip, port: 443, path, host: domain });
        results.push(this.classifyPath(name, severity, r));
        await this.sleepJitter(120, 80);
      }
      await this.sleepJitter(300, 150);
    }

    return results;
  }

  // ─── Test 8: Banner grabbing ──────────────────────────────────────────────

  private async testBannerGrab(
    ip: string,
    openPorts: OpenPort[],
  ): Promise<BannerResult[]> {
    if (!openPorts.length) return [];

    const results: BannerResult[] = [];
    for (const { port, service } of openPorts) {
      const banner = await this.grabBanner(ip, port, service);
      results.push(banner);
      await this.sleepJitter(200, 100);
    }
    return results;
  }

  private grabBanner(
    ip: string,
    port: number,
    service: string,
  ): Promise<BannerResult> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let raw = '';

      socket.setTimeout(4_000);
      socket.connect(port, ip, () => {
        /* passive — wait for banner */
      });

      socket.on('data', (chunk: Buffer) => {
        raw += chunk.toString('utf8', 0, Math.min(chunk.length, 512));
        if (raw.length >= 256) socket.destroy();
      });

      const finish = () => {
        socket.destroy();
        resolve(this.parseBanner(port, service, raw.trim()));
      };

      socket.on('end', finish);
      socket.on('timeout', finish);
      socket.on('error', () => {
        socket.destroy();
        resolve({
          port,
          service,
          banner: null,
          softwareName: null,
          softwareVersion: null,
          os: null,
          risk: 'info',
          note: 'Could not grab banner',
          cveHint: null,
        });
      });
    });
  }

  private parseBanner(
    port: number,
    service: string,
    raw: string,
  ): BannerResult {
    if (!raw) {
      return {
        port,
        service,
        banner: null,
        softwareName: null,
        softwareVersion: null,
        os: null,
        risk: 'info',
        note: 'No banner received',
        cveHint: null,
      };
    }

    for (const pattern of BANNER_PATTERNS) {
      const match = raw.match(pattern.regex);
      if (match) {
        const version = pattern.versionGroup
          ? (match[pattern.versionGroup] ?? null)
          : null;
        const cveHint =
          version && pattern.cveCheck ? pattern.cveCheck(version) : null;
        return {
          port,
          service,
          banner: raw.slice(0, 200),
          softwareName: pattern.software,
          softwareVersion: version,
          os: pattern.osGroup ? (match[pattern.osGroup] ?? null) : null,
          risk: cveHint ? 'high' : pattern.risk,
          note: pattern.note,
          cveHint,
        };
      }
    }

    return {
      port,
      service,
      banner: raw.slice(0, 200),
      softwareName: null,
      softwareVersion: null,
      os: null,
      risk: 'info',
      note: 'Banner received but software not identified',
      cveHint: null,
    };
  }

  // ─── HTTP/HTTPS request ───────────────────────────────────────────────────

  private request(opts: {
    ip: string;
    port: number;
    path: string;
    host: string;
    headers?: Record<string, string>;
    sniOverride?: string;
  }): Promise<RawResponse> {
    const { ip, port, path, host, headers = {}, sniOverride } = opts;
    const isHTTPS = port === 443 || port === 8443;
    const mod = isHTTPS ? https : http;
    const start = Date.now();

    return new Promise((resolve) => {
      const options: Record<string, any> = {
        hostname: ip,
        port,
        path,
        method: 'GET',
        timeout: 6_000,
        rejectUnauthorized: false,
        headers: {
          Host: host,
          'User-Agent': this.randomUA(),
          Accept: 'text/html,application/xhtml+xml,application/json,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          Connection: 'close',
          ...headers,
        },
      };

      if (isHTTPS) {
        options.servername = sniOverride !== undefined ? sniOverride : host;
      }

      const req = mod.request(options, (res: any) => {
        let body = '';
        let contentLength = 0;

        res.on('data', (chunk: Buffer) => {
          contentLength += chunk.length;
          if (body.length < 500) body += chunk.toString();
        });

        res.on('end', () => {
          resolve({
            ok: true,
            statusCode: res.statusCode,
            headers: res.headers ?? {},
            bodySnippet: body.slice(0, 200),
            contentLength,
            hasData: contentLength > REAL_DATA_THRESHOLD,
            latencyMs: Date.now() - start,
            redirectTo: res.headers?.['location'] ?? null,
            serverHeader: res.headers?.['server'] ?? null,
          });
        });
      });

      req.on('error', () =>
        resolve({
          ok: false,
          statusCode: 'ERR',
          headers: {},
          bodySnippet: '',
          contentLength: 0,
          hasData: false,
          latencyMs: Date.now() - start,
          redirectTo: null,
          serverHeader: null,
        }),
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ok: false,
          statusCode: 'TIMEOUT',
          headers: {},
          bodySnippet: '',
          contentLength: 0,
          hasData: false,
          latencyMs: 6_000,
          redirectTo: null,
          serverHeader: null,
        });
      });

      req.end();
    });
  }

  // ─── Classifiers ──────────────────────────────────────────────────────────

  private classify(name: string, category: string, r: RawResponse): TestCase {
    let result: TestResult;

    if (!r.ok || r.statusCode === 'TIMEOUT') result = 'TIMEOUT';
    else if (r.statusCode === 'ERR') result = 'ERROR';
    else if (r.hasData) result = 'VULN';
    else if ([301, 302, 307, 308].includes(r.statusCode as number))
      result = 'REDIRECT';
    else if ([400, 403, 406, 444].includes(r.statusCode as number))
      result = 'BLOCKED';
    else result = 'EMPTY';

    return {
      name,
      category,
      result,
      statusCode: r.statusCode,
      latencyMs: r.latencyMs,
      responseSnippet: result === 'VULN' ? r.bodySnippet : null,
      details: r.redirectTo
        ? `Redirects to: ${r.redirectTo}`
        : r.serverHeader
          ? `Server: ${r.serverHeader}`
          : null,
    };
  }

  // ─── File classifier with smart content validation ────────────────────────
  // Guards against false positives when server returns 200 with an HTML
  // error page (Next.js, Cloudflare, nginx try_files, etc.) instead of
  // the actual sensitive file.

  private classifyFile(
    name: string,
    severity: string,
    r: RawResponse,
  ): TestCase {
    let result: TestResult;

    if (!r.ok || r.statusCode === 'TIMEOUT') {
      result = 'TIMEOUT';
    } else if (r.statusCode === 'ERR') {
      result = 'ERROR';
    } else if (r.statusCode === 200) {
      const body = r.bodySnippet;
      const lower = body.toLowerCase().trimStart();

      // Empty response
      if (r.contentLength === 0 || lower.length === 0) {
        result = 'EMPTY';

        // HTML error page — real sensitive files never start with HTML tags.
        // Covers: Next.js, Cloudflare, nginx, Apache, any framework error page.
      } else if (
        lower.startsWith('<!doctype') ||
        lower.startsWith('<html') ||
        (lower.startsWith('<') && lower.includes('</'))
      ) {
        result = 'BLOCKED';

        // Content matches what we expect from this file type — confirmed leak
      } else if (this.isRealFileContent(name, body, r.contentLength)) {
        result = 'VULN';

        // Large non-HTML response — likely real file even without signature match
      } else if (r.contentLength > REAL_DATA_THRESHOLD) {
        result = 'VULN';

        // Small unrecognised response
      } else {
        result = 'EMPTY';
      }
    } else if ([301, 302, 307, 308].includes(r.statusCode as number)) {
      result = 'REDIRECT';
    } else {
      result = 'BLOCKED';
    }

    return {
      name,
      category: 'Exposed Files',
      result,
      statusCode: r.statusCode,
      latencyMs: r.latencyMs,
      responseSnippet: result === 'VULN' ? r.bodySnippet : null,
      details:
        result === 'VULN'
          ? `[${severity.toUpperCase()}] File is publicly accessible (${r.contentLength} bytes)`
          : result === 'BLOCKED' && r.statusCode === 200
            ? 'Server returned HTML page instead of file (error page)'
            : r.redirectTo
              ? `Redirects to: ${r.redirectTo}`
              : null,
    };
  }

  // ─── Known-path classifier ────────────────────────────────────────────────

  private classifyPath(
    name: string,
    severity: string,
    r: RawResponse,
  ): TestCase {
    let result: TestResult;

    if (!r.ok || r.statusCode === 'TIMEOUT') result = 'TIMEOUT';
    else if (r.statusCode === 'ERR') result = 'ERROR';
    else if (r.statusCode === 200) result = 'VULN';
    else if (r.statusCode === 401)
      result = 'VULN'; // path exists
    else if ([301, 302, 307, 308].includes(r.statusCode as number))
      result = 'REDIRECT';
    else result = 'BLOCKED';

    const authNote =
      r.statusCode === 401 ? ' (requires auth but path exists)' : '';

    return {
      name,
      category: 'Known Paths',
      result,
      statusCode: r.statusCode,
      latencyMs: r.latencyMs,
      responseSnippet:
        result === 'VULN' && r.statusCode === 200 ? r.bodySnippet : null,
      details:
        result === 'VULN'
          ? `[${severity.toUpperCase()}] ${name} is accessible${authNote}`
          : r.redirectTo
            ? `Redirects to: ${r.redirectTo}`
            : null,
    };
  }

  // ─── File content signatures ──────────────────────────────────────────────
  // Confirms response body actually matches the expected file type.
  // All parameters are explicit — no hidden dependencies on outer scope.

  private isRealFileContent(
    filename: string,
    body: string,
    contentLength: number,
  ): boolean {
    const lower = filename.toLowerCase();
    const snippet = body.slice(0, 500);

    // .env — must contain KEY=VALUE assignments
    if (lower === '.env' || lower.startsWith('.env.')) {
      return (
        /^[A-Z_][A-Z0-9_]*\s*=/m.test(snippet) ||
        snippet.includes('APP_') ||
        snippet.includes('DB_') ||
        snippet.includes('SECRET') ||
        snippet.includes('PASSWORD') ||
        snippet.includes('API_KEY')
      );
    }

    // SQL dumps
    if (lower.endsWith('.sql')) {
      return /CREATE\s+TABLE|INSERT\s+INTO|DROP\s+TABLE|--\s+MySQL|--\s+PostgreSQL/i.test(
        snippet,
      );
    }

    // PHP files
    if (lower.endsWith('.php') || lower.endsWith('.php.bak')) {
      return snippet.includes('<?php') || snippet.includes('<?=');
    }

    // Git internals
    if (lower === '.git/config') {
      return snippet.includes('[core]') || snippet.includes('[remote');
    }
    if (lower === '.git/head') {
      return snippet.startsWith('ref:') || /^[0-9a-f]{40}$/m.test(snippet);
    }

    // JSON manifests
    if (lower === 'composer.json' || lower === 'package.json') {
      const trimmed = snippet.trimStart();
      return (
        trimmed.startsWith('{') &&
        (snippet.includes('"require"') ||
          snippet.includes('"dependencies"') ||
          snippet.includes('"name"'))
      );
    }

    // Lock files (large text files — size is sufficient signal)
    if (lower === 'composer.lock' || lower === 'yarn.lock') {
      return contentLength > 500;
    }

    // Log files
    if (lower.endsWith('.log')) {
      return /\[\d{4}-\d{2}-\d{2}|\[error\]|\[warn\]|exception|stack\s+trace/i.test(
        snippet,
      );
    }

    // Archives — check ZIP magic bytes (PK\x03\x04) or large size
    if (lower.endsWith('.zip') || lower.endsWith('.tar.gz')) {
      return snippet.startsWith('PK') || contentLength > 1_000;
    }

    // YAML configs
    if (lower.endsWith('.yml') || lower.endsWith('.yaml')) {
      return /^\w[\w-]*\s*:/m.test(snippet);
    }

    // DS_Store — any non-empty binary response
    if (lower === '.ds_store') {
      return contentLength > 0;
    }

    // SVN entries
    if (lower === '.svn/entries') {
      return snippet.includes('dir') || /^\d+$/m.test(snippet.split('\n')[0]);
    }

    // Default — trust 200 + reasonable size
    return contentLength > 100;
  }

  // ─── Build final result ───────────────────────────────────────────────────

  private buildResult(
    ip: string,
    domain: string,
    mode: ScanMode,
    tests: TestCase[],
    banners: BannerResult[],
    startedAt: number,
  ): DirectAccessResult {
    const exposedFiles = tests.filter(
      (t) => t.category === 'Exposed Files' && t.result === 'VULN',
    );
    const exposedPaths = tests.filter(
      (t) => t.category === 'Known Paths' && t.result === 'VULN',
    );
    const highRiskBanners = banners.filter((b) => b.risk === 'high');

    const summary = {
      total: tests.length,
      blocked: tests.filter((t) =>
        ['BLOCKED', 'TIMEOUT', 'ERROR'].includes(t.result),
      ).length,
      vulnerable: tests.filter((t) => t.result === 'VULN').length,
      redirect: tests.filter((t) => t.result === 'REDIRECT').length,
      empty: tests.filter((t) => t.result === 'EMPTY').length,
      exposedFiles: exposedFiles.length,
      exposedPaths: exposedPaths.length,
      highRiskBanners: highRiskBanners.length,
    };

    const score = Math.max(
      0,
      Math.round(
        100 -
          exposedFiles.length * 30 -
          exposedPaths.length * 20 -
          (summary.vulnerable - exposedFiles.length - exposedPaths.length) *
            10 -
          summary.empty * 5 -
          summary.redirect * 3 -
          highRiskBanners.length * 10 -
          banners.filter((b) => b.risk === 'medium').length * 3 -
          banners.filter((b) => b.cveHint !== null).length * 15,
      ),
    );

    const grade: DirectAccessResult['grade'] =
      summary.vulnerable > 0 || highRiskBanners.length > 0
        ? 'EXPOSED'
        : summary.empty > 0 || summary.redirect > 0
          ? 'PARTIAL'
          : 'PROTECTED';

    const recommendations: string[] = [];

    if (exposedFiles.length > 0) {
      recommendations.push(
        `🔴 ${exposedFiles.length} sensitive file(s) publicly accessible: ` +
          `${exposedFiles.map((f) => f.name).join(', ')}. ` +
          `Move outside web root or add nginx deny rules.`,
      );
    }
    if (exposedPaths.length > 0) {
      recommendations.push(
        `🔴 ${exposedPaths.length} admin/debug path(s) reachable: ` +
          `${exposedPaths.map((p) => p.name).join(', ')}. ` +
          `Restrict by IP or disable in production.`,
      );
    }
    for (const b of banners.filter((b) => b.cveHint)) {
      recommendations.push(
        `🔴 ${b.softwareName} ${b.softwareVersion}: ${b.cveHint}`,
      );
    }
    if (
      summary.vulnerable > 0 &&
      exposedFiles.length === 0 &&
      exposedPaths.length === 0
    ) {
      recommendations.push(
        'Add firewall rule to block all incoming traffic on ports 80/443 except from CDN IP ranges.',
        'In nginx: deny all; allow only Cloudflare/CDN IP ranges before proxy_pass.',
      );
    }
    if (banners.some((b) => ['high', 'medium'].includes(b.risk))) {
      recommendations.push(
        'Software versions visible in service banners. Configure services to suppress version strings.',
      );
    }
    if (summary.empty > 0 || summary.redirect > 0) {
      recommendations.push(
        'Server accepts direct connections but returns no data. Add explicit DROP in firewall.',
      );
    }

    const verdictMap: Record<DirectAccessResult['grade'], string> = {
      PROTECTED: 'Server is properly protected — direct IP access is blocked',
      PARTIAL:
        'Server accepts connections but returns no meaningful data. Harden firewall.',
      EXPOSED: `Server is EXPOSED — ${summary.vulnerable} issue(s) found. Immediate action required.`,
    };

    return {
      ip,
      domain,
      scanMode: mode,
      grade,
      score,
      summary,
      tests,
      exposedFiles,
      exposedPaths,
      banners,
      verdict: verdictMap[grade],
      recommendations,
      scannedAt: new Date().toISOString(),
      scanDurationMs: Date.now() - startedAt,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private randomUA(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  private sleepJitter(base: number, jitter: number): Promise<void> {
    const ms = base + Math.floor(Math.random() * jitter);
    return new Promise((r) => setTimeout(r, ms));
  }
}
