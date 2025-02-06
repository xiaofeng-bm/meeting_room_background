import { Injectable, Inject, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { RedisService } from 'src/redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Like, Repository } from 'typeorm';
import { md5 } from 'src/utils';
import { EmailService } from 'src/email/email.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginUserVo } from './vo/login-user.vo';
import { throws } from 'assert';
import { UpdateUserPasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor() {}

  private logger = new Logger('UserService');

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(EmailService)
  private emailService: EmailService;

  @InjectRepository(User)
  private userRepository: Repository<User>;

  @InjectRepository(Role)
  private roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  async initData() {
    const user1 = new User();
    user1.username = '白敏';
    user1.password = md5('123456');
    user1.email = 'baimin_job@163.com';
    user1.is_admin = true;
    user1.nick_name = '小白';
    user1.phone_number = '13233323333';
    user1.create_time = Date.now().toString();

    const user2 = new User();
    user2.username = '系统管理员';
    user2.password = md5('123456');
    user2.email = 'system@yy.com';
    user2.nick_name = '管理员';
    user2.create_time = Date.now().toString();

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问 ccc 接口';

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问 ddd 接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }

  async register(registerUser: RegisterUserDto) {
    const captcha = await this.redisService.get(`register_${registerUser.email}`);
    if (!captcha) {
      throw new HttpException('验证码无效', HttpStatus.BAD_REQUEST);
    }

    if (captcha !== registerUser.captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOne({
      where: {
        username: registerUser.username,
      },
    });

    if (foundUser) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
    }

    const newUser = new User();
    newUser.username = registerUser.username;
    newUser.password = md5(registerUser.password);
    newUser.email = registerUser.email;
    newUser.nick_name = registerUser.nick_name;
    newUser.create_time = Date.now().toString();

    try {
      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (e) {
      this.logger.error(e);

      return '注册失败';
    }
  }

  async registerCaptcha(email: string) {
    const code = Math.random().toString().slice(2, 8);

    try {
      await this.redisService.set(`register_${email}`, code, 60 * 5);
      await this.emailService.sendMail({
        to: email,
        subject: '注册验证码',
        html: `您的验证码是：${code}`,
      });

      return 'success';
    } catch (error) {
      console.log(error);
    }
  }

  async login(loginUser: LoginUserDto, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUser.username,
      },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }
    if (md5(loginUser.password) !== user.password) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const vo = new LoginUserVo();
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nick_name: user.nick_name,
      email: user.email,
      head_pic: user.head_pic,
      phone_number: user.phone_number,
      is_frozen: user.is_frozen,
      is_admin: user.is_admin,
      create_time: Number(user.create_time),
      roles: user.roles.map((role) => role.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission.code) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };

    return vo;
  }

  async findUserById(id: number, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
      relations: ['roles', 'roles.permissions'],
    });
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
  }

  async findUserDetailById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    return user;
  }

  async updatePassword(passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(`update_password_${passwordDto.email}`);

    if (!captcha) {
      throw new HttpException('验证码无效', HttpStatus.BAD_REQUEST);
    }
    if (passwordDto.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOne({
      where: {
        username: passwordDto.username,
      },
    });

    foundUser.password = md5(passwordDto.password);
    try {
      await this.userRepository.save(foundUser);
    } catch (error) {
      this.logger.error(error);
      return '修改密码失败';
    }
  }

  async updatePasswordCaptcha(email: string) {
    const code = Math.random().toString().slice(2, 8);
    try {
      await this.redisService.set(`update_password_${email}`, code, 60 * 5);
      await this.emailService.sendMail({
        to: email,
        subject: '修改密码验证码',
        html: `您的验证码是：${code}`,
      });
      return 'success';
    } catch (error) {
      console.log(error);
    }
  }

  async freezeUserById(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    user.is_frozen = true;

    await this.userRepository.save(user);
  }

  async findUserByPage(username: string, email: string, page: number, pageSize: number) {
    const skipCount = (page - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (username) {
      condition.username = Like(`%${username}%`); // like模糊匹配
    }

    if (email) {
      condition.email = Like(`%${email}%`);
    }

    const [list, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'username',
        'nick_name',
        'email',
        'head_pic',
        'phone_number',
        'is_frozen',
        'is_admin',
        'create_time',
      ],
      skip: skipCount,
      take: pageSize,
      where: condition,
    });

    return {
      list,
      total,
    };
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(`update_user_captcha_${updateUserDto.email}`);

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });

    if (updateUserDto.nick_name) {
      foundUser.nick_name = updateUserDto.nick_name;
    }
    if (updateUserDto.head_pic) {
      foundUser.head_pic = updateUserDto.head_pic;
    }

    try {
      await this.userRepository.save(foundUser);
      this.redisService.del(`update_user_captcha_${updateUserDto.email}`);
      return '用户信息修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '用户信息修改成功';
    }
  }
  
  async updateInfoCaptcha(address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`update_user_captcha_${address}`, code, 10 * 60 * 10);

    await this.emailService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的验证码是 ${code}</p>`,
    });
    return '发送成功';
  }
}
