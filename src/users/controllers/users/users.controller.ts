import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateUserDto } from 'src/users/dtos/create.user.dto';
import { UpdateUserDto } from 'src/users/dtos/update.user.dto';
import { UpdateUserRoleDto } from 'src/users/dtos/update-user-role.dto';
import { UpdateAiPreferencesDto } from 'src/users/dtos/update-ai-preferences.dto';
import { UpdateMeDto } from 'src/users/dtos/update-me.dto';
import type { UserAiPreferencesRecord } from 'src/users/interfaces/user-ai-preferences.interface';
import type { DataExportResponse } from 'src/users/interfaces/data-export.interface';
import type {
  IUsersController,
  IUsersService,
} from 'src/users/interfaces/users.interface';
import type { PaginatedUsersResponse } from 'src/users/types';
import { ROUTES, SERVICES } from 'src/utils/constants';
import { User } from 'src/utils/types';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetUsersDto } from 'src/users/dtos/get.users.dto';

@ApiBearerAuth('access-token')
@ApiTags(ROUTES.USERS)
@Controller(ROUTES.USERS)
export class UsersController implements IUsersController {
  constructor(
    @Inject(SERVICES.USERS) private readonly usersService: IUsersService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COACH', 'ADMIN')
  getUsers(
    @Query() query: GetUsersDto,
  ): Promise<User[] | PaginatedUsersResponse> {
    return this.usersService.getUsers(query);
  }

  @ApiBearerAuth('access-token')
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getUsersStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    b2bUsers: number;
  }> {
    return this.usersService.getUsersStats();
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Mettre à jour mon nom d'affichage" })
  @ApiOkResponse({ description: 'Profil mis à jour' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  async updateMe(
    @Req() req: Request,
    @Body() dto: UpdateMeDto,
  ): Promise<{ user: { first_name: string; last_name: string } }> {
    const payload = req.user as JwtPayload;
    const result = await this.usersService.updateMe(
      payload.sub,
      dto.first_name,
      dto.last_name,
    );
    return { user: result };
  }

  @Post('me/export')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Demander un export RGPD de mes données personnelles',
  })
  @ApiAcceptedResponse({ description: "Demande d'export enregistrée" })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  requestDataExport(@Req() req: Request): Promise<DataExportResponse> {
    const payload = req.user as JwtPayload;
    return this.usersService.requestDataExport(payload.sub);
  }

  @Put('me/ai-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mettre à jour mes préférences IA (utilisateur connecté)',
  })
  @ApiOkResponse({ description: 'Préférences IA enregistrées' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  updateMyAiPreferences(
    @Req() req: Request,
    @Body() preferences: UpdateAiPreferencesDto,
  ): Promise<UserAiPreferencesRecord> {
    const payload = req.user as JwtPayload;

    return this.usersService.updateMyAiPreferences(
      payload.sub.toString(),
      preferences,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COACH', 'ADMIN')
  getUserById(@Param('id') id: string): Promise<User> {
    return this.usersService.getUserById(id);
  }

  @Post()
  createUser(@Body() user: CreateUserDto): Promise<User> {
    return this.usersService.createUser(user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateUser(
    @Param('id') id: string,
    @Body() user: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(id, user);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateUserRole(
    @Param('id') id: string,
    @Body() userRole: UpdateUserRoleDto,
  ): Promise<User> {
    return this.usersService.updateUserRole(id, userRole);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteUser(@Param('id') id: string): Promise<User> {
    return this.usersService.deleteUser(id);
  }
}
