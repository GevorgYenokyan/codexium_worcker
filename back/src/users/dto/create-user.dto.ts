import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsUrl,
  IsLatLong,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'specialist', description: 'Type of user' })
  @IsString()
  user_type: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Developer',
    description: 'Profession',
    required: false,
  })
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiProperty({
    example: 'arm',
    description: 'arm',
    required: false,
  })
  @IsOptional()
  @IsString()
  lang?: string;

  @ApiProperty({
    example: 'New York',
    description: 'Location',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    example: '123456789',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({
    example: '5 years',
    description: 'Work experience',
    required: false,
  })
  @IsOptional()
  @IsString()
  work_experience?: string;

  @ApiProperty({ example: 30, description: 'Age of the user', required: false })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiProperty({
    example: 'Company ABC',
    description: 'Company name',
    required: false,
  })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter and 1 number',
  })
  password?: string;

  @ApiProperty({
    example: 'IT',
    description: 'Industry of the business',
    required: false,
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({
    example: 'LLC',
    description: 'Type of business',
    required: false,
  })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiProperty({
    example: 'John Manager',
    description: 'Contact person',
    required: false,
  })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiProperty({
    example: '094120060',
    description: '094120060',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: '094120060',
    description: '094120060',
    required: false,
  })
  @IsOptional()
  @IsString()
  viber?: string;

  @ApiProperty({
    example: '094120060',
    description: '094120060',
    required: false,
  })
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiProperty({
    example: '094120060',
    description: '094120060',
    required: false,
  })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'Website',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({
    example: 'Some additional information',
    description: 'Additional info',
    required: false,
  })
  @IsOptional()
  @IsString()
  additional_information?: string;

  @IsOptional()
  @IsString()
  deviceToken?: string;

  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiProperty({
    example: false,
    description: 'Is the user blacklisted?',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_blacklisted?: boolean;
}
