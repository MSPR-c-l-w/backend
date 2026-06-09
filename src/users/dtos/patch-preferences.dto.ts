import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PatchPrivacyDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'PRIVATE_ACCOUNT_MUST_BE_A_BOOLEAN' })
  privateAccount?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'ALLOW_DIRECT_MESSAGES_MUST_BE_A_BOOLEAN' })
  allowDirectMessages?: boolean;
}

export class PatchPreferencesDto {
  @ApiPropertyOptional({ example: 'fr', enum: ['fr', 'en'] })
  @IsOptional()
  @IsIn(['fr', 'en'], { message: 'LANGUAGE_MUST_BE_FR_OR_EN' })
  language?: string;

  @ApiPropertyOptional({ example: 'metric', enum: ['metric', 'imperial'] })
  @IsOptional()
  @IsIn(['metric', 'imperial'], { message: 'UNITS_MUST_BE_METRIC_OR_IMPERIAL' })
  units?: string;

  @ApiPropertyOptional({ type: PatchPrivacyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatchPrivacyDto)
  privacy?: PatchPrivacyDto;
}
