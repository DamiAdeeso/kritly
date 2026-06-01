import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { AccountRepository } from '../repositories/account.repository';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async issueTokensForUser(userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
  }> {
    const user = await this.accountRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      ...tokens,
      userId: user.id,
      email: user.email,
    };
  }

  async generateTokens(userId: string, email: string, role: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
