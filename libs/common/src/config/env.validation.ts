import { plainToInstance } from 'class-transformer';
import { IsIn, IsOptional, IsString, validateSync } from 'class-validator';

const LOCAL_JWT_SECRET = 'local-dev-jwt-secret-change-me';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['local', 'development', 'staging', 'production'])
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;
}

export function isLocalEnvironment(nodeEnv = process.env.NODE_ENV || 'local'): boolean {
  return nodeEnv === 'local';
}

export function resolveJwtSecret(
  config?: Record<string, string | undefined>,
  nodeEnv = config?.NODE_ENV ?? process.env.NODE_ENV ?? 'local',
): string {
  const secret = config?.JWT_SECRET ?? process.env.JWT_SECRET;

  if (isLocalEnvironment(nodeEnv)) {
    return secret || LOCAL_JWT_SECRET;
  }

  if (!secret) {
    throw new Error('JWT_SECRET is required when NODE_ENV is not local');
  }

  return secret;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  resolveJwtSecret(
    {
      NODE_ENV: String(config.NODE_ENV ?? 'local'),
      JWT_SECRET: config.JWT_SECRET ? String(config.JWT_SECRET) : undefined,
    },
    String(config.NODE_ENV ?? 'local'),
  );

  return config;
}
