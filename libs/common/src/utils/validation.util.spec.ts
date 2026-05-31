import { isValidEmail, isValidPassword, sanitizeInput } from './validation.util';

describe('validation.util', () => {
  it('validates email format', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  it('validates password strength', () => {
    expect(isValidPassword('Password1')).toBe(true);
    expect(isValidPassword('weak')).toBe(false);
  });

  it('sanitizes user input', () => {
    expect(sanitizeInput('  hello <world>  ')).toBe('hello world');
  });
});
