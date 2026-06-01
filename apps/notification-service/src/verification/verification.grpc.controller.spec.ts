import { lastValueFrom, Observable } from 'rxjs';
import { BadRequestException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { GrpcServiceResponseExceptionFilter } from '@kritly/common';
import { PinoLogger } from 'nestjs-pino';
import { VerificationGrpcController } from './verification.grpc.controller';
import { VerificationService } from './verification.service';

describe('VerificationGrpcController', () => {
  let controller: VerificationGrpcController;
  let verificationService: jest.Mocked<Pick<VerificationService, 'sendOtp'>>;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;
  const filter = new GrpcServiceResponseExceptionFilter();
  const rpcHost = { getType: () => 'rpc' } as ArgumentsHost;

  beforeEach(() => {
    verificationService = {
      sendOtp: jest.fn(),
    };
    controller = new VerificationGrpcController(
      verificationService as unknown as VerificationService,
      logger,
    );
  });

  it('delegates sendOtp to VerificationService', async () => {
    verificationService.sendOtp.mockResolvedValue({
      statusCode: 200,
      message: 'Verification code sent',
      data: { expiresAt: 1, expiresInSeconds: 600 },
    });

    const result = await controller.sendOtp({
      subject: 'user@example.com',
      purpose: 'password_reset',
      channel: 'email',
    });

    expect(result.statusCode).toBe(200);
  });

  it('maps invalid purpose failures to fail envelope through the global filter contract', async () => {
    const envelope = await lastValueFrom(
      filter.catch(new BadRequestException('Invalid verification purpose: bad'), rpcHost) as Observable<unknown>,
    );

    expect(envelope).toEqual({
      statusCode: 400,
      message: 'Invalid verification purpose: bad',
      data: null,
    });
  });
});
