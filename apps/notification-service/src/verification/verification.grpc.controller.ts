import { Controller } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { GrpcMethod } from '@nestjs/microservices';
import {
  SendOtpRequest,
  ValidateVerificationTokenRequest,
  ConsumeVerificationTokenRequest,
  VerifyOtpRequest,
} from '@kritly/common';
import { VerificationService } from './verification.service';

@Controller()
export class VerificationGrpcController {
  constructor(
    private readonly verificationService: VerificationService,
    @InjectPinoLogger(VerificationGrpcController.name) private readonly logger: PinoLogger,
  ) {}

  @GrpcMethod('VerificationService', 'SendOtp')
  sendOtp(data: SendOtpRequest) {
    this.logger.info({ purpose: data.purpose, subject: data.subject }, 'SendOtp rpc');
    return this.verificationService.sendOtp(data);
  }

  @GrpcMethod('VerificationService', 'VerifyOtp')
  verifyOtp(data: VerifyOtpRequest) {
    this.logger.info({ purpose: data.purpose, subject: data.subject }, 'VerifyOtp rpc');
    return this.verificationService.verifyOtp(data);
  }

  @GrpcMethod('VerificationService', 'ValidateVerificationToken')
  validateVerificationToken(data: ValidateVerificationTokenRequest) {
    return this.verificationService.validateVerificationToken(data);
  }

  @GrpcMethod('VerificationService', 'ConsumeVerificationToken')
  consumeVerificationToken(data: ConsumeVerificationTokenRequest) {
    this.logger.info({ purpose: data.purpose }, 'ConsumeVerificationToken rpc');
    return this.verificationService.consumeVerificationToken(data);
  }
}
