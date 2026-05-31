import { AuthProvider } from '@kritly/common';
import { AuthRequestMapper } from './auth-request.mapper';

describe('AuthRequestMapper', () => {
  it('maps register request with default username from email', () => {
    const dto = AuthRequestMapper.toRegisterDto({
      email: 'user@example.com',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(dto.email).toBe('user@example.com');
    expect(dto.username).toBe('user');
  });

  it('maps register request preserving explicit username', () => {
    const dto = AuthRequestMapper.toRegisterDto({
      email: 'user@example.com',
      password: 'Password123',
      username: 'customname',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(dto.username).toBe('customname');
  });

  it('maps social login provider to AuthProvider enum', () => {
    const dto = AuthRequestMapper.toSocialLoginDto({
      provider: 'google',
      idToken: 'google-id-token',
    });

    expect(dto.provider).toBe(AuthProvider.GOOGLE);
    expect(dto.idToken).toBe('google-id-token');
  });
});
