export interface ExposedFileEntry {
  path: string;
  name: string;
  priority: 1 | 2;
  severity: 'critical' | 'high' | 'medium';
}

export const EXPOSED_FILES: ExposedFileEntry[] = [
  // ── Critical · priority 1 (quick scan) ──────────────────────────────────
  { path: '/.env', name: '.env', priority: 1, severity: 'critical' },
  {
    path: '/.env.production',
    name: '.env.production',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/.env.local',
    name: '.env.local',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/.git/config',
    name: '.git/config',
    priority: 1,
    severity: 'critical',
  },
  { path: '/.git/HEAD', name: '.git/HEAD', priority: 1, severity: 'critical' },
  {
    path: '/wp-config.php',
    name: 'wp-config.php',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/config.php',
    name: 'config.php',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/phpinfo.php',
    name: 'phpinfo.php',
    priority: 1,
    severity: 'critical',
  },
  { path: '/dump.sql', name: 'dump.sql', priority: 1, severity: 'critical' },
  {
    path: '/backup.sql',
    name: 'backup.sql',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/database.sql',
    name: 'database.sql',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/backup.zip',
    name: 'backup.zip',
    priority: 1,
    severity: 'critical',
  },
  // ── High · priority 1 ───────────────────────────────────────────────────
  {
    path: '/composer.json',
    name: 'composer.json',
    priority: 1,
    severity: 'high',
  },
  {
    path: '/composer.lock',
    name: 'composer.lock',
    priority: 1,
    severity: 'high',
  },
  {
    path: '/package.json',
    name: 'package.json',
    priority: 1,
    severity: 'high',
  },
  { path: '/.DS_Store', name: '.DS_Store', priority: 1, severity: 'high' },
  {
    path: '/storage/logs/laravel.log',
    name: 'laravel.log',
    priority: 1,
    severity: 'high',
  },
  { path: '/error.log', name: 'error.log', priority: 1, severity: 'high' },
  { path: '/debug.log', name: 'debug.log', priority: 1, severity: 'high' },
  // ── Full scan only (priority 2) ──────────────────────────────────────────
  {
    path: '/.env.backup',
    name: '.env.backup',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/.env.staging',
    name: '.env.staging',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/wp-config.php.bak',
    name: 'wp-config.php.bak',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/configuration.php',
    name: 'configuration.php',
    priority: 2,
    severity: 'high',
  },
  {
    path: '/settings.php',
    name: 'settings.php',
    priority: 2,
    severity: 'high',
  },
  { path: '/config.yml', name: 'config.yml', priority: 2, severity: 'high' },
  { path: '/config.yaml', name: 'config.yaml', priority: 2, severity: 'high' },
  {
    path: '/.svn/entries',
    name: '.svn/entries',
    priority: 2,
    severity: 'high',
  },
  { path: '/.gitignore', name: '.gitignore', priority: 2, severity: 'medium' },
  {
    path: '/backup.tar.gz',
    name: 'backup.tar.gz',
    priority: 2,
    severity: 'critical',
  },
  { path: '/db.sql', name: 'db.sql', priority: 2, severity: 'critical' },
  { path: '/site.zip', name: 'site.zip', priority: 2, severity: 'critical' },
  { path: '/www.zip', name: 'www.zip', priority: 2, severity: 'critical' },
  { path: '/access.log', name: 'access.log', priority: 2, severity: 'high' },
  { path: '/yarn.lock', name: 'yarn.lock', priority: 2, severity: 'medium' },
  {
    path: '/.idea/workspace.xml',
    name: '.idea/workspace.xml',
    priority: 2,
    severity: 'medium',
  },
  {
    path: '/.vscode/settings.json',
    name: '.vscode/settings.json',
    priority: 2,
    severity: 'medium',
  },
  { path: '/info.php', name: 'info.php', priority: 2, severity: 'critical' },
  { path: '/test.php', name: 'test.php', priority: 2, severity: 'high' },
  { path: '/readme.txt', name: 'readme.txt', priority: 2, severity: 'medium' },
  {
    path: '/CHANGELOG.md',
    name: 'CHANGELOG.md',
    priority: 2,
    severity: 'medium',
  },
];
