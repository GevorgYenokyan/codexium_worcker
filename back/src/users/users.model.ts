import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Role } from 'src/roles/roles.model';
import { UserRoles } from 'src/roles/user-roles.model';
import { UserImages } from './user-images.model';


export interface UserCreationAttrs {
  name?: string;
  profession?: string;
  email: string;
  location?: string;
  phone_number?: string;
  bank_card_attachment?: string;
  work_experience?: string;
  age?: number;
  profile_photo?: Buffer;
  // company_name?: string;
  password?: string;
  industry?: string;
  business_type?: string;
  contact_person?: string;
  website?: string;
  additional_information?: string;
  logo?: Buffer;
  is_blacklisted?: boolean;
  googleId?: string;
  user_type?: string;
}

@Table({ tableName: 'users', timestamps: true })
export class User extends Model<User, UserCreationAttrs> {
  @ApiProperty({ example: 1, description: 'id' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  email: string;

  @ApiProperty({
    example: 'simple user',
    description: 'User user_type address',
  })
  @Column({
    type: DataType.STRING(25),
    allowNull: false,
  })
  user_type: string;

  @ApiProperty({ example: 'John Doe', description: 'User name' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name: string;

  @ApiProperty({ example: 'Developer', description: 'Profession' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  profession: string;

  @ApiProperty({ example: 'New York', description: 'Location' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  location: string;

  @ApiProperty({ example: '123456789', description: 'Phone number' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone_number: string;

  @ApiProperty({ example: '5 years', description: 'Work experience' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  work_experience: string;

  @ApiProperty({ example: 30, description: 'Age of the user' })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  age: number;

  @ApiProperty({
    example: 'Company ABC',
    description: 'Company name (for businesses)',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  company_name: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  password: string;

  @ApiProperty({ example: 'LLC', description: 'Type of business' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  business_type: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  viber: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  telegram: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  whatsapp: string;

  @ApiProperty({ example: 'https://example.com', description: 'Website URL' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  website: string;

  @ApiProperty({
    example: 'Some additional information',
    description: 'Additional information',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  additional_information: string;

  @ApiProperty({ example: 4.5, description: 'Overall user rating' })
  @Column({
    type: DataType.FLOAT,
    allowNull: true,
    defaultValue: 0.0,
  })
  rating: number;

  @ApiProperty({
    example: false,
    description: 'Indicates if the user is blacklisted',
  })
  banned: boolean;
  @ApiProperty({ example: 'debil', description: 'banReason' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  banReason: string;
  @ApiProperty({ example: '1', description: 'active' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  isActive: boolean;

  @ApiProperty({ example: 'link', description: 'activation link' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  activationLink: string;

  @ApiProperty({ example: 'token', description: 'deviceToken' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  deviceToken?: string;

  @Column({
    type: DataType.STRING(300),
    allowNull: true,
    unique: true,
  })
  googleId: string;

  @BelongsToMany(() => Role, () => UserRoles)
  roles: Role[];



  @HasMany(() => UserImages)
  images: UserImages[];


}
