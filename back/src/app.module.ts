import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { User } from './users/users.model';
import { RolesModule } from './roles/roles.module';
import { Role } from './roles/roles.model';
import { UserRoles } from './roles/user-roles.model';
import { AuthModule } from './auth/auth.module';

import { UserImages } from './users/user-images.model';

import { MailModule } from './mail/mail.module';

import {} from 'cache-manager-redis-store';
import { seconds, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ReconModule } from './modules/recon/recon.module';
import { ReconScan } from './modules/recon/models/recon-scan.model';
import { VerifiedDomain } from './modules/recon/models/verified-domain.model';
import { ScheduleModule } from '@nestjs/schedule';
import { ScannerWorkerModule } from './modules/scanner-worker/scanner-worker.module';
import { DirectAccessModule } from './modules/direct-access/direct-access.module';

@Module({
  // controllers: [MailController],
  // providers: [MaileService],

  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: seconds(60),
          limit: 10,
        },
        {
          name: 'medium',
          ttl: seconds(60),
          limit: 15,
        },
      ],

      storage: new ThrottlerStorageRedisService({
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      }),
    }),

    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   useFactory: async () => {
    //     const client = createClient({
    //       url: 'redis://mypas@redis:6379', // <-- ЭТО ГЛАВНОЕ
    //     });

    //     client.on('error', (err) =>
    //       console.error('Redis ошибка:', err.message),
    //     );
    //     client.on('connect', () =>
    //       console.log('Подключено к redis (НЕ localhost)'),
    //     );

    //     await client.connect();

    //     const store = await cacheManagerRedisStore({
    //       redisClient: client, // <-- Передаём готовый клиент
    //       ttl: 300,
    //     });

    //     return { store };
    //   },
    // }),

    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.USER,
          pass: process.env.PASS,
        },
      },
    }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      models: [
        User,
        Role,
        UserRoles,
        UserImages,

        ReconScan,
        VerifiedDomain,
        // SubSubCategory,
        // About,
        // AboutImages,
      ],
      autoLoadModels: true,
    }),

    UsersModule,
    RolesModule,
    AuthModule,
    MailModule,

    ReconModule,

    ScannerWorkerModule,
    DirectAccessModule,

    // SubSubCategoriesModule,
    // AboutModule,
  ],
})
export class AppModule {}
