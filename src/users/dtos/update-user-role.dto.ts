import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'ROLE_ID_MUST_BE_A_NUMBER' })
  role_id?: number | null;
}
