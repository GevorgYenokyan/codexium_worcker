import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RecoverPasswordDto {
  @ApiProperty({ example: 'link', description: ' link', required: true })
  link: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    required: true,
  })
  @IsString()
  password?: string;
}
