import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

/**
 * 设置登录要求的装饰器
 * @param bool 是否需要登录，默认为true
 */
export const RequireLogin = (bool: boolean = true) => SetMetadata('require-login', bool);

/**
 * 设置权限要求的装饰器
 * @param permissions 需要的权限列表
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('require-permission', permissions);

/**
 * 创建一个参数装饰器，用于获取用户信息
 * 如果请求的user属性不存在，则返回null
 * 如果提供了data参数，则返回user对象中对应的属性值；否则返回整个user对象
 * @param data 用户信息的特定属性名
 * @param ctx 当前的执行上下文
 * @returns 用户信息或其特定属性值，或者null
 */
export const UserInfo = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  if (!request.user) {
    return null;
  }

  return data ? request.user[data] : request.user;
});
