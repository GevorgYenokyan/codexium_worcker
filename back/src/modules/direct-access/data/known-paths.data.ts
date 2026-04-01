export interface KnownPathEntry {
  path: string;
  name: string;
  priority: 1 | 2;
  severity: 'critical' | 'high' | 'medium';
}

export const KNOWN_PATHS: KnownPathEntry[] = [
  // ── Critical · priority 1 (quick scan) ──────────────────────────────────
  {
    path: '/phpmyadmin/',
    name: 'phpMyAdmin',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/pma/',
    name: 'phpMyAdmin (pma)',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/wp-admin/',
    name: 'WordPress Admin',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/wp-login.php',
    name: 'WordPress Login',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/xmlrpc.php',
    name: 'WordPress XMLRPC',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/actuator/env',
    name: 'Spring Actuator: env',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/actuator/beans',
    name: 'Spring Actuator: beans',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/actuator/logfile',
    name: 'Spring Actuator: log',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/telescope',
    name: 'Laravel Telescope',
    priority: 1,
    severity: 'critical',
  },
  {
    path: '/graphiql',
    name: 'GraphiQL IDE',
    priority: 1,
    severity: 'critical',
  },
  { path: '/debug/pprof', name: 'Go pprof', priority: 1, severity: 'critical' },
  {
    path: '/_profiler',
    name: 'Symfony Profiler',
    priority: 1,
    severity: 'critical',
  },
  // ── High · priority 1 ───────────────────────────────────────────────────
  { path: '/graphql', name: 'GraphQL endpoint', priority: 1, severity: 'high' },
  {
    path: '/swagger-ui.html',
    name: 'Swagger UI',
    priority: 1,
    severity: 'high',
  },
  { path: '/v3/api-docs', name: 'OpenAPI v3', priority: 1, severity: 'high' },
  {
    path: '/metrics',
    name: 'Prometheus metrics',
    priority: 1,
    severity: 'high',
  },
  {
    path: '/server-status',
    name: 'Apache server-status',
    priority: 1,
    severity: 'high',
  },
  { path: '/admin', name: 'Admin panel', priority: 1, severity: 'high' },
  { path: '/horizon', name: 'Laravel Horizon', priority: 1, severity: 'high' },
  // ── Full scan only (priority 2) ──────────────────────────────────────────
  {
    path: '/phpmyadmin/index.php',
    name: 'phpMyAdmin (index)',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/myadmin/',
    name: 'phpMyAdmin (myadmin)',
    priority: 2,
    severity: 'critical',
  },
  { path: '/mysql/', name: 'MySQL panel', priority: 2, severity: 'critical' },
  {
    path: '/actuator',
    name: 'Spring Actuator',
    priority: 2,
    severity: 'critical',
  },
  { path: '/debug', name: 'Debug endpoint', priority: 2, severity: 'critical' },
  {
    path: '/_profiler/phpinfo',
    name: 'Symfony phpinfo',
    priority: 2,
    severity: 'critical',
  },
  {
    path: '/administrator/',
    name: 'Joomla Admin',
    priority: 2,
    severity: 'critical',
  },
  { path: '/cpanel', name: 'cPanel', priority: 2, severity: 'critical' },
  {
    path: '/actuator/health',
    name: 'Spring Actuator: health',
    priority: 2,
    severity: 'medium',
  },
  {
    path: '/actuator/mappings',
    name: 'Spring Actuator: mappings',
    priority: 2,
    severity: 'high',
  },
  {
    path: '/swagger-ui/',
    name: 'Swagger UI (/)',
    priority: 2,
    severity: 'high',
  },
  {
    path: '/api/swagger.json',
    name: 'Swagger JSON',
    priority: 2,
    severity: 'high',
  },
  { path: '/api-docs', name: 'API Docs', priority: 2, severity: 'high' },
  { path: '/v2/api-docs', name: 'Swagger v2', priority: 2, severity: 'high' },
  {
    path: '/nginx_status',
    name: 'Nginx status',
    priority: 2,
    severity: 'high',
  },
  {
    path: '/server-info',
    name: 'Apache server-info',
    priority: 2,
    severity: 'high',
  },
  { path: '/admin/', name: 'Admin panel (/)', priority: 2, severity: 'high' },
  { path: '/panel', name: 'Panel', priority: 2, severity: 'high' },
  { path: '/status', name: 'Status page', priority: 2, severity: 'medium' },
  {
    path: '/.well-known/security.txt',
    name: 'security.txt',
    priority: 2,
    severity: 'medium',
  },
];
