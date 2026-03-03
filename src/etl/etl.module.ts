import { Module } from '@nestjs/common';
import { EtlService } from './services/etl/etl.service';
import { EtlGateway } from './gateways/etl/etl.gateway';

@Module({
  providers: [EtlService, EtlGateway],
  exports: [EtlService],
})
export class EtlModule {}
