import { User } from '@prisma/client';
import { ProfileData } from '@kritly/common';

/** Maps a Prisma user row to gRPC ProfileData (no extra DB query). */
export function toProfileDataFromUser(user: User, includeEmail = true): ProfileData {
  return {
    userId: user.id,
    username: user.username ?? undefined,
    displayName: user.displayName ?? undefined,
    bio: user.bio ?? undefined,
    avatar: user.avatar ?? undefined,
    ...(includeEmail ? { email: user.email } : {}),
  };
}
