import { Module } from '@nestjs/common';
import { EtlLogService } from './etl-log.service';
import { EtlLogGateway } from './etl-log.gateway';

@Module({
  providers: [EtlLogService, EtlLogGateway],
  exports: [EtlLogService],
})
export class EtlLogModule {}
