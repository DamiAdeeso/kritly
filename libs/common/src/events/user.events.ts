export interface UserRegisteredPayload {
  userId: string;
  email: string;
  firstName: string;
}

export interface UserPasswordResetRequestedPayload {
  userId: string;
  email: string;
  firstName: string;
  resetUrl: string;
  expiresIn: string;
}
