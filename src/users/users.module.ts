import { Module } from '@nestjs/common';
import { UsersService } from './services/users/users.service';
import { SERVICES } from 'src/utils/constants';
import { UsersController } from './controllers/users/users.controller';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [RolesModule],
  providers: [
    UsersService,
    {
      provide: SERVICES.USERS,
      useClass: UsersService,
    },
  ],
  controllers: [UsersController],
  exports: [
    UsersService,
    {
      provide: SERVICES.USERS,
      useClass: UsersService,
    },
  ],
})
export class UsersModule {}
