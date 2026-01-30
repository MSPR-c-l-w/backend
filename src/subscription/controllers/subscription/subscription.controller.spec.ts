/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SERVICES } from 'src/utils/constants';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  const subscriptionServiceMock = {
    getSubscriptions: jest.fn(),
    getSubscriptionById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SERVICES.SUBSCRIPTION,
          useValue: subscriptionServiceMock,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getSubscriptions should call service and return subscriptions', async () => {
    const subscriptions = [{ id: 1 }, { id: 2 }] as any;
    subscriptionServiceMock.getSubscriptions.mockResolvedValue(subscriptions);

    await expect(controller.getSubscriptions()).resolves.toEqual(subscriptions);
    expect(subscriptionServiceMock.getSubscriptions).toHaveBeenCalledTimes(1);
  });

  it('getSubscriptionById should call service with id and return subscription', async () => {
    const subscription = { id: 123 } as any;
    subscriptionServiceMock.getSubscriptionById.mockResolvedValue(subscription);

    await expect(controller.getSubscriptionById('123')).resolves.toEqual(
      subscription,
    );
    expect(subscriptionServiceMock.getSubscriptionById).toHaveBeenCalledWith(
      '123',
    );
  });
});
