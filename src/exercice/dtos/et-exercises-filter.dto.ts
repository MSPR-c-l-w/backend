import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetExercisesFilterDto {
  @ApiPropertyOptional({
    example: 'biceps',
    description: 'Filtrer par muscle ciblé',
  })
  @IsOptional()
  @IsString({ message: 'MUSCLE_MUST_BE_A_STRING' })
  muscle?: string;

  @ApiPropertyOptional({
    example: 'beginner',
    description: 'Filtrer par niveau de difficulté',
  })
  @IsOptional()
  @IsString({ message: 'LEVEL_MUST_BE_A_STRING' })
  level?: string;

  @ApiPropertyOptional({
    example: 'dumbbell',
    description: 'Filtrer par équipement',
  })
  @IsOptional()
  @IsString({ message: 'EQUIPMENT_MUST_BE_A_STRING' })
  equipment?: string;

  @ApiPropertyOptional({
    example: 'strength',
    description: 'Filtrer par catégorie',
  })
  @IsOptional()
  @IsString({ message: 'CATEGORY_MUST_BE_A_STRING' })
  category?: string;

  // --- Pagination ---
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Numéro de la page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'PAGE_MUST_BE_AN_INTEGER' })
  @Min(1, { message: 'PAGE_MUST_BE_GREATER_THAN_0' })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Nombre d’éléments par page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'LIMIT_MUST_BE_AN_INTEGER' })
  @Min(1, { message: 'LIMIT_MUST_BE_GREATER_THAN_0' })
  limit?: number = 20;
}
