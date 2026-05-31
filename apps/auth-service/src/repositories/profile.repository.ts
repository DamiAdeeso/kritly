import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { IProfileUpdate } from '@kritly/common';

export type ProfileUsernameContext = {
  id: string;
  email: string;
  username: string | null;
  usernameChangedAt: Date | null;
};

export type PublicProfileRecord = {
  userId: string;
  username: string | null;
  firstName: string;
  lastName: string;
  avatar: string | null;
  email?: string;
};

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findForUsernameUpdate(id: string): Promise<ProfileUsernameContext | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        usernameChangedAt: true,
      },
    });
  }

  async findProfileById(userId: string, includeEmail = false): Promise<PublicProfileRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        ...(includeEmail ? { email: true } : {}),
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      ...(includeEmail ? { email: user.email } : {}),
    };
  }

  async findProfileByUsername(username: string): Promise<PublicProfileRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
    };
  }

  async updateProfile(id: string, data: IProfileUpdate): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        usernameChangedAt: data.usernameChangedAt,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        dateOfBirth: data.dateOfBirth,
      },
    });
  }
}
