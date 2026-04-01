import { Injectable } from '@nestjs/common';
import * as tls from 'tls';
import * as crypto from 'crypto';
import { SslCertInfo, FaviconInfo } from '../interfaces/cdn-leak.interface';

@Injectable()
export class CertFaviconService {
  fetchSslCert(domain: string): Promise<SslCertInfo | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 8_000);
      try {
        const socket = tls.connect(
          {
            host: domain,
            port: 443,
            servername: domain,
            rejectUnauthorized: false,
          },
          () => {
            clearTimeout(timer);
            const cert = socket.getPeerCertificate(true);
            socket.destroy();
            if (!cert?.subject) {
              resolve(null);
              return;
            }
            const sans: string[] = [];
            if (cert.subjectaltname) {
              const m = cert.subjectaltname.match(/DNS:[^,]+/g) ?? [];
              sans.push(...m.map((s) => s.replace('DNS:', '').trim()));
            }
            resolve({
              subject: cert.subject?.CN ?? 'Unknown',
              issuer: cert.issuer?.CN ?? 'Unknown',
              fingerprint256: cert.fingerprint256 ?? '',
              serialNumber: cert.serialNumber ?? '',
              validFrom: cert.valid_from ?? '',
              validTo: cert.valid_to ?? '',
              subjectAltNames: sans,
            });
          },
        );
        socket.on('error', () => {
          clearTimeout(timer);
          resolve(null);
        });
        socket.on('timeout', () => {
          clearTimeout(timer);
          socket.destroy();
          resolve(null);
        });
      } catch {
        clearTimeout(timer);
        resolve(null);
      }
    });
  }

  async findCertRelatedDomains(domain: string): Promise<string[]> {
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
      const seen = new Set<string>();
      for (const entry of data) {
        for (const line of entry.name_value.split('\n')) {
          const name = line.trim().toLowerCase().replace(/^\*\./, '');
          if (name && !name.includes(domain) && name.includes('.'))
            seen.add(name);
        }
      }
      return [...seen].slice(0, 20);
    } catch {
      return [];
    }
  }

  async fetchFaviconHash(domain: string): Promise<FaviconInfo | null> {
    for (const path of ['/favicon.ico', '/favicon.png']) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6_000);
        const res = await fetch(`https://${domain}${path}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        clearTimeout(timer);
        if (!res.ok || res.status === 404) continue;
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('image') && !ct.includes('octet')) continue;
        const bytes: any = Buffer.from(await res.arrayBuffer());
        const md5 = crypto.createHash('md5').update(bytes).digest('hex');
        const hash = this.mmh3(bytes.toString('base64'));
        return {
          hash,
          md5,
          fetched: true,
          searchUrl: `https://www.shodan.io/search?query=http.favicon.hash%3A${hash}`,
        };
      } catch {
        continue;
      }
    }
    return null;
  }

  private mmh3(str: string): number {
    const data = Buffer.from(str, 'utf8');
    const len = data.length;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let h1 = 0,
      i = 0;

    while (i <= len - 4) {
      let k =
        (data[i] & 0xff) |
        ((data[i + 1] & 0xff) << 8) |
        ((data[i + 2] & 0xff) << 16) |
        ((data[i + 3] & 0xff) << 24);
      k = Math.imul(k, c1);
      k = (k << 15) | (k >>> 17);
      k = Math.imul(k, c2);
      h1 ^= k;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
      i += 4;
    }

    let k = 0;
    switch (len & 3) {
      case 3:
        k ^= (data[i + 2] & 0xff) << 16; // falls through
      case 2:
        k ^= (data[i + 1] & 0xff) << 8; // falls through
      case 1:
        k ^= data[i] & 0xff;
        k = Math.imul(k, c1);
        k = (k << 15) | (k >>> 17);
        k = Math.imul(k, c2);
        h1 ^= k;
    }

    h1 ^= len;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;
    return h1 | 0;
  }
}
