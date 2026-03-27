import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/components/file-upload.config';
import { LoginDto } from 'src/users/dto/login-dto';
import { RecoverPasswordDto } from 'src/users/dto/recover-password.dto';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles-auth.decorator';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';
import { seconds, SkipThrottle, Throttle } from '@nestjs/throttler';
import { ThrottlerIpGuard } from 'src/components/throttler-ip.guard';

@ApiTags('registration')
@Controller('api')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  // @UseGuards(ThrottlerIpGuard)
  // @Throttle({ short: { limit: 10, ttl: seconds(60) } })
  @SkipThrottle()
  login(@Body() loginDto: LoginDto, @Req() req) {
    const ip = req?.headers['cf-connecting-ip'] || req?.ip || 'unknown';
    return this.authService.login(loginDto, ip);
  }

  @Post('google-login')
  @UseGuards(ThrottlerIpGuard)
  @Throttle({ medium: { limit: 10, ttl: seconds(60) } })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Google ID token ( token!)',
        },
      },
    },
  })
  googleLogin(@Body() body: { token: string }) {
    if (!body.token) {
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
    }
    return this.authService.googleLogin(body.token);
  }

  @Post('registration')
  @UseGuards(ThrottlerIpGuard)
  @Throttle({ medium: { limit: 15, ttl: seconds(60) } })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        user_type: { type: 'string' },
        lang: { type: 'string' },
        images: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  registration(
    @Body() userDto: CreateUserDto,
    @UploadedFiles() images: Express.Multer.File,
  ) {
    return this.authService.registration(userDto, images);
  }

  @Post('recoverPassword')
  @UseGuards(ThrottlerIpGuard)
  @Throttle({ medium: { limit: 15, ttl: seconds(60) } })
  recoverPassword(@Body() dto: RecoverPasswordDto) {
    return this.authService.recoverPassword(dto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard)
  @Roles('specialist', 'ADMIN', 'simple user', 'employer')
  @Post('changePassword')
  changePassword(@Body() dto: ChangePasswordDto, @Req() req) {
    return this.authService.changePassword(dto, req);
  }
}
