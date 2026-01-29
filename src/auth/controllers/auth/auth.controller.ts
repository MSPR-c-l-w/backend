import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ROUTES } from 'src/utils/constants';
import { LoginDto } from 'src/auth/dtos/login.dto';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { RequestPasswordResetDto } from 'src/auth/dtos/request-password-reset.dto';
import { ConfirmPasswordResetDto } from 'src/auth/dtos/confirm-password-reset.dto';
import { RefreshTokenDto } from 'src/auth/dtos/refresh-token.dto';
import { LogoutDto } from 'src/auth/dtos/logout.dto';
import { RequestAccountVerificationDto } from 'src/auth/dtos/request-account-verification.dto';
import { ConfirmAccountVerificationDto } from 'src/auth/dtos/confirm-account-verification.dto';
import { AuthService } from 'src/auth/services/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SERVICES } from 'src/utils/constants';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller(ROUTES.AUTH)
@ApiTags('Auth')
export class AuthController {
  constructor(
    @Inject(SERVICES.AUTH) private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un compte et retourner un access token JWT' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        token: { type: 'string', nullable: true },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'EMAIL_ALREADY_USED / validation DTO' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login et retourner un access token JWT' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'INVALID_CREDENTIALS' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Récupérer un nouvel access token via refresh token (rotation)',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'INVALID_REFRESH_TOKEN' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Révoquer le refresh token (logout)' })
  @ApiBody({ type: LogoutDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refresh_token);
  }

  @Post('verify-account/request')
  @ApiOperation({
    summary: 'Envoyer un email de validation de compte (réponse générique)',
  })
  @ApiBody({ type: RequestAccountVerificationDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        token: { type: 'string', nullable: true },
      },
    },
  })
  requestAccountVerification(@Body() dto: RequestAccountVerificationDto) {
    return this.authService.requestAccountVerification(dto.email);
  }

  @Post('verify-account/confirm')
  @ApiOperation({ summary: 'Valider le compte via token et activer le compte' })
  @ApiBody({ type: ConfirmAccountVerificationDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'INVALID_OR_EXPIRED_TOKEN' })
  confirmAccountVerification(@Body() dto: ConfirmAccountVerificationDto) {
    return this.authService.confirmAccountVerification(dto.token);
  }

  @Post('password-reset/request')
  @ApiOperation({
    summary:
      'Demander un reset mot de passe (réponse générique pour éviter l’énumération)',
  })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        token: {
          type: 'string',
          description:
            'Uniquement retourné hors production (dev). En prod, le token doit être envoyé par email.',
          nullable: true,
        },
      },
    },
  })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password-reset/confirm')
  @ApiOperation({
    summary: 'Confirmer le reset mot de passe avec token one-time',
  })
  @ApiBody({ type: ConfirmPasswordResetDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'INVALID_OR_EXPIRED_TOKEN / validation DTO',
  })
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(dto.token, dto.new_password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Retourner le profil de l’utilisateur connecté (JWT requis)',
  })
  @ApiOkResponse({ description: 'Profil utilisateur' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide/expiré' })
  me(@Req() req: Request) {
    const payload = req.user as JwtPayload;
    return this.authService.getProfile(payload.sub);
  }
}
