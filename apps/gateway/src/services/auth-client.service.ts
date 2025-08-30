import { ChannelCredentials } from '@grpc/grpc-js';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';

interface AuthService {
  register(data: any): Promise<any>;
  login(data: any): Promise<any>;
  socialLogin(data: any): Promise<any>;
  refreshToken(data: any): Promise<any>;
  logout(data: any): Promise<any>;
  validateToken(data: any): Promise<any>;
}

@Injectable()
export class AuthClientService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(process.cwd(), 'libs/common/src/proto/auth.proto'),
      url: `${process.env.AUTH_SERVICE_HOST || 'localhost'}:${process.env.AUTH_SERVICE_PORT || 3001}`,
      credentials: ChannelCredentials.createSsl(),
    },
  })
  private client: ClientGrpc;

  private authService: AuthService;

  onModuleInit() {
    this.authService = this.client.getService<AuthService>('AuthService');
  }

  async register(data: any) {
    return this.authService.register(data);
  }

  async login(data: any) {
    return this.authService.login(data);
  }

  async socialLogin(data: any) {
    return this.authService.socialLogin(data);
  }

  async refreshToken(data: any) {
    return this.authService.refreshToken(data);
  }

  async logout(data: any) {
    return this.authService.logout(data);
  }

  async validateToken(data: any) {
    return this.authService.validateToken(data);
  }
}
