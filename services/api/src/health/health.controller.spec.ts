import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  let controller: HealthController;

  const healthServiceMock = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthServiceMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the health status', async () => {
    const healthStatus = {
      status: 'ok',
      database: 'ok',
    };

    healthServiceMock.check.mockResolvedValue(healthStatus);

    await expect(controller.check()).resolves.toEqual(healthStatus);

    expect(healthServiceMock.check).toHaveBeenCalledTimes(1);
  });
});
