import { fail } from '../dto/common.dto';
import {
  isHttpClientError,
  mapAvailabilityToHttp,
  mapGrpcEmptyToHttp,
  mapGrpcToHttp,
} from './http-envelope.util';

describe('http-envelope.util', () => {
  it('wraps gRPC data in the HTTP envelope', () => {
    expect(
      mapGrpcToHttp(
        { accessToken: 'a', refreshToken: 'r', userId: 'u', email: 'e@example.com' },
        'Login successful',
      ),
    ).toEqual({
      statusCode: 200,
      message: 'Login successful',
      data: { accessToken: 'a', refreshToken: 'r', userId: 'u', email: 'e@example.com' },
    });
  });

  it('passes through gateway gRPC error envelopes unchanged', () => {
    const error = fail('Invalid credentials', 401);
    expect(isHttpClientError(error)).toBe(true);
    expect(mapGrpcToHttp(error, 'Login successful')).toBe(error);
  });

  it('wraps empty gRPC success for HTTP', () => {
    expect(mapGrpcEmptyToHttp({}, 'Logout successful')).toEqual({
      statusCode: 200,
      message: 'Logout successful',
      data: {},
    });
  });

  it('mapAvailabilityToHttp passes through client errors', () => {
    const error = fail('Service unavailable', 503);
    expect(
      mapAvailabilityToHttp(error, 'Available', 'Taken'),
    ).toBe(error);
  });

  it('mapAvailabilityToHttp uses distinct messages for available vs taken', () => {
    expect(mapAvailabilityToHttp({ isAvailable: true }, 'Free', 'Taken')).toEqual({
      statusCode: 200,
      message: 'Free',
      data: { isAvailable: true },
    });
    expect(mapAvailabilityToHttp({ isAvailable: false }, 'Free', 'Taken')).toEqual({
      statusCode: 200,
      message: 'Taken',
      data: { isAvailable: false },
    });
  });
});
