
interface UserInfo {
  id: number;
  username: string;
  nick_name: string;
  email: string;
  head_pic: string;

  phone_number: string;
  is_frozen: boolean;
  is_admin: boolean;
  create_time: number;
  roles: string[];
  permissions: string[];
}

export class LoginUserVo {
  userInfo: UserInfo;
  accessToken: string;
  refreshToken: string;
}