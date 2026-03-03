import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EtlController } from './controllers/etl/etl.controller';
import { EtlService } from './services/etl/etl.service';
import { EtlStagingService } from './services/etl/etl-staging.service';
import { EtlGateway } from './gateways/etl/etl.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [EtlController],
  providers: [EtlService, EtlStagingService, EtlGateway],
  exports: [EtlService],
})
export class EtlModule {}
