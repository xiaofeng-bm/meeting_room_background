import { Controller, DefaultValuePipe, Get, Query } from '@nestjs/common';
import { MeetingRoomService } from './meeting_room.service';
import { generateParseIntPipe } from 'src/utils';

@Controller('meeting-room')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  @Get('list')
  async list(
    @Query('page', new DefaultValuePipe(1), generateParseIntPipe('page')) page: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
  ) { 
    return await this.meetingRoomService.find(page, pageSize)
  }
}
