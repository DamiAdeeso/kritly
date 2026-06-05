const sendMock = jest.fn();

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(() => ({ send: sendMock })),
  SendEmailCommand: jest.fn((input: unknown) => input),
}));

import { ConfigService } from '@nestjs/config';
import { SesEmailProvider } from './ses-email.provider';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
};

describe('SesEmailProvider', () => {
  let provider: SesEmailProvider;

  beforeEach(() => {
    sendMock.mockReset();

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'email.ses.region': 'eu-west-1',
          'email.ses.accessKeyId': 'ses-key',
          'email.ses.secretAccessKey': 'ses-secret',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    provider = new SesEmailProvider(configService, mockLogger as never);
  });

  it('sends email through SES and returns message id', async () => {
    sendMock.mockResolvedValue({ MessageId: 'ses-msg-123' });

    const result = await provider.send(
      {
        to: 'user@example.com',
        subject: 'Your code',
        bodyText: '123456',
        bodyHtml: '<p>123456</p>',
      },
      'Kritly <noreply@kritly.com>',
    );

    expect(result).toEqual({ success: true, providerMessageId: 'ses-msg-123' });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        Source: 'Kritly <noreply@kritly.com>',
        Destination: { ToAddresses: ['user@example.com'] },
        Message: expect.objectContaining({
          Subject: { Charset: 'UTF-8', Data: 'Your code' },
        }),
      }),
    );
  });

  it('returns a retryable failure when SES send fails', async () => {
    sendMock.mockRejectedValue(new Error('Email address is not verified'));

    const result = await provider.send(
      {
        to: 'user@example.com',
        subject: 'Hi',
        bodyText: 'Hello',
      },
      'noreply@kritly.com',
    );

    expect(result).toEqual({ success: false, error: 'Email address is not verified' });
  });
});
