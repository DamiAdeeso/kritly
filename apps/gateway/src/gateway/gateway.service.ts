import { Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GatewayService {
  private authClient: ClientProxy;

  constructor(private readonly configService: ConfigService) {
    this.authClient = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: this.configService.get('AUTH_SERVICE_HOST', 'localhost'),
        port: this.configService.get('AUTH_SERVICE_PORT', 3001),
      },
    });
  }

  async forwardToAuthService(pattern: string, data: any): Promise<any> {
    return this.authClient.send(pattern, data).toPromise();
  }

  async emitToAuthService(pattern: string, data: any): Promise<void> {
    this.authClient.emit(pattern, data);
  }
}
