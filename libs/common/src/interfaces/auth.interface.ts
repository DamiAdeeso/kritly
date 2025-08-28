import { AuthProvider, UserRole, UserStatus } from '../enums/auth.enum';

export interface IUser {
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

export interface IAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ISocialProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface IAuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  provider?: AuthProvider;
}

export interface IRefreshTokenPayload {
  userId: string;
  tokenId: string;
}
