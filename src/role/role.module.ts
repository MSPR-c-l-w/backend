/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { RoleController } from './controllers/role/role.controller';
import { RoleService } from './services/role/role.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SERVICES } from 'src/utils/constants';

@Module({
  imports: [PrismaModule],
  controllers: [RoleController],
  providers: [
    RoleService,
    {
      provide: SERVICES.ROLE,
      useClass: RoleService,
    },
  ],
  exports: [
    RoleService,
    {
      provide: SERVICES.ROLE,
      useClass: RoleService,
    },
  ],
})
export class RoleModule {}
