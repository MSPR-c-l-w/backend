import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class GetUsersDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Numéro de la page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: "Nombre d'éléments par page",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Recherche par nom (prénom ou nom)',
    example: 'Marie',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: "Filtre par plan d'abonnement",
    example: 'Premium',
    enum: ['Freemium', 'Premium', 'Premium+', 'B2B'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['Freemium', 'Premium', 'Premium+', 'B2B'])
  plan?: 'Freemium' | 'Premium' | 'Premium+' | 'B2B';
}
