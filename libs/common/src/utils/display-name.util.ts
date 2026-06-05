/** Joins non-empty name parts into a single display name (e.g. OAuth given + family name). */
export function formatDisplayName(...parts: (string | null | undefined)[]): string | undefined {
  const trimmed = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return trimmed.length > 0 ? trimmed.join(' ') : undefined;
}
