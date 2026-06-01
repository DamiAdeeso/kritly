import { BadRequestException } from '@nestjs/common';
import { fail, ok } from '../dto/common.dto';
import { getErrorMessage, getErrorStatus, isServiceResponse } from './service-response.util';

describe('service-response.util', () => {
  it('identifies service response envelopes', () => {
    expect(isServiceResponse(ok('Success', { id: '1' }))).toBe(true);
    expect(isServiceResponse(fail('Failed', 400))).toBe(true);
    expect(isServiceResponse({ status: 'ok' })).toBe(false);
  });

  it('extracts error messages from exceptions', () => {
    expect(getErrorMessage(new BadRequestException('Invalid input'), 'Fallback')).toBe(
      'Invalid input',
    );
    expect(getErrorMessage('not an error', 'Fallback')).toBe('Fallback');
  });

  it('extracts status codes from HttpException', () => {
    expect(getErrorStatus(new BadRequestException('Invalid input'))).toBe(400);
    expect(getErrorStatus(new Error('Unexpected'))).toBe(500);
  });
});
