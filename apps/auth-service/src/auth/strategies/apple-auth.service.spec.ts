import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppleAuthService } from './apple-auth.service';

describe('AppleAuthService', () => {
  let service: AppleAuthService;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          APPLE_CLIENT_ID: 'apple-client-id',
          APPLE_CLIENT_SECRET: 'apple-client-secret',
          APPLE_CALLBACK_URL: 'http://localhost:3000/api/auth/oauth/apple/callback',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    service = new AppleAuthService(configService);
  });

  it('rejects malformed Apple ID tokens', async () => {
    await expect(service.verifyIdToken('not-a-jwt')).rejects.toThrow(
      new UnauthorizedException('Invalid Apple ID token'),
    );
  });

  it('rejects authorization code exchange when Apple returns an error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400 });

    await expect(service.exchangeAuthorizationCode('bad-code')).rejects.toThrow(
      new UnauthorizedException('Invalid Apple authorization code'),
    );
  });

  it('rejects authorization code exchange when Apple omits id_token', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(service.exchangeAuthorizationCode('valid-code')).rejects.toThrow(
      new UnauthorizedException('Apple did not return an ID token'),
    );
  });

  it('wraps network failures during authorization code exchange', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(service.exchangeAuthorizationCode('valid-code')).rejects.toThrow(
      new UnauthorizedException('Failed to exchange Apple authorization code'),
    );
  });
});
