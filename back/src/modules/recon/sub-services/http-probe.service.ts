import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  HeaderProbeResult,
  DomainFingerprint,
  LeakedIp,
} from '../interfaces/cdn-leak.interface';

const VHOST_BODY_BYTES = 8192;

@Injectable()
export class HttpProbeService {
  private readonly logger = new Logger(HttpProbeService.name);

  // ─── Response headers probe ───────────────────────────────────────────────

  async probeResponseHeaders(domain: string): Promise<HeaderProbeResult> {
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

  // ─── robots.txt / sitemap ─────────────────────────────────────────────────

  async checkRobotsAndSitemap(
    domain: string,
    resolveHostSafe: (host: string) => Promise<string[]>,
    isCdnIpFn: (ip: string) => boolean,
  ): Promise<string[]> {
    const ips: string[] = [];
    for (const path of ['/robots.txt', '/sitemap.xml', '/sitemap_index.xml']) {
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
            const resolved = await resolveHostSafe(host);
            ips.push(...resolved.filter((ip) => !isCdnIpFn(ip)));
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

  // ─── Domain fingerprint ───────────────────────────────────────────────────

  async fetchDomainFingerprint(
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

  // ─── Virtual-host probe ───────────────────────────────────────────────────

  async vhostProbeAll(
    leaks: LeakedIp[],
    domain: string,
    fp: DomainFingerprint,
  ): Promise<LeakedIp[]> {
    return Promise.all(
      leaks.map(async (leak) => {
        const isMxSource = leak.source.toLowerCase().includes('mx');
        const ptrIsMail = leak.ptrHostname
          ? /mail|smtp|mx|secureserver|mailru|mail\.ru/i.test(leak.ptrHostname)
          : false;
        if (isMxSource && ptrIsMail) return { ...leak, vhostMatch: null };

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
          ...this.buildTlsSkipInit(),
        });
        clearTimeout(timer);

        if (!res.ok && res.status !== 301 && res.status !== 302) continue;

        const buf = await res.arrayBuffer();
        const body = Buffer.from(buf).toString('utf8', 0, VHOST_BODY_BYTES);
        const titleMatch = body.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
        const probeTitle = titleMatch ? titleMatch[1].trim() : null;

        if (fp.title && probeTitle && fp.title === probeTitle) {
          this.logger.log(`vhost probe: title match on ${ip} for ${domain}`);
          return true;
        }

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

        return false;
      } catch {
        continue;
      }
    }
    return null;
  }

  private buildTlsSkipInit(): RequestInit {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Agent } = require('undici');
      return {
        dispatcher: new Agent({ connect: { rejectUnauthorized: false } }),
      } as any;
    } catch {
      return {};
    }
  }
}
