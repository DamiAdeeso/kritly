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
  password?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface IUserUpdate {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: UserStatus;
}

export interface IUserFilters {
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}
