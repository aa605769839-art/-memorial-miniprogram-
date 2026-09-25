import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * 鉴权守卫。
 * - 无 @Roles 装饰器时：校验已登录（任意角色）。
 * - 带 @Roles('admin') 时：额外校验指定角色之一。
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: any; user?: any }>();
    const authHeader: string | undefined = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }
    const token = authHeader.slice('Bearer '.length).trim();
    let payload: any;
    try {
      payload = this.authService.verifyToken(token);
    } catch {
      throw new UnauthorizedException('登录凭证无效或已过期');
    }

    // 角色校验
    const requiredRoles = Reflect.getMetadata('roles', context.getHandler());
    if (requiredRoles && Array.isArray(requiredRoles) && requiredRoles.length > 0) {
      if (!requiredRoles.includes(payload.role)) {
        throw new ForbiddenException('没有权限执行此操作');
      }
    }

    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    return true;
  }
}

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
import { SetMetadata } from '@nestjs/common';