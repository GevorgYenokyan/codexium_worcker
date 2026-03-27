import {
  Column,
  DataType,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

/**
 * Caches passive DNS results per domain.
 * TTL: 24 hours — passive DNS data doesn't change frequently.
 * This way 50 HackerTarget requests/day serve ALL users,
 * not just 50 individual users.
 */
@Table({ tableName: 'passive_dns_cache', timestamps: true })
export class PassiveDnsCache extends Model<PassiveDnsCache> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  // Domain is unique — one cache entry per domain
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  domain: string;

  // JSON array of PassiveDnsRecord[]
  @Column({ type: DataType.TEXT, allowNull: false })
  records: string;

  // Which source returned data
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'HackerTarget',
  })
  source: string;

  // Cache hit counter — useful for analytics
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  hitCount: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
