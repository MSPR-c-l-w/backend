import { Module } from '@nestjs/common';
import { HealthProfileService } from './services/health-profile/health-profile.service';
import { HealthProfileController } from './controllers/health-profile/health-profile.controller';
import { SERVICES } from 'src/utils/constants';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EtlLogModule } from 'src/etl-log/etl-log.module';

@Module({
  imports: [PrismaModule, HttpModule, EtlLogModule],
  providers: [
    HealthProfileService,
    {
      provide: SERVICES.HEALTH_PROFILE,
      useClass: HealthProfileService,
    },
  ],
  controllers: [HealthProfileController],
  exports: [
    HealthProfileService,
    {
      provide: SERVICES.HEALTH_PROFILE,
      useClass: HealthProfileService,
    },
  ],
})
export class HealthProfileModule {}
