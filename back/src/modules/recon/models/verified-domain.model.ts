import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from 'src/users/users.model';

@Table({ tableName: 'verified_domains', timestamps: true, updatedAt: false })
export class VerifiedDomain extends Model<VerifiedDomain> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
  userId: number;

  @ApiProperty({ example: 'example.com' })
  @Column({ type: DataType.STRING, allowNull: false })
  domain: string;

  @ApiProperty({ description: 'DNS TXT record value the user must set' })
  @Column({ type: DataType.STRING, allowNull: false })
  token: string;

  @ApiProperty({ enum: ['pending', 'verified', 'failed'] })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'pending',
  })
  status: 'pending' | 'verified' | 'failed';

  @Column({ type: DataType.DATE, allowNull: true })
  verifiedAt: Date | null;

  @CreatedAt
  createdAt: Date;

  @BelongsTo(() => User)
  user: User;
}
