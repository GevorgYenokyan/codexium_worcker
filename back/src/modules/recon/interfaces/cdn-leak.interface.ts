export interface LeakedIp {
  ip: string;
  source: string;
  isCdn: boolean;
  confidence: 'high' | 'medium' | 'low';
  ptrHostname?: string | null;
  vhostMatch?: boolean | null;
  knownPlatform?: string | null;
}

export interface MxRecord {
  exchange: string;
  priority: number;
  ips: string[];
  isCdn: boolean;
  cdnProvider: CdnProvider | null;
}

export interface BypassSubdomain {
  subdomain: string;
  ips: string[];
  isCdn: boolean;
  cdnProvider: CdnProvider | null;
}

export interface SslCertInfo {
  subject: string;
  issuer: string;
  fingerprint256: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  subjectAltNames: string[];
}

export interface PassiveDnsRecord {
  hostname: string;
  ip: string;
  source: string;
}

export interface FaviconInfo {
  hash: number;
  md5: string;
  fetched: boolean;
  searchUrl: string;
}

export interface CaaInfo {
  caas: string[];
  hasDirectCert: boolean;
}

export interface HeaderProbeResult {
  leakedHeaders: Record<string, string>;
  serverHint: string | null;
}

export interface DomainFingerprint {
  title: string | null;
  bodyHash: string | null;
  statusCode: number | null;
  server: string | null;
}

export interface CdnLeakResult {
  domain: string;
  isCdn: boolean;
  cdnProvider: CdnProvider | null;
  cdnIps: string[];
  leakedIps: LeakedIp[];
  spfIps: string[];
  mxIps: MxRecord[];
  bypassSubdomains: BypassSubdomain[];
  passiveDns: PassiveDnsRecord[];
  sslCert: SslCertInfo | null;
  certRelatedDomains: string[];
  favicon: FaviconInfo | null;
  caaInfo: CaaInfo;
  headerProbe: HeaderProbeResult;
  soaIps: string[];
  dmarcIps: string[];
  bimiIps: string[];
  robotsIps: string[];
  filteredPlatformIps: Array<{ ip: string; label: string; source: string }>;
  confidence: 'high' | 'medium' | 'low' | 'not_found';
  summary: string;
  recommendations: string[];
  scannedAt: string;
}

export type CdnProvider =
  | 'Cloudflare'
  | 'Fastly'
  | 'CloudFront'
  | 'Akamai'
  | 'Sucuri'
  | 'BunnyCDN'
  | 'KeyCDN'
  | 'Incapsula';
