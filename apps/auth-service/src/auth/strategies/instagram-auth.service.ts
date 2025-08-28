import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISocialProfile, AuthProvider } from '@rev/common';

@Injectable()
export class InstagramAuthService {
  constructor(private readonly configService: ConfigService) {}

  async verifyToken(accessToken: string): Promise<ISocialProfile> {
    try {
      const response = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Instagram token');
      }

      const data = await response.json();

      // Instagram Basic Display API doesn't provide email by default
      // You would need to request additional permissions or use Instagram Graph API
      return {
        provider: AuthProvider.INSTAGRAM,
        providerId: data.id,
        email: `instagram_${data.id}@example.com`, // Placeholder email
        firstName: data.username || '',
        lastName: '',
        avatar: undefined, // Instagram doesn't provide avatar URLs in basic API
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to verify Instagram token');
    }
  }
}
