import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, JwtUser } from './jwt-user.interface';

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  extractBearerToken(authHeader: string | undefined): string | undefined {
    if (!authHeader?.startsWith('Bearer ')) {
      return undefined;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    return token || undefined;
  }

  verifyAccessToken(token: string): JwtUser {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return this.toUser(payload);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  verifyFromAuthHeader(authHeader: string | undefined): JwtUser {
    const token = this.extractBearerToken(authHeader);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    return this.verifyAccessToken(token);
  }

  tryVerifyFromAuthHeader(authHeader: string | undefined): JwtUser | undefined {
    const token = this.extractBearerToken(authHeader);
    if (!token) {
      return undefined;
    }

    try {
      return this.verifyAccessToken(token);
    } catch {
      return undefined;
    }
  }

  private toUser(payload: JwtPayload): JwtUser {
    return {
      userId: String(payload.sub ?? ''),
      email: String(payload.email ?? ''),
      role: String(payload.role ?? ''),
    };
  }
}
