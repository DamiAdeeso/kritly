import { Test, TestingModule } from '@nestjs/testing';
import { UserGatewayController } from './user.gateway.controller';
import { AuthClientService } from '../services/auth-client.service';
import { UserClientService } from '../services/user-client.service';
import { VerificationClientService } from '../services/verification-client.service';
import { VerificationGuard } from '../guards/verification.guard';

describe('UserGatewayController', () => {
  let controller: UserGatewayController;
  let authClient: jest.Mocked<AuthClientService>;
  let userClient: jest.Mocked<UserClientService>;
  let verificationClient: jest.Mocked<VerificationClientService>;

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

    verificationClient = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
      validateVerificationToken: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<VerificationClientService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserGatewayController],
      providers: [
        { provide: AuthClientService, useValue: authClient },
        { provide: UserClientService, useValue: userClient },
        { provide: VerificationClientService, useValue: verificationClient },
        {
          provide: VerificationGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
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

  it('delegates username check to user client', async () => {
    userClient.checkUsername.mockResolvedValue({
      statusCode: 200,
      message: 'Username is available',
      data: { isAvailable: true },
    });

    await controller.checkUsername({ username: 'newuser' });

    expect(userClient.checkUsername).toHaveBeenCalledWith({ username: 'newuser' });
  });
});
