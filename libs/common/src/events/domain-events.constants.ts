export const DOMAIN_EVENTS = {
  USER_REGISTERED: 'user.registered',
  USER_PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',
} as const;

export type DomainEventType = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];
