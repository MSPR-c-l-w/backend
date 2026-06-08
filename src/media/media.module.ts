import { Module } from '@nestjs/common';
import { MediaController } from './controllers/media/media.controller';
import { StorageService } from './services/storage/storage.service';
import { SERVICES } from 'src/utils/constants';

@Module({
  providers: [
    StorageService,
    {
      provide: SERVICES.STORAGE,
      useExisting: StorageService,
    },
  ],
  controllers: [MediaController],
  exports: [StorageService],
})
export class MediaModule {}
