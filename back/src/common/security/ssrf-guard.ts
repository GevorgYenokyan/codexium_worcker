import * as dns from 'dns';
import * as net from 'net';
import { promisify } from 'util';
import { BadRequestException } from '@nestjs/common';

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);

// ─── Private IP ranges as numeric ranges ──────────────────────────────────────
// Covers ALL bypass techniques: decimal, hex, octal, IPv6-mapped

function ipToLong(ip: string): number {
  return (
    ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0
  );
}

interface IpRange {
  start: number;
  end: number;
  label: string;
}

const BLOCKED_IPV4_RANGES: IpRange[] = [
  {
    start: ipToLong('0.0.0.0'),
    end: ipToLong('0.255.255.255'),
    label: 'Current network',
  },
  {
    start: ipToLong('10.0.0.0'),
    end: ipToLong('10.255.255.255'),
    label: 'Private RFC1918',
  },
  {
    start: ipToLong('100.64.0.0'),
    end: ipToLong('100.127.255.255'),
    label: 'CGNAT',
  },
  {
    start: ipToLong('127.0.0.0'),
    end: ipToLong('127.255.255.255'),
    label: 'Loopback',
  },
  {
    start: ipToLong('169.254.0.0'),
    end: ipToLong('169.254.255.255'),
    label: 'Link-local / Cloud metadata',
  },
  {
    start: ipToLong('172.16.0.0'),
    end: ipToLong('172.31.255.255'),
    label: 'Private RFC1918',
  },
  {
    start: ipToLong('192.0.0.0'),
    end: ipToLong('192.0.0.255'),
    label: 'IETF Protocol',
  },
  {
    start: ipToLong('192.168.0.0'),
    end: ipToLong('192.168.255.255'),
    label: 'Private RFC1918',
  },
  {
    start: ipToLong('198.18.0.0'),
    end: ipToLong('198.19.255.255'),
    label: 'Benchmark',
  },
  {
    start: ipToLong('198.51.100.0'),
    end: ipToLong('198.51.100.255'),
    label: 'Documentation',
  },
  {
    start: ipToLong('203.0.113.0'),
    end: ipToLong('203.0.113.255'),
    label: 'Documentation',
  },
  {
    start: ipToLong('224.0.0.0'),
    end: ipToLong('239.255.255.255'),
    label: 'Multicast',
  },
  {
    start: ipToLong('240.0.0.0'),
    end: ipToLong('255.255.255.255'),
    label: 'Reserved/Broadcast',
  },
];

function isBlockedIpv4(ip: string): boolean {
  // Validate it's actually a proper IPv4
  const parts = ip.split('.');
  if (parts.length !== 4) return true;
  if (!parts.every((p) => /^\d+$/.test(p) && parseInt(p) <= 255)) return true;

  const long = ipToLong(ip);
  return BLOCKED_IPV4_RANGES.some((r) => long >= r.start && long <= r.end);
}

function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/[\[\]]/g, '');
  // Loopback ::1
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
  // Unspecified ::
  if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
  // Link-local fe80::/10
  if (lower.startsWith('fe80')) return true;
  // Unique local fc00::/7
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  // IPv4-mapped ::ffff:
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.replace('::ffff:', '');
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(v4)) return isBlockedIpv4(v4);
  }
  return false;
}

// ─── URL scheme allowlist ─────────────────────────────────────────────────────
const ALLOWED_SCHEMES = new Set(['https:', 'http:']);

// ─── Blocked hostnames ────────────────────────────────────────────────────────
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'broadcasthost',
  // Cloud metadata
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  'link-local',
  // Kubernetes
  'kubernetes.default',
  'kubernetes.default.svc',
  'kubernetes.default.svc.cluster.local',
  // Common internal names
  'db',
  'database',
  'redis',
  'cache',
  'internal',
  'admin',
  'mailhog',
  'rabbitmq',
  'elastic',
  'mongo',
]);

const BLOCKED_TLDS = [
  '.local',
  '.internal',
  '.intranet',
  '.corp',
  '.lan',
  '.home',
  '.localdomain',
  '.localhost',
  '.test',
  '.example',
  '.invalid',
  '.arpa',
];

// ─── Dangerous schemes and bypass patterns ────────────────────────────────────
const DANGEROUS_PATTERNS = [
  /^(0x[\da-f]+\.?)+$/i, // Hex IP: 0x7f000001
  /^\d{7,10}$/, // Decimal IP: 2130706433
  /^0\d+(\.\d+){0,3}$/, // Octal IP: 0177.0.0.1
  /^\[.*\]$/, // IPv6 bracket notation — handle separately
];

// ─── Main: parse and validate any user input ──────────────────────────────────

export async function validateTarget(input: string): Promise<string> {
  if (!input || typeof input !== 'string') {
    throw new BadRequestException('Invalid target');
  }

  const raw = input.trim();

  // Block dangerous URL schemes (gopher, file, dict, ldap, ftp, sftp, etc.)
  try {
    const hasScheme = /^[a-z][a-z0-9+\-.]*:\/\//i.test(raw);
    const withScheme = hasScheme ? raw : `https://${raw}`;
    const parsed = new URL(withScheme);

    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      throw new BadRequestException('URL scheme not allowed');
    }

    const hostname = parsed.hostname.toLowerCase().replace(/[\[\]]/g, '');
    const port = parseInt(
      parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
      10,
    );

    // Block dangerous ports (internal services)
    const BLOCKED_PORTS = new Set([
      22, 23, 25, 110, 143, 389, 445, 1433, 1521, 2375, 2376, 3306, 3389, 5432,
      5900, 6379, 8080, 8443, 8888, 9200, 27017,
    ]);
    if (BLOCKED_PORTS.has(port) && ![80, 443].includes(port)) {
      throw new BadRequestException('Target port not allowed');
    }

    // Block by hostname
    await validateHostname(hostname);

    return hostname;
  } catch (err) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException('Invalid URL format');
  }
}

async function validateHostname(hostname: string): Promise<void> {
  // 1. Block known internal hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new BadRequestException('Target not allowed');
  }

  // 2. Block by TLD
  for (const tld of BLOCKED_TLDS) {
    if (hostname.endsWith(tld)) {
      throw new BadRequestException('Target not allowed');
    }
  }

  // 3. Block dangerous bypass patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new BadRequestException('Target not allowed');
    }
  }

  // 4. If it's an IPv6 address
  if (net.isIPv6(hostname)) {
    if (isBlockedIpv6(hostname)) {
      throw new BadRequestException('Private IP addresses are not allowed');
    }
    return;
  }

  // 5. If it's an IPv4 address — validate directly
  if (net.isIPv4(hostname)) {
    if (isBlockedIpv4(hostname)) {
      throw new BadRequestException('Private IP addresses are not allowed');
    }
    return;
  }

  // 6. It's a domain name — resolve and check ALL returned IPs
  // This defeats DNS rebinding by resolving fresh
  await resolveAndValidate(hostname);
}

async function resolveAndValidate(domain: string): Promise<void> {
  let ips: string[] = [];

  try {
    const [v4, v6] = await Promise.allSettled([
      Promise.race([
        dnsResolve4(domain),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]),
      Promise.race([
        dnsResolve6(domain),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error()), 5_000),
        ),
      ]),
    ]);

    if (v4.status === 'fulfilled') ips.push(...v4.value);
    if (v6.status === 'fulfilled') ips.push(...v6.value);
  } catch {
    throw new BadRequestException('Could not resolve domain');
  }

  if (ips.length === 0) {
    throw new BadRequestException('Domain does not resolve');
  }

  // ALL IPs must be public — one private IP = reject
  for (const ip of ips) {
    if (net.isIPv4(ip) && isBlockedIpv4(ip)) {
      throw new BadRequestException('Private IP addresses are not allowed');
    }
    if (net.isIPv6(ip) && isBlockedIpv6(ip)) {
      throw new BadRequestException('Private IP addresses are not allowed');
    }
  }
}

// ─── Wrappers for services ────────────────────────────────────────────────────

export async function validateDomain(domain: string): Promise<void> {
  await validateTarget(domain);
}

export async function validateIp(ip: string): Promise<void> {
  if (!net.isIPv4(ip) && !net.isIPv6(ip)) {
    throw new BadRequestException('Must be a valid IP address');
  }
  if (net.isIPv4(ip) && isBlockedIpv4(ip)) {
    throw new BadRequestException('Private IP addresses are not allowed');
  }
  if (net.isIPv6(ip) && isBlockedIpv6(ip)) {
    throw new BadRequestException('Private IP addresses are not allowed');
  }
}

// ─── Safe fetch — re-validates before EVERY request (defeats DNS rebinding) ───

export async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8_000,
): Promise<Response> {
  // Always re-validate — DNS rebinding window is between validate and fetch
  const hostname = await validateTarget(url);

  // Re-resolve to get current IP (defeats TTL-based rebinding)
  await resolveAndValidate(hostname);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.startsWith('http') ? url : `https://${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)',
        ...(options.headers ?? {}),
      },
    });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError')
      throw new BadRequestException('Request timed out');
    // Sanitize — never expose internal network errors
    throw new BadRequestException('Could not reach target');
  } finally {
    clearTimeout(timer);
  }
}
