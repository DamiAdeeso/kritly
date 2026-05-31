export interface RenderedNotification {
  to: string;
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
}

export interface DeliveryResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface NotificationChannelAdapter {
  readonly channel: string;
  send(rendered: RenderedNotification): Promise<DeliveryResult>;
}
