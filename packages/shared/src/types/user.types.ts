export interface UserDto {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
