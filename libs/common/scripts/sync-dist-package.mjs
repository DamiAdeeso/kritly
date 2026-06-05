import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const distPackagePath = join(scriptDir, '../dist/package.json');
const sourcePackagePath = join(scriptDir, '../package.json');

if (!existsSync(distPackagePath)) {
  copyFileSync(sourcePackagePath, distPackagePath);
}

const packageJson = JSON.parse(readFileSync(distPackagePath, 'utf8'));

packageJson.main = 'src/index.js';
packageJson.types = 'src/index.d.ts';
packageJson.exports = {
  '.': {
    types: './src/index.d.ts',
    default: './src/index.js',
  },
};

writeFileSync(distPackagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
