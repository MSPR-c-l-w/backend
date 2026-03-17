import { Module } from '@nestjs/common';
import { SERVICES } from 'src/utils/constants';
import { AuthService } from './services/auth/auth.service';
import { AuthController } from './controllers/auth/auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailerService } from 'src/auth/services/mailer/mailer.service';
import { CsrfService } from 'src/auth/services/csrf/csrf.service';

const jwtSecret =
  process.env.JWT_SECRET ??
  (process.env.NODE_ENV === 'production' ? undefined : 'dev-secret');

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required');
}

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN
          ? parseInt(process.env.JWT_EXPIRES_IN)
          : 15 * 60,
      },
    }),
  ],
  providers: [
    AuthService,
    {
      provide: SERVICES.AUTH,
      useClass: AuthService,
    },
    JwtStrategy,
    MailerService,
    CsrfService,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    {
      provide: SERVICES.AUTH,
      useClass: AuthService,
    },
    CsrfService,
  ],
})
export class AuthModule {}
