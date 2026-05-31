import { resolveJwtSecret, validateEnv } from './env.validation';

describe('env.validation', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('allows missing JWT_SECRET in local environment', () => {
    expect(resolveJwtSecret({ NODE_ENV: 'local' }, 'local')).toBeTruthy();
  });

  it('requires JWT_SECRET outside local environment', () => {
    expect(() => resolveJwtSecret({ NODE_ENV: 'production' }, 'production')).toThrow(
      'JWT_SECRET is required when NODE_ENV is not local',
    );
  });

  it('validates environment configuration', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'super-secret-key',
      }),
    ).not.toThrow();
  });
});
