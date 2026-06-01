import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UserGatewayController } from './user.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { UserClientService } from '../services/user-client.service';

describe('UserGatewayController', () => {
  let controller: UserGatewayController;
  let authClient: jest.Mocked<AuthClientService>;
  let userClient: jest.Mocked<UserClientService>;

  beforeEach(async () => {
    authClient = {
      validateToken: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<AuthClientService>;

    userClient = {
      getProfile: jest.fn(),
      getProfileByUsername: jest.fn(),
      checkUsername: jest.fn(),
      setUsername: jest.fn(),
      updateAvatar: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<UserClientService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserGatewayController],
      providers: [
        { provide: AuthClientService, useValue: authClient },
        { provide: UserClientService, useValue: userClient },
      ],
    }).compile();

    controller = module.get<UserGatewayController>(UserGatewayController);
  });

  it('delegates avatar update with validated user id', async () => {
    authClient.validateToken.mockResolvedValue({
      statusCode: 200,
      message: 'Token validation successful',
      data: {
        isValid: true,
        userId: 'user-1',
        email: 'user@example.com',
      },
    });
    userClient.updateAvatar.mockResolvedValue({
      statusCode: 200,
      message: 'Avatar updated successfully',
      data: {},
    });

    await controller.updateAvatar('Bearer access-token', { avatar: 'https://cdn.example.com/a.jpg' });

    expect(userClient.updateAvatar).toHaveBeenCalledWith({
      userId: 'user-1',
      avatar: 'https://cdn.example.com/a.jpg',
    });
  });

  it('forwards verification token when setting username', async () => {
    authClient.validateToken.mockResolvedValue({
      statusCode: 200,
      message: 'Token validation successful',
      data: {
        isValid: true,
        userId: 'user-1',
        email: 'user@example.com',
      },
    });
    userClient.setUsername.mockResolvedValue({
      statusCode: 200,
      message: 'Username set successfully',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-1',
        email: 'user@example.com',
      },
    });

    await controller.setUsername('Bearer access-token', 'verification-token', { username: 'newname' });

    expect(userClient.setUsername).toHaveBeenCalledWith({
      userId: 'user-1',
      username: 'newname',
      verificationToken: 'verification-token',
    });
  });

  it('delegates username check to user client', async () => {
    userClient.checkUsername.mockResolvedValue({
      statusCode: 200,
      message: 'Username is available',
      data: { isAvailable: true },
    });

    await controller.checkUsername({ username: 'newuser' });

    expect(userClient.checkUsername).toHaveBeenCalledWith({ username: 'newuser' });
  });

  it('rejects profile fetch without authorization header', async () => {
    await expect(controller.getMyProfile(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects avatar update when token validation fails', async () => {
    authClient.validateToken.mockResolvedValue({
      statusCode: 401,
      message: 'Invalid token',
      data: { isValid: false, userId: '', email: '' },
    });

    await expect(
      controller.updateAvatar('Bearer bad-token', { avatar: 'https://cdn.example.com/a.jpg' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
