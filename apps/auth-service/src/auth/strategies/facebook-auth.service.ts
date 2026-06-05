import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ISocialProfile, AuthProvider, formatDisplayName } from '@kritly/common';

@Injectable()
export class FacebookAuthService {
  async verifyAccessToken(accessToken: string): Promise<ISocialProfile> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${accessToken}`,
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Facebook token');
      }

      const data = (await response.json()) as {
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
        displayName: formatDisplayName(data.first_name, data.last_name),
        avatar: data.picture?.data?.url,
      };
    } catch {
      throw new UnauthorizedException('Failed to verify Facebook access token');
    }
  }
}
