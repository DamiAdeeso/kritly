// DTOs
export * from './dto/auth.dto';
export * from './dto/user.dto';
export * from './dto/upload.dto';
export * from './dto/verification.dto';
export * from './dto/common.dto';

// Interfaces
export * from './interfaces/auth.interface';
export * from './interfaces/user.interface';
export * from './interfaces/grpc.interface';
export * from './interfaces/upload-grpc.interface';
export * from './interfaces/user-grpc.interface';
export * from './interfaces/verification-grpc.interface';
export * from './interfaces/notification.interface';

// Enums
export * from './enums/auth.enum';

// Constants
export * from './constants/auth.constants';
export * from './constants/notification.constants';
export * from './constants/upload.constants';
export * from './constants/verification.constants';
export * from './constants/profile.constants';

// Decorators
export * from './decorators/requires-verification.decorator';

// Config
export * from './config/env.validation';

// Generated gRPC types (run: npm run proto:generate)
export * from './generated/auth';
export type {
  CheckUsernameRequest,
  GetProfileByUsernameRequest,
  GetProfileRequest,
  ProfileData,
  ProfileResponse,
  SetUsernameAuthData,
  SetUsernameRequest,
  SetUsernameResponse,
  UpdateAvatarRequest,
  UpdateProfileResponse as UserUpdateProfileResponse,
  UsernameAvailabilityData,
  UsernameAvailabilityResponse,
} from './generated/user';
export type {
  CreatePresignedUploadRequest,
  CreatePresignedUploadResponse,
  PresignedUploadData,
} from './generated/upload';
export type {
  SendOtpRequest,
  SendOtpResponse,
  SendOtpData,
  VerifyOtpRequest,
  VerifyOtpResponse,
  VerifyOtpData,
  ValidateVerificationTokenRequest,
  ValidateVerificationTokenResponse,
  ValidateVerificationTokenData,
} from './generated/verification';

// Utils
export * from './utils/validation.util';

// Domain events (producers)
export * from './events/integration-event.interface';
export * from './events/domain-events.constants';
export * from './events/user.events';
export * from './events/event-bus.constants';
export * from './events/event-publisher.constants';
export * from './events/event-publisher.module';
export * from './events/event-publisher.service';
