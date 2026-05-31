import { SetMetadata } from '@nestjs/common';
import { OtpPurpose, VERIFICATION_METADATA_KEY } from '../constants/verification.constants';

export const RequiresVerification = (purpose: OtpPurpose) =>
  SetMetadata(VERIFICATION_METADATA_KEY, purpose);
