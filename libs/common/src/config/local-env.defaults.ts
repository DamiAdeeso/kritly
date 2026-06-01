import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { findRepoRoot } from './repo-root';

function loadLocalEnvDefaults(): Record<string, string> {
  const file = resolve(findRepoRoot(), 'config/local-env.defaults.json');
  if (!existsSync(file)) {
    return {};
  }

  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
}

/** Local dev defaults from repo-root `config/local-env.defaults.json`. */
export const LOCAL_ENV_DEFAULTS: Record<string, string> = loadLocalEnvDefaults();
