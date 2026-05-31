import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { ProfileService } from './profile.service';
import { UserGrpcController } from './user.grpc.controller';

@Module({
  imports: [SharedModule],
  controllers: [UserGrpcController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class UserModule {}
