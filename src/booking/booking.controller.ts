import { Body, Controller, DefaultValuePipe, Get, Param, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { RequireLogin, UserInfo } from 'src/aop/custom.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('list')
  async getList(
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query("pageSize", new DefaultValuePipe(10)) pageSize: number,
    @Query('username') username: string,
    @Query('meetingName') meetingName: string,
    @Query("bookingTimeRangeStart") bookingTimeRangeStart: string,
    @Query("bookingTimeRangeEnd") bookingTimeRangeEnd: string,
    @Query('bookingRoomPosition') bookingRoomPosition: string,
  ) {
    return this.bookingService.list(page, pageSize, username, meetingName, bookingTimeRangeStart, bookingTimeRangeEnd, bookingRoomPosition);
  }

  @Post('add')
  @RequireLogin()
  async add(@Body() booking: CreateBookingDto, @UserInfo('userId') userId: number) {
    return await this.bookingService.add(booking, userId);
  }

  @Get('apply')
  async apply(@Query('id') id: number, @Query('status') status: string) {
    return await this.bookingService.apply(id, status);
  }

  @Get('urge/:id')
  async urge(@Param('id') id: number) {
    return await this.bookingService.urge(id);
  }
}
