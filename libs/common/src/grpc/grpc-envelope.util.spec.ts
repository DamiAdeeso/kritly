import { grpcField, grpcIsAvailable, grpcIsValid, grpcStatusCode } from './grpc-envelope.util';

describe('grpc-envelope.util', () => {
  it('reads camelCase statusCode', () => {
    expect(grpcStatusCode({ statusCode: 200 })).toBe(200);
  });

  it('reads snake_case status_code', () => {
    expect(grpcStatusCode({ status_code: 200 })).toBe(200);
  });

  it('reads isAvailable from nested data', () => {
    expect(grpcIsAvailable({ isAvailable: true })).toBe(true);
    expect(grpcIsAvailable({ is_available: true })).toBe(true);
  });

  it('reads isValid from nested data', () => {
    expect(grpcIsValid({ isValid: true })).toBe(true);
    expect(grpcIsValid({ is_valid: true })).toBe(true);
  });

  it('reads nested grpc fields', () => {
    const payload = {
      status_code: 200,
      data: { is_available: true },
    };

    expect(grpcField<boolean>(payload.data as Record<string, unknown>, 'isAvailable')).toBe(true);
    expect(grpcStatusCode(payload)).toBe(200);
  });
});
