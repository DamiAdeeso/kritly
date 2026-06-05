// Enums and constants first — avoids partial barrel exports in downstream imports
export * from './enums/auth.enum';
export * from './constants/auth.constants';
export * from './constants/notification.constants';
export * from './constants/upload.constants';
export * from './constants/verification.constants';
export * from './constants/profile.constants';

// DTOs
export * from './dto/auth.dto';
export * from './dto/auth-session.dto';
export * from './dto/user.dto';
export * from './dto/upload.dto';
export * from './dto/verification.dto';
export * from './dto/common.dto';

// Interfaces
export * from './interfaces/social-profile.interface';
export * from './interfaces/user.interface';
export * from './interfaces/http-client.interface';
export * from './interfaces/notification.interface';

// Decorators
export * from './decorators/api-envelope-errors.decorator';

// Config
export * from './config/env.validation';
export * from './config/root-env';
export * from './config/grpc-client.config';
export * from './config/grpc-tls.config';

// gRPC
export * from './grpc/grpc-client.factory';
export * from './grpc/grpc-credentials.util';
export * from './grpc/grpc-client-config.service';
export * from './grpc/grpc-client-config.module';
export * from './grpc/grpc-server.util';
export * from './grpc/grpc-status.util';
export { ClientError, ServerError, Status } from 'nice-grpc';
export * from './grpc/grpc-server.runner';
export * from './grpc/grpc-logging.middleware';
export * from './grpc/grpc-server-credentials.util';
export * from './grpc/health-grpc.implementation';

// Generated gRPC types + clients (run: npm run proto:generate)
export {
  AuthServiceDefinition,
  RegisterRequest,
  LoginRequest,
  SocialLoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  CheckEmailRequest,
} from './generated/auth';
export type { AuthServiceClient, AuthServiceImplementation } from './generated/auth';
export type { UserServiceImplementation } from './generated/user';
export type { UploadServiceImplementation } from './generated/upload';
export type { VerificationServiceImplementation } from './generated/verification';
export type { HealthServiceImplementation } from './generated/health';
export {
  UserServiceDefinition,
  GetProfileRequest,
  GetProfileByUsernameRequest,
  CheckUsernameRequest,
  SetUsernameRequest,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from './generated/user';
export type { UserServiceClient } from './generated/user';
export {
  UploadServiceDefinition,
  CreatePresignedUploadRequest,
} from './generated/upload';
export type { UploadServiceClient } from './generated/upload';
export {
  VerificationServiceDefinition,
  SendOtpRequest,
  VerifyOtpRequest,
  ValidateVerificationTokenRequest,
  ConsumeVerificationTokenRequest,
} from './generated/verification';
export type { VerificationServiceClient } from './generated/verification';
export { HealthDefinition } from './generated/health';
export type { HealthClient } from './generated/health';

export type { ProfileData } from './generated/profile';
export type { UsernameAvailabilityData } from './generated/user';
export type { PresignedUploadData } from './generated/upload';
export type {
  SendOtpData,
  VerifyOtpData,
  ValidateVerificationTokenData,
} from './generated/verification';
export type { AuthData, EmailAvailabilityData, LoginSessionData } from './generated/auth';
export type { ValidateTokenData } from './dto/common.dto';
export type { Empty } from './generated/google/protobuf/empty';

// Utils
export * from './utils/service-response.util';
export * from './utils/http-envelope.util';
export * from './utils/http-exception-message.util';
export * from './utils/display-name.util';
export * from './utils/redact.util';
export * from './utils/otp-bypass.util';

// Logging
export * from './logging/logger.constants';
export * from './logging/app-logger.module';
export * from './logging/app-logger.util';
export { Logger } from 'nestjs-pino';

// Redis
export * from './redis/redis.constants';
export * from './redis/redis.module';
export * from './redis/redis.service';

// Domain events (producers)
export * from './events/integration-event.interface';
export * from './events/domain-events.constants';
export * from './events/user.events';
export * from './events/verification.events';
export * from './events/event-bus.constants';
export * from './events/event-publisher.constants';
export * from './events/event-publisher.module';
export * from './events/event-publisher.service';
