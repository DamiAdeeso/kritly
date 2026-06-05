import { Test, TestingModule } from '@nestjs/testing';
import { UserGatewayController } from './user.gateway.controller';
import { UserClientService } from '../services/user-client.service';
import { bypassJwtAuthGuard } from '../auth/test-auth.util';

describe('UserGatewayController', () => {
  let controller: UserGatewayController;
  let userClient: jest.Mocked<UserClientService>;

  const user = {
    userId: 'user-1',
    email: 'user@example.com',
    role: 'USER',
  };

  beforeEach(async () => {
    userClient = {
      getProfile: jest.fn(),
      getProfileByUsername: jest.fn(),
      checkUsername: jest.fn(),
      setUsername: jest.fn(),
      updateAvatar: jest.fn(),
      updateProfile: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<UserClientService>;

    const module: TestingModule = await bypassJwtAuthGuard(
      Test.createTestingModule({
        controllers: [UserGatewayController],
        providers: [{ provide: UserClientService, useValue: userClient }],
      }),
    ).compile();

    controller = module.get<UserGatewayController>(UserGatewayController);
  });

  it('delegates avatar update with authenticated user id', async () => {
    userClient.updateAvatar.mockResolvedValue({});

    await controller.updateAvatar(user, { avatar: 'https://cdn.example.com/a.jpg' });

    expect(userClient.updateAvatar).toHaveBeenCalledWith({
      userId: 'user-1',
      avatar: 'https://cdn.example.com/a.jpg',
    });
  });

  it('delegates username set with authenticated user id', async () => {
    userClient.setUsername.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 'user-1',
      email: 'user@example.com',
    });

    await controller.setUsername(user, { username: 'newname' });

    expect(userClient.setUsername).toHaveBeenCalledWith({
      userId: 'user-1',
      username: 'newname',
    });
  });

  it('delegates username check to user client', async () => {
    userClient.checkUsername.mockResolvedValue({ isAvailable: true });

    await controller.checkUsername({ username: 'newuser' });

    expect(userClient.checkUsername).toHaveBeenCalledWith({ username: 'newuser' });
  });

  it('delegates profile fetch for authenticated user', async () => {
    userClient.getProfile.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      username: 'user123',
      displayName: 'John Doe',
      bio: '',
      avatar: '',
    });

    await controller.getMyProfile(user);

    expect(userClient.getProfile).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});
