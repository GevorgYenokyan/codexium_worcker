import { RawResponse, TestCase, TestResult } from '../interfaces/direct-access.interface';
import { isRealFileContent } from './file-content.validator';

const REAL_DATA_THRESHOLD = 300;

// ─── General classifier ───────────────────────────────────────────────────────

export function classify(
  name: string,
  category: string,
  r: RawResponse,
): TestCase {
  let result: TestResult;

  if (!r.ok || r.statusCode === 'TIMEOUT')                        result = 'TIMEOUT';
  else if (r.statusCode === 'ERR')                                result = 'ERROR';
  else if (r.hasData)                                             result = 'VULN';
  else if ([301, 302, 307, 308].includes(r.statusCode as number)) result = 'REDIRECT';
  else if ([400, 403, 406, 444].includes(r.statusCode as number)) result = 'BLOCKED';
  else                                                             result = 'EMPTY';

  return {
    name,
    category,
    result,
    statusCode:      r.statusCode,
    latencyMs:       r.latencyMs,
    responseSnippet: result === 'VULN' ? r.bodySnippet : null,
    details: r.redirectTo
      ? `Redirects to: ${r.redirectTo}`
      : r.serverHeader
        ? `Server: ${r.serverHeader}`
        : null,
  };
}

// ─── File classifier ─────────────────────────────────────────────────────────
// Guards against false positives: server returns 200 with an HTML error page
// (Next.js, Cloudflare, nginx try_files) instead of the actual sensitive file.

export function classifyFile(
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
    const body  = r.bodySnippet;
    const lower = body.toLowerCase().trimStart();

    if (r.contentLength === 0 || lower.length === 0) {
      result = 'EMPTY';
    } else if (
      lower.startsWith('<!doctype') ||
      lower.startsWith('<html')     ||
      (lower.startsWith('<') && lower.includes('</'))
    ) {
      // HTML response = error page, not the real file
      result = 'BLOCKED';
    } else if (isRealFileContent(name, body, r.contentLength)) {
      result = 'VULN';
    } else if (r.contentLength > REAL_DATA_THRESHOLD) {
      // Large non-HTML response — likely real file
      result = 'VULN';
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
    category:   'Exposed Files',
    result,
    statusCode: r.statusCode,
    latencyMs:  r.latencyMs,
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

// ─── Path classifier ──────────────────────────────────────────────────────────

export function classifyPath(
  name: string,
  severity: string,
  r: RawResponse,
): TestCase {
  let result: TestResult;

  if (!r.ok || r.statusCode === 'TIMEOUT')                        result = 'TIMEOUT';
  else if (r.statusCode === 'ERR')                                result = 'ERROR';
  else if (r.statusCode === 200)                                  result = 'VULN';
  else if (r.statusCode === 401)                                  result = 'VULN'; // path exists
  else if ([301, 302, 307, 308].includes(r.statusCode as number)) result = 'REDIRECT';
  else                                                             result = 'BLOCKED';

  const authNote = r.statusCode === 401 ? ' (requires auth but path exists)' : '';

  return {
    name,
    category:   'Known Paths',
    result,
    statusCode: r.statusCode,
    latencyMs:  r.latencyMs,
    responseSnippet: result === 'VULN' && r.statusCode === 200 ? r.bodySnippet : null,
    details:
      result === 'VULN'
        ? `[${severity.toUpperCase()}] ${name} is accessible${authNote}`
        : r.redirectTo
          ? `Redirects to: ${r.redirectTo}`
          : null,
  };
}