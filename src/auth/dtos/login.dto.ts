import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'EMAIL_MUST_BE_VALID' })
  @IsNotEmpty({ message: 'EMAIL_IS_REQUIRED' })
  email: string;

  @ApiProperty({ example: 'UnMotDePasseTresSolide123!' })
  @IsString({ message: 'PASSWORD_MUST_BE_A_STRING' })
  @IsNotEmpty({ message: 'PASSWORD_IS_REQUIRED' })
  @MinLength(8, { message: 'PASSWORD_TOO_SHORT' })
  password: string;
}
