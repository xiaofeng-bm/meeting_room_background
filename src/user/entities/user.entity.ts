import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
    comment: '用户名',
    unique: true // 唯一索引
  })
  username: string;

  @Column({
    length: 50,
    comment: '密码',
  })
  password: string;

  @Column({
    length: 50,
    comment: '昵称',
  })
  nick_name: string;

  @Column({
    length: 50,
    comment: '邮箱',
  })
  email: string;

  @Column({
    length: 100,
    comment: '头像',
    nullable: true,
  })
  head_pic: string;

  @Column({
    length: 20,
    comment: '手机号',
    nullable: true,
  })
  phone_number: string;

  @Column({
    comment: '是否冻结',
    default: false,
  })
  is_frozen: boolean;

  @Column({
    comment: '是否管理员',
    default: false,
  })
  is_admin: boolean;

  @Column('bigint', {
    comment: '创建时间',
  })
  create_time: string;

  @Column('bigint', {
    comment: '更新时间',
    nullable: true
  })
  update_time: number;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
  })
  roles: Role[];
}
