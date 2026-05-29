import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Mon post' })
  @IsString({ message: 'TITLE_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'TITLE_IS_REQUIRED' })
  title: string;

  @ApiProperty({ example: '<p>Contenu</p>' })
  @IsString({ message: 'CONTENT_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'CONTENT_IS_REQUIRED' })
  content: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/posts/hero.jpg',
  })
  @IsString({ message: 'MEDIA_URL_MUST_BE_A_STRING' })
  @IsOptional()
  @MaxLength(2048, { message: 'MEDIA_URL_TOO_LONG' })
  media_url?: string;

  @ApiPropertyOptional({
    example: 'workout',
    description: 'Catégorie du post : workout | nutrition | wellness',
  })
  @IsString({ message: 'CATEGORY_MUST_BE_A_STRING' })
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: '💪',
    description: 'Emoji humeur associé au post',
  })
  @IsString({ message: 'MOOD_MUST_BE_A_STRING' })
  @IsOptional()
  @MaxLength(8, { message: 'MOOD_TOO_LONG' })
  mood?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Publication (MCD is_published)',
  })
  @IsBoolean({ message: 'IS_PUBLISHED_MUST_BE_A_BOOLEAN' })
  @IsOptional()
  is_published?: boolean;

  @ApiProperty({
    example: 1,
    description: 'Identifiant utilisateur auteur du post (author_id)',
  })
  @IsInt({ message: 'AUTHOR_ID_MUST_BE_AN_INTEGER' })
  @Min(1, { message: 'AUTHOR_ID_MUST_BE_POSITIVE' })
  author_id: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Organisation (MCD organization_id)',
  })
  @IsInt({ message: 'ORGANIZATION_ID_MUST_BE_AN_INTEGER' })
  @IsOptional()
  organization_id?: number;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Mon post' })
  @IsString({ message: 'TITLE_MUST_BE_A_STRING' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: '<p>Contenu</p>' })
  @IsString({ message: 'CONTENT_MUST_BE_A_STRING' })
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/posts/hero.jpg' })
  @IsString({ message: 'MEDIA_URL_MUST_BE_A_STRING' })
  @IsOptional()
  @MaxLength(2048, { message: 'MEDIA_URL_TOO_LONG' })
  media_url?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsBoolean({ message: 'IS_PUBLISHED_MUST_BE_A_BOOLEAN' })
  @IsOptional()
  is_published?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsInt({ message: 'AUTHOR_ID_MUST_BE_AN_INTEGER' })
  @IsOptional()
  @Min(1, { message: 'AUTHOR_ID_MUST_BE_POSITIVE' })
  author_id?: number;

  @ApiPropertyOptional({
    example: 'workout',
    description: 'Catégorie du post : workout | nutrition | wellness',
  })
  @IsString({ message: 'CATEGORY_MUST_BE_A_STRING' })
  @IsOptional()
  category?: string | null;

  @ApiPropertyOptional({ example: 1 })
  @IsInt({ message: 'ORGANIZATION_ID_MUST_BE_AN_INTEGER' })
  @IsOptional()
  organization_id?: number | null;
}

export class GetPostsQueryDto {
  @ApiPropertyOptional({
    example: 10,
    description:
      'ID du dernier post reçu — tous les posts antérieurs sont retournés',
  })
  @IsInt({ message: 'CURSOR_MUST_BE_AN_INTEGER' })
  @Min(1, { message: 'CURSOR_MUST_BE_POSITIVE' })
  @IsOptional()
  @Type(() => Number)
  cursor?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Nombre de posts à retourner (défaut : 20, max : 100)',
  })
  @IsInt({ message: 'LIMIT_MUST_BE_AN_INTEGER' })
  @Min(1, { message: 'LIMIT_MUST_BE_POSITIVE' })
  @Max(100, { message: 'LIMIT_MUST_NOT_EXCEED_100' })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    example: 'workout',
    description: 'Filtrer par catégorie : workout | nutrition | wellness',
  })
  @IsString({ message: 'CATEGORY_MUST_BE_A_STRING' })
  @IsOptional()
  category?: string;
}

export class CreatePostCommentDto {
  @ApiProperty({
    example: 'Bravo pour cette séance !',
    description: 'Texte du commentaire',
  })
  @IsString({ message: 'COMMENT_CONTENT_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'COMMENT_CONTENT_IS_REQUIRED' })
  @MaxLength(4000, { message: 'COMMENT_CONTENT_TOO_LONG' })
  content: string;

  @ApiPropertyOptional({
    example: 12,
    description:
      'ID du commentaire parent (réponse à un commentaire du même post). Omis = commentaire racine.',
  })
  @IsInt({ message: 'COMMENT_PARENT_ID_MUST_BE_AN_INTEGER' })
  @Min(1, { message: 'COMMENT_PARENT_ID_MUST_BE_POSITIVE' })
  @IsOptional()
  parent_id?: number;
}
