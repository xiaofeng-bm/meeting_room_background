import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { MeetingRoom } from 'src/meeting_room/entities/meeting_room.entity';
import { User } from 'src/user/entities/user.entity';
import { Between, EntityManager, LessThanOrEqual, Like, MoreThanOrEqual } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class BookingService {
  @InjectEntityManager()
  private entityManager: EntityManager;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(EmailService)
  private emailService: EmailService;

  async initData() {
    const user1 = await this.entityManager.findOneBy(User, {
      id: 1,
    });
    const user2 = await this.entityManager.findOneBy(User, {
      id: 2,
    });

    const room1 = await this.entityManager.findOneBy(MeetingRoom, {
      id: 3,
    });
    const room2 = await await this.entityManager.findOneBy(MeetingRoom, {
      id: 6,
    });

    const booking1 = new Booking();
    booking1.room = room1;
    booking1.user = user1;
    booking1.startTime = new Date();
    booking1.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking1);

    const booking2 = new Booking();
    booking2.room = room2;
    booking2.user = user2;
    booking2.startTime = new Date();
    booking2.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking2);

    const booking3 = new Booking();
    booking3.room = room1;
    booking3.user = user2;
    booking3.startTime = new Date();
    booking3.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking3);

    const booking4 = new Booking();
    booking4.room = room2;
    booking4.user = user1;
    booking4.startTime = new Date();
    booking4.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking4);
  }

  async list(
    page: number,
    pageSize: number,
    username: string,
    meetingName: string,
    bookingTimeRangeStart: string,
    bookingTimeRangeEnd: string,
    bookingRoomPosition: string,
  ) {
    if (page < 1) {
      throw new BadRequestException('page页码不能小于1');
    }

    const skipCount = (page - 1) * pageSize;

    const condition: Record<string, any> = {};
    if (username) {
      condition.user = {
        username: Like(`%${username}%`),
      };
    }
    if (meetingName) {
      condition.room = {
        name: Like(`%${meetingName}%`),
      };
    }

    if (bookingRoomPosition) {
      condition.room = {
        location: Like(`%${bookingRoomPosition}%`),
      };
    }

    if (bookingTimeRangeStart) {
      if (!bookingTimeRangeEnd) {
        bookingTimeRangeEnd = bookingTimeRangeStart + 60 * 60 * 1000;
      }
      condition.startTime = Between(new Date(bookingTimeRangeStart), new Date(bookingTimeRangeEnd));
    }

    const [list, total] = await this.entityManager.findAndCount(Booking, {
      where: condition,
      skip: skipCount,
      take: pageSize,
      relations: {
        user: true,
        room: true,
      },
    });

    return {
      list: list.map((item) => {
        delete item.user.password;
        return item;
      }),
      total,
    };
  }

  async add(bookingDto: CreateBookingDto, userId: number) {
    const meetingRoom = await this.entityManager.findOneBy(MeetingRoom, {
      id: bookingDto.meetingRoomId,
    });

    if (!meetingRoom) {
      throw new BadRequestException('会议室不存在');
    }

    const user = await this.entityManager.findOneBy(User, {
      id: userId,
    });

    const booking = new Booking();
    booking.room = meetingRoom;
    booking.startTime = new Date(bookingDto.startTime);
    booking.endTime = new Date(bookingDto.endTime);
    booking.status = '申请中';
    booking.user = user;
    booking.note = bookingDto.note;

    const res = await this.entityManager.findOneBy(Booking, {
      room: {
        id: meetingRoom.id,
      },
      startTime: LessThanOrEqual(booking.startTime),
      endTime: MoreThanOrEqual(booking.endTime),
    });

    if (res) {
      throw new BadRequestException('该时间段已被预约');
    }

    await this.entityManager.save(Booking, booking);
    return 'success';
  }

  async apply(id: number, status: string) {
    try {
      await this.entityManager.update(Booking, id, {
        status,
      });
      return 'success';
    } catch (error) {
      return error;
    }
  }
  async urge(id: number) {
    const flag = await this.redisService.get(`urge_${id}`);

    if (flag) {
      return '半小时内只能催促一次，请耐心等待';
    }

    let email = await this.redisService.get(`admin_email`);
    if (!email) {
      const admin = await this.entityManager.findOne(User, {
        select: {
          email: true,
        },
        where: {
          is_admin: true,
        },
      });

      email = admin.email;
      this.redisService.set('admin_email', admin.email);
    }

    this.emailService.sendMail({
      to: email,
      subject: '催促管理员审批预定',
      html: `id 为 ${id} 的预定申请正在等待审批`,
    });

    this.redisService.set(`urge_${id}`, 1 * 60 * 30);
  }
}
