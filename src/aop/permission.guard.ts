import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

/**
 * 权限守卫，用于检查用户是否具有访问特定资源的权限
 * 实现了CanActivate接口，以确定是否允许激活路由
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;

  /**
   * 检查用户是否具有必要的权限
   * @param context 执行上下文，用于获取请求和反射元数据
   * @returns 返回一个布尔值、Promise<boolean>或Observable<boolean>，表示是否允许激活路由
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 获取当前请求
    const request = context.switchToHttp().getRequest();

    // 如果请求中没有用户信息，直接返回true，允许继续执行
    if (!request.user) {
      return true;
    }

    // 获取用户的权限列表
    const permissions = request.user.permissions;

    // 从类和方法中获取所需的权限
    const requiredPermissions = this.reflector.getAllAndOverride('require-permission', [
      context.getClass(),
      context.getHandler(),
    ]);

    // 如果没有设置所需的权限，直接返回true，允许继续执行
    if (!requiredPermissions) {
      return true;
    }

    // 遍历所需的权限列表，检查用户是否具有所有必要的权限
    for (let i = 0; i < requiredPermissions.length; i++) {
      const curPermission = requiredPermissions[i];
      // 查找用户权限列表中是否存在当前所需的权限
      const found = permissions.find((permission) => permission.code === curPermission);
      // 如果用户没有当前所需的权限，抛出未授权异常
      if (!found) {
        throw new UnauthorizedException('您没有权限访问');
      }
    }

    // 用户具有所有必要的权限，返回true，允许继续执行
    return true;
  }
}