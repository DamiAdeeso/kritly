import { existsSync } from 'fs';
import { resolve } from 'path';

let cachedRepoRoot: string | undefined;

/** Walk up from cwd until nx.json is found (monorepo root). */
export function findRepoRoot(startDir = process.cwd()): string {
  if (cachedRepoRoot) {
    return cachedRepoRoot;
  }

  let dir = startDir;
  for (let i = 0; i < 12; i += 1) {
    if (existsSync(resolve(dir, 'nx.json'))) {
      cachedRepoRoot = dir;
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  cachedRepoRoot = startDir;
  return startDir;
}
