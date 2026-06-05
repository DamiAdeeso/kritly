import { UserRole, UserStatus } from '../enums/auth.enum';

export interface IUserCreate {
  email: string;
  username?: string;
  displayName?: string;
  dateOfBirth?: Date;
  avatar?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface IProfileUpdate {
  username?: string;
  usernameChangedAt?: Date;
  displayName?: string;
  bio?: string | null;
  avatar?: string;
}
