import { Injectable } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';
import { RawResponse } from '../interfaces/direct-access.interface';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
];

@Injectable()
export class HttpProbeService {
  request(opts: {
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
            hasData: contentLength > 300,
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

  randomUA(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  sleepJitter(base: number, jitter: number): Promise<void> {
    const ms = base + Math.floor(Math.random() * jitter);
    return new Promise((r) => setTimeout(r, ms));
  }
}
