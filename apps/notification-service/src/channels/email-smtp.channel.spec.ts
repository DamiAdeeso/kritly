const sendMail = jest.fn();
const createTransport = jest.fn(() => ({ sendMail }));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport,
  },
}));

import { ConfigService } from '@nestjs/config';
import { EmailSmtpChannel } from './email-smtp.channel';

describe('EmailSmtpChannel', () => {
  let channel: EmailSmtpChannel;

  beforeEach(() => {
    sendMail.mockReset();
    createTransport.mockClear();

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'smtp.host': 'smtp.example.com',
          'smtp.port': 587,
          'smtp.secure': false,
          'smtp.user': 'smtp-user',
          'smtp.pass': 'smtp-pass',
          'smtp.from': 'noreply@kritly.com',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    channel = new EmailSmtpChannel(configService);
  });

  it('sends email through SMTP and returns provider message id', async () => {
    sendMail.mockResolvedValue({ messageId: 'msg-123' });

    const result = await channel.send({
      to: 'user@example.com',
      subject: 'Welcome',
      bodyText: 'Hello there',
      bodyHtml: '<p>Hello there</p>',
    });

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

    const result = await channel.send({
      to: 'user@example.com',
      subject: 'Welcome',
      bodyText: 'Hello there',
    });

    expect(result).toEqual({ success: false, error: 'SMTP unavailable' });
  });
});
