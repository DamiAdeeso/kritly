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

  @GrpcMethod('AuthService', 'CheckUsername')
  async checkUsername(data: any) {
    return this.authGrpcService.checkUsername(data);
  }

  @GrpcMethod('AuthService', 'SetUsername')
  async setUsername(data: any) {
    return this.authGrpcService.setUsername(data);
  }

  @GrpcMethod('AuthService', 'UpdateDisplayName')
  async updateDisplayName(data: any) {
    return this.authGrpcService.updateDisplayName(data);
  }

  @GrpcMethod('AuthService', 'UpdateAvatar')
  async updateAvatar(data: any) {
    return this.authGrpcService.updateAvatar(data);
  }
}
