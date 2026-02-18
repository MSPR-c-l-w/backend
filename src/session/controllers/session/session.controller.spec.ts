/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from './session.controller';
import { SERVICES } from 'src/utils/constants';
import type { Request } from 'express';
import { ISessionService } from 'src/session/interfaces/session/session.interface';

describe('WorkoutSessionController', () => {
  let controller: SessionController;

  let service: ISessionService;

  const mockWorkoutSession = {
    id: 1,
    user_id: 1,
    duration_h: 1.5,
    calories_total: 800,
    avg_bpm: 145,
    max_bpm: 180,
    created_at: new Date(),
    logs: [{ id: 1, exercise_id: 1, exercise: { name: 'Running' } }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SERVICES.SESSION,
          useValue: {
            getUserSummary: jest
              .fn()
              .mockResolvedValue({ total_calories: 800, total_sessions: 1 }),
            getUserLevel: jest.fn().mockResolvedValue({ level: 'Actif' }),
            getIntensityStats: jest.fn().mockResolvedValue({ avg_bpm: 145 }),
            getSessions: jest.fn().mockResolvedValue([mockWorkoutSession]),
            getSessionById: jest.fn().mockResolvedValue(mockWorkoutSession),
            getTodaySummary: jest.fn().mockResolvedValue({
              total_sessions_today: 1,
              total_duration_h: 1.5,
              total_calories_burned: 800,
              average_intensity_percent: 80,
              date: '2026-01-31',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<SessionController>(SessionController);
    service = module.get<ISessionService>(SERVICES.SESSION);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return user dashboard summary', async () => {
      const result = await controller.getDashboard(1);
      expect(result).toHaveProperty('total_calories');
      expect(service.getUserSummary).toHaveBeenCalledWith(1);
    });
  });

  describe('getHistory', () => {
    it('should return all sessions for a user', async () => {
      const result = await controller.getHistory(1, undefined);
      expect(Array.isArray(result)).toBe(true);
      expect(service.getSessions).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe('getSessionById', () => {
    it('should return a specific session', async () => {
      const result = await controller.getSessionById(1);
      expect(result.id).toEqual(1);
      expect(service.getSessionById).toHaveBeenCalledWith(1);
    });
  });

  describe('getTodaySummary', () => {
    it('should call service with current user id', async () => {
      const req = { user: { sub: 1, email: 'a@b.com' } } as unknown as Request;
      const result = await controller.getTodaySummary(req, undefined);
      expect(result).toHaveProperty('total_sessions_today');
      expect(service.getTodaySummary).toHaveBeenCalledWith(1, undefined);
    });
  });
});
