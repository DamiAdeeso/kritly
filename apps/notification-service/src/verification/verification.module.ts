import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { VerificationGrpcController } from './verification.grpc.controller';
import { VerificationService } from './verification.service';

@Module({
  controllers: [VerificationGrpcController],
  providers: [VerificationService, OtpService],
  exports: [VerificationService, OtpService],
})
export class VerificationModule {}
