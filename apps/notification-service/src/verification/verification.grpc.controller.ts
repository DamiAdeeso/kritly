import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  SendOtpRequest,
  ValidateVerificationTokenRequest,
  VerifyOtpRequest,
} from '@kritly/common';
import { VerificationGrpcService } from './verification.grpc.service';

@Controller()
export class VerificationGrpcController {
  constructor(private readonly verificationGrpcService: VerificationGrpcService) {}

  @GrpcMethod('VerificationService', 'SendOtp')
  sendOtp(data: SendOtpRequest) {
    return this.verificationGrpcService.sendOtp(data);
  }

  @GrpcMethod('VerificationService', 'VerifyOtp')
  verifyOtp(data: VerifyOtpRequest) {
    return this.verificationGrpcService.verifyOtp(data);
  }

  @GrpcMethod('VerificationService', 'ValidateVerificationToken')
  validateVerificationToken(data: ValidateVerificationTokenRequest) {
    return this.verificationGrpcService.validateVerificationToken(data);
  }
}
