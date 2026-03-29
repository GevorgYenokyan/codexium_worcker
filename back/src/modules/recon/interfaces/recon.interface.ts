import { DirectAccessResult } from 'src/modules/direct-access/direct-access.service';

export interface SubdomainEntry {
  subdomain: string;
  ips: string[];
  isCloudflare: boolean; // true if all IPs belong to Cloudflare
  source: 'ct_logs' | 'dns_bruteforce' | 'both';
  resolvedAt: string | null;
}

export interface PortResult {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
}

export interface IpInfo {
  address: string;
  subdomains: string[];
  openPorts: PortResult[];
  isCloudflare: boolean; // if true — port scan was skipped
}

export interface ReconScanResult {
  id: number;
  domain: string;
  scannedAt: string;
  hasWildcardDns: boolean;
  cdnProvider: string | null; // detected CDN provider e.g. "Cloudflare"
  leakedRealIps: string[]; // real origin IPs found via CDN leak check
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
