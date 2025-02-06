import {
  Body,
  Controller,
  Post,
  Query,
  Get,
  Inject,
  UnauthorizedException,
  SetMetadata,
  ParseIntPipe,
  BadRequestException,
  DefaultValuePipe,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RequireLogin, RequirePermission, UserInfo } from 'src/aop/custom.decorator';
import { UpdateUserPasswordDto } from './dto/update-password.dto';
import { generateParseIntPipe } from 'src/utils';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginUserVo } from './vo/login-user.vo';
import { UserDetailVo } from './vo/user-info.vo';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { storage } from 'src/utils/my-file-storage';

/**
 * 用户控制器，用于处理用户相关的HTTP请求
 */
@ApiTags('用户管理模块')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService;

  /**
   * 初始化用户数据
   * @returns 成功消息
   */
  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'success';
  }

  /**
   * 用户注册
   * @param registerUser 注册用户的信息
   * @returns 注册结果
   */
  @ApiBody({
    type: RegisterUserDto,
    description: '注册用户的信息',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码无效/验证码错误/用户名已存在',
    type: String,
  })
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  /**
   * 发送注册验证码
   * @param email 用户邮箱
   * @returns 验证码发送结果
   */
  @ApiQuery({
    name: 'email',
    type: String,
    description: '邮箱地址',
    required: true,
    example: '123456@qq.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送验证码成功',
    type: String,
    example: 'success',
  })
  @Get('register-captcha')
  async registerCaptcha(@Query('email') email: string) {
    return await this.userService.registerCaptcha(email);
  }

  /**
   * 用户登录
   * @param loginUser 登录用户的信息
   * @returns 登录结果，包括访问令牌和刷新令牌
   */
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和 token',
    type: LoginUserVo,
  })
  @Post('login')
  async login(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false);

    // 生成访问令牌
    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        email: vo.userInfo.email,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      {
        expiresIn: this.configService.get('jwt_access_token_expire_time') || '3d',
      },
    );

    // 生成刷新令牌
    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn: this.configService.get('jwt_refresh_token_expire_time') || '30d',
      },
    );

    return vo;
  }

  /**
   * 管理员登录
   * @param loginUser 登录用户的信息
   * @returns 登录结果
   */
  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    return await this.userService.login(loginUser, true);
  }

  /**
   * 刷新令牌
   * @param refreshToken 刷新令牌
   * @returns 新的访问令牌和刷新令牌
   */
  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新 token',
    required: true,
    example: 'xxxxxxxxyyyyyyyyzzzzz',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效，请重新登录',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
  })
  @Get('refresh-token')
  async refreshToken(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);

      const user = await this.userService.findUserById(data.userId, false);

      // 生成新的访问令牌
      const access_token = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
        },
        {
          expiresIn: this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );

      // 生成新的刷新令牌
      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn: this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      );

      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('refresh token无效');
    }
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: UserDetailVo,
  })
  @Get('info')
  @RequireLogin(true)
  async info(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserDetailById(userId);

    const vo = new UserDetailVo();
    vo.id = user.id;
    vo.email = user.email;
    vo.username = user.username;
    vo.headPic = user.head_pic;
    vo.phoneNumber = user.phone_number;
    vo.nickName = user.nick_name;
    vo.createTime = user.create_time;
    vo.isFrozen = user.is_frozen;

    return vo;
  }

  @Post(['update_password', 'admin/update_password'])
  async updatePassword(
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return await this.userService.updatePassword(passwordDto);
  }

  @Get('update_password/captcha')
  async updatePasswordCaptcha(@Query('email') email: string) {
    return await this.userService.updatePasswordCaptcha(email);
  }

  /**
   * 测试接口，无需登录或权限
   * @returns 固定字符串'aaa'
   */
  @Get('aaa')
  aaa() {
    return 'aaa';
  }

  /**
   * 测试接口，需要登录和特定权限
   * @param username 当前登录用户的用户名
   * @returns 当前登录用户的用户名
   */
  @Get('bbb')
  @RequirePermission('ddd')
  @RequireLogin(true)
  bbb(@UserInfo('username') username: string) {
    return username;
  }

  @Get('freeze')
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'success';
  }

  @ApiBearerAuth()
  @ApiQuery({
    name: 'page',
    description: '第几页',
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    description: '每页多少条',
    type: Number,
  })
  @ApiQuery({
    name: 'username',
    description: '用户名',
    type: Number,
  })
  @ApiQuery({
    name: 'nick_name',
    description: '昵称',
    type: Number,
  })
  @ApiQuery({
    name: 'email',
    description: '邮箱地址',
    type: Number,
  })
  @ApiResponse({
    type: String,
    description: '用户列表',
  })
  @RequireLogin()
  @Get('list')
  async list(
    @Query('page', new DefaultValuePipe(1), generateParseIntPipe('page')) page: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('username') username: string,
    @Query('email') email: string,
  ) {
    return await this.userService.findUserByPage(username, email, page, pageSize);
  }

  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/不正确'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: String
  })
  @Post(['update', 'admin/update'])
  @RequireLogin()
  async update(@UserInfo('userId') userId: number, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(userId, updateUserDto);  
  }

  @ApiBearerAuth()
  @ApiResponse({
    type: String,
    description: '发送成功'
  })
  @RequireLogin()
  @Get('update/captcha')
  async updateCaptcha(@UserInfo('email') address: string) {
    return await this.userService.updateInfoCaptcha(address);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor('file', {
    dest: 'uploads',
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 30  // 3MB
    },
    fileFilter: (req, file, callback) => {
      const extname = path.extname(file.originalname);
      if(['.png', '.jpg', '.jpeg', '.gif'].includes(extname)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('只能上传图片'), false);
      }
    }
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('file', file);
    return file.path;
  }
}
