import { Injectable } from '@nestjs/common';
import {
  BannerResult,
  DirectAccessResult,
  ScanMode,
  TestCase,
} from '../interfaces/direct-access.interface';

@Injectable()
export class ResultBuilderService {
  build(
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

    const recommendations = this.buildRecommendations(
      summary,
      exposedFiles,
      exposedPaths,
      banners,
    );

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

  private buildRecommendations(
    summary: DirectAccessResult['summary'],
    exposedFiles: TestCase[],
    exposedPaths: TestCase[],
    banners: BannerResult[],
  ): string[] {
    const recs: string[] = [];

    if (exposedFiles.length > 0) {
      recs.push(
        `🔴 ${exposedFiles.length} sensitive file(s) publicly accessible: ` +
          `${exposedFiles.map((f) => f.name).join(', ')}. ` +
          `Move outside web root or add nginx deny rules.`,
      );
    }

    if (exposedPaths.length > 0) {
      recs.push(
        `🔴 ${exposedPaths.length} admin/debug path(s) reachable: ` +
          `${exposedPaths.map((p) => p.name).join(', ')}. ` +
          `Restrict by IP or disable in production.`,
      );
    }

    for (const b of banners.filter((b) => b.cveHint)) {
      recs.push(`🔴 ${b.softwareName} ${b.softwareVersion}: ${b.cveHint}`);
    }

    if (
      summary.vulnerable > 0 &&
      exposedFiles.length === 0 &&
      exposedPaths.length === 0
    ) {
      recs.push(
        'Add firewall rule to block all incoming traffic on ports 80/443 except from CDN IP ranges.',
        'In nginx: deny all; allow only Cloudflare/CDN IP ranges before proxy_pass.',
      );
    }

    if (banners.some((b) => ['high', 'medium'].includes(b.risk))) {
      recs.push(
        'Software versions visible in service banners. Configure services to suppress version strings.',
      );
    }

    if (summary.empty > 0 || summary.redirect > 0) {
      recs.push(
        'Server accepts direct connections but returns no data. Add explicit DROP in firewall.',
      );
    }

    return recs;
  }
}
