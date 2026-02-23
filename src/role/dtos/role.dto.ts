/* eslint-disable prettier/prettier */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin' })
  @IsString({ message: 'NAME_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'NAME_IS_REQUIRED' })
  name: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'coach' })
  @IsString({ message: 'NAME_MUST_BE_A_STRING' })
  @IsOptional()
  name?: string;
}
