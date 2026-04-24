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
import {
  CreatePostCommentDto,
  CreatePostDto,
  UpdatePostDto,
} from 'src/post/dtos/post.dto';
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
@ApiTags(ROUTES.POST)
@ApiForbiddenResponse({
  description: 'Rôle non autorisé (ADMIN, COACH ou CLIENT requis)',
})
export class PostController implements IPostController {
  constructor(
    @Inject(SERVICES.POST) private readonly postService: IPostService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les posts',
    description:
      'Chaque post inclut likes_count, comments_count et liked_by_me (utilisateur du JWT).',
  })
  @ApiOkResponse({ description: 'Liste des posts avec engagement' })
  getPosts(@Req() req: Request) {
    const payload = req.user as JwtPayload;
    return this.postService.getPosts(payload.sub);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Lister les commentaires d’un post' })
  @ApiParam({ name: 'id', description: 'ID du post' })
  @ApiOkResponse({ description: 'Liste des commentaires' })
  @ApiNotFoundResponse({ description: 'Post introuvable' })
  @ApiBadRequestResponse({ description: 'ID du post invalide' })
  getPostComments(@Param('id') id: string) {
    return this.postService.getPostComments(id);
  }

  @PostMethod(':id/comments')
  @ApiOperation({ summary: 'Ajouter un commentaire à un post' })
  @ApiParam({ name: 'id', description: 'ID du post' })
  @ApiBody({ type: CreatePostCommentDto })
  @ApiOkResponse({ description: 'Commentaire créé' })
  @ApiNotFoundResponse({ description: 'Post introuvable' })
  createPostComment(
    @Param('id') id: string,
    @Body() dto: CreatePostCommentDto,
    @Req() req: Request,
  ) {
    const payload = req.user as JwtPayload;
    return this.postService.createPostComment(id, dto.content, payload.sub);
  }

  @PostMethod(':id/like')
  @ApiOperation({
    summary: 'Liker un post',
    description: 'Idempotent : un second like ne change pas l’état.',
  })
  @ApiParam({ name: 'id', description: 'ID du post' })
  @ApiOkResponse({ description: 'Résumé des likes' })
  @ApiNotFoundResponse({ description: 'Post introuvable' })
  likePost(@Param('id') id: string, @Req() req: Request) {
    const payload = req.user as JwtPayload;
    return this.postService.likePost(id, payload.sub);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Retirer son like d’un post' })
  @ApiParam({ name: 'id', description: 'ID du post' })
  @ApiOkResponse({ description: 'Résumé des likes' })
  @ApiNotFoundResponse({ description: 'Post introuvable' })
  unlikePost(@Param('id') id: string, @Req() req: Request) {
    const payload = req.user as JwtPayload;
    return this.postService.unlikePost(id, payload.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un post par id',
    description:
      'Inclut likes_count, comments_count et liked_by_me (utilisateur du JWT).',
  })
  @ApiOkResponse({ description: 'Post avec engagement' })
  @ApiParam({ name: 'id', description: 'ID du post' })
  @ApiNotFoundResponse({ description: 'Post introuvable' })
  @ApiBadRequestResponse({ description: 'ID du post invalide' })
  getPostById(@Param('id') id: string, @Req() req: Request) {
    const payload = req.user as JwtPayload;
    return this.postService.getPostById(id, payload.sub);
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
