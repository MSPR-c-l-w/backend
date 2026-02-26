import { Test, TestingModule } from '@nestjs/testing';
import { HealthProfileController } from './health-profile.controller';
import { SERVICES } from 'src/utils/constants';

describe('HealthProfileController', () => {
  let controller: HealthProfileController;
  const healthProfileServiceMock = {
    getHealthProfiles: jest.fn(),
    getHealthProfile: jest.fn(),
    runHealthProfilePipeline: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthProfileController],
      providers: [
        {
          provide: SERVICES.HEALTH_PROFILE,
          useValue: healthProfileServiceMock,
        },
      ],
    }).compile();

    controller = module.get<HealthProfileController>(HealthProfileController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getHealthProfiles should call service and return health profiles', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const healthProfiles = [{ id: 1 }, { id: 2 }] as any;
    healthProfileServiceMock.getHealthProfiles.mockResolvedValue(
      healthProfiles,
    );

    await expect(controller.getHealthProfiles()).resolves.toEqual(
      healthProfiles,
    );
    expect(healthProfileServiceMock.getHealthProfiles).toHaveBeenCalledTimes(1);
  });

  it('getHealthProfile should call service with id and return health profile', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const healthProfile = { id: 123 } as any;
    healthProfileServiceMock.getHealthProfile.mockResolvedValue(healthProfile);

    await expect(controller.getHealthProfile('123')).resolves.toEqual(
      healthProfile,
    );
    expect(healthProfileServiceMock.getHealthProfile).toHaveBeenCalledWith(
      '123',
    );
  });

  it('triggerImport should call service and return success message', async () => {
    healthProfileServiceMock.runHealthProfilePipeline.mockResolvedValue(150);

    const result = await controller.triggerImport();

    expect(result).toEqual({
      message:
        'Le pipeline ETL HealthProfile a été exécuté avec succès et les user_id ont été redistribués.',
      imported: 150,
      updated: 150,
      usersCreated: 0,
    });
    expect(
      healthProfileServiceMock.runHealthProfilePipeline,
    ).toHaveBeenCalledTimes(1);
  });
});
