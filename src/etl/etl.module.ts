import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EtlController } from './controllers/etl/etl.controller';
import { EtlService } from './services/etl/etl.service';
import { EtlGateway } from './gateways/etl/etl.gateway';
import { EtlStagingService } from './services/etl-staging/etl-staging.service';
import { EtlAnomalyDetectorService } from './services/etl-anomaly-detector/etl-anomaly-detector.service';

@Module({
  imports: [PrismaModule],
  controllers: [EtlController],
  providers: [
    EtlService,
    EtlStagingService,
    EtlGateway,
    EtlAnomalyDetectorService,
  ],
  exports: [EtlService, EtlAnomalyDetectorService],
})
export class EtlModule {}
