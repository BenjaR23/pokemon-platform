import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  const appServiceMock = {
    getHello: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('should return the API status', async () => {
    appServiceMock.getHello.mockResolvedValue(
      'API + PostgreSQL funcionando correctamente',
    );

    await expect(appController.getHello()).resolves.toBe(
      'API + PostgreSQL funcionando correctamente',
    );

    expect(appServiceMock.getHello).toHaveBeenCalledTimes(1);
  });
});
