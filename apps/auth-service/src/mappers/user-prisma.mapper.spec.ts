import { UserRole, UserStatus } from '@kritly/common';
import {
  fromPrismaUserRole,
  fromPrismaUserStatus,
  toPrismaCreateUserInput,
  toPrismaUserRole,
  toPrismaUserStatus,
} from './user-prisma.mapper';

describe('user-prisma.mapper', () => {
  describe('toPrismaUserRole', () => {
    it('maps common roles to Prisma enum values', () => {
      expect(toPrismaUserRole(UserRole.USER)).toBe('USER');
      expect(toPrismaUserRole(UserRole.ADMIN)).toBe('ADMIN');
      expect(toPrismaUserRole(UserRole.MODERATOR)).toBe('MODERATOR');
    });

    it('returns undefined when role is omitted', () => {
      expect(toPrismaUserRole(undefined)).toBeUndefined();
    });
  });

  describe('toPrismaUserStatus', () => {
    it('maps common statuses to Prisma enum values', () => {
      expect(toPrismaUserStatus(UserStatus.ACTIVE)).toBe('ACTIVE');
      expect(toPrismaUserStatus(UserStatus.PENDING)).toBe('PENDING');
    });

    it('returns undefined when status is omitted', () => {
      expect(toPrismaUserStatus(undefined)).toBeUndefined();
    });
  });

  describe('fromPrismaUserRole', () => {
    it('maps Prisma roles back to common enums', () => {
      expect(fromPrismaUserRole('USER')).toBe(UserRole.USER);
      expect(fromPrismaUserRole('ADMIN')).toBe(UserRole.ADMIN);
    });
  });

  describe('fromPrismaUserStatus', () => {
    it('maps Prisma statuses back to common enums', () => {
      expect(fromPrismaUserStatus('ACTIVE')).toBe(UserStatus.ACTIVE);
      expect(fromPrismaUserStatus('SUSPENDED')).toBe(UserStatus.SUSPENDED);
    });
  });

  describe('toPrismaCreateUserInput', () => {
    it('omits names and role/status for email signup', () => {
      const input = toPrismaCreateUserInput({
        email: 'user@example.com',
        username: 'user123',
        password: 'hashed',
      });

      expect(input).toEqual({
        email: 'user@example.com',
        username: 'user123',
        password: 'hashed',
      });
      expect(input).not.toHaveProperty('firstName');
      expect(input).not.toHaveProperty('lastName');
      expect(input).not.toHaveProperty('role');
      expect(input).not.toHaveProperty('status');
    });

    it('includes mapped role and status when provided', () => {
      const input = toPrismaCreateUserInput({
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.PENDING,
      });

      expect(input.role).toBe('ADMIN');
      expect(input.status).toBe('PENDING');
    });

    it('includes social profile names when present', () => {
      const input = toPrismaCreateUserInput({
        email: 'social@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(input.firstName).toBe('Jane');
      expect(input.lastName).toBe('Doe');
    });

    it('skips empty name strings', () => {
      const input = toPrismaCreateUserInput({
        email: 'social@example.com',
        firstName: '',
        lastName: 'Doe',
      });

      expect(input).not.toHaveProperty('firstName');
      expect(input.lastName).toBe('Doe');
    });
  });
});
