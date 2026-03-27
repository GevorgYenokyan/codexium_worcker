import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { Observable } from 'rxjs';
import { ROLES_KEY } from './roles-auth.decorator';
import { User } from 'src/users/users.model';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const requiredRole = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredRole) {
        return true;
      }
      const req = context.switchToHttp().getRequest();
      const [bearer, token] = req.headers.authorization?.split(' ');
      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException({ message: 'user is not authorized' });
      }

      const user: User = this.jwtService.verify(token);
      req.user = user;
      return user.roles.some((role) => requiredRole.includes(role.value));
    } catch (e) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }
}
