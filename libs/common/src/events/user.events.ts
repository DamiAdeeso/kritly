export interface UserRegisteredPayload {
  userId: string;
  email: string;
  displayName: string;
}

export interface UserPasswordResetRequestedPayload {
  userId: string;
  email: string;
  displayName: string;
  resetUrl: string;
  expiresIn: string;
}
