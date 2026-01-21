import { Module } from '@nestjs/common';
import { PlanService } from './services/plan/plan.service';
import { PlanController } from './controllers/plan/plan.controller';
import { SERVICES } from 'src/utils/constants';

@Module({
  providers: [
    PlanService,
    {
      provide: SERVICES.PLAN,
      useClass: PlanService,
    },
  ],
  controllers: [PlanController],
  exports: [
    PlanService,
    {
      provide: SERVICES.PLAN,
      useClass: PlanService,
    },
  ],
})
export class PlanModule {}
