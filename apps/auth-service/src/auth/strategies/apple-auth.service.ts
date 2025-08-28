import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISocialProfile, AuthProvider } from '@rev/common';

@Injectable()
export class AppleAuthService {
  constructor(private readonly configService: ConfigService) {}

  async verifyToken(accessToken: string): Promise<ISocialProfile> {
    try {
      // Call Apple's token endpoint to verify the token
      const response = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.configService.get('APPLE_CLIENT_ID'),
          client_secret: this.configService.get('APPLE_CLIENT_SECRET'),
          code: accessToken,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Apple token');
      }

      const data = await response.json() as {
        id_token?: string;
        access_token: string;
      };

      // Parse the ID token to get user information
      // In a real implementation, you would verify the JWT signature
      const idTokenPayload = this.parseJwt(data.id_token || '');

      return {
        provider: AuthProvider.APPLE,
        providerId: idTokenPayload.sub || '',
        email: idTokenPayload.email || '',
        firstName: idTokenPayload.name?.firstName || '',
        lastName: idTokenPayload.name?.lastName || '',
        avatar: undefined, // Apple doesn't provide avatar URLs
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to verify Apple token');
    }
  }

  private parseJwt(token: string): any {
    try {
      return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch {
      return {};
    }
  }
}
