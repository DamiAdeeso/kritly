import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocialAccount, AuthProvider } from '@prisma/client';

@Injectable()
export class SocialAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    provider: AuthProvider;
    providerId: string;
    userId: string;
  }): Promise<SocialAccount> {
    return this.prisma.socialAccount.create({
      data,
    });
  }

  async findByProviderAndId(provider: AuthProvider, providerId: string): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        user: true,
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

  async deleteByProviderAndId(provider: AuthProvider, providerId: string): Promise<SocialAccount> {
    return this.prisma.socialAccount.delete({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
  }
}
