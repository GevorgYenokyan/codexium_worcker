import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/users/users.model';
import { UserRoles } from './user-roles.model';

interface RoleCreationAttrs {
  velue: string;
  description: string;
}

@Table({ tableName: 'roles', timestamps: false })
export class Role extends Model<Role, RoleCreationAttrs> {
  @ApiProperty({ example: 1, description: 'id' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;
  @ApiProperty({ example: 'admin', description: 'user role' })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  value: string;
  @ApiProperty({ example: 'admin user', description: 'admin user' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  description: string;
  @BelongsToMany(() => User, () => UserRoles)
  user: User[];
}
