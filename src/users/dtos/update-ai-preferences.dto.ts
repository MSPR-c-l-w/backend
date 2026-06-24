import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateAiPreferencesDto {
  @ApiProperty({
    example: ['arachides', 'lactose'],
    description: 'Liste des allergies alimentaires',
  })
  @IsArray({ message: 'ALLERGIES_MUST_BE_AN_ARRAY' })
  allergies: string[];

  @ApiPropertyOptional({ example: 'vegetarien' })
  @IsOptional()
  @IsString({ message: 'REGIME_MUST_BE_A_STRING' })
  regime?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber({}, { message: 'BUDGET_MUST_BE_A_NUMBER' })
  budget?: number;

  @ApiProperty({ example: 'perte_de_poids' })
  @IsString({ message: 'OBJECTIF_IA_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'OBJECTIF_IA_IS_REQUIRED' })
  objectif_ia: string;

  @ApiProperty({
    example: ['haltères', 'tapis'],
    description: 'Équipement disponible pour les recommandations sportives',
  })
  @IsArray({ message: 'CONTRAINTES_MATERIELLES_MUST_BE_AN_ARRAY' })
  contraintes_materielles: string[];

  @ApiPropertyOptional({
    example: ['genou', 'dos'],
    description: 'Limitations physiques (blessures, contre-indications)',
  })
  @IsOptional()
  @IsArray({ message: 'LIMITATIONS_PHYSIQUES_MUST_BE_AN_ARRAY' })
  limitations_physiques?: string[];

  @ApiPropertyOptional({
    example: ['faible impact', '30 min', 'soir'],
    description: "Préférences sportives (durée, horaires, types d'activité)",
  })
  @IsOptional()
  @IsArray({ message: 'PREFERENCES_SPORTIVES_MUST_BE_AN_ARRAY' })
  preferences_sportives?: string[];
}
