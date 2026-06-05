import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { VerificationGrpcImplementation } from './verification.grpc.implementation';
import { VerificationService } from './verification.service';

@Module({
  providers: [VerificationService, VerificationGrpcImplementation, OtpService],
  exports: [VerificationService, VerificationGrpcImplementation, OtpService],
})
export class VerificationModule {}
