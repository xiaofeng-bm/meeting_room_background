import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';

import { Role } from './user/entities/role.entity';
import { User } from './user/entities/user.entity';
import { Permission } from './user/entities/permission.entity';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { LoginGuard } from './aop/login.guard';
import { PermissionGuard } from './aop/permission.guard';
import { MeetingRoomModule } from './meeting_room/meeting_room.module';
import { MeetingRoom } from './meeting_room/entities/meeting_room.entity';
import { BookingModule } from './booking/booking.module';
import { Booking } from './booking/entities/booking.entity';
import { StatisticModule } from './statistic/statistic.module';
import { WinstonModule, utilities, WinstonLogger, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as winston from 'winston';
import { CustomTypeOrmLogger } from './CustomTypeOrmLogger';
import 'winston-daily-rotate-file';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt_secret'),
        signOptions: {
          expiresIn: '30m',
        },
      }),
      inject: [ConfigService],
    }),
    // mysql 配置
    TypeOrmModule.forRootAsync({
      useFactory(configService: ConfigService, logger: WinstonLogger) {
        return {
          type: 'mysql',
          host: configService.get('mysql_host'),
          port: configService.get('mysql_port'),
          username: configService.get('mysql_username'),
          password: configService.get('mysql_password'),
          database: configService.get('mysql_database'),
          synchronize: true,
          logging: true,
          logger: new CustomTypeOrmLogger(logger),
          entities: [User, Role, Permission, MeetingRoom, Booking],
          poolSize: 10,
          connectorPackage: 'mysql2',
        };
      },
      inject: [ConfigService, WINSTON_MODULE_NEST_PROVIDER],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['src/.env'],
    }),

    WinstonModule.forRootAsync({
      useFactory: () => ({
        level: 'debug',
        transports: [
          // new winston.transports.File({
          //   filename: `${process.cwd()}/log`,
          // }),
          new winston.transports.DailyRotateFile({
            level: 'debug',
            dirname: 'daily-log',
            filename: 'log=%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '10K'
          }),
          new winston.transports.Console({
            format: winston.format.combine(winston.format.timestamp(), utilities.format.nestLike()),
          }),
        ],
      }),
    }),

    UserModule,
    RedisModule,
    EmailModule,
    MeetingRoomModule,
    BookingModule,
    StatisticModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoginGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
