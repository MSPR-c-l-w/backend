/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Inject,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type {
  ISessionService,
  ISessionController,
} from 'src/session/interfaces/session/session.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller(ROUTES.SESSION)
@ApiTags('Sessions & Dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class SessionController implements ISessionController {
  constructor(
    @Inject(SERVICES.SESSION)
    private readonly sessionService: ISessionService,
  ) {}

  @Get('dashboard/:userId')
  @ApiOperation({
    summary:
      'Récupérer les indicateurs clés (KPIs) pour le dashboard utilisateur',
  })
  @ApiOkResponse({
    description: 'Retourne le total des calories, heures et sessions',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COACH')
  async getDashboard(@Param('userId', ParseIntPipe) userId: number) {
    return await this.sessionService.getUserSummary(userId);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Récupérer mes indicateurs clés (KPIs)',
  })
  @ApiOkResponse({
    description: 'Retourne le total des calories, heures et sessions',
  })
  async getMyDashboard(@Req() req: Request) {
    const payload = req.user as JwtPayload;
    return await this.sessionService.getUserSummary(payload.sub);
  }

  @Get('level/:userId')
  @ApiOperation({
    summary: "Récupérer le rang et la progression de l'utilisateur",
  })
  @ApiOkResponse({
    description: "Retourne le niveau de l'utilisateur",
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COACH')
  async getLevel(@Param('userId', ParseIntPipe) userId: number) {
    return await this.sessionService.getUserLevel(userId);
  }

  @Get('level')
  @ApiOperation({
    summary: 'Récupérer mon rang et ma progression',
  })
  @ApiOkResponse({
    description: "Retourne le niveau de l'utilisateur",
  })
  async getMyLevel(@Req() req: Request) {
    const payload = req.user as JwtPayload;
    return await this.sessionService.getUserLevel(payload.sub);
  }

  @Get('stats/intensity/:userId')
  @ApiOperation({
    summary: "Obtenir les moyennes d'intensité d'un utilisateur spécifique",
  })
  @ApiOkResponse({
    description: 'Retourne les moyennes de BPM et calories par session',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COACH')
  async getIntensity(@Param('userId', ParseIntPipe) userId: number) {
    return await this.sessionService.getIntensityStats(userId);
  }

  @Get('stats/intensity')
  @ApiOperation({
    summary: "Obtenir mes moyennes d'intensité",
  })
  @ApiOkResponse({
    description: 'Retourne les moyennes de BPM et calories par session',
  })
  async getMyIntensity(@Req() req: Request) {
    const payload = req.user as JwtPayload;
    return await this.sessionService.getIntensityStats(payload.sub);
  }

  @Get('history/:userId')
  @ApiOperation({
    summary:
      "Récupérer l'historique avec filtre optionnel par date (journalier ou mensuel)",
  })
  @ApiQuery({
    name: 'date',
    required: false,
    example: '2026-01-30',
    description: 'Format YYYY-MM-DD ou YYYY-MM',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COACH')
  async getHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('date') date?: string,
  ) {
    return await this.sessionService.getSessions(userId, date);
  }

  @Get('history')
  @ApiOperation({
    summary:
      'Récupérer mon historique avec filtre optionnel par date (journalier ou mensuel)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    example: '2026-01-30',
    description: 'Format YYYY-MM-DD ou YYYY-MM',
  })
  async getMyHistory(@Req() req: Request, @Query('date') date?: string) {
    const payload = req.user as JwtPayload;
    return await this.sessionService.getSessions(payload.sub, date);
  }

  @UseGuards(JwtAuthGuard)
  @Get('today/summary')
  @ApiOperation({
    summary:
      "Récap de la journée d'entraînement (temps total, calories, intensité moyenne)",
  })
  @ApiOkResponse({
    description:
      "Retourne le nombre de séances du jour, la durée totale, les calories et l'intensité moyenne (%)",
  })
  async getTodaySummary(@Req() req: Request, @Query('date') date?: string) {
    const payload = req.user as JwtPayload;
    return await this.sessionService.getTodaySummary(payload.sub, date);
  }

  @Get('me/:id')
  @ApiOperation({
    summary: 'Récupérer une de mes séances par son ID',
  })
  @ApiOkResponse({
    description: "Détails de la séance (appartenant à l'utilisateur connecté)",
  })
  @ApiNotFoundResponse({
    description: 'Séance introuvable ou ne vous appartient pas',
  })
  @ApiParam({ name: 'id', description: 'ID de la séance' })
  async getSessionByUserIdAndId(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = req.user as JwtPayload;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return await this.sessionService.getSessionByUserIdAndId(payload.sub, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une séance spécifique par son ID' })
  @ApiOkResponse({
    description: "Détails de la séance avec ses logs d'exercices",
  })
  @ApiNotFoundResponse({ description: 'Séance introuvable' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COACH')
  async getSessionById(@Param('id', ParseIntPipe) id: number) {
    return await this.sessionService.getSessionById(id);
  }
}
