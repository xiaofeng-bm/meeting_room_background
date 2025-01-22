import { Injectable, Inject, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { RedisService } from 'src/redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { md5 } from 'src/utils';
import { EmailService } from 'src/email/email.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

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
}
