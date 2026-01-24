import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  const prismaMock = {
    subscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubscriptions', () => {
    it('returns subscriptions when found', async () => {
      const subscriptions = [{ id: 1 }, { id: 2 }] as any;
      prismaMock.subscription.findMany.mockResolvedValue(subscriptions);

      await expect(service.getSubscriptions()).resolves.toEqual(subscriptions);
      expect(prismaMock.subscription.findMany).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when none found', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);

      await expect(service.getSubscriptions()).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getSubscriptionById', () => {
    it('returns subscription when found and parses id', async () => {
      const subscription = { id: 42 } as any;
      prismaMock.subscription.findUnique.mockResolvedValue(subscription);

      await expect(service.getSubscriptionById('42')).resolves.toEqual(subscription);
      expect(prismaMock.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it('throws when not found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await expect(service.getSubscriptionById('42')).rejects.toBeInstanceOf(Error);
    });
  });
});
