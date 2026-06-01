import { UserRole, UserStatus } from '../enums/auth.enum';

export interface IUserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  avatar?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface IProfileUpdate {
  username?: string;
  usernameChangedAt?: Date;
  firstName?: string;
  lastName?: string;
  bio?: string | null;
  avatar?: string;
}

export interface IUserUpdate extends IProfileUpdate {
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface IUserFilters {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  createdAt?: {
    start?: Date;
    end?: Date;
  };
}
