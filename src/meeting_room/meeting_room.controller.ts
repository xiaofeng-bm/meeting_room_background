import { Controller, DefaultValuePipe, Get, Query, Post, Body, Param, Delete } from '@nestjs/common';
import { MeetingRoomService } from './meeting_room.service';
import { generateParseIntPipe } from 'src/utils';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';

@Controller('meeting-room')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  @Get('list')
  async list(
    @Query('page', new DefaultValuePipe(1), generateParseIntPipe('page')) page: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('name') name: string,
    @Query("location") location: string
  ) { 
    return await this.meetingRoomService.find(page, pageSize, name, location);
  }

  @Post('create')
  async create(@Body() createData: CreateMeetingRoomDto) {
    return await this.meetingRoomService.create(createData);
  }

  @Post('update')
  async update(@Body() meetingRoomDto: UpdateMeetingRoomDto) {
    return await this.meetingRoomService.update(meetingRoomDto)
  }

  @Get(':id')
  async find(@Param('id') id: number) {
    return await this.meetingRoomService.findById(id)
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: number) {
    return await this.meetingRoomService.delete(id)
  }
}
