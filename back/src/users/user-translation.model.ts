import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './users.model';

@Table({ tableName: 'user_translations', timestamps: true })
export class UserTranslation extends Model<UserTranslation> {
  @ApiProperty({ example: 1, description: 'Translation ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: 1, description: 'User ID' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  @ForeignKey(() => User)
  userId: number;

  @ApiProperty({ example: 'en', description: 'Language code' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  languageCode: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User name in a specific language',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @ApiProperty({
    example: 'Developer',
    description: 'Profession in a specific language',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  profession: string;

  @ApiProperty({ example: 'IT', description: 'Industry of the business' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  industry: string;

  @ApiProperty({ example: 'LLC', description: 'Type of business' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  business_type: string;

  @ApiProperty({ example: '5 years', description: 'Work experience' })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  work_experience: string;

  @ApiProperty({
    example: 'Some additional information',
    description: 'Localized information',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  additional_information: string;

  @BelongsTo(() => User)
  user: User;
}
