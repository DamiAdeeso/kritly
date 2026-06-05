import { createHash } from 'crypto';

/** Short opaque hash for log correlation without storing raw email/phone. */
export function hashSubject(value: string): string {
  const normalized = value.trim().toLowerCase();
  return createHash('sha256').update(normalized).digest('hex').slice(0, 12);
}
