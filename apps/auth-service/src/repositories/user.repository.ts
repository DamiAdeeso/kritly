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
        role: data.role,
        status: data.status,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        socialAccounts: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        socialAccounts: true,
      },
    });
  }

  async findBySocialProvider(provider: string, providerId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        socialAccounts: {
          some: {
            provider: provider as any,
            providerId,
          },
        },
      },
      include: {
        socialAccounts: true,
      },
    });
  }

  async update(id: string, data: IUserUpdate): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
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

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdAt) {
      where.createdAt = {};
      if (filters.createdAt.gte) {
        where.createdAt.gte = filters.createdAt.gte;
      }
      if (filters.createdAt.lte) {
        where.createdAt.lte = filters.createdAt.lte;
      }
    }

    return this.prisma.user.findMany({
      where,
      skip,
      take,
      include: {
        socialAccounts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(filters: IUserFilters): Promise<number> {
    const where: Prisma.UserWhereInput = {};

    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdAt) {
      where.createdAt = {};
      if (filters.createdAt.gte) {
        where.createdAt.gte = filters.createdAt.gte;
      }
      if (filters.createdAt.lte) {
        where.createdAt.lte = filters.createdAt.lte;
      }
    }

    return this.prisma.user.count({ where });
  }
}
