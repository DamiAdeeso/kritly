import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://kritly:kritly@localhost:5672',
  queue: process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notification-service.send',
}));
