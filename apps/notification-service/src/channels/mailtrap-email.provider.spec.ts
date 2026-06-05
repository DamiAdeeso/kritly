import { ConfigService } from '@nestjs/config';
import { MailtrapEmailProvider } from './mailtrap-email.provider';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
};

describe('MailtrapEmailProvider', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function createProvider(apiToken = 'mailtrap-token') {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'email.mailtrap.apiToken': apiToken,
          'email.mailtrap.apiUrl': 'https://send.api.mailtrap.io/api/send',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    return new MailtrapEmailProvider(configService, mockLogger as never);
  }

  it('sends email through Mailtrap API', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message_ids: ['mt-123'] }),
    });

    const provider = createProvider();
    const result = await provider.send(
      {
        to: 'user@example.com',
        subject: 'Your code',
        bodyText: '123456',
        bodyHtml: '<p>123456</p>',
      },
      'Kritly <noreply@kritly.com>',
    );

    expect(result).toEqual({ success: true, providerMessageId: 'mt-123' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://send.api.mailtrap.io/api/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mailtrap-token',
        }),
        body: JSON.stringify({
          from: { name: 'Kritly', email: 'noreply@kritly.com' },
          to: [{ email: 'user@example.com' }],
          subject: 'Your code',
          text: '123456',
          html: '<p>123456</p>',
          category: 'transactional',
        }),
      }),
    );
  });

  it('fails when API token is missing', async () => {
    const provider = createProvider('');
    const result = await provider.send(
      { to: 'user@example.com', subject: 'Hi', bodyText: 'Hello' },
      'noreply@kritly.com',
    );

    expect(result).toEqual({
      success: false,
      error: 'MAILTRAP_API_TOKEN is required when EMAIL_PROVIDER=mailtrap',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns API error details on non-2xx response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ errors: ['Invalid API token'] }),
    });

    const provider = createProvider();
    const result = await provider.send(
      { to: 'user@example.com', subject: 'Hi', bodyText: 'Hello' },
      'noreply@kritly.com',
    );

    expect(result).toEqual({ success: false, error: 'Invalid API token' });
  });
});
