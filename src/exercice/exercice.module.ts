import { Module } from '@nestjs/common';
import { ExerciceService } from './services/exercice/exercice.service';
import { ExerciceController } from './controllers/exercice/exercice.controller';
import { SERVICES } from 'src/utils/constants';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
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
