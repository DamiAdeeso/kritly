import { createPublicKey, verify as cryptoVerify, type JsonWebKey } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISocialProfile, AuthProvider } from '@kritly/common';

interface AppleIdTokenPayload {
  sub?: string;
  email?: string;
  iss?: string;
  aud?: string;
  exp?: number;
}

interface AppleJwk {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n?: string;
  e?: string;
}

@Injectable()
export class AppleAuthService {
  private jwksCache: { keys: AppleJwk[]; fetchedAt: number } | null = null;

  constructor(private readonly configService: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<ISocialProfile> {
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID') ?? '';
    const payload = await this.verifyAppleJwt(idToken, clientId);

    return {
      provider: AuthProvider.APPLE,
      providerId: payload.sub ?? '',
      email: payload.email ?? '',
      firstName: '',
      lastName: '',
    };
  }

  async exchangeAuthorizationCode(authorizationCode: string): Promise<ISocialProfile> {
    try {
      const response = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.configService.get<string>('APPLE_CLIENT_ID') ?? '',
          client_secret: this.configService.get<string>('APPLE_CLIENT_SECRET') ?? '',
          code: authorizationCode,
          grant_type: 'authorization_code',
          redirect_uri:
            this.configService.get<string>('APPLE_CALLBACK_URL') ??
            `${process.env.GATEWAY_PUBLIC_URL ?? 'http://localhost:3000'}/api/auth/oauth/apple/callback`,
        }),
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Apple authorization code');
      }

      const data = (await response.json()) as {
        id_token?: string;
      };

      if (!data.id_token) {
        throw new UnauthorizedException('Apple did not return an ID token');
      }

      return this.verifyIdToken(data.id_token);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Failed to exchange Apple authorization code');
    }
  }

  private async verifyAppleJwt(idToken: string, audience: string): Promise<AppleIdTokenPayload> {
    const segments = idToken.split('.');
    if (segments.length !== 3) {
      throw new UnauthorizedException('Invalid Apple ID token');
    }

    const [headerSegment, payloadSegment, signatureSegment] = segments;
    const header = this.decodeJson<{ kid?: string; alg?: string }>(headerSegment);
    const payload = this.decodeJson<AppleIdTokenPayload>(payloadSegment);

    if (payload.iss !== 'https://appleid.apple.com') {
      throw new UnauthorizedException('Invalid Apple ID token issuer');
    }

    if (payload.aud !== audience) {
      throw new UnauthorizedException('Invalid Apple ID token audience');
    }

    if (!payload.exp || payload.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('Apple ID token expired');
    }

    const jwk = await this.findAppleJwk(header.kid);
    const publicKey = createPublicKey({ key: jwk as unknown as JsonWebKey, format: 'jwk' });
    const signedData = Buffer.from(`${headerSegment}.${payloadSegment}`);
    const signature = this.base64UrlDecode(signatureSegment);

    const isValid = cryptoVerify(
      header.alg === 'RS256' ? 'RSA-SHA256' : 'RSA-SHA256',
      signedData,
      publicKey,
      signature,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid Apple ID token signature');
    }

    return payload;
  }

  private async findAppleJwk(kid?: string): Promise<AppleJwk> {
    const now = Date.now();
    if (!this.jwksCache || now - this.jwksCache.fetchedAt > 60 * 60 * 1000) {
      const response = await fetch('https://appleid.apple.com/auth/keys');
      if (!response.ok) {
        throw new UnauthorizedException('Unable to fetch Apple public keys');
      }

      const data = (await response.json()) as { keys: AppleJwk[] };
      this.jwksCache = { keys: data.keys, fetchedAt: now };
    }

    const jwk = this.jwksCache.keys.find((key) => key.kid === kid);
    if (!jwk) {
      throw new UnauthorizedException('Apple signing key not found');
    }

    return jwk;
  }

  private decodeJson<T>(segment: string): T {
    return JSON.parse(this.base64UrlDecode(segment).toString('utf8')) as T;
  }

  private base64UrlDecode(value: string): Buffer {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(normalized + padding, 'base64');
  }
}
