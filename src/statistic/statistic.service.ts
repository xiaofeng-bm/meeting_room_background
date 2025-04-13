import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Booking } from 'src/booking/entities/booking.entity';
import { User } from 'src/user/entities/user.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class StatisticService {
  @InjectEntityManager()
  private entityManager: EntityManager;

  async userBookingCount() {
    const res = await this.entityManager
      .createQueryBuilder(Booking, 'b')
      .select('u.id', '用户id')
      .addSelect('u.username', '用户名')
      .leftJoin(User, 'u', 'b.userId = u.id')
      .addSelect('count(1)', '预定次数')
      .where('b.startTime between :time1 and :time2', {
        time1: '2023-09-24',
        time2: '2023-09-30',
      })
      .addGroupBy('b.user')
      .getRawMany();
    return res;
  }
}
