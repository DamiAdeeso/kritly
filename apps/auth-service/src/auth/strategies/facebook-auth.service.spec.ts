import { UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '@kritly/common';
import { FacebookAuthService } from './facebook-auth.service';

describe('FacebookAuthService', () => {
  let service: FacebookAuthService;
  const fetchMock = jest.fn();

  beforeEach(() => {
    service = new FacebookAuthService();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('maps a valid Facebook access token to a social profile', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'fb-1',
        email: 'user@facebook.com',
        first_name: 'Jane',
        last_name: 'Doe',
        picture: { data: { url: 'https://cdn.example.com/fb.jpg' } },
      }),
    });

    const profile = await service.verifyAccessToken('fb-access-token');

    expect(profile).toEqual({
      provider: AuthProvider.FACEBOOK,
      providerId: 'fb-1',
      email: 'user@facebook.com',
      firstName: 'Jane',
      lastName: 'Doe',
      avatar: 'https://cdn.example.com/fb.jpg',
    });
  });

  it('rejects invalid Facebook tokens', async () => {
    fetchMock.mockResolvedValue({ ok: false });

    await expect(service.verifyAccessToken('bad-token')).rejects.toThrow(
      new UnauthorizedException('Failed to verify Facebook access token'),
    );
  });

  it('rejects when the Graph API request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    await expect(service.verifyAccessToken('bad-token')).rejects.toThrow(
      new UnauthorizedException('Failed to verify Facebook access token'),
    );
  });
});
