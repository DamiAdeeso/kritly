import { EmailProviderName } from '../config/email.constants';
import { DeliveryResult, RenderedNotification } from './notification-channel.interface';

export interface EmailDeliveryProvider {
  readonly name: EmailProviderName;
  send(rendered: RenderedNotification, from: string): Promise<DeliveryResult>;
}
