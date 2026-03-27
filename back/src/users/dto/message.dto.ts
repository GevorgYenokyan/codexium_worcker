import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsDateString,
  IsEmail,
} from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @ApiProperty({ example: 'name', description: 'Karen' })
  readonly email: string;

  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @ApiProperty({ example: 'name', description: 'Karen' })
  readonly name: string;

  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @ApiProperty({ example: 'name', description: 'Karen' })
  readonly phone: string;

  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @ApiProperty({ example: 'name', description: 'Karen' })
  readonly message: string;
}
