import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post as PostMethod,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Post } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import { CreatePostDto, UpdatePostDto } from 'src/post/dtos/post.dto';
import type {
  IPostController,
  IPostService,
} from 'src/post/interfaces/post.interface';
import { DEFAULT_ROLE_NAMES } from 'src/roles/interfaces/role.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.POST)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...DEFAULT_ROLE_NAMES)
@ApiBearerAuth('access-token')
@ApiTags('Posts')
@ApiForbiddenResponse({
  description: 'Rôle non autorisé (ADMIN, COACH ou CLIENT requis)',
})
export class PostController implements IPostController {
  constructor(
    @Inject(SERVICES.POST) private readonly postService: IPostService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister les posts' })
  @ApiOkResponse({ description: 'Liste des posts' })
  getPosts(): Promise<Post[]> {
    return this.postService.getPosts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un post par id' })
  @ApiOkResponse({ description: 'Post' })
  @ApiParam({ name: 'id', description: 'ID du post' })
  @ApiNotFoundResponse({ description: 'Post introuvable' })
  @ApiBadRequestResponse({ description: 'ID du post invalide' })
  getPostById(@Param('id') id: string): Promise<Post> {
    return this.postService.getPostById(id);
  }

  @PostMethod()
  @ApiOperation({ summary: 'Créer un post' })
  @ApiBody({ type: CreatePostDto })
  @ApiOkResponse({ description: 'Post créé' })
  createPost(@Body() dto: CreatePostDto): Promise<Post> {
    return this.postService.createPost(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un post' })
  @ApiBody({ type: UpdatePostDto })
  @ApiOkResponse({ description: 'Post mis à jour' })
  updatePost(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<Post> {
    return this.postService.updatePost(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un post',
    description:
      "Réservé à l'auteur du post (author_id) ou à un administrateur.",
  })
  @ApiOkResponse({ description: 'Post supprimé' })
  @ApiForbiddenResponse({
    description:
      'Interdit si ni auteur du post ni ADMIN (POST_DELETE_FORBIDDEN_NOT_AUTHOR_OR_ADMIN)',
  })
  deletePost(@Param('id') id: string, @Req() req: Request): Promise<Post> {
    const payload = req.user as JwtPayload;
    return this.postService.deletePost(id, payload.sub);
  }
}
