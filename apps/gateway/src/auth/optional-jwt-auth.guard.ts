import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtTokenService } from './jwt-token.service';
import { JwtUser } from './jwt-user.interface';

type AuthenticatedRequest = FastifyRequest & { user?: JwtUser };

/** Attaches request.user when a valid bearer token is present; never rejects. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = this.jwtTokenService.tryVerifyFromAuthHeader(request.headers.authorization);
    if (user) {
      request.user = user;
    }
    return true;
  }
}
