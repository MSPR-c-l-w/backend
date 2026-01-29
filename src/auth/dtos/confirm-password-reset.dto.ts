import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPasswordResetDto {
  @ApiProperty({
    example: '9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
  })
  @IsString({ message: 'TOKEN_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'TOKEN_IS_REQUIRED' })
  token: string;

  @ApiProperty({ example: 'UnMotDePasseTresSolide123!' })
  @IsString({ message: 'PASSWORD_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'PASSWORD_IS_REQUIRED' })
  @MinLength(12, { message: 'PASSWORD_TOO_SHORT' })
  new_password: string;
}
