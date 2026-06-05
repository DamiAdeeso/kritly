import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtTokenService } from './jwt-token.service';
import { JwtUser } from './jwt-user.interface';

type AuthenticatedRequest = FastifyRequest & { user?: JwtUser };

/** Requires a valid bearer JWT; throws UnauthorizedException (mapped to the REST error envelope by the global filter). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.user = this.jwtTokenService.verifyFromAuthHeader(request.headers.authorization);
    return true;
  }
}
