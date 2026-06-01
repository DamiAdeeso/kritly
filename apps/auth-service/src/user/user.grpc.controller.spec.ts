import { lastValueFrom, Observable } from 'rxjs';
import { NotFoundException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { GrpcServiceResponseExceptionFilter } from '@kritly/common';
import { UserGrpcController } from './user.grpc.controller';
import { ProfileService } from './profile.service';

describe('UserGrpcController', () => {
  let controller: UserGrpcController;
  let profileService: jest.Mocked<Pick<ProfileService, 'getProfile'>>;
  const filter = new GrpcServiceResponseExceptionFilter();
  const rpcHost = { getType: () => 'rpc' } as ArgumentsHost;

  beforeEach(() => {
    profileService = {
      getProfile: jest.fn(),
    };
    controller = new UserGrpcController(profileService as unknown as ProfileService);
  });

  it('delegates getProfile to ProfileService', async () => {
    profileService.getProfile.mockResolvedValue({
      statusCode: 200,
      message: 'Profile retrieved successfully',
      data: {
        userId: 'user-1',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    const result = await controller.getProfile({ userId: 'user-1' });

    expect(profileService.getProfile).toHaveBeenCalledWith('user-1');
    expect(result.statusCode).toBe(200);
  });

  it('maps not found failures to fail envelope through the global filter contract', async () => {
    profileService.getProfile.mockRejectedValue(new NotFoundException('Profile not found'));

    const envelope = await lastValueFrom(
      filter.catch(new NotFoundException('Profile not found'), rpcHost) as Observable<unknown>,
    );

    expect(envelope).toEqual({
      statusCode: 404,
      message: 'Profile not found',
      data: null,
    });
  });
});
