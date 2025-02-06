import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
  name: 'meeting_room'
})
export class MeetingRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
    comment: '会议室名称'
  })
  name: string;

  @Column({
    comment: '会议室容量'
  })
  capacity: number;

  @Column({
    length: 50,
    comment: '会议室位置'
  })
  location: string;

  @Column({
    length: 50,
    comment: '设备'
  })
  equipment: string;

  @Column({
    length: 100,
    comment: '描述',
    default: ''
  })
  description: string;

  @Column({
    comment: '是否被预定',
    default: false
  })
  is_booked: boolean;

  @CreateDateColumn({
    comment: '创建时间'
  })
  create_time: Date;

  @CreateDateColumn({
    comment: '更新时间'
  })
  update_time: Date;
}