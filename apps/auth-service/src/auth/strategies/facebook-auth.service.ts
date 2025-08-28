import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISocialProfile, AuthProvider } from '@rev/common';

@Injectable()
export class FacebookAuthService {
  constructor(private readonly configService: ConfigService) {}

  async verifyToken(accessToken: string): Promise<ISocialProfile> {
    try {
      // Call Facebook Graph API to verify token and get user info
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Facebook token');
      }

      const data = await response.json() as {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        picture?: {
          data?: {
            url: string;
          };
        };
      };

      return {
        provider: AuthProvider.FACEBOOK,
        providerId: data.id,
        email: data.email,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        avatar: data.picture?.data?.url,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to verify Facebook token');
    }
  }
}
