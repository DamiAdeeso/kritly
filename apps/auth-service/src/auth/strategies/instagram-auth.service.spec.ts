import { UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '@kritly/common';
import { InstagramAuthService } from './instagram-auth.service';

describe('InstagramAuthService', () => {
  let service: InstagramAuthService;
  const fetchMock = jest.fn();

  beforeEach(() => {
    service = new InstagramAuthService();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('maps a valid Instagram access token to a social profile', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'ig-1',
        username: 'janedoe',
      }),
    });

    const profile = await service.verifyAccessToken('ig-access-token');

    expect(profile).toEqual({
      provider: AuthProvider.INSTAGRAM,
      providerId: 'ig-1',
      email: 'instagram_ig-1@example.com',
      firstName: 'janedoe',
      lastName: '',
      avatar: undefined,
    });
  });

  it('rejects invalid Instagram tokens', async () => {
    fetchMock.mockResolvedValue({ ok: false });

    await expect(service.verifyAccessToken('bad-token')).rejects.toThrow(
      new UnauthorizedException('Failed to verify Instagram access token'),
    );
  });
});
