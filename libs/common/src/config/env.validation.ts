import { plainToInstance } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches, validateSync } from 'class-validator';

const LOCAL_JWT_SECRET = 'local-dev-jwt-secret-change-me';
const PORT_PATTERN = /^\d{1,5}$/;

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['local', 'development', 'staging', 'production'])
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  @Matches(PORT_PATTERN, { message: 'AUTH_SERVICE_PORT must be a numeric port' })
  AUTH_SERVICE_PORT?: string;

  @IsOptional()
  @IsString()
  @Matches(PORT_PATTERN, { message: 'UPLOAD_SERVICE_PORT must be a numeric port' })
  UPLOAD_SERVICE_PORT?: string;

  @IsOptional()
  @IsString()
  @Matches(PORT_PATTERN, { message: 'NOTIFICATION_SERVICE_GRPC_PORT must be a numeric port' })
  NOTIFICATION_SERVICE_GRPC_PORT?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  GRPC_USE_TLS?: string;

  @IsOptional()
  @IsString()
  GRPC_TLS_CERT?: string;

  @IsOptional()
  @IsString()
  GRPC_TLS_KEY?: string;

  @IsOptional()
  @IsString()
  GRPC_TLS_CA?: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @IsString()
  RABBITMQ_URL?: string;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;
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

  const nodeEnv = String(config.NODE_ENV ?? 'local');

  resolveJwtSecret(
    {
      NODE_ENV: nodeEnv,
      JWT_SECRET: config.JWT_SECRET ? String(config.JWT_SECRET) : undefined,
    },
    nodeEnv,
  );

  if (!isLocalEnvironment(nodeEnv)) {
    const requiredOutsideLocal = ['DATABASE_URL', 'REDIS_URL', 'RABBITMQ_URL'] as const;
    const missing = requiredOutsideLocal.filter((key) => {
      const value = config[key];
      return value === undefined || value === '';
    });
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for NODE_ENV=${nodeEnv}: ${missing.join(', ')}`,
      );
    }
  }

  return config;
}
