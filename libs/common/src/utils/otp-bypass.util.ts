/** Fixed OTP for local/dev/staging only — never enabled in production. */
export function resolveOtpBypassCode(
  configuredCode: string | undefined,
  nodeEnv = process.env.NODE_ENV || 'local',
): string | undefined {
  if (nodeEnv === 'production') {
    return undefined;
  }

  const trimmed = configuredCode?.trim();
  return trimmed || undefined;
}

export function isOtpBypassCode(
  submittedCode: string,
  configuredCode: string | undefined,
  nodeEnv = process.env.NODE_ENV || 'local',
): boolean {
  const bypassCode = resolveOtpBypassCode(configuredCode, nodeEnv);
  if (!bypassCode) {
    return false;
  }

  return submittedCode.trim() === bypassCode;
}
