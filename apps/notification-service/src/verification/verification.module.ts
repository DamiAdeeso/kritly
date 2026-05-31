import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OtpService } from './otp.service';
import { VerificationGrpcController } from './verification.grpc.controller';
import { VerificationGrpcService } from './verification.grpc.service';
import { VerificationService } from './verification.service';

@Module({
  imports: [NotificationsModule],
  controllers: [VerificationGrpcController],
  providers: [VerificationService, VerificationGrpcService, OtpService],
  exports: [VerificationService, OtpService],
})
export class VerificationModule {}
