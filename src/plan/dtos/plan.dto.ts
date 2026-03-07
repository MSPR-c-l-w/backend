import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'Premium' })
  @IsString({ message: 'NAME_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'NAME_IS_REQUIRED' })
  name: string;

  @ApiProperty({ example: 19.99 })
  @IsNumber({}, { message: 'PRICE_MUST_BE_A_NUMBER' })
  price: number;

  @ApiProperty({
    example: ['Accès illimité', 'Programmes personnalisés', 'Support coach'],
  })
  @IsDefined({ message: 'FEATURES_IS_REQUIRED' })
  features: unknown;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Premium' })
  @IsString({ message: 'NAME_MUST_BE_A_STRING' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 19.99 })
  @IsNumber({}, { message: 'PRICE_MUST_BE_A_NUMBER' })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    example: ['Accès illimité', 'Programmes personnalisés', 'Support coach'],
  })
  @IsOptional()
  features?: unknown;
}
