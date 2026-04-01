import { DirectAccessResult } from 'src/modules/direct-access/interfaces/direct-access.interface';

export interface SubdomainEntry {
  subdomain: string;
  ips: string[];
  isCloudflare: boolean;
  source: 'ct_logs' | 'dns_bruteforce' | 'both' | 'external';
  resolvedAt: string | null;
}

export interface PortResult {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
  banner?: string; // ✅ баннер сервиса — SSH version, FTP greeting, Redis PONG и т.д.
}

export interface IpInfo {
  address: string;
  subdomains: string[];
  openPorts: PortResult[];
  isCloudflare: boolean;
}

export interface ReconScanResult {
  id: number;
  domain: string;
  scannedAt: string;
  hasWildcardDns: boolean;
  cdnProvider: string | null;
  leakedRealIps: string[];
  subdomains: SubdomainEntry[];
  ipMap: IpInfo[];
  portRange: { from: number; to: number };
  summary: {
    totalSubdomains: number;
    resolvedSubdomains: number;
    realSubdomains: number;
    uniqueIps: number;
    realIps: number;
    totalOpenPorts: number;
    ctLogsFound: number;
    bruteforceFound: number;
  };
  directAccess?: DirectAccessResult[];
}
