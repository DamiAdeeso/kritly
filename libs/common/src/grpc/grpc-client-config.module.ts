import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GrpcClientConfigService } from './grpc-client-config.service';

@Module({
  imports: [ConfigModule],
  providers: [GrpcClientConfigService],
  exports: [GrpcClientConfigService],
})
export class GrpcClientConfigModule {}
