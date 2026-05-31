import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { ISocialProfile, AuthProvider } from '@kritly/common';

@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  async verifyIdToken(idToken: string): Promise<ISocialProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      return {
        provider: AuthProvider.GOOGLE,
        providerId: payload.sub,
        email: payload.email!,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        avatar: payload.picture,
      };
    } catch {
      throw new UnauthorizedException('Failed to verify Google ID token');
    }
  }
}
