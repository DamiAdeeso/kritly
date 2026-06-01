import { ConfigModuleOptions } from '@nestjs/config';
import { resolve } from 'path';
import { isLocalEnvironment, validateEnv } from './env.validation';
import { LOCAL_ENV_DEFAULTS } from './local-env.defaults';
import { findRepoRoot } from './repo-root';

export { findRepoRoot } from './repo-root';

let cachedEnvFilePath: string | undefined;

export function getRootEnvFilePath(): string {
  if (!cachedEnvFilePath) {
    cachedEnvFilePath = resolve(findRepoRoot(), '.env');
  }
  return cachedEnvFilePath;
}

export function applyLocalEnvDefaults(config: Record<string, unknown>): Record<string, unknown> {
  if (!isLocalEnvironment(String(config.NODE_ENV ?? process.env.NODE_ENV ?? 'local'))) {
    return config;
  }

  const merged = { ...config };
  for (const [key, value] of Object.entries(LOCAL_ENV_DEFAULTS)) {
    const existing = merged[key] ?? process.env[key];
    if (existing === undefined || existing === '') {
      merged[key] = value;
      process.env[key] = value;
    }
  }
  return merged;
}

/** Nest ConfigModule: loads repo-root `.env` and applies local defaults in validate. */
export function rootEnvConfig(): ConfigModuleOptions {
  return {
    isGlobal: true,
    envFilePath: getRootEnvFilePath(),
    validate: (config) => validateEnv(applyLocalEnvDefaults(config as Record<string, unknown>)),
  };
}
