export interface VerificationOtpRequestedPayload {
  recipient: string;
  purpose: string;
  code: string;
  expiresIn: string;
  purposeLabel: string;
}
