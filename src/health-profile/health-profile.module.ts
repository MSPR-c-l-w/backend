import { Module } from '@nestjs/common';
import { HealthProfileService } from './services/health-profile/health-profile.service';
import { HealthProfileController } from './controllers/health-profile/health-profile.controller';
import { SERVICES } from 'src/utils/constants';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EtlModule } from 'src/etl/etl.module';

@Module({
  imports: [PrismaModule, HttpModule, EtlModule],
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
