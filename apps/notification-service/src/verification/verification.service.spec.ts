import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import { DOMAIN_EVENTS, EventPublisher, OtpChannel, OtpPurpose } from '@kritly/common';
import { VerificationService } from './verification.service';
import { OtpService } from './otp.service';

describe('VerificationService', () => {
  let service: VerificationService;
  let otpService: jest.Mocked<OtpService>;
  let eventPublisher: jest.Mocked<Pick<EventPublisher, 'publish'>>;

  beforeEach(async () => {
    otpService = {
      normalizeSubject: jest.fn((subject: string) => subject.trim().toLowerCase()),
      assertCanSend: jest.fn().mockResolvedValue(undefined),
      generateCode: jest.fn().mockReturnValue('123456'),
      storeCode: jest.fn().mockResolvedValue(600),
      getTtlSeconds: jest.fn().mockReturnValue(600),
      isBypassActive: jest.fn().mockReturnValue(false),
      verifyCode: jest.fn().mockResolvedValue({ userId: 'user@example.com' }),
      issueVerificationToken: jest.fn().mockResolvedValue({
        verificationToken: 'verification-token',
        expiresAt: 1_700_000_000,
      }),
      validateVerificationToken: jest.fn(),
      consumeVerificationToken: jest.fn(),
      formatExpiresIn: jest.fn().mockReturnValue('10 minutes'),
      purposeLabel: jest.fn().mockReturnValue('password reset'),
    } as unknown as jest.Mocked<OtpService>;

    eventPublisher = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: OtpService, useValue: otpService },
        { provide: EventPublisher, useValue: eventPublisher },
        {
          provide: getLoggerToken(VerificationService.name),
          useValue: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
  });

  describe('sendOtp', () => {
    it('queues email OTP for async delivery', async () => {
      const result = await service.sendOtp({
        subject: 'user@example.com',
        purpose: OtpPurpose.PASSWORD_RESET,
        channel: OtpChannel.EMAIL,
      });

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        DOMAIN_EVENTS.VERIFICATION_OTP_REQUESTED,
        expect.objectContaining({
          recipient: 'user@example.com',
          purpose: OtpPurpose.PASSWORD_RESET,
          code: '123456',
          expiresIn: '10 minutes',
          purposeLabel: 'password reset',
        }),
        expect.objectContaining({ idempotencyKey: expect.stringContaining('otp:') }),
      );
      expect(result.expiresInSeconds).toBe(600);
    });

    it('rejects invalid purpose', async () => {
      await expect(
        service.sendOtp({
          subject: 'user@example.com',
          purpose: 'invalid' as OtpPurpose,
          channel: OtpChannel.EMAIL,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid channel', async () => {
      await expect(
        service.sendOtp({
          subject: 'user@example.com',
          purpose: OtpPurpose.PASSWORD_RESET,
          channel: 'sms' as OtpChannel,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects unsupported SMS channel', async () => {
      await expect(
        service.sendOtp({
          subject: '+15551234567',
          purpose: OtpPurpose.PASSWORD_RESET,
          channel: OtpChannel.SMS,
        }),
      ).rejects.toThrow(new BadRequestException('SMS verification is not enabled yet'));
    });

    it('skips email delivery when OTP bypass is active', async () => {
      otpService.isBypassActive.mockReturnValue(true);

      const result = await service.sendOtp({
        subject: 'user@example.com',
        purpose: OtpPurpose.PASSWORD_RESET,
        channel: OtpChannel.EMAIL,
      });

      expect(eventPublisher.publish).not.toHaveBeenCalled();
      expect(otpService.generateCode).not.toHaveBeenCalled();
      expect(otpService.storeCode).not.toHaveBeenCalled();
      expect(result.expiresInSeconds).toBe(600);
    });
  });

  describe('verifyOtp', () => {
    it('returns verification token on success', async () => {
      const result = await service.verifyOtp({
        subject: 'user@example.com',
        purpose: OtpPurpose.PASSWORD_RESET,
        code: '123456',
      });

      expect(result.verificationToken).toBe('verification-token');
    });
  });

  describe('validateVerificationToken', () => {
    it('returns valid result without throwing', async () => {
      otpService.validateVerificationToken.mockResolvedValue(true);

      const result = await service.validateVerificationToken({
        verificationToken: 'verification-token',
        purpose: OtpPurpose.PASSWORD_RESET,
        userId: 'user@example.com',
      });

      expect(result.isValid).toBe(true);
    });

    it('returns invalid result without throwing', async () => {
      otpService.validateVerificationToken.mockResolvedValue(false);

      const result = await service.validateVerificationToken({
        verificationToken: 'verification-token',
        purpose: OtpPurpose.PASSWORD_RESET,
        userId: 'user@example.com',
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe('consumeVerificationToken', () => {
    it('returns consumed result without throwing', async () => {
      otpService.consumeVerificationToken.mockResolvedValue(true);

      const result = await service.consumeVerificationToken({
        verificationToken: 'verification-token',
        purpose: OtpPurpose.PASSWORD_RESET,
        email: 'user@example.com',
      });

      expect(result.isValid).toBe(true);
    });

    it('returns invalid result when token cannot be consumed', async () => {
      otpService.consumeVerificationToken.mockResolvedValue(false);

      const result = await service.consumeVerificationToken({
        verificationToken: 'verification-token',
        purpose: OtpPurpose.PASSWORD_RESET,
        email: 'user@example.com',
      });

      expect(result.isValid).toBe(false);
    });
  });
});
