export interface IntegrationEvent<TPayload = Record<string, unknown>> {
  type: string;
  source: string;
  payload: TPayload;
  idempotencyKey?: string;
  correlationId?: string;
  occurredAt: string;
}

export interface PublishEventOptions {
  idempotencyKey?: string;
  correlationId?: string;
}
