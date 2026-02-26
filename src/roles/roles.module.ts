import { Module } from '@nestjs/common';
import { RolesService } from './services/roles/roles.service';
import { RolesController } from './controllers/roles/roles.controller';
import { SERVICES } from 'src/utils/constants';

@Module({
  providers: [
    RolesService,
    {
      provide: SERVICES.ROLES,
      useClass: RolesService,
    },
  ],
  controllers: [RolesController],
  exports: [
    RolesService,
    {
      provide: SERVICES.ROLES,
      useClass: RolesService,
    },
  ],
})
export class RolesModule {}
