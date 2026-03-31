export type CdnProvider =
  | 'Cloudflare'
  | 'Fastly'
  | 'CloudFront'
  | 'Akamai'
  | 'Sucuri'
  | 'BunnyCDN'
  | 'KeyCDN'
  | 'Incapsula';

export interface CidrBlock {
  cidr: string;
  label: string;
}

export interface CdnRange {
  cidr: string;
  provider: CdnProvider;
}

export const KNOWN_PLATFORM_RANGES: CidrBlock[] = [
  // Google / Alphabet
  { cidr: '142.250.0.0/15', label: 'Google' },
  { cidr: '142.251.0.0/16', label: 'Google' },
  { cidr: '172.217.0.0/16', label: 'Google' },
  { cidr: '172.253.0.0/16', label: 'Google' },
  { cidr: '216.58.192.0/19', label: 'Google' },
  { cidr: '216.239.32.0/19', label: 'Google' },
  { cidr: '74.125.0.0/16', label: 'Google' },
  { cidr: '64.233.160.0/19', label: 'Google' },
  { cidr: '66.102.0.0/20', label: 'Google' },
  { cidr: '209.85.128.0/17', label: 'Google' },
  { cidr: '173.194.0.0/16', label: 'Google' },
  { cidr: '108.177.8.0/21', label: 'Google' },
  { cidr: '35.190.0.0/17', label: 'Google Cloud' },
  { cidr: '34.64.0.0/10', label: 'Google Cloud' },
  // Meta / Facebook / Instagram / WhatsApp
  { cidr: '157.240.0.0/16', label: 'Meta/Facebook' },
  { cidr: '31.13.24.0/21', label: 'Meta/Facebook' },
  { cidr: '31.13.64.0/18', label: 'Meta/Facebook' },
  { cidr: '69.63.176.0/20', label: 'Meta/Facebook' },
  { cidr: '69.171.224.0/19', label: 'Meta/Facebook' },
  { cidr: '66.220.144.0/20', label: 'Meta/Facebook' },
  { cidr: '74.119.76.0/22', label: 'Meta/Facebook' },
  // Telegram
  { cidr: '149.154.160.0/20', label: 'Telegram' },
  { cidr: '91.108.4.0/22', label: 'Telegram' },
  { cidr: '91.108.56.0/22', label: 'Telegram' },
  { cidr: '91.108.8.0/22', label: 'Telegram' },
  // Microsoft / Azure
  { cidr: '20.33.0.0/16', label: 'Microsoft Azure' },
  { cidr: '20.34.0.0/15', label: 'Microsoft Azure' },
  { cidr: '20.36.0.0/14', label: 'Microsoft Azure' },
  { cidr: '20.40.0.0/13', label: 'Microsoft Azure' },
  { cidr: '20.128.0.0/16', label: 'Microsoft Azure' },
  { cidr: '52.224.0.0/11', label: 'Microsoft Azure' },
  { cidr: '13.64.0.0/11', label: 'Microsoft Azure' },
  { cidr: '40.64.0.0/10', label: 'Microsoft Azure' },
  { cidr: '104.208.0.0/13', label: 'Microsoft Azure' },
  // Amazon AWS (non-CloudFront)
  { cidr: '52.0.0.0/11', label: 'AWS' },
  { cidr: '54.0.0.0/8', label: 'AWS' },
  { cidr: '18.144.0.0/12', label: 'AWS' },
  { cidr: '3.0.0.0/9', label: 'AWS' },
  // Apple
  { cidr: '17.0.0.0/8', label: 'Apple' },
  // Twitter / X
  { cidr: '104.244.40.0/21', label: 'Twitter/X' },
  { cidr: '192.133.76.0/22', label: 'Twitter/X' },
  // Yandex
  { cidr: '5.45.192.0/18', label: 'Yandex' },
  { cidr: '5.255.192.0/18', label: 'Yandex' },
  { cidr: '37.9.64.0/18', label: 'Yandex' },
  { cidr: '77.88.0.0/18', label: 'Yandex' },
  { cidr: '87.250.224.0/19', label: 'Yandex' },
  { cidr: '93.158.128.0/18', label: 'Yandex' },
  { cidr: '213.180.192.0/19', label: 'Yandex' },
  // VK / Mail.ru group  — NOTE: emx.mail.ru is a legitimate MX server,
  // these ranges cover VK CDN/media, NOT the MX servers (94.100.x, 217.69.x)
  { cidr: '87.240.128.0/18', label: 'VK/Mail.ru CDN' },
  { cidr: '195.82.48.0/20', label: 'VK/Mail.ru CDN' },
  // Cloudinary
  { cidr: '35.244.0.0/14', label: 'Cloudinary/GCP' },
  // Stripe
  { cidr: '54.187.174.0/24', label: 'Stripe' },
  // Twilio / SendGrid
  { cidr: '168.245.0.0/17', label: 'Twilio/SendGrid' },
  // GitHub
  { cidr: '140.82.112.0/20', label: 'GitHub' },
  { cidr: '185.199.108.0/22', label: 'GitHub' },
  // Shopify
  { cidr: '23.227.38.0/24', label: 'Shopify' },
  // GoDaddy hosting shared pools — these ARE used as mail servers,
  // so we explicitly keep secureserver.net IPs (92.204.x, 160.153.x)
  // by NOT listing them here. Only filter GoDaddy CDN/media ranges.
  { cidr: '184.168.0.0/15', label: 'GoDaddy CDN' },
];

export const CDN_RANGES: CdnRange[] = [
  // Cloudflare (AS13335)
  { cidr: '173.245.48.0/20', provider: 'Cloudflare' },
  { cidr: '103.21.244.0/22', provider: 'Cloudflare' },
  { cidr: '103.22.200.0/22', provider: 'Cloudflare' },
  { cidr: '103.31.4.0/22', provider: 'Cloudflare' },
  { cidr: '141.101.64.0/18', provider: 'Cloudflare' },
  { cidr: '108.162.192.0/18', provider: 'Cloudflare' },
  { cidr: '190.93.240.0/20', provider: 'Cloudflare' },
  { cidr: '188.114.96.0/20', provider: 'Cloudflare' },
  { cidr: '197.234.240.0/22', provider: 'Cloudflare' },
  { cidr: '198.41.128.0/17', provider: 'Cloudflare' },
  { cidr: '162.158.0.0/15', provider: 'Cloudflare' },
  { cidr: '104.16.0.0/13', provider: 'Cloudflare' },
  { cidr: '104.24.0.0/14', provider: 'Cloudflare' },
  { cidr: '172.64.0.0/13', provider: 'Cloudflare' },
  { cidr: '131.0.72.0/22', provider: 'Cloudflare' },
  // Fastly (AS54113)
  { cidr: '23.235.32.0/20', provider: 'Fastly' },
  { cidr: '43.249.72.0/22', provider: 'Fastly' },
  { cidr: '103.244.50.0/24', provider: 'Fastly' },
  { cidr: '103.245.222.0/23', provider: 'Fastly' },
  { cidr: '104.156.80.0/20', provider: 'Fastly' },
  { cidr: '140.248.64.0/18', provider: 'Fastly' },
  { cidr: '146.75.0.0/17', provider: 'Fastly' },
  { cidr: '151.101.0.0/16', provider: 'Fastly' },
  { cidr: '157.52.64.0/18', provider: 'Fastly' },
  { cidr: '167.82.0.0/17', provider: 'Fastly' },
  { cidr: '172.111.64.0/18', provider: 'Fastly' },
  { cidr: '185.31.16.0/22', provider: 'Fastly' },
  { cidr: '199.27.72.0/21', provider: 'Fastly' },
  { cidr: '199.232.0.0/16', provider: 'Fastly' },
  // AWS CloudFront
  { cidr: '13.32.0.0/15', provider: 'CloudFront' },
  { cidr: '13.35.0.0/16', provider: 'CloudFront' },
  { cidr: '52.84.0.0/15', provider: 'CloudFront' },
  { cidr: '54.182.0.0/16', provider: 'CloudFront' },
  { cidr: '54.192.0.0/16', provider: 'CloudFront' },
  { cidr: '54.230.0.0/16', provider: 'CloudFront' },
  { cidr: '54.239.128.0/18', provider: 'CloudFront' },
  { cidr: '64.252.64.0/18', provider: 'CloudFront' },
  { cidr: '64.252.128.0/18', provider: 'CloudFront' },
  { cidr: '70.132.0.0/18', provider: 'CloudFront' },
  { cidr: '130.176.0.0/16', provider: 'CloudFront' },
  { cidr: '143.204.0.0/16', provider: 'CloudFront' },
  { cidr: '205.251.192.0/19', provider: 'CloudFront' },
  { cidr: '205.251.249.0/24', provider: 'CloudFront' },
  { cidr: '216.137.32.0/19', provider: 'CloudFront' },
  // Akamai (AS20940)
  { cidr: '2.16.0.0/13', provider: 'Akamai' },
  { cidr: '23.0.0.0/12', provider: 'Akamai' },
  { cidr: '23.192.0.0/11', provider: 'Akamai' },
  { cidr: '23.32.0.0/11', provider: 'Akamai' },
  { cidr: '23.64.0.0/14', provider: 'Akamai' },
  { cidr: '23.72.0.0/13', provider: 'Akamai' },
  { cidr: '72.246.0.0/15', provider: 'Akamai' },
  { cidr: '88.221.0.0/16', provider: 'Akamai' },
  { cidr: '92.122.0.0/15', provider: 'Akamai' },
  { cidr: '95.100.0.0/15', provider: 'Akamai' },
  { cidr: '96.16.0.0/15', provider: 'Akamai' },
  { cidr: '104.64.0.0/10', provider: 'Akamai' },
  { cidr: '118.214.0.0/16', provider: 'Akamai' },
  { cidr: '173.222.0.0/15', provider: 'Akamai' },
  { cidr: '184.24.0.0/13', provider: 'Akamai' },
  // Sucuri / GoDaddy WAF (AS30148)
  { cidr: '192.88.134.0/23', provider: 'Sucuri' },
  { cidr: '185.93.228.0/22', provider: 'Sucuri' },
  { cidr: '66.248.200.0/22', provider: 'Sucuri' },
  { cidr: '208.109.0.0/22', provider: 'Sucuri' },
  // BunnyCDN (AS34248)
  { cidr: '185.152.66.0/24', provider: 'BunnyCDN' },
  { cidr: '185.152.67.0/24', provider: 'BunnyCDN' },
  // KeyCDN (AS47583)
  { cidr: '91.195.240.0/22', provider: 'KeyCDN' },
  { cidr: '94.31.27.0/24', provider: 'KeyCDN' },
  // Imperva / Incapsula (AS19551)
  { cidr: '149.126.72.0/21', provider: 'Incapsula' },
  { cidr: '192.230.64.0/19', provider: 'Incapsula' },
  { cidr: '45.64.64.0/22', provider: 'Incapsula' },
];
