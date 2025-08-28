import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthGrpcService } from './auth.grpc.service';

@Controller()
export class AuthGrpcController {
  constructor(private readonly authGrpcService: AuthGrpcService) {}

  @GrpcMethod('AuthService', 'Register')
  async register(data: any) {
    return this.authGrpcService.register(data);
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: any) {
    return this.authGrpcService.login(data);
  }

  @GrpcMethod('AuthService', 'SocialLogin')
  async socialLogin(data: any) {
    return this.authGrpcService.socialLogin(data);
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: any) {
    return this.authGrpcService.refreshToken(data);
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: any) {
    return this.authGrpcService.logout(data);
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: any) {
    return this.authGrpcService.validateToken(data);
  }
}
