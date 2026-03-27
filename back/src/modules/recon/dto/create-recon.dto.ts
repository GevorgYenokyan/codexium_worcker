import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsIP,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// ─── Add domain for verification ─────────────────────────────────────────────
export class AddDomainDto {
  @ApiProperty({ example: 'example.com' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(253)
  @Matches(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, {
    message: 'Must be a valid domain (e.g. example.com)',
  })
  domain: string;
}

// ─── Verify ownership (check DNS TXT record) ─────────────────────────────────
export class VerifyDomainDto {
  @ApiProperty({ example: 1, description: 'VerifiedDomain record id' })
  @IsInt()
  @Min(1)
  domainId: number;
}

// ─── Run recon scan ───────────────────────────────────────────────────────────
export class ReconScanDto {
  @ApiProperty({ example: 1, description: 'Verified domain id to scan' })
  @IsInt()
  @Min(1)
  domainId: number;

  @ApiProperty({ example: 1, description: 'Port range start (1–65534)' })
  @IsInt()
  @Min(1)
  @Max(65534)
  portFrom: number;

  @ApiProperty({ example: 1024, description: 'Port range end (2–65535)' })
  @IsInt()
  @Min(2)
  @Max(65535)
  portTo: number;

  @ApiProperty({
    example: ['173.249.38.250'],
    description:
      'Real IPs found from cloudflare-leak — passed here to skip re-fetching HackerTarget',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsIP('4', { each: true })
  knownRealIps?: string[];
}

// ─── Direct IP port scan (used after cloudflare-leak reveals real IP) ─────────
export class ScanIpDto {
  @ApiProperty({
    example: '173.249.38.250',
    description: 'Real IP address to port scan (obtained from cloudflare-leak)',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\d{1,3}\.){3}\d{1,3}$/, {
    message: 'Must be a valid IPv4 address',
  })
  ip: string;

  @ApiProperty({ example: 'example.com' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(253)
  @Matches(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, {
    message: 'Must be a valid domain (e.g. example.com)',
  })
  domain: string;

  @ApiProperty({
    example: 1,
    description: 'Verified domain id (ownership check)',
  })
  @IsInt()
  @Min(1)
  domainId: number;

  @ApiProperty({ example: 1, description: 'Port range start' })
  @IsInt()
  @Min(1)
  @Max(65534)
  portFrom: number;

  @ApiProperty({ example: 1024, description: 'Port range end' })
  @IsInt()
  @Min(2)
  @Max(65535)
  portTo: number;
}
