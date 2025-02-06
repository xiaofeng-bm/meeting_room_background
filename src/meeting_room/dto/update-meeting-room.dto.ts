import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';
import { CreateMeetingRoomDto } from './create-meeting-room.dto';

export class UpdateMeetingRoomDto extends PartialType(CreateMeetingRoomDto) {
  @ApiProperty()
  @IsNotEmpty({
    message: 'id 不能为空',
  })
  id: number;
}