import { hashSubject } from '../utils/redact.util';
import { PublishEventOptions } from '../events/integration-event.interface';

/** Safe structured fields for integration-event logs (never includes OTP codes or tokens). */
export function buildIntegrationEventLogContext(
  type: string,
  source: string,
  payload: Record<string, unknown>,
  options: PublishEventOptions = {},
): Record<string, unknown> {
  const context: Record<string, unknown> = {
    eventType: type,
    source,
    idempotencyKey: options.idempotencyKey ?? null,
    correlationId: options.correlationId ?? null,
  };

  if (typeof payload.userId === 'string') {
    context.userId = payload.userId;
  }

  if (typeof payload.purpose === 'string') {
    context.purpose = payload.purpose;
  }

  if (typeof payload.email === 'string') {
    context.emailHash = hashSubject(payload.email);
  }

  if (typeof payload.recipient === 'string') {
    context.recipientHash = hashSubject(payload.recipient);
  }

  return context;
}
