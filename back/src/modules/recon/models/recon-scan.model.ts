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

@Table({ tableName: 'recon_scans', timestamps: true, updatedAt: false })
export class ReconScan extends Model<ReconScan> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
  userId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  domain: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  result: string; // JSON stringified ReconScanResult

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  portFrom: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1024 })
  portTo: number;

  @CreatedAt
  createdAt: Date;

  @BelongsTo(() => User)
  user: User;
}
