require('../prisma/load-env.cjs');

const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  cwd: process.cwd(),
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
