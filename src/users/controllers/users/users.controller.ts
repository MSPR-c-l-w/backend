import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
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
import { DeleteMeDto } from 'src/users/dtos/delete-me.dto';
import type { UserAiPreferencesRecord } from 'src/users/interfaces/user-ai-preferences.interface';
import type { DataExportResponse } from 'src/users/interfaces/data-export.interface';
import type {
  FollowResult,
  PublicProfile,
} from 'src/users/interfaces/follow.interface';
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetUsersDto } from 'src/users/dtos/get.users.dto';
import { PostService } from 'src/post/services/post/post.service';
import type { PostWithEngagement } from 'src/post/types/post-engagement.types';

@ApiBearerAuth('access-token')
@ApiTags(ROUTES.USERS)
@Controller(ROUTES.USERS)
export class UsersController implements IUsersController {
  constructor(
    @Inject(SERVICES.USERS) private readonly usersService: IUsersService,
    private readonly postService: PostService,
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

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Supprimer mon compte (soft delete, mot de passe requis)',
  })
  @ApiNoContentResponse({ description: 'Compte supprimé' })
  @ApiUnauthorizedResponse({
    description: 'Mot de passe incorrect ou JWT invalide',
  })
  async deleteMe(@Req() req: Request, @Body() dto: DeleteMeDto): Promise<void> {
    const payload = req.user as JwtPayload;
    await this.usersService.deleteMe(payload.sub, dto.password);
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

  @Get('me/ai-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Récupérer mes préférences IA (utilisateur connecté)',
  })
  @ApiOkResponse({ description: 'Préférences IA' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  getMyAiPreferences(
    @Req() req: Request,
  ): Promise<UserAiPreferencesRecord | null> {
    const payload = req.user as JwtPayload;
    return this.usersService.getMyAiPreferences(payload.sub.toString());
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

  @Get('me/liked')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer les posts likés par moi' })
  @ApiOkResponse({ description: 'Liste des posts likés' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  getMyLikedPosts(
    @Req() req: Request,
    @Query('cursor', new ParseIntPipe({ optional: true })) cursor?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PostWithEngagement[]> {
    const payload = req.user as JwtPayload;
    return this.postService.getLikedPosts(payload.sub, cursor, limit);
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Profil public d'un utilisateur (avec état de suivi)",
  })
  @ApiOkResponse({ description: 'Profil public' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  getPublicProfile(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PublicProfile> {
    const payload = req.user as JwtPayload;
    return this.usersService.getPublicProfile(payload.sub, id);
  }

  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Suivre un utilisateur' })
  @ApiOkResponse({ description: 'Utilisateur suivi' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  followUser(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FollowResult> {
    const payload = req.user as JwtPayload;
    return this.usersService.followUser(payload.sub, id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ne plus suivre un utilisateur' })
  @ApiOkResponse({ description: 'Utilisateur unfollow' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  unfollowUser(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FollowResult> {
    const payload = req.user as JwtPayload;
    return this.usersService.unfollowUser(payload.sub, id);
  }

  @Get(':userId/posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Récupérer les posts d'un utilisateur" })
  @ApiOkResponse({ description: "Liste des posts de l'utilisateur" })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  getUserPosts(
    @Param('userId') userId: string,
    @Req() req: Request,
    @Query('cursor', new ParseIntPipe({ optional: true })) cursor?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PostWithEngagement[]> {
    const payload = req.user as JwtPayload;
    return this.postService.getUserPosts(
      parseInt(userId, 10),
      payload.sub,
      cursor,
      limit,
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
