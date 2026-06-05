import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthData, AuthProvider, SocialLoginRequest } from '@kritly/common';

export type OAuthWebProvider =
  | AuthProvider.GOOGLE
  | AuthProvider.FACEBOOK
  | AuthProvider.APPLE
  | AuthProvider.INSTAGRAM;

interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
}

interface OAuthExchangeEntry {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  expiresAt: number;
}

const EXCHANGE_CODE_TTL_MS = 60_000;

@Injectable()
export class OAuthService {
  private readonly exchangeCodes = new Map<string, OAuthExchangeEntry>();
  parseProvider(provider: string): OAuthWebProvider {
    const normalized = provider.trim().toLowerCase();
    switch (normalized) {
      case AuthProvider.GOOGLE:
      case AuthProvider.FACEBOOK:
      case AuthProvider.APPLE:
      case AuthProvider.INSTAGRAM:
        return normalized;
      default:
        throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
  }

  buildCallbackUrl(provider: OAuthWebProvider): string {
    const base = process.env.GATEWAY_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    return `${base.replace(/\/$/, '')}/api/auth/oauth/${provider}/callback`;
  }

  createState(provider: OAuthWebProvider): string {
    const payload = Buffer.from(
      JSON.stringify({
        provider,
        nonce: randomBytes(16).toString('hex'),
        exp: Date.now() + 10 * 60 * 1000,
      }),
    ).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }

  verifyState(state: string, expectedProvider: OAuthWebProvider): void {
    const [payload, signature] = state.split('.');
    if (!payload || !signature) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const expectedSignature = this.sign(payload);
    if (
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      provider: OAuthWebProvider;
      exp: number;
    };

    if (parsed.provider !== expectedProvider) {
      throw new UnauthorizedException('OAuth provider mismatch');
    }

    if (parsed.exp < Date.now()) {
      throw new UnauthorizedException('OAuth state expired');
    }
  }

  getAuthorizationUrl(provider: OAuthWebProvider, state: string): string {
    const config = this.getProviderConfig(provider);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: this.buildCallbackUrl(provider),
      response_type: 'code',
      state,
      scope: config.scopes.join(' '),
    });

    if (provider === AuthProvider.APPLE) {
      params.set('response_mode', 'form_post');
    }

    if (provider === AuthProvider.GOOGLE) {
      params.set('access_type', 'offline');
      params.set('prompt', 'select_account');
    }

    return `${config.authorizeUrl}?${params.toString()}`;
  }

  async buildSocialLoginRequest(
    provider: OAuthWebProvider,
    authorizationCode: string,
  ): Promise<SocialLoginRequest> {
    if (provider === AuthProvider.APPLE) {
      return {
        provider,
        authorizationCode,
      };
    }

    const tokenResponse = await this.exchangeAuthorizationCode(provider, authorizationCode);

    if (provider === AuthProvider.GOOGLE) {
      if (!tokenResponse.id_token) {
        throw new BadRequestException('Google did not return an ID token');
      }

      return {
        provider,
        idToken: tokenResponse.id_token,
      };
    }

    if (!tokenResponse.access_token) {
      throw new BadRequestException('Provider did not return an access token');
    }

    return {
      provider,
      accessToken: tokenResponse.access_token,
    };
  }

  /** Redirect with a one-time exchange code — tokens are not placed in the URL. */
  buildSuccessRedirect(accessToken: string, refreshToken: string, userId: string, email: string): string {
    const code = this.createExchangeCode({ accessToken, refreshToken, userId, email });
    const base = process.env.OAUTH_SUCCESS_REDIRECT_URL ?? 'http://localhost:3000/auth/callback';
    return `${base.replace(/\/$/, '')}?code=${encodeURIComponent(code)}`;
  }

  buildFailureRedirect(message: string): string {
    const base =
      process.env.OAUTH_FAILURE_REDIRECT_URL ??
      process.env.OAUTH_SUCCESS_REDIRECT_URL ??
      'http://localhost:3000/auth/callback';
    return `${base.replace(/\/$/, '')}?error=${encodeURIComponent(message)}`;
  }

  /** Exchange a one-time OAuth code for session tokens (single use, short TTL). */
  consumeExchangeCode(code: string): AuthData | null {
    const entry = this.exchangeCodes.get(code);
    if (!entry) {
      return null;
    }

    this.exchangeCodes.delete(code);
    if (entry.expiresAt < Date.now()) {
      return null;
    }

    return {
      accessToken: entry.accessToken,
      refreshToken: entry.refreshToken,
      userId: entry.userId,
      email: entry.email,
    };
  }

  private createExchangeCode(tokens: Omit<OAuthExchangeEntry, 'expiresAt'>): string {
    this.pruneExpiredExchangeCodes();
    const code = randomBytes(32).toString('hex');
    this.exchangeCodes.set(code, { ...tokens, expiresAt: Date.now() + EXCHANGE_CODE_TTL_MS });
    return code;
  }

  private pruneExpiredExchangeCodes(): void {
    const now = Date.now();
    for (const [code, entry] of this.exchangeCodes) {
      if (entry.expiresAt < now) {
        this.exchangeCodes.delete(code);
      }
    }
  }

  private async exchangeAuthorizationCode(
    provider: OAuthWebProvider,
    code: string,
  ): Promise<{ access_token?: string; id_token?: string }> {
    const config = this.getProviderConfig(provider);
    const redirectUri = this.buildCallbackUrl(provider);

    if (provider === AuthProvider.FACEBOOK || provider === AuthProvider.INSTAGRAM) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        code,
      });
      const response = await fetch(`${config.tokenUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new UnauthorizedException('Failed to exchange OAuth authorization code');
      }

      return (await response.json()) as { access_token?: string };
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to exchange OAuth authorization code');
    }

    return (await response.json()) as { access_token?: string; id_token?: string };
  }

  private getProviderConfig(provider: OAuthWebProvider): OAuthProviderConfig {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return {
          clientId: this.requireEnv('GOOGLE_CLIENT_ID'),
          clientSecret: this.requireEnv('GOOGLE_CLIENT_SECRET'),
          authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          scopes: ['openid', 'email', 'profile'],
        };
      case AuthProvider.FACEBOOK:
        return {
          clientId: this.requireEnv('FACEBOOK_CLIENT_ID'),
          clientSecret: this.requireEnv('FACEBOOK_CLIENT_SECRET'),
          authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
          tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
          scopes: ['email', 'public_profile'],
        };
      case AuthProvider.APPLE:
        return {
          clientId: this.requireEnv('APPLE_CLIENT_ID'),
          clientSecret: this.requireEnv('APPLE_CLIENT_SECRET'),
          authorizeUrl: 'https://appleid.apple.com/auth/authorize',
          tokenUrl: 'https://appleid.apple.com/auth/token',
          scopes: ['name', 'email'],
        };
      case AuthProvider.INSTAGRAM:
        return {
          clientId: this.requireEnv('INSTAGRAM_CLIENT_ID'),
          clientSecret: this.requireEnv('INSTAGRAM_CLIENT_SECRET'),
          authorizeUrl: 'https://api.instagram.com/oauth/authorize',
          tokenUrl: 'https://graph.instagram.com/access_token',
          scopes: ['user_profile'],
        };
      default: {
        const _exhaustive: never = provider;
        throw new BadRequestException(`Unsupported OAuth provider: ${String(_exhaustive)}`);
      }
    }
  }

  private requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
      throw new BadRequestException(`${name} is not configured`);
    }

    return value;
  }

  private sign(payload: string): string {
    const secret =
      process.env.OAUTH_STATE_SECRET ??
      process.env.JWT_SECRET ??
      'dev-oauth-state-secret';

    return createHmac('sha256', secret).update(payload).digest('base64url');
  }
}
