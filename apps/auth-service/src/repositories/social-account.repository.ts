import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocialAccount } from '@prisma/client';

@Injectable()
export class SocialAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    provider: string;
    providerId: string;
    userId: string;
  }): Promise<SocialAccount> {
    return this.prisma.socialAccount.create({
      data: {
        provider: data.provider as any,
        providerId: data.providerId,
        userId: data.userId,
      },
    });
  }

  async findByProviderAndId(provider: string, providerId: string): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findFirst({
      where: {
        provider: provider as any,
        providerId,
      },
    });
  }

  async findByUserId(userId: string): Promise<SocialAccount[]> {
    return this.prisma.socialAccount.findMany({
      where: { userId },
    });
  }

  async delete(id: string): Promise<SocialAccount> {
    return this.prisma.socialAccount.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.socialAccount.deleteMany({
      where: { userId },
    });
  }
}
