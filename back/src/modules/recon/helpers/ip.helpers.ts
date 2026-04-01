import { CDN_RANGES, KNOWN_PLATFORM_RANGES } from '../data/ip-ranges';
import { CdnProvider } from '../interfaces/cdn-leak.interface';

export function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
}

export function ipInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/');
    const mask = ~((1 << (32 - parseInt(bits))) - 1);
    return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
  } catch {
    return false;
  }
}

export function detectCdn(ip: string): CdnProvider | null {
  for (const { cidr, provider } of CDN_RANGES)
    if (ipInCidr(ip, cidr)) return provider;
  return null;
}

export function isCdnIp(ip: string): boolean {
  return detectCdn(ip) !== null;
}

export function getKnownPlatformLabel(ip: string): string | null {
  for (const { cidr, label } of KNOWN_PLATFORM_RANGES)
    if (ipInCidr(ip, cidr)) return label;
  return null;
}

export function isValidPublicIp(ip: string): boolean {
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;
  return !/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.)/.test(ip);
}
