import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { RolesModule } from 'src/roles/roles.module';
import { RedisThrottleModule } from 'src/redis/redis-throttle.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_KEY,
      signOptions: {
        expiresIn: '30d',
      },
    }),
    RolesModule,
    RedisThrottleModule,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
