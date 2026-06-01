# Environment

## `.env` only

Copy `cp .env.example .env` and set secrets (JWT, SMTP, S3, OAuth).

## Nest services

`ConfigModule.forRoot(rootEnvConfig())` from `@kritly/common`:

- Loads repo-root `.env` (finds monorepo root via `nx.json`)
- When `NODE_ENV=local`, fills unset keys from `config/local-env.defaults.json`

## Prisma CLI

`prisma/load-env.cjs` → `config/load-root-env.cjs` (same defaults file).

## Commands

| Command | `NODE_ENV` |
|---------|------------|
| `pnpm dev` | `local` (defaults apply) |
| `pnpm start:dev` / staging / production | set in `.env` or host secrets |

## Render

Deploy all services via Blueprint: root `render.yaml` → Render **New → Blueprint**. Set `sync: false` secrets (`RABBITMQ_URL`, `GATEWAY_PUBLIC_URL`, SMTP, S3, OAuth) after the first deploy.
