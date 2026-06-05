import { UnauthorizedException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: JwtService;
  const secret = 'test-jwt-secret';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret,
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [JwtTokenService],
    }).compile();

    service = module.get(JwtTokenService);
    jwtService = module.get(JwtService);
  });

  it('verifies a valid bearer token', () => {
    const token = jwtService.sign({ sub: 'user-1', email: 'user@example.com', role: 'USER' });
    const user = service.verifyFromAuthHeader(`Bearer ${token}`);

    expect(user).toEqual({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'USER',
    });
  });

  it('rejects missing authorization header', () => {
    expect(() => service.verifyFromAuthHeader(undefined)).toThrow(UnauthorizedException);
  });

  it('rejects invalid bearer token', () => {
    expect(() => service.verifyFromAuthHeader('Bearer not-a-jwt')).toThrow(UnauthorizedException);
  });

  it('returns undefined for optional verification when header is absent', () => {
    expect(service.tryVerifyFromAuthHeader(undefined)).toBeUndefined();
  });

  it('returns undefined for optional verification when token is invalid', () => {
    expect(service.tryVerifyFromAuthHeader('Bearer not-a-jwt')).toBeUndefined();
  });
});
