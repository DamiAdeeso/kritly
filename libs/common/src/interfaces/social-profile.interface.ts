import type { AuthProvider } from '../enums/auth.enum';

/** Normalized profile from an OAuth provider after token verification. */
export interface ISocialProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  displayName?: string;
  avatar?: string;
}
