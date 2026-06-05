import { isOtpBypassCode, resolveOtpBypassCode } from './otp-bypass.util';

describe('otp-bypass.util', () => {
  it('returns bypass code outside production', () => {
    expect(resolveOtpBypassCode('000000', 'local')).toBe('000000');
    expect(resolveOtpBypassCode('000000', 'staging')).toBe('000000');
  });

  it('disables bypass in production', () => {
    expect(resolveOtpBypassCode('000000', 'production')).toBeUndefined();
    expect(isOtpBypassCode('000000', '000000', 'production')).toBe(false);
  });

  it('matches bypass codes when configured', () => {
    expect(isOtpBypassCode('000000', '000000', 'local')).toBe(true);
    expect(isOtpBypassCode('123456', '000000', 'local')).toBe(false);
  });
});
