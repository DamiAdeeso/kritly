import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '@kritly/common';
import { OAuthService } from './oauth.service';

describe('OAuthService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      FACEBOOK_CLIENT_ID: 'facebook-client-id',
      FACEBOOK_CLIENT_SECRET: 'facebook-client-secret',
      APPLE_CLIENT_ID: 'apple-client-id',
      APPLE_CLIENT_SECRET: 'apple-client-secret',
      INSTAGRAM_CLIENT_ID: 'instagram-client-id',
      INSTAGRAM_CLIENT_SECRET: 'instagram-client-secret',
      OAUTH_STATE_SECRET: 'test-state-secret',
      GATEWAY_PUBLIC_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('parses supported providers', () => {
    const service = new OAuthService();

    expect(service.parseProvider('google')).toBe(AuthProvider.GOOGLE);
    expect(service.parseProvider('APPLE')).toBe(AuthProvider.APPLE);
  });

  it('rejects unsupported providers', () => {
    const service = new OAuthService();

    expect(() => service.parseProvider('twitter')).toThrow(
      new BadRequestException('Unsupported OAuth provider: twitter'),
    );
  });

  it('creates and verifies signed state', () => {
    const service = new OAuthService();
    const state = service.createState(AuthProvider.GOOGLE);

    expect(() => service.verifyState(state, AuthProvider.GOOGLE)).not.toThrow();
  });

  it('rejects tampered state signatures', () => {
    const service = new OAuthService();
    const state = service.createState(AuthProvider.GOOGLE);
    const tampered = `${state}x`;

    expect(() => service.verifyState(tampered, AuthProvider.GOOGLE)).toThrow(
      new UnauthorizedException('Invalid OAuth state'),
    );
  });

  it('rejects expired state', () => {
    const service = new OAuthService();
    const payload = Buffer.from(
      JSON.stringify({
        provider: AuthProvider.GOOGLE,
        nonce: 'abc',
        exp: Date.now() - 1_000,
      }),
    ).toString('base64url');
    const signature = (service as unknown as { sign: (value: string) => string }).sign(payload);
    const expiredState = `${payload}.${signature}`;

    expect(() => service.verifyState(expiredState, AuthProvider.GOOGLE)).toThrow(
      new UnauthorizedException('OAuth state expired'),
    );
  });

  it('builds provider authorization URLs', () => {
    const service = new OAuthService();
    const url = service.getAuthorizationUrl(AuthProvider.APPLE, 'signed-state');

    expect(url).toContain('appleid.apple.com');
    expect(url).toContain('response_mode=form_post');
  });

  it('builds Apple social login request without token exchange', async () => {
    const service = new OAuthService();

    await expect(service.buildSocialLoginRequest(AuthProvider.APPLE, 'apple-code')).resolves.toEqual({
      provider: AuthProvider.APPLE,
      authorizationCode: 'apple-code',
    });
  });

  it('builds Google social login request from token exchange', async () => {
    const service = new OAuthService();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ id_token: 'google-id-token' }),
    } as Response);

    await expect(service.buildSocialLoginRequest(AuthProvider.GOOGLE, 'google-code')).resolves.toEqual({
      provider: AuthProvider.GOOGLE,
      idToken: 'google-id-token',
    });
  });

  it('rejects token exchange failures', async () => {
    const service = new OAuthService();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(service.buildSocialLoginRequest(AuthProvider.GOOGLE, 'google-code')).rejects.toThrow(
      new UnauthorizedException('Failed to exchange OAuth authorization code'),
    );
  });

  it('builds success and failure redirects', () => {
    const service = new OAuthService();

    const successUrl = service.buildSuccessRedirect('a', 'r', 'user-1', 'user@example.com');
    expect(successUrl).toContain('?code=');
    expect(successUrl).not.toContain('accessToken');

    const code = new URL(successUrl).searchParams.get('code');
    expect(code).toBeTruthy();
    expect(service.consumeExchangeCode(code!)).toEqual({
      accessToken: 'a',
      refreshToken: 'r',
      userId: 'user-1',
      email: 'user@example.com',
    });
    expect(service.consumeExchangeCode(code!)).toBeNull();

    process.env.OAUTH_FAILURE_REDIRECT_URL = 'http://localhost:3000/auth/error';
    expect(service.buildFailureRedirect('OAuth failed')).toContain('error=OAuth%20failed');
    expect(service.buildFailureRedirect('OAuth failed')).toContain('/auth/error');
  });
});
