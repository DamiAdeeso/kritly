import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { ProfileService } from './profile.service';
import { UserGrpcImplementation } from './user.grpc.implementation';

@Module({
  imports: [SharedModule],
  providers: [ProfileService, UserGrpcImplementation],
  exports: [ProfileService, UserGrpcImplementation],
})
export class UserModule {}
