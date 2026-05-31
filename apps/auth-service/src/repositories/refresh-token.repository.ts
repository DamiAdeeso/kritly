import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany({
      where: { userId },
    });
  }

  async delete(token: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.delete({
      where: { token },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
