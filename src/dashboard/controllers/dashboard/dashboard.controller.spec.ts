import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

describe('DashboardController', () => {
  let controller: DashboardController;
  const dashboardServiceMock = {
    getPilotage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: dashboardServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPilotage', () => {
    it('appelle le service getPilotage et retourne le DTO', async () => {
      const pilotage = {
        kpis: {
          dataQuality: { value: '85.0%', trend: '+' },
          activeUsers: { value: '60', trend: '60.0% actifs' },
          premiumConversion: { value: '20.0%', trend: '—' },
          pipelineErrors: { value: '0', trend: '—' },
        },
        dataQualityTrend: [],
        ageDistribution: [],
        objectivesData: [],
        alerts: [],
      };
      dashboardServiceMock.getPilotage.mockResolvedValue(pilotage);

      const result = await controller.getPilotage();

      expect(result).toEqual(pilotage);
      expect(dashboardServiceMock.getPilotage).toHaveBeenCalledTimes(1);
      expect(dashboardServiceMock.getPilotage).toHaveBeenCalledWith();
    });
  });
});
