import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateNutritionDto {
  @ApiPropertyOptional({ example: 'Pomme' })
  @IsOptional()
  @IsString({ message: 'NAME_MUST_BE_A_STRING' })
  name?: string;

  @ApiPropertyOptional({ example: 'Fruit' })
  @IsOptional()
  @IsString({ message: 'CATEGORY_MUST_BE_A_STRING' })
  category?: string;

  @ApiPropertyOptional({ example: 52 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'CALORIES_KCAL_MUST_BE_A_NUMBER' })
  calories_kcal?: number;

  @ApiPropertyOptional({ example: 0.3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'PROTEIN_G_MUST_BE_A_NUMBER' })
  protein_g?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'CARBOHYDRATES_G_MUST_BE_A_NUMBER' })
  carbohydrates_g?: number;

  @ApiPropertyOptional({ example: 0.2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'FAT_G_MUST_BE_A_NUMBER' })
  fat_g?: number;

  @ApiPropertyOptional({ example: 2.4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'FIBER_G_MUST_BE_A_NUMBER' })
  fiber_g?: number;

  @ApiPropertyOptional({ example: 10.4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'SUGAR_G_MUST_BE_A_NUMBER' })
  sugar_g?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'SODIUM_MG_MUST_BE_A_NUMBER' })
  sodium_mg?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'CHOLESTEROL_MG_MUST_BE_A_NUMBER' })
  cholesterol_mg?: number;

  @ApiPropertyOptional({ example: 'Snack' })
  @IsOptional()
  @IsString({ message: 'MEAL_TYPE_NAME_MUST_BE_A_STRING' })
  meal_type_name?: string;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'WATER_INTAKE_ML_MUST_BE_A_NUMBER' })
  water_intake_ml?: number;

  @ApiPropertyOptional({
    example: 'https://example.com/apple.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'PICTURE_URL_MUST_BE_A_STRING' })
  picture_url?: string | null;
}
