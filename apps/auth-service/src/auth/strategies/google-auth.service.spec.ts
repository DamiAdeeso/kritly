const verifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken,
  })),
}));

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@kritly/common';
import { GoogleAuthService } from './google-auth.service';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;

  beforeEach(() => {
    verifyIdToken.mockReset();
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'google-client-id';
        if (key === 'GOOGLE_CLIENT_SECRET') return 'google-client-secret';
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new GoogleAuthService(configService);
  });

  it('maps a valid Google ID token to a social profile', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-1',
        email: 'user@gmail.com',
        given_name: 'Jane',
        family_name: 'Doe',
        picture: 'https://cdn.example.com/avatar.jpg',
      }),
    });

    const profile = await service.verifyIdToken('google-id-token');

    expect(profile).toEqual({
      provider: AuthProvider.GOOGLE,
      providerId: 'google-sub-1',
      email: 'user@gmail.com',
      displayName: 'Jane Doe',
      avatar: 'https://cdn.example.com/avatar.jpg',
    });
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'google-id-token',
      audience: 'google-client-id',
    });
  });

  it('rejects tokens with no payload', async () => {
    verifyIdToken.mockResolvedValue({ getPayload: () => undefined });

    await expect(service.verifyIdToken('bad-token')).rejects.toThrow(
      new UnauthorizedException('Failed to verify Google ID token'),
    );
  });

  it('rejects when Google verification fails', async () => {
    verifyIdToken.mockRejectedValue(new Error('invalid token'));

    await expect(service.verifyIdToken('bad-token')).rejects.toThrow(
      new UnauthorizedException('Failed to verify Google ID token'),
    );
  });
});
