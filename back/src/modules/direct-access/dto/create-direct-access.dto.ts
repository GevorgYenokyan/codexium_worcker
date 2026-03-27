import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class DirectAccessDto {
  @ApiProperty({
    example: '173.249.38.250',
    description:
      'Real server IP — must be previously discovered via CDN leak check',
  })
  @IsString()
  @Matches(/^(\d{1,3}\.){3}\d{1,3}$/, {
    message: 'Must be a valid IPv4 address',
  })
  ip: string;

  @ApiProperty({
    example: 1,
    description: 'Verified domain ID — you must own this domain',
  })
  @IsInt()
  @Min(1)
  domainId: number;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Skip the check that IP was discovered via CDN leak (only for testing)',
  })
  @IsBoolean()
  @IsOptional()
  skipLeakCheck?: boolean;
}
