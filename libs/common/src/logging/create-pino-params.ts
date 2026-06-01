import { AppLoggerOptions } from './logger.constants';

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'refreshToken',
  'accessToken',
  'idToken',
  'authorizationCode',
  'verificationToken',
] as const;

type PinoSharedOptions = {
  level: string;
  base: {
    service: string;
    env: string;
  };
  redact: {
    paths: readonly string[];
    censor: string;
  };
  transport?: {
    target: string;
    options: {
      colorize: boolean;
      singleLine: boolean;
      ignore: string;
    };
  };
};

type AppPinoHttpOptions = PinoSharedOptions & {
  autoLogging: {
    ignore: (request: { url: string }) => boolean;
  };
};

export type AppPinoParams = PinoSharedOptions & {
  pinoHttp?: AppPinoHttpOptions;
};

function resolveLogLevel(nodeEnv: string): string {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  return nodeEnv === 'local' || nodeEnv === 'development' ? 'debug' : 'info';
}

function isPrettyEnvironment(nodeEnv: string): boolean {
  return nodeEnv === 'local' || nodeEnv === 'development';
}

export function createPinoParams(options: AppLoggerOptions): AppPinoParams {
  const nodeEnv = process.env.NODE_ENV || 'local';
  const level = resolveLogLevel(nodeEnv);
  const pretty = isPrettyEnvironment(nodeEnv);

  const sharedOptions: PinoSharedOptions = {
    level,
    base: {
      service: options.service,
      env: nodeEnv,
    },
    redact: {
      paths: REDACT_PATHS,
      censor: '[Redacted]',
    },
    ...(pretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
  };

  if (options.enableHttpLogging === false) {
    return sharedOptions;
  }

  return {
    ...sharedOptions,
    pinoHttp: {
      ...sharedOptions,
      autoLogging: {
        ignore: (request: { url: string }) => request.url === '/health',
      },
    },
  };
}
