import { Injectable } from '@nestjs/common';
import * as net from 'net';
import { BannerResult, OpenPort } from '../interfaces/direct-access.interface';
import { BANNER_PATTERNS } from '../data/banner-patterns.data';
import { HttpProbeService } from './http-probe.service';

@Injectable()
export class BannerService {
  constructor(private readonly http: HttpProbeService) {}

  async grabAll(ip: string, openPorts: OpenPort[]): Promise<BannerResult[]> {
    if (!openPorts.length) return [];

    const results: BannerResult[] = [];
    for (const { port, service } of openPorts) {
      const banner = await this.grabBanner(ip, port, service);
      results.push(banner);
      await this.http.sleepJitter(200, 100);
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
      if (!match) continue;

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
}
