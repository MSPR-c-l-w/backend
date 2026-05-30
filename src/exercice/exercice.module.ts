import { Module } from '@nestjs/common';
import { ExerciceService } from './services/exercice/exercice.service';
import { ExerciceController } from './controllers/exercice/exercice.controller';
import { SERVICES } from 'src/utils/constants';
import { HttpModule } from '@nestjs/axios';
import { EtlModule } from 'src/etl/etl.module';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  imports: [HttpModule, EtlModule, MetricsModule],
  providers: [
    ExerciceService,
    {
      provide: SERVICES.EXERCISE,
      useClass: ExerciceService,
    },
  ],
  controllers: [ExerciceController],
  exports: [
    ExerciceService,
    {
      provide: SERVICES.EXERCISE,
      useClass: ExerciceService,
    },
  ],
})
export class ExerciceModule {}
