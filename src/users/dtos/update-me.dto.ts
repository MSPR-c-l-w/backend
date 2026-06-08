import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @ApiProperty({ example: 'Jean' })
  @IsString({ message: 'FIRST_NAME_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'FIRST_NAME_IS_REQUIRED' })
  @MaxLength(50, { message: 'FIRST_NAME_TOO_LONG' })
  first_name: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString({ message: 'LAST_NAME_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'LAST_NAME_IS_REQUIRED' })
  @MaxLength(50, { message: 'LAST_NAME_TOO_LONG' })
  last_name: string;
}
