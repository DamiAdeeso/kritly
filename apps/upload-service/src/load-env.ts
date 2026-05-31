import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const nodeEnv = process.env.NODE_ENV || 'local';
const envFiles = ['.env', `.env.${nodeEnv}`, '.env.local'];

for (const file of envFiles) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) {
    config({ path, override: true });
  }
}
