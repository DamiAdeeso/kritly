import pino, { Logger } from 'pino';

function resolveLogLevel(): string {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  const nodeEnv = process.env.NODE_ENV || 'local';
  return nodeEnv === 'local' || nodeEnv === 'development' ? 'debug' : 'info';
}

/** Lightweight pino logger for shared modules that run outside Nest DI. */
export function createModuleLogger(context: string): Logger {
  const nodeEnv = process.env.NODE_ENV || 'local';

  return pino({
    level: resolveLogLevel(),
    base: {
      context,
      env: nodeEnv,
    },
  });
}
