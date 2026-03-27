import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/users.model';
import { LoginDto } from 'src/users/dto/login-dto';
import { RecoverPasswordDto } from 'src/users/dto/recover-password.dto';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';
import { OAuth2Client } from 'google-auth-library';
import { RedisThrottleService } from 'src/redis/redis-throttle.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private redisThrottle: RedisThrottleService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async login(loginDto: LoginDto, ip: string) {
    const key = `login-fail:${ip}:${loginDto.email}`;
    const limit = 5;
    const ttl = 300;

    const failedAttempts = await this.redisThrottle.checkFailedAttempts(
      key,
      limit,
    );

    if (failedAttempts >= limit) {
      const ttlRemaining = await this.redisThrottle.getTTL(key);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many failed login attempts. Try again in ${Math.ceil(ttlRemaining / 60)} minutes.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      const user = await this.validateUser(loginDto);
      if (failedAttempts > 0) {
        await this.redisThrottle.resetFailedAttempts(key);
      }
      return this.generateToken(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        const newCount = await this.redisThrottle.incrementFailedAttempts(
          key,
          ttl,
        );
        const attemptsLeft = limit - newCount;
        throw new UnauthorizedException({
          message: 'Invalid login or password',
          attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0,
        });
      }

      throw error;
    }
  }
  // async login(loginDto: LoginDto, ip: string) {

  //   const user = await this.validateUser(loginDto);
  //   return this.generateToken(user);
  // }

  async registration(userDto: CreateUserDto, images: any) {
    const candidate = await this.userService.getUserByEmail(userDto.email);

    if (candidate) {
      throw new HttpException('email already exist', HttpStatus.BAD_REQUEST);
    }
    const hashPassword = await bcrypt.hash(userDto.password, 8);

    const user = await this.userService.createUser(
      {
        ...userDto,
        password: hashPassword,
      },
      images,
    );
    // this.generateToken(user);
    return {
      error: false,
      maessage:
        'Open your inbox and look for an email from the service you registered with',
    };
  }

  private async generateToken(user: User) {
    const payload = { email: user.email, id: user.id, roles: user.roles };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  private async validateUser(dto: LoginDto) {
    const user = await this.userService.getUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({ message: 'invalid login or password' });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({ message: 'Invalid credentials' });
    }
    const passwordEquals = await bcrypt.compare(dto.password, user?.password);

    if (user && passwordEquals) {
      return user;
    }

    throw new UnauthorizedException({ message: 'invalid login or password' });
  }

  async recoverPassword(dto: RecoverPasswordDto) {
    const user = await this.userService.getUserByLink(dto.link);

    if (!user) {
      throw new HttpException(
        'invalid activation link',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashPassword = await bcrypt.hash(dto.password, 8);

    user.password = hashPassword;
    user.activationLink = '';
    user.save();

    return {
      error: false,
      message: 'password successfully changed',
    };
  }

  async changePassword(dto: ChangePasswordDto, req) {
    const user = await this.userService.getUserById(req.user.id);
    if (!user) {
      throw new NotFoundException('user not found');
    }

    const hashPassword = await bcrypt.hash(dto.password, 8);

    user.password = hashPassword;

    user.save();

    return {
      error: false,
      message: 'password successfully changed',
    };
  }

  async googleLogin(googleToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email_verified) {
        throw new UnauthorizedException('Email not verified by Google');
      }

      const email = payload.email;
      const name = payload.name;
      const googleId = payload.sub;

      let user = await this.userService.getUserByEmail(email);

      if (!user) {
        user = await this.userService.createGoogleUser({
          email,
          name,
          googleId,
        });
      } else {
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }

        if (user.googleId !== googleId) {
          throw new UnauthorizedException('Google account mismatch');
        }
      }

      if (user.banned) {
        throw new UnauthorizedException({
          message: 'User is banned',
          reason: user.banReason,
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException({
          message: 'Invalid credentials',
        });
      }

      return this.generateToken(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Google auth error:', error);
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
