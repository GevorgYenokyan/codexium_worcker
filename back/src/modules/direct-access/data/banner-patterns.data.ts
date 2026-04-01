import { BannerResult } from '../interfaces/direct-access.interface';

export interface BannerPattern {
  regex: RegExp;
  software: string;
  versionGroup?: number;
  osGroup?: number;
  risk: BannerResult['risk'];
  note: string;
  cveCheck?: (version: string) => string | null;
}

export const BANNER_PATTERNS: BannerPattern[] = [
  {
    regex: /SSH-[\d.]+-OpenSSH_([\d.p]+)\s*([A-Za-z]+\w*)?/i,
    software: 'OpenSSH',
    versionGroup: 1,
    osGroup: 2,
    risk: 'medium',
    note: 'SSH version exposed',
    cveCheck: (v) => {
      const [major, minor] = v.split('.').map(Number);
      if (major < 8 || (major === 8 && minor < 9))
        return 'Versions < 8.9 may be affected by CVE-2023-38408';
      return null;
    },
  },
  {
    regex: /SSH-[\d.]+-dropbear_([\d.]+)/i,
    software: 'Dropbear SSH',
    versionGroup: 1,
    risk: 'medium',
    note: 'Dropbear SSH — common on embedded/IoT devices',
  },
  {
    regex: /220.*?Postfix/i,
    software: 'Postfix',
    risk: 'low',
    note: 'Postfix SMTP banner visible',
  },
  {
    regex: /220.*?Exim\s([\d.]+)/i,
    software: 'Exim',
    versionGroup: 1,
    risk: 'high',
    note: 'Exim version exposed',
    cveCheck: (v) => {
      const [major, minor] = v.split('.').map(Number);
      if (major < 4 || (major === 4 && minor < 96))
        return 'Versions < 4.96 affected by CVE-2023-42115 (RCE)';
      return null;
    },
  },
  {
    regex: /220.*?Sendmail\s([\d./]+)/i,
    software: 'Sendmail',
    versionGroup: 1,
    risk: 'medium',
    note: 'Sendmail version exposed',
  },
  {
    regex: /220.*?Microsoft ESMTP/i,
    software: 'Microsoft Exchange',
    risk: 'medium',
    note: 'Exchange SMTP banner — version hidden but product exposed',
  },
  {
    regex: /\* OK.*?Dovecot/i,
    software: 'Dovecot',
    risk: 'low',
    note: 'Dovecot IMAP/POP3 banner visible',
  },
  {
    regex: /\* OK.*?Cyrus\s([\d.]+)/i,
    software: 'Cyrus IMAP',
    versionGroup: 1,
    risk: 'low',
    note: 'Cyrus IMAP banner visible',
  },
  {
    regex: /220.*?ProFTPD\s([\d.]+)/i,
    software: 'ProFTPD',
    versionGroup: 1,
    risk: 'high',
    note: 'ProFTPD on FTP — replace with SFTP/FTPS',
    cveCheck: (v) => {
      const [major, minor, patch = 0] = v.split('.').map(Number);
      if (major === 1 && minor === 3 && patch <= 7)
        return 'ProFTPD 1.3.7 and below — check CVE-2021-46854';
      return null;
    },
  },
  {
    regex: /220.*?vsftpd\s([\d.]+)/i,
    software: 'vsftpd',
    versionGroup: 1,
    risk: 'high',
    note: 'vsftpd on FTP — replace with SFTP',
  },
  {
    regex: /220.*?FileZilla\sServer\s([\d.]+)/i,
    software: 'FileZilla Server',
    versionGroup: 1,
    risk: 'high',
    note: 'FileZilla FTP Server exposed',
  },
  {
    regex: /SSH-[\d.]+-/,
    software: 'SSH',
    risk: 'info',
    note: 'SSH service detected (vendor unknown)',
  },
];
