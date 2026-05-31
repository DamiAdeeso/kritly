const { config } = require('dotenv');
const { existsSync } = require('fs');
const { resolve } = require('path');

const root = resolve(__dirname, '..');
const nodeEnv = process.env.NODE_ENV || 'local';

for (const file of ['.env', `.env.${nodeEnv}`, '.env.local']) {
  const path = resolve(root, file);
  if (existsSync(path)) {
    config({ path, override: true });
  }
}
