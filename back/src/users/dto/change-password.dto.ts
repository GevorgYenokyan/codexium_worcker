import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'password123',
    description: 'User password',
    required: true,
  })
  @IsString()
  password?: string;
}
