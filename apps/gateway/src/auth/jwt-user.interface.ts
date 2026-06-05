/** Authenticated user extracted from a verified access token. */
export interface JwtUser {
  userId: string;
  email: string;
  role: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtUser;
  }
}
