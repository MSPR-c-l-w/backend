import { Module } from '@nestjs/common';
import { SessionController } from './controllers/session/session.controller';
import { SessionService } from './services/session/session.service';
import { SERVICES } from 'src/utils/constants';

@Module({
  controllers: [SessionController],
  providers: [
    SessionService,
    {
      provide: SERVICES.SESSION,
      useClass: SessionService,
    },
  ],
  exports: [
    SessionService,
    {
      provide: SERVICES.SESSION,
      useClass: SessionService,
    },
  ],
})
export class SessionModule {}
