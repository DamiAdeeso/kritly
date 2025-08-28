import { IsString, IsEmail, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { AuthProvider } from '../enums/auth.enum';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

export class SocialLoginDto {
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  refreshToken: string;
}

export class AuthDataDto {
  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;

  @IsString()
  userId: string;

  @IsString()
  email: string;
}

export class AuthResponseDto {
  @IsString()
  message: string;

  data: AuthDataDto;

  @IsNumber()
  statusCode: number;
}
