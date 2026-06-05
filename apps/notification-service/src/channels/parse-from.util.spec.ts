import { parseFromAddress } from './parse-from.util';

describe('parseFromAddress', () => {
  it('parses name and email format', () => {
    expect(parseFromAddress('Kritly <noreply@kritly.com>')).toEqual({
      name: 'Kritly',
      email: 'noreply@kritly.com',
    });
  });

  it('parses plain email', () => {
    expect(parseFromAddress('noreply@kritly.com')).toEqual({
      email: 'noreply@kritly.com',
    });
  });
});
