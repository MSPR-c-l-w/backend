import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteMeDto {
  @ApiProperty({ example: 'monMotDePasse123' })
  @IsString({ message: 'PASSWORD_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'PASSWORD_IS_REQUIRED' })
  password: string;
}
