/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { Workout_SessionController } from './workout-session.controller';
import { SERVICES } from 'src/utils/constants';
import type { Request } from 'express';

describe('WorkoutSessionController', () => {
  let controller: Workout_SessionController;
  let service: any;

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
      controllers: [Workout_SessionController],
      providers: [
        {
          provide: SERVICES.WORKOUT_SESSION,
          useValue: {
            getUserSummary: jest
              .fn()
              .mockResolvedValue({ total_calories: 800, total_sessions: 1 }),
            getUserLevel: jest.fn().mockResolvedValue({ level: 'Actif' }),
            getIntensityStats: jest.fn().mockResolvedValue({ avg_bpm: 145 }),
            getWorkoutSessions: jest
              .fn()
              .mockResolvedValue([mockWorkoutSession]),
            getWorkoutSessionById: jest
              .fn()
              .mockResolvedValue(mockWorkoutSession),
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

    controller = module.get<Workout_SessionController>(
      Workout_SessionController,
    );
    service = module.get(SERVICES.WORKOUT_SESSION);
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
      const result = await controller.getHistory(1);
      expect(Array.isArray(result)).toBe(true);
      expect(service.getWorkoutSessions).toHaveBeenCalledWith(1);
    });
  });

  describe('getSessionById', () => {
    it('should return a specific session', async () => {
      const result = await controller.getSessionById(1);
      expect(result.id).toEqual(1);
      expect(service.getWorkoutSessionById).toHaveBeenCalledWith(1);
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
