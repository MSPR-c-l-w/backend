import { Module } from '@nestjs/common';
import { HealthProfileService } from './services/health-profile/health-profile.service';
import { HealthProfileController } from './controllers/health-profile/health-profile.controller';
import { SERVICES } from 'src/utils/constants';

@Module({
  providers: [HealthProfileService, {
    provide: SERVICES.HEALTH_PROFILE,
    useClass: HealthProfileService,
  }],
  controllers: [HealthProfileController],
  exports: [HealthProfileService],
})
export class HealthProfileModule {}
