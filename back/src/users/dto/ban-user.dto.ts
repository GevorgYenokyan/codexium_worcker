import { ApiProperty } from '@nestjs/swagger';

export class BanUserDto {
  @ApiProperty({ example: '1', description: 'userId' })
  readonly userId: number;
  @ApiProperty({ example: 'bad user', description: 'banReason' })
  readonly banReason: string;
}
