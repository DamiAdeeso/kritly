import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  ConsumeVerificationTokenRequest,
  hashSubject,
  SendOtpRequest,
  ValidateVerificationTokenRequest,
  VerificationServiceImplementation,
  VerifyOtpRequest,
} from '@kritly/common';
import { VerificationService } from './verification.service';

@Injectable()
export class VerificationGrpcImplementation implements VerificationServiceImplementation {
  constructor(
    private readonly verificationService: VerificationService,
    @InjectPinoLogger(VerificationGrpcImplementation.name) private readonly logger: PinoLogger,
  ) {}

  sendOtp(request: SendOtpRequest) {
    this.logger.info(
      { purpose: request.purpose, subjectHash: hashSubject(request.subject) },
      'SendOtp rpc',
    );
    return this.verificationService.sendOtp(request);
  }

  verifyOtp(request: VerifyOtpRequest) {
    this.logger.info(
      { purpose: request.purpose, subjectHash: hashSubject(request.subject) },
      'VerifyOtp rpc',
    );
    return this.verificationService.verifyOtp(request);
  }

  validateVerificationToken(request: ValidateVerificationTokenRequest) {
    return this.verificationService.validateVerificationToken(request);
  }

  consumeVerificationToken(request: ConsumeVerificationTokenRequest) {
    this.logger.info({ purpose: request.purpose }, 'ConsumeVerificationToken rpc');
    return this.verificationService.consumeVerificationToken(request);
  }
}
