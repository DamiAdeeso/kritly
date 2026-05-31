import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, User } from '@prisma/client';
import { IUserCreate } from '@kritly/common';

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: IUserCreate): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        avatar: data.avatar,
        password: data.password,
        role: data.role as unknown as User['role'],
        status: data.status as unknown as User['status'],
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findBySocialAccount(provider: AuthProvider, providerId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        socialAccounts: {
          some: { provider, providerId },
        },
      },
    });
  }

  async updatePassword(id: string, password: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { password },
    });
  }
}
