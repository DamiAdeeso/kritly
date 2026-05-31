export type NotificationChannel = 'email' | 'sms' | 'push';

export interface NotificationFieldSchema {
  required?: string[];
  optional?: string[];
}

export interface NotificationSendEvent {
  templateKey: string;
  channel: NotificationChannel;
  recipient: string;
  data: Record<string, string>;
  idempotencyKey?: string;
  correlationId?: string;
  source?: string;
  createdAt?: string;
}
