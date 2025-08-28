import { UserRole, UserStatus } from '../enums/auth.enum';

export interface IUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface IUserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
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
