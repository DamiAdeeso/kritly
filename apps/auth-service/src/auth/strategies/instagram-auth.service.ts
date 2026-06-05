import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ISocialProfile, AuthProvider } from '@kritly/common';

@Injectable()
export class InstagramAuthService {
  async verifyAccessToken(accessToken: string): Promise<ISocialProfile> {
    try {
      const response = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`,
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Instagram token');
      }

      const data = (await response.json()) as {
        id: string;
        username: string;
      };

      return {
        provider: AuthProvider.INSTAGRAM,
        providerId: data.id,
        email: `instagram_${data.id}@example.com`,
        displayName: data.username || undefined,
        avatar: undefined,
      };
    } catch {
      throw new UnauthorizedException('Failed to verify Instagram access token');
    }
  }
}
