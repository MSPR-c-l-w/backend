import { Module } from '@nestjs/common';
import { SubscriptionService } from './services/subscription/subscription.service';
import { SubscriptionController } from './controllers/subscription/subscription.controller';
import { SERVICES } from 'src/utils/constants';

@Module({
  providers: [
    SubscriptionService,
    {
      provide: SERVICES.SUBSCRIPTION,
      useClass: SubscriptionService,
    },
  ],
  controllers: [SubscriptionController],
  exports: [
    SubscriptionService,
    {
      provide: SERVICES.SUBSCRIPTION,
      useClass: SubscriptionService,
    },
  ],
})
export class SubscriptionModule {}
