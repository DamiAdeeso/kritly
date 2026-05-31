import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { OAuthGatewayController } from './oauth.gateway.controller';
import { OAuthService } from '../services/oauth.service';
import { AuthClientService } from '../services/auth-client.service';
import { AuthProvider } from '@kritly/common';

describe('OAuthGatewayController', () => {
  let controller: OAuthGatewayController;
  let oauthService: jest.Mocked<OAuthService>;
  let authClient: jest.Mocked<AuthClientService>;

  beforeEach(async () => {
    oauthService = {
      parseProvider: jest.fn(),
      createState: jest.fn(),
      getAuthorizationUrl: jest.fn(),
      verifyState: jest.fn(),
      buildSocialLoginRequest: jest.fn(),
      buildSuccessRedirect: jest.fn(),
      buildFailureRedirect: jest.fn(),
    } as unknown as jest.Mocked<OAuthService>;

    authClient = {
      socialLogin: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<AuthClientService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthGatewayController],
      providers: [
        { provide: OAuthService, useValue: oauthService },
        { provide: AuthClientService, useValue: authClient },
      ],
    }).compile();

    controller = module.get<OAuthGatewayController>(OAuthGatewayController);
  });

  it('redirects to provider authorization URL', () => {
    oauthService.parseProvider.mockReturnValue(AuthProvider.GOOGLE);
    oauthService.createState.mockReturnValue('signed-state');
    oauthService.getAuthorizationUrl.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?state=signed-state');

    const response = { redirect: jest.fn() } as unknown as Response;

    controller.startOAuth('google', response);

    expect(oauthService.getAuthorizationUrl).toHaveBeenCalledWith(AuthProvider.GOOGLE, 'signed-state');
    expect(response.redirect).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/v2/auth?state=signed-state',
    );
  });

  it('completes OAuth callback and redirects with tokens', async () => {
    oauthService.parseProvider.mockReturnValue(AuthProvider.GOOGLE);
    oauthService.buildSocialLoginRequest.mockResolvedValue({
      provider: AuthProvider.GOOGLE,
      idToken: 'google-id-token',
    });
    authClient.socialLogin.mockResolvedValue({
      statusCode: 200,
      message: 'Social login successful',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-1',
        email: 'user@example.com',
      },
    });
    oauthService.buildSuccessRedirect.mockReturnValue('http://localhost:3000/auth/callback#accessToken=access-token');

    const response = { redirect: jest.fn() } as unknown as Response;

    await controller.oauthCallbackGet('google', 'auth-code', 'signed-state', response);

    expect(oauthService.verifyState).toHaveBeenCalledWith('signed-state', AuthProvider.GOOGLE);
    expect(authClient.socialLogin).toHaveBeenCalledWith({
      provider: AuthProvider.GOOGLE,
      idToken: 'google-id-token',
    });
    expect(response.redirect).toHaveBeenCalledWith('http://localhost:3000/auth/callback#accessToken=access-token');
  });
});
