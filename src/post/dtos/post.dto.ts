import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
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

  @ApiPropertyOptional({ example: 1 })
  @IsInt({ message: 'ORGANIZATION_ID_MUST_BE_AN_INTEGER' })
  @IsOptional()
  organization_id?: number | null;
}
