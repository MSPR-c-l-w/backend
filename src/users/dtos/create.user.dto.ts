import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiPropertyOptional({ example: 1 })
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
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString({ message: 'FIRST_NAME_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'FIRST_NAME_IS_REQUIRED' })
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString({ message: 'LAST_NAME_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'LAST_NAME_IS_REQUIRED' })
  last_name: string;

  @ApiProperty({ example: '1990-01-31' })
  @IsDateString({}, { message: 'DATE_OF_BIRTH_MUST_BE_A_DATE' })
  @IsNotEmpty({ message: 'DATE_OF_BIRTH_IS_REQUIRED' })
  date_of_birth: string;

  @ApiProperty({ example: 'Male' })
  @IsString({ message: 'GENDER_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'GENDER_IS_REQUIRED' })
  gender: string;

  @ApiProperty({ example: 178 })
  @IsNumber({}, { message: 'HEIGHT_MUST_BE_A_NUMBER' })
  @IsNotEmpty({ message: 'HEIGHT_IS_REQUIRED' })
  height: number;
}
