import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingRoom } from './entities/meeting_room.entity';
import { Like, Repository } from 'typeorm';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private repository: Repository<MeetingRoom>;

  initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    this.repository.insert([room1, room2, room3]);
  }

  async find(page: number, pageSize: number, name: string, location: string) {
    if (page < 1) {
      throw new BadRequestException('page 必须大于 1');
    }

    const condition: Record<string, any> = {};

    if(name) {
      condition.name = Like(`%${name}%`);
    }
    if(location) {
      condition.location = Like(`%${location}%`);
    }
    const skipCount = (page - 1) * pageSize;
    const [list, total] = await this.repository.findAndCount({
      skip: skipCount,
      take: pageSize,
      where: condition
    });

    return {
      list,
      total,
    };
  }

  async create(createData: CreateMeetingRoomDto) {
    const room = await this.repository.findOneBy({
      name: createData.name,
    });
    if (room) {
      throw new BadRequestException('该会议室已存在');
    }

    return await this.repository.insert(createData);
  }

  async update(meetingRoomDto: UpdateMeetingRoomDto) {
    const room = await this.repository.findOneBy({
      id: meetingRoomDto.id,
    });

    if (!room) {
      throw new BadRequestException('会议室不存在');
    }

    room.name = meetingRoomDto.name;
    room.capacity = meetingRoomDto.capacity;
    room.location = meetingRoomDto.location;

    if (meetingRoomDto.description) {
      room.description = meetingRoomDto.description;
    }

    if (meetingRoomDto.equipment) {
      room.equipment = meetingRoomDto.equipment;
    }

    await this.repository.update(
      {
        id: meetingRoomDto.id,
      },
      room,
    );
    return 'success';
  }

  async findById(id: number) {
    return await this.repository.findOneBy({
      id,
    });
  }

  async delete(id: number) {
    const room = await this.repository.findOneBy({ id });
    if (!room) {
      throw new BadRequestException('该会议室不存在');
    }

    await this.repository.delete({ id });

    return 'success';
  }
}
