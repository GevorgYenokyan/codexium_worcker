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

// Internal — used by HttpProbeService only
export interface RawResponse {
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

export interface OpenPort {
  port: number;
  service: string;
}
