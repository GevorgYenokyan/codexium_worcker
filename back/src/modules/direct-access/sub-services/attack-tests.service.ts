import { Injectable } from '@nestjs/common';
import { TestCase } from '../interfaces/direct-access.interface';
import { HttpProbeService } from './http-probe.service';
import { classify } from '../helpers/classifiers';

@Injectable()
export class AttackTestsService {
  constructor(private readonly http: HttpProbeService) {}

  // ─── Test 1: Basic direct access ─────────────────────────────────────────

  async testBasicAccess(ip: string, domain: string): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const http80 = await this.http.request({ ip, port: 80, path: '/', host: domain });
    results.push(classify('HTTP:80 direct', 'Basic Access', http80));
    await this.http.sleepJitter(80, 50);

    const https443 = await this.http.request({ ip, port: 443, path: '/', host: domain });
    results.push(classify('HTTPS:443 direct', 'Basic Access', https443));
    await this.http.sleepJitter(80, 50);

    for (const path of ['/api', '/health', '/robots.txt']) {
      const r = await this.http.request({ ip, port: 443, path, host: domain });
      results.push(classify(`HTTPS:443 ${path}`, 'Basic Access', r));
      await this.http.sleepJitter(80, 40);
    }

    return results;
  }

  // ─── Test 2: Host header variations ──────────────────────────────────────

  async testHostVariants(ip: string, domain: string): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const variants = [
      { name: 'Host: IP directly',  host: ip },
      { name: 'Host: IP:443',       host: `${ip}:443` },
      { name: 'Host: domain:443',   host: `${domain}:443` },
      { name: 'Host: www.domain',   host: `www.${domain}` },
    ];

    for (const v of variants) {
      const r = await this.http.request({ ip, port: 443, path: '/', host: v.host });
      results.push(classify(v.name, 'Host Header', r));
      await this.http.sleepJitter(100, 50);
    }

    return results;
  }

  // ─── Test 3: X-Forwarded-For bypass ──────────────────────────────────────

  async testXFFBypass(ip: string, domain: string): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const cases = [
      { name: 'XFF: Cloudflare IP',    headers: { 'x-forwarded-for': '104.16.0.1' } },
      { name: 'XFF: chain with CF',    headers: { 'x-forwarded-for': '104.16.0.1, 172.64.0.1' } },
      { name: 'X-Real-IP: CF',         headers: { 'x-real-ip': '104.16.0.1' } },
      { name: 'True-Client-IP: CF',    headers: { 'true-client-ip': '104.16.0.1' } },
    ];

    for (const c of cases) {
      const r = await this.http.request({ ip, port: 443, path: '/', host: domain, headers: c.headers });
      results.push(classify(c.name, 'XFF Bypass', r));
      await this.http.sleepJitter(100, 50);
    }

    return results;
  }

  // ─── Test 4: Cloudflare header spoofing ──────────────────────────────────

  async testCFHeaderSpoof(ip: string, domain: string): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const cases = [
      {
        name: 'CF headers (US)',
        headers: {
          'cf-connecting-ip': '104.16.0.1',
          'cf-ray':           '7d3f1234abcd-IAD',
          'cf-visitor':       '{"scheme":"https"}',
          'cf-ipcountry':     'US',
          'x-forwarded-for':  '104.16.0.1',
        },
      },
      {
        name: 'CF headers (EU)',
        headers: {
          'cf-connecting-ip': '172.64.0.1',
          'cf-ray':           '8a4b5678efgh-LHR',
          'cf-visitor':       '{"scheme":"https"}',
          'cf-ipcountry':     'DE',
        },
      },
    ];

    for (const c of cases) {
      const r = await this.http.request({ ip, port: 443, path: '/', host: domain, headers: c.headers });
      results.push(classify(c.name, 'CF Header Spoof', r));
      await this.http.sleepJitter(120, 60);
    }

    return results;
  }

  // ─── Test 5: SNI mismatch ─────────────────────────────────────────────────

  async testSNIMismatch(ip: string, domain: string): Promise<TestCase[]> {
    const results: TestCase[] = [];

    const cases = [
      { name: 'SNI=domain, Host=IP', sni: domain, host: ip },
      { name: 'SNI=IP, Host=domain', sni: ip,     host: domain },
    ];

    for (const c of cases) {
      const r = await this.http.request({ ip, port: 443, path: '/', host: c.host, sniOverride: c.sni });
      results.push(classify(c.name, 'SNI Mismatch', r));
      await this.http.sleepJitter(100, 50);
    }

    return results;
  }
}