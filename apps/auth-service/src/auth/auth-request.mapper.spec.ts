import { AuthProvider } from '@kritly/common';
import { AuthRequestMapper } from './auth-request.mapper';

describe('AuthRequestMapper', () => {
  it('maps register request with default username from email', () => {
    const dto = AuthRequestMapper.toRegisterDto({
      email: 'user@example.com',
      password: 'Password123',
      dateOfBirth: '1990-01-15',
      verificationToken: 'verification-token',
    });

    expect(dto.email).toBe('user@example.com');
    expect(dto.username).toBe('user');
  });

  it('maps register request preserving explicit username', () => {
    const dto = AuthRequestMapper.toRegisterDto({
      email: 'user@example.com',
      password: 'Password123',
      username: 'customname',
      dateOfBirth: '1990-01-15',
      verificationToken: 'verification-token',
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

  it('preserves optional social login credential fields', () => {
    const dto = AuthRequestMapper.toSocialLoginDto({
      provider: 'apple',
      authorizationCode: 'apple-code',
    });

    expect(dto.provider).toBe(AuthProvider.APPLE);
    expect(dto.authorizationCode).toBe('apple-code');
  });
});
