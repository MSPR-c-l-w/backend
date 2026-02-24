import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber({}, { message: 'ORGANIZATION_ID_MUST_BE_A_NUMBER' })
  organization_id?: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'ROLE_ID_MUST_BE_A_NUMBER' })
  role_id?: number | null;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'EMAIL_MUST_BE_VALID' })
  @IsOptional()
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsString({ message: 'FIRST_NAME_MUST_BE_A_STRING' })
  @IsOptional()
  first_name: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString({ message: 'LAST_NAME_MUST_BE_A_STRING' })
  @IsOptional()
  last_name: string;

  @ApiPropertyOptional({ example: 178 })
  @IsNumber({}, { message: 'HEIGHT_MUST_BE_A_NUMBER' })
  @IsOptional()
  height: number;
}
