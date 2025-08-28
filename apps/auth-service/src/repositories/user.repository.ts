import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { IUserCreate, IUserUpdate, IUserFilters } from '@rev/common';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: IUserCreate): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        password: data.password,
        role: data.role as any,
        status: data.status as any,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findBySocialAccount(provider: string, providerId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        socialAccounts: {
          some: {
            provider: provider as any,
            providerId,
          },
        },
      },
    });
  }

  async update(id: string, data: IUserUpdate): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        role: data.role as any,
        status: data.status as any,
      },
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findMany(filters: IUserFilters, skip = 0, take = 10): Promise<User[]> {
    const where: Prisma.UserWhereInput = {};

    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    if (filters.firstName) {
      where.firstName = { contains: filters.firstName, mode: 'insensitive' };
    }

    if (filters.lastName) {
      where.lastName = { contains: filters.lastName, mode: 'insensitive' };
    }

    if (filters.role) {
      where.role = filters.role as any;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.createdAt) {
      where.createdAt = {
        gte: filters.createdAt.start,
        lte: filters.createdAt.end,
      };
    }

    return this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(filters: IUserFilters): Promise<number> {
    const where: Prisma.UserWhereInput = {};

    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    if (filters.firstName) {
      where.firstName = { contains: filters.firstName, mode: 'insensitive' };
    }

    if (filters.lastName) {
      where.lastName = { contains: filters.lastName, mode: 'insensitive' };
    }

    if (filters.role) {
      where.role = filters.role as any;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.createdAt) {
      where.createdAt = {
        gte: filters.createdAt.start,
        lte: filters.createdAt.end,
      };
    }

    return this.prisma.user.count({ where });
  }
}
