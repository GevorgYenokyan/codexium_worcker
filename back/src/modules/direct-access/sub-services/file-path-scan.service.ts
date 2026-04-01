import { Injectable } from '@nestjs/common';
import { ScanMode, TestCase } from '../interfaces/direct-access.interface';
import { HttpProbeService } from './http-probe.service';
import { classifyFile, classifyPath } from '../helpers/classifiers';
import { EXPOSED_FILES } from '../data/exposed-files.data';
import { KNOWN_PATHS } from '../data/known-paths.data';

@Injectable()
export class FilePathScanService {
  constructor(private readonly http: HttpProbeService) {}

  // ─── Exposed files ────────────────────────────────────────────────────────

  async testExposedFiles(
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
        const r = await this.http.request({
          ip,
          port: 443,
          path,
          host: domain,
        });
        results.push(classifyFile(name, severity, r));
        await this.http.sleepJitter(120, 80);
      }
      await this.http.sleepJitter(300, 150);
    }

    return results;
  }

  // ─── Known paths ──────────────────────────────────────────────────────────

  async testKnownPaths(
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
        const r = await this.http.request({
          ip,
          port: 443,
          path,
          host: domain,
        });
        results.push(classifyPath(name, severity, r));
        await this.http.sleepJitter(120, 80);
      }
      await this.http.sleepJitter(300, 150);
    }

    return results;
  }
}
