import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TestResult =
  | 'VULN'
  | 'BLOCKED'
  | 'REDIRECT'
  | 'EMPTY'
  | 'TIMEOUT'
  | 'ERROR';

export interface TestCase {
  name: string;
  category: string;
  result: TestResult;
  statusCode: number | string;
  latencyMs: number;
  responseSnippet: string | null; // max 200 chars, never full body
  details: string | null;
}

export interface DirectAccessResult {
  ip: string;
  domain: string;
  grade: 'PROTECTED' | 'PARTIAL' | 'EXPOSED';
  score: number; // 0–100, 100 = fully protected
  summary: {
    total: number;
    blocked: number;
    vulnerable: number;
    redirect: number;
    empty: number;
  };
  tests: TestCase[];
  verdict: string;
  recommendations: string[];
  scannedAt: string;
}

interface RawResponse {
  ok: boolean;
  statusCode: number | string;
  headers: Record<string, string>;
  bodySnippet: string;
  hasData: boolean;
  latencyMs: number;
  redirectTo: string | null;
}

const REAL_DATA_THRESHOLD = 300; // bytes — if response > this, server is leaking

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DirectAccessService {
  private readonly logger = new Logger(DirectAccessService.name);

  async test(ip: string, domain: string): Promise<DirectAccessResult> {
    this.logger.log(`Direct access test: ${ip} / ${domain}`);

    const tests: TestCase[] = [];

    // Run all test categories in sequence with small delays
    // (parallel would be too aggressive on the target)
    const categories = [
      () => this.testBasicAccess(ip, domain),
      () => this.testHostVariants(ip, domain),
      () => this.testXFFBypass(ip, domain),
      () => this.testCFHeaderSpoof(ip, domain),
      () => this.testSNIMismatch(ip, domain),
    ];

    for (const category of categories) {
      const results = await category();
      tests.push(...results);
      await this.sleep(100);
    }

    return this.buildResult(ip, domain, tests);
  }

  // ─── Test 1: Basic direct access ─────────────────────────────────────────

  private async testBasicAccess(
    ip: string,
    domain: string,
  ): Promise<TestCase[]> {
    const results: TestCase[] = [];

    // HTTP:80
    const http80 = await this.request({
      ip,
      port: 80,
      path: '/',
      host: domain,
    });
    results.push(this.classify('HTTP:80 direct', 'Basic Access', http80));

    // HTTPS:443
    const https443 = await this.request({
      ip,
      port: 443,
      path: '/',
      host: domain,
    });
    results.push(this.classify('HTTPS:443 direct', 'Basic Access', https443));

    // Common API paths
    for (const path of ['/api', '/health', '/robots.txt']) {
      const r = await this.request({ ip, port: 443, path, host: domain });
      results.push(this.classify(`HTTPS:443 ${path}`, 'Basic Access', r));
      await this.sleep(80);
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
      await this.sleep(80);
    }

    return results;
  }

  // ─── Test 3: X-Forwarded-For bypass ──────────────────────────────────────
  // Checks if server trusts XFF headers to bypass IP restrictions

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
      {
        name: 'X-Real-IP: CF',
        headers: { 'x-real-ip': '104.16.0.1' },
      },
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
      await this.sleep(80);
    }

    return results;
  }

  // ─── Test 4: Cloudflare header spoofing ──────────────────────────────────
  // Checks if server opens up when it sees CF-specific headers

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
      await this.sleep(80);
    }

    return results;
  }

  // ─── Test 5: SNI mismatch ─────────────────────────────────────────────────
  // Some servers respond differently based on SNI vs Host mismatch

  private async testSNIMismatch(
    ip: string,
    domain: string,
  ): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const cases = [
      { name: 'SNI=domain, Host=IP', sni: domain, host: ip },
      { name: 'SNI=IP,     Host=domain', sni: ip, host: domain },
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
      await this.sleep(80);
    }

    return results;
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
        rejectUnauthorized: false, // IP ≠ cert domain — expected
        headers: { Host: host, 'User-Agent': 'Mozilla/5.0', ...headers },
      };

      if (isHTTPS) {
        options.servername = sniOverride !== undefined ? sniOverride : host;
      }

      const req = mod.request(options, (res: any) => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          if (body.length < 500) body += chunk.toString();
        });
        res.on('end', () => {
          resolve({
            ok: true,
            statusCode: res.statusCode,
            headers: res.headers ?? {},
            bodySnippet: body.slice(0, 200),
            hasData: body.length > REAL_DATA_THRESHOLD,
            latencyMs: Date.now() - start,
            redirectTo: res.headers?.['location'] ?? null,
          });
        });
      });

      req.on('error', () =>
        resolve({
          ok: false,
          statusCode: 'ERR',
          headers: {},
          bodySnippet: '',
          hasData: false,
          latencyMs: Date.now() - start,
          redirectTo: null,
        }),
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ok: false,
          statusCode: 'TIMEOUT',
          headers: {},
          bodySnippet: '',
          hasData: false,
          latencyMs: 6_000,
          redirectTo: null,
        });
      });

      req.end();
    });
  }

  // ─── Classify single response ─────────────────────────────────────────────

  private classify(name: string, category: string, r: RawResponse): TestCase {
    let result: TestResult;

    if (!r.ok || r.statusCode === 'TIMEOUT') {
      result = 'TIMEOUT';
    } else if (r.statusCode === 'ERR') {
      result = 'ERROR';
    } else if (r.hasData) {
      result = 'VULN';
    } else if ([301, 302, 307, 308].includes(r.statusCode as number)) {
      result = 'REDIRECT';
    } else if ([403, 444, 400, 406].includes(r.statusCode as number)) {
      result = 'BLOCKED';
    } else {
      result = 'EMPTY';
    }

    return {
      name,
      category,
      result,
      statusCode: r.statusCode,
      latencyMs: r.latencyMs,
      // Never return full body — just enough to confirm what's leaking
      responseSnippet: result === 'VULN' ? r.bodySnippet : null,
      details: r.redirectTo ? `Redirects to: ${r.redirectTo}` : null,
    };
  }

  // ─── Build final result ───────────────────────────────────────────────────

  private buildResult(
    ip: string,
    domain: string,
    tests: TestCase[],
  ): DirectAccessResult {
    const summary = {
      total: tests.length,
      blocked: tests.filter(
        (t) =>
          t.result === 'BLOCKED' ||
          t.result === 'TIMEOUT' ||
          t.result === 'ERROR',
      ).length,
      vulnerable: tests.filter((t) => t.result === 'VULN').length,
      redirect: tests.filter((t) => t.result === 'REDIRECT').length,
      empty: tests.filter((t) => t.result === 'EMPTY').length,
    };

    // Score: 100 if all blocked, -10 per redirect/empty, -25 per vuln
    const score = Math.max(
      0,
      Math.round(
        100 -
          summary.vulnerable * 25 -
          summary.empty * 10 -
          summary.redirect * 5,
      ),
    );

    const grade: DirectAccessResult['grade'] =
      summary.vulnerable > 0
        ? 'EXPOSED'
        : summary.empty > 0 || summary.redirect > 0
          ? 'PARTIAL'
          : 'PROTECTED';

    const recommendations: string[] = [];

    if (summary.vulnerable > 0) {
      recommendations.push(
        'Add firewall rule to block all incoming traffic on ports 80/443 except from CDN IP ranges',
      );
      recommendations.push(
        'In nginx: deny all; allow only Cloudflare/CDN IP ranges before your proxy_pass',
      );
    }

    if (summary.empty > 0 || summary.redirect > 0) {
      recommendations.push(
        'Server accepts direct connections but returns no data. Add explicit DROP rule in firewall.',
      );
    }

    const verdictMap: Record<DirectAccessResult['grade'], string> = {
      PROTECTED:
        'Server is properly protected — direct IP access is blocked by firewall/nginx',
      PARTIAL:
        'Server accepts connections but does not return data. Add explicit firewall DROP.',
      EXPOSED: `Server is EXPOSED — ${summary.vulnerable} test(s) returned real data. Close direct IP access immediately.`,
    };

    return {
      ip,
      domain,
      grade,
      score,
      summary,
      tests,
      verdict: verdictMap[grade],
      recommendations,
      scannedAt: new Date().toISOString(),
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
