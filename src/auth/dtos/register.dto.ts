import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Optionnel: rattacher le user à une organisation',
  })
  @IsNumber({}, { message: 'ORGANIZATION_ID_MUST_BE_A_NUMBER' })
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'EMAIL_MUST_BE_VALID' })
  @IsNotEmpty({ message: 'EMAIL_IS_REQUIRED' })
  email: string;

  @ApiProperty({ example: 'UnMotDePasseTresSolide123!' })
  @IsString({ message: 'PASSWORD_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'PASSWORD_IS_REQUIRED' })
  @MinLength(12, { message: 'PASSWORD_TOO_SHORT' })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString({ message: 'FIRST_NAME_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'FIRST_NAME_IS_REQUIRED' })
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString({ message: 'LAST_NAME_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'LAST_NAME_IS_REQUIRED' })
  last_name: string;

  @ApiPropertyOptional({ example: '1990-01-31' })
  @IsDateString({}, { message: 'DATE_OF_BIRTH_MUST_BE_A_DATE' })
  @IsOptional()
  date_of_birth?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsString({ message: 'GENDER_MUST_BE_A_STRING' })
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 178 })
  @IsNumber({}, { message: 'HEIGHT_MUST_BE_A_NUMBER' })
  @IsOptional()
  height?: number;
}
