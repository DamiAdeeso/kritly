import { Test, TestingModule } from '@nestjs/testing';
import { GatewayController } from './gateway.controller';

describe('GatewayController', () => {
  let controller: GatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
    }).compile();

    controller = module.get<GatewayController>(GatewayController);
  });

  it('returns gateway health status in REST envelope', () => {
    expect(controller.healthCheck()).toEqual({
      statusCode: 200,
      message: 'Gateway is healthy',
      data: {
        status: 'ok',
        timestamp: expect.any(String),
      },
    });
  });
});
