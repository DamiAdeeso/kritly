import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { FastifyReply } from 'fastify';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  AuthClientService,
} from '../services/auth-client.service';
import { OAuthService } from '../services/oauth.service';
import {
  AuthData,
  AuthResponseDto,
  HttpClientErrorResponse,
  ServiceResponse,
  httpFail,
  isHttpClientError,
  ok,
} from '@kritly/common';

/** Browser OAuth flow — redirects and one-time code exchange, not JSON envelopes on redirect. */
@SkipThrottle()
@ApiTags('OAuth')
@Controller('api/auth/oauth')
export class OAuthGatewayController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly authClient: AuthClientService,
    @InjectPinoLogger(OAuthGatewayController.name) private readonly logger: PinoLogger,
  ) {}

  @Get('exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a one-time OAuth code for tokens',
    description: 'Call after browser redirect with ?code= from the OAuth callback.',
  })
  @ApiQuery({ name: 'code', required: true })
  @ApiResponse({ status: 200, description: 'Tokens issued', type: AuthResponseDto })
  exchangeCode(
    @Query('code') code: string | undefined,
  ): ServiceResponse<AuthData> | HttpClientErrorResponse {
    if (!code?.trim()) {
      return httpFail('OAuth exchange code is required', HttpStatus.BAD_REQUEST);
    }

    const authData = this.oauthService.consumeExchangeCode(code.trim());
    if (!authData) {
      return httpFail('Invalid or expired OAuth exchange code', HttpStatus.UNAUTHORIZED);
    }

    return ok('OAuth login successful', authData);
  }

  @Get(':provider')
  @ApiOperation({ summary: 'Start web OAuth login (redirects to provider)' })
  @ApiParam({ name: 'provider', example: 'google' })
  @ApiResponse({ status: 302, description: 'Redirect to OAuth provider authorization URL' })
  startOAuth(@Param('provider') provider: string, @Res() response: FastifyReply): void {
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
  @ApiResponse({ status: 302, description: 'Redirect to frontend with one-time code or error query param' })
  async oauthCallbackGet(
    @Param('provider') provider: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res() response: FastifyReply,
  ): Promise<void> {
    await this.completeOAuth(provider, code, state, response);
  }

  @Post(':provider/callback')
  @ApiOperation({ summary: 'OAuth callback for Apple (form_post response mode)' })
  @ApiParam({ name: 'provider', example: 'apple' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with one-time code or error query param' })
  async oauthCallbackPost(
    @Param('provider') provider: string,
    @Body('code') code: string | undefined,
    @Body('state') state: string | undefined,
    @Res() response: FastifyReply,
  ): Promise<void> {
    await this.completeOAuth(provider, code, state, response);
  }

  private async completeOAuth(
    provider: string,
    code: string | undefined,
    state: string | undefined,
    response: FastifyReply,
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
      this.logger.warn(
        { provider, errMessage: error instanceof Error ? error.message : 'unknown' },
        'OAuth callback failed',
      );
      response.redirect(this.oauthService.buildFailureRedirect(message));
    }
  }

  private buildRedirectFromAuthResult(result: AuthData | HttpClientErrorResponse): string {
    if (isHttpClientError(result)) {
      return this.oauthService.buildFailureRedirect(result.message || 'Social login failed');
    }

    if (!result.accessToken || !result.refreshToken || !result.userId) {
      return this.oauthService.buildFailureRedirect('Social login did not return tokens');
    }

    return this.oauthService.buildSuccessRedirect(
      result.accessToken,
      result.refreshToken,
      result.userId,
      result.email,
    );
  }
}
