import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: '2f0e4c9a... (token refresh)' })
  @IsString({ message: 'TOKEN_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'TOKEN_IS_REQUIRED' })
  refresh_token: string;
}
