import { Injectable, NotFoundException } from '@nestjs/common';
import { Subscription } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { ISubscriptionService } from 'src/subscription/interface/subscription/subscription.interface';

@Injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscriptions(): Promise<Subscription[]> {
    const subscriptions = await this.prisma.subscription.findMany();
    if (subscriptions.length === 0) {
      throw new NotFoundException('NO_SUBSCRIPTIONS_FOUND');
    }
    return subscriptions;
  }

  async getSubscriptionById(id: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: parseInt(id) },
    });
    if (!subscription) {
      throw new Error(`Subscription with id ${id} not found`);
    }
    return subscription;
  }
}
