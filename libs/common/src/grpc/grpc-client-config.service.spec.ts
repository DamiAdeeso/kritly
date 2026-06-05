import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { GrpcClientConfigService } from './grpc-client-config.service';

describe('GrpcClientConfigService', () => {
  let service: GrpcClientConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              AUTH_SERVICE_HOST: 'auth-svc',
              AUTH_SERVICE_PORT: '4001',
              GRPC_USE_TLS: 'false',
            }),
          ],
        }),
      ],
      providers: [GrpcClientConfigService],
    }).compile();

    service = module.get(GrpcClientConfigService);
  });

  it('reads endpoints from ConfigService', () => {
    expect(service.getEndpoint('auth')).toEqual({
      host: 'auth-svc',
      port: '4001',
    });
  });

  it('falls back to defaults for unconfigured services', () => {
    expect(service.getEndpoint('upload')).toEqual({
      host: 'localhost',
      port: '3002',
    });
  });
});
