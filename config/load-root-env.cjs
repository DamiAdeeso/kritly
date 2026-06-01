/** Prisma CLI / scripts: load repo `.env` + local defaults (Nest uses @kritly/common rootEnvConfig). */
const { config } = require('dotenv');
const { existsSync, readFileSync } = require('fs');
const { resolve } = require('path');

const ROOT = resolve(__dirname, '..');
const LOCAL_ENV_DEFAULTS = JSON.parse(
  readFileSync(resolve(__dirname, 'local-env.defaults.json'), 'utf8'),
);

function applyLocalEnvDefaults() {
  if ((process.env.NODE_ENV || 'local') !== 'local') {
    return;
  }
  for (const [key, value] of Object.entries(LOCAL_ENV_DEFAULTS)) {
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = String(value);
    }
  }
}

function loadRootEnv() {
  const envPath = resolve(ROOT, '.env');
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
  applyLocalEnvDefaults();
}

module.exports = { loadRootEnv, ROOT };
