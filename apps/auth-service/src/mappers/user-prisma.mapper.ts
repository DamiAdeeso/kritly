import { Prisma, User } from '@prisma/client';
import { IUserCreate, UserRole, UserStatus } from '@kritly/common';

const COMMON_TO_PRISMA_ROLE: Record<UserRole, User['role']> = {
  [UserRole.USER]: 'USER',
  [UserRole.ADMIN]: 'ADMIN',
  [UserRole.MODERATOR]: 'MODERATOR',
};

const COMMON_TO_PRISMA_STATUS: Record<UserStatus, User['status']> = {
  [UserStatus.ACTIVE]: 'ACTIVE',
  [UserStatus.INACTIVE]: 'INACTIVE',
  [UserStatus.SUSPENDED]: 'SUSPENDED',
  [UserStatus.PENDING]: 'PENDING',
};

const PRISMA_TO_COMMON_ROLE: Record<User['role'], UserRole> = {
  USER: UserRole.USER,
  ADMIN: UserRole.ADMIN,
  MODERATOR: UserRole.MODERATOR,
};

const PRISMA_TO_COMMON_STATUS: Record<User['status'], UserStatus> = {
  ACTIVE: UserStatus.ACTIVE,
  INACTIVE: UserStatus.INACTIVE,
  SUSPENDED: UserStatus.SUSPENDED,
  PENDING: UserStatus.PENDING,
};

export function toPrismaUserRole(role?: UserRole): User['role'] | undefined {
  if (role === undefined) {
    return undefined;
  }
  return COMMON_TO_PRISMA_ROLE[role];
}

export function toPrismaUserStatus(status?: UserStatus): User['status'] | undefined {
  if (status === undefined) {
    return undefined;
  }
  return COMMON_TO_PRISMA_STATUS[status];
}

export function fromPrismaUserRole(role: User['role']): UserRole {
  return PRISMA_TO_COMMON_ROLE[role];
}

export function fromPrismaUserStatus(status: User['status']): UserStatus {
  return PRISMA_TO_COMMON_STATUS[status];
}

/** Maps domain create input to a Prisma create payload (omits unset optional fields). */
export function toPrismaCreateUserInput(data: IUserCreate): Prisma.UserUncheckedCreateInput {
  const input: Prisma.UserUncheckedCreateInput = {
    email: data.email,
  };

  if (data.username !== undefined) {
    input.username = data.username;
  }
  if (data.dateOfBirth !== undefined) {
    input.dateOfBirth = data.dateOfBirth;
  }
  if (data.avatar !== undefined) {
    input.avatar = data.avatar;
  }
  if (data.password !== undefined) {
    input.password = data.password;
  }
  if (data.displayName?.trim()) {
    input.displayName = data.displayName.trim();
  }

  const role = toPrismaUserRole(data.role);
  if (role !== undefined) {
    input.role = role;
  }

  const status = toPrismaUserStatus(data.status);
  if (status !== undefined) {
    input.status = status;
  }

  return input;
}
