/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SessionService', () => {
  let service: SessionService;
  let prisma: PrismaService;

  const mockWorkoutSession = {
    id: 1,
    user_id: 1,
    duration_h: 1.5,
    calories_total: 600,
    avg_bpm: 120,
    max_bpm: 160,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: {
            session: {
              aggregate: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserSummary', () => {
    it('should return aggregated stats correctly', async () => {
      const mockAggregateResponse = {
        _sum: { calories_total: 1000, duration_h: 2.5 },
        _avg: { avg_bpm: 110 },
        _count: { id: 2 },
      };

      jest
        .spyOn(prisma.session, 'aggregate')
        .mockResolvedValue(mockAggregateResponse as never);

      const result = await service.getUserSummary(1);

      expect(result).toEqual({
        total_calories: 1000,
        total_hours: 2.5,
        average_bpm: 110,
        total_sessions: 2,
      });
    });
  });

  describe('getSessions', () => {
    it('should return an array of sessions', async () => {
      const mockSessions = [mockWorkoutSession];

      jest
        .spyOn(prisma.session, 'findMany')
        .mockResolvedValue(mockSessions as never);

      const result = await service.getSessions(1);

      expect(result).toEqual(mockSessions);

      expect(prisma.session.findMany).toHaveBeenCalled();
    });
  });

  describe('getSessionById', () => {
    it('should return a session when found', async () => {
      jest
        .spyOn(prisma.session, 'findUnique')
        .mockResolvedValue(mockWorkoutSession as never);

      const result = await service.getSessionById(1);
      expect(result).toEqual(mockWorkoutSession);
    });

    it('should throw NotFoundException when session does not exist', async () => {
      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(null);

      await expect(service.getSessionById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTodaySummary', () => {
    it('should return today summary with computed intensity', async () => {
      jest.spyOn(prisma.session, 'aggregate').mockResolvedValue({
        _sum: { calories_total: 1000, duration_h: 2 },
        _count: { id: 2 },
      } as never);

      jest.spyOn(prisma.session, 'findMany').mockResolvedValue([
        { avg_bpm: 120, max_bpm: 150, duration_h: 1 }, // 80%
        { avg_bpm: 90, max_bpm: 150, duration_h: 1 }, // 60%
      ] as never);

      const res = await service.getTodaySummary(1, '2026-01-31');
      expect(res.total_sessions_today).toBe(2);
      expect(res.total_duration_h).toBe(2);
      expect(res.total_calories_burned).toBe(1000);
      expect(res.average_intensity_percent).toBe(70);
      expect(res.date).toBe('2026-01-31');
    });
  });
});
