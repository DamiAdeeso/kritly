const sendMail = jest.fn();
const createTransport = jest.fn(() => ({ sendMail }));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport,
  },
}));

import { ConfigService } from '@nestjs/config';
import { SmtpEmailProvider } from './smtp-email.provider';

describe('SmtpEmailProvider', () => {
  let provider: SmtpEmailProvider;

  beforeEach(() => {
    sendMail.mockReset();
    createTransport.mockClear();

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'email.smtp.host': 'smtp.example.com',
          'email.smtp.port': 587,
          'email.smtp.secure': false,
          'email.smtp.user': 'smtp-user',
          'email.smtp.pass': 'smtp-pass',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    provider = new SmtpEmailProvider(configService);
  });

  it('sends email through SMTP and returns provider message id', async () => {
    sendMail.mockResolvedValue({ messageId: 'msg-123' });

    const result = await provider.send(
      {
        to: 'user@example.com',
        subject: 'Welcome',
        bodyText: 'Hello there',
        bodyHtml: '<p>Hello there</p>',
      },
      'noreply@kritly.com',
    );

    expect(result).toEqual({ success: true, providerMessageId: 'msg-123' });
    expect(sendMail).toHaveBeenCalledWith({
      from: 'noreply@kritly.com',
      to: 'user@example.com',
      subject: 'Welcome',
      text: 'Hello there',
      html: '<p>Hello there</p>',
    });
  });

  it('returns a retryable failure when SMTP send fails', async () => {
    sendMail.mockRejectedValue(new Error('SMTP unavailable'));

    const result = await provider.send(
      {
        to: 'user@example.com',
        subject: 'Welcome',
        bodyText: 'Hello there',
      },
      'noreply@kritly.com',
    );

    expect(result).toEqual({ success: false, error: 'SMTP unavailable' });
  });
});
