import { Module } from '@nestjs/common';
import { SERVICES } from 'src/utils/constants';
import { AuthService } from './services/auth/auth.service';
import { AuthController } from './controllers/auth/auth.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [
    AuthService,
    {
      provide: SERVICES.AUTH,
      useClass: AuthService,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
