import { ApiProperty } from '@nestjs/swagger';

class UserInfo {
  @ApiProperty()
  id: number;
  @ApiProperty()
  username: string;
  @ApiProperty()
  nick_name: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  head_pic: string;
  @ApiProperty()
  phone_number: string;
  @ApiProperty()
  is_frozen: boolean;
  @ApiProperty()
  is_admin: boolean;
  @ApiProperty()
  create_time: number;
  @ApiProperty()
  roles: string[];
  @ApiProperty()
  permissions: string[];
}

export class LoginUserVo {
  @ApiProperty()
  userInfo: UserInfo;
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
}
