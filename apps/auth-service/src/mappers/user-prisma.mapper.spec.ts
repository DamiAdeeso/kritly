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
    it('omits display name and role/status for email signup', () => {
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
      expect(input).not.toHaveProperty('displayName');
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

    it('includes social profile display name when present', () => {
      const input = toPrismaCreateUserInput({
        email: 'social@example.com',
        displayName: 'Jane Doe',
      });

      expect(input.displayName).toBe('Jane Doe');
    });

    it('skips empty display name strings', () => {
      const input = toPrismaCreateUserInput({
        email: 'social@example.com',
        displayName: '   ',
      });

      expect(input).not.toHaveProperty('displayName');
    });
  });
});
