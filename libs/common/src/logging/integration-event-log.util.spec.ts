import { buildIntegrationEventLogContext } from './integration-event-log.util';

describe('buildIntegrationEventLogContext', () => {
  it('hashes email and recipient without leaking secrets', () => {
    const context = buildIntegrationEventLogContext(
      'verification.otp_requested',
      'notification-service',
      {
        recipient: 'user@example.com',
        purpose: 'email_verify',
        code: '123456',
      },
      { idempotencyKey: 'otp:email_verify:user@example.com:1' },
    );

    expect(context).toMatchObject({
      eventType: 'verification.otp_requested',
      source: 'notification-service',
      purpose: 'email_verify',
      idempotencyKey: 'otp:email_verify:user@example.com:1',
      recipientHash: expect.any(String),
    });
    expect(context).not.toHaveProperty('code');
    expect(context).not.toHaveProperty('recipient');
    expect(context).not.toHaveProperty('email');
  });
});
