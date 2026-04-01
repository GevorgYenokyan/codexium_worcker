/**
 * Confirms that the HTTP response body actually matches the expected
 * file type — guards against false positives where the server returns
 * a 200 with an HTML error page instead of the real file.
 *
 * Pure function — no dependencies, fully unit-testable.
 */
export function isRealFileContent(
  filename: string,
  body: string,
  contentLength: number,
): boolean {
  const lower = filename.toLowerCase();
  const snippet = body.slice(0, 500);

  // .env — must contain KEY=VALUE assignments
  if (lower === '.env' || lower.startsWith('.env.')) {
    return (
      /^[A-Z_][A-Z0-9_]*\s*=/m.test(snippet) ||
      snippet.includes('APP_') ||
      snippet.includes('DB_') ||
      snippet.includes('SECRET') ||
      snippet.includes('PASSWORD') ||
      snippet.includes('API_KEY')
    );
  }

  // SQL dumps
  if (lower.endsWith('.sql')) {
    return /CREATE\s+TABLE|INSERT\s+INTO|DROP\s+TABLE|--\s+MySQL|--\s+PostgreSQL/i.test(
      snippet,
    );
  }

  // PHP files
  if (lower.endsWith('.php') || lower.endsWith('.php.bak')) {
    return snippet.includes('<?php') || snippet.includes('<?=');
  }

  // Git internals
  if (lower === '.git/config') {
    return snippet.includes('[core]') || snippet.includes('[remote');
  }
  if (lower === '.git/head') {
    return snippet.startsWith('ref:') || /^[0-9a-f]{40}$/m.test(snippet);
  }

  // JSON manifests
  if (lower === 'composer.json' || lower === 'package.json') {
    const trimmed = snippet.trimStart();
    return (
      trimmed.startsWith('{') &&
      (snippet.includes('"require"') ||
        snippet.includes('"dependencies"') ||
        snippet.includes('"name"'))
    );
  }

  // Lock files — size is sufficient signal
  if (lower === 'composer.lock' || lower === 'yarn.lock') {
    return contentLength > 500;
  }

  // Log files
  if (lower.endsWith('.log')) {
    return /\[\d{4}-\d{2}-\d{2}|\[error\]|\[warn\]|exception|stack\s+trace/i.test(
      snippet,
    );
  }

  // Archives — check ZIP magic bytes or large size
  if (lower.endsWith('.zip') || lower.endsWith('.tar.gz')) {
    return snippet.startsWith('PK') || contentLength > 1_000;
  }

  // YAML configs
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) {
    return /^\w[\w-]*\s*:/m.test(snippet);
  }

  // DS_Store — any non-empty binary response
  if (lower === '.ds_store') {
    return contentLength > 0;
  }

  // SVN entries
  if (lower === '.svn/entries') {
    return snippet.includes('dir') || /^\d+$/m.test(snippet.split('\n')[0]);
  }

  // Default — trust 200 + reasonable size
  return contentLength > 100;
}
