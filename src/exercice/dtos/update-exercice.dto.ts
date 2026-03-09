import { ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class UpdateExerciceDto {
  @ApiPropertyOptional({ example: 'Bench Press' })
  @IsOptional()
  @IsString({ message: 'NAME_MUST_BE_A_STRING' })
  name?: string;

  @ApiPropertyOptional({ example: ['pectoraux'] })
  @IsOptional()
  primary_muscles?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ example: ['triceps', 'épaules'] })
  @IsOptional()
  secondary_muscles?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ example: 'débutant' })
  @IsOptional()
  @IsString({ message: 'LEVEL_MUST_BE_A_STRING' })
  level?: string;

  @ApiPropertyOptional({ example: 'polyarticulaire' })
  @IsOptional()
  @IsString({ message: 'MECHANIC_MUST_BE_A_STRING' })
  mechanic?: string;

  @ApiPropertyOptional({ example: 'barre' })
  @IsOptional()
  @IsString({ message: 'EQUIPMENT_MUST_BE_A_STRING' })
  equipment?: string;

  @ApiPropertyOptional({ example: 'force' })
  @IsOptional()
  @IsString({ message: 'CATEGORY_MUST_BE_A_STRING' })
  category?: string;

  @ApiPropertyOptional({ example: ['Allongez-vous', 'Poussez la barre'] })
  @IsOptional()
  instructions?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ example: ['https://example.com/image.jpg'] })
  @IsOptional()
  image_urls?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ example: 'poussée' })
  @IsOptional()
  @IsString({ message: 'EXERCISE_TYPE_MUST_BE_A_STRING' })
  exercise_type?: string;
}
