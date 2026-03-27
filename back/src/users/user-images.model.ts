import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './users.model';
import { ApiProperty } from '@nestjs/swagger';

interface UserImagesCreationAttrs {
  userId: number;
  image: string;
}

@Table({ tableName: 'user_images', timestamps: false })
export class UserImages extends Model<UserImages, UserImagesCreationAttrs> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  image: string;
}
