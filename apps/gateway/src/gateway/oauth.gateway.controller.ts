import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthClientService } from '../services/auth-client.service';
import { OAuthService } from '../services/oauth.service';
import { AuthResponse, GrpcErrorResponse } from '@kritly/common';

@ApiTags('Auth')
@Controller('api/auth/oauth')
export class OAuthGatewayController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly authClient: AuthClientService,
  ) {}

  @Get(':provider')
  @ApiOperation({ summary: 'Start web OAuth login (redirects to provider)' })
  @ApiParam({ name: 'provider', example: 'google' })
  startOAuth(@Param('provider') provider: string, @Res() response: Response): void {
    const normalizedProvider = this.oauthService.parseProvider(provider);
    const state = this.oauthService.createState(normalizedProvider);
    const authorizationUrl = this.oauthService.getAuthorizationUrl(normalizedProvider, state);
    response.redirect(authorizationUrl);
  }

  @Get(':provider/callback')
  @ApiOperation({ summary: 'OAuth callback for providers that use GET redirects' })
  @ApiParam({ name: 'provider', example: 'google' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  async oauthCallbackGet(
    @Param('provider') provider: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    await this.completeOAuth(provider, code, state, response);
  }

  @Post(':provider/callback')
  @ApiOperation({ summary: 'OAuth callback for Apple (form_post response mode)' })
  @ApiParam({ name: 'provider', example: 'apple' })
  async oauthCallbackPost(
    @Param('provider') provider: string,
    @Body('code') code: string | undefined,
    @Body('state') state: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    await this.completeOAuth(provider, code, state, response);
  }

  private async completeOAuth(
    provider: string,
    code: string | undefined,
    state: string | undefined,
    response: Response,
  ): Promise<void> {
    try {
      const normalizedProvider = this.oauthService.parseProvider(provider);

      if (!code || !state) {
        throw new BadRequestException('Missing OAuth code or state');
      }

      this.oauthService.verifyState(state, normalizedProvider);

      const socialLoginRequest = await this.oauthService.buildSocialLoginRequest(
        normalizedProvider,
        code,
      );
      const result = await this.authClient.socialLogin(socialLoginRequest);

      response.redirect(this.buildRedirectFromAuthResult(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth login failed';
      response.redirect(this.oauthService.buildFailureRedirect(message));
    }
  }

  private buildRedirectFromAuthResult(result: AuthResponse | GrpcErrorResponse): string {
    if (result.statusCode !== 200 && result.statusCode !== 201) {
      return this.oauthService.buildFailureRedirect(result.message || 'Social login failed');
    }

    if (!result.data?.accessToken || !result.data.refreshToken || !result.data.userId) {
      return this.oauthService.buildFailureRedirect('Social login did not return tokens');
    }

    return this.oauthService.buildSuccessRedirect(
      result.data.accessToken,
      result.data.refreshToken,
      result.data.userId,
      result.data.email,
    );
  }
}
