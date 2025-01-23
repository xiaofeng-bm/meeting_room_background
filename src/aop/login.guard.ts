import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Permission } from 'src/user/entities/permission.entity';

// 定义JWT用户数据接口
interface JwtUserData {
  userId: number;
  username: string;
  roles: string[];
  permissions: Permission[];
}

// 扩展Express的Request接口，添加用户信息
declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}

// 登录守卫，用于检查用户是否登录
@Injectable()
export class LoginGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;

  @Inject(JwtService)
  private jwtService: JwtService;

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 获取当前请求对象
    const request: Request = context.switchToHttp().getRequest();

    // 检查控制器类和处理程序是否需要登录
    const requireLogin = this.reflector.getAllAndOverride('require-login', [
      context.getClass(),
      context.getHandler(),
    ]);

    // 如果不需要登录，则直接允许通过
    if (!requireLogin) {
      return true;
    }

    // 获取请求头中的Authorization字段
    const authorization = request.headers.authorization;

    // 如果没有Authorization字段，则抛出未登录异常
    if (!authorization) {
      throw new UnauthorizedException('用户未登录');
    }

    // 解析JWT token并验证
    try {
      const token = authorization.split(' ')[1];
      const data = this.jwtService.verify<JwtUserData>(token);

      // 将验证后的用户信息附加到请求对象
      request.user = {
        userId: data.userId,
        username: data.username,
        roles: data.roles,
        permissions: data.permissions,
      };
      return true;
    } catch (error) {
      // 如果token验证失败，则抛出token失效异常
      throw new UnauthorizedException('token 失效，请重新登录');
    }
  }
}
