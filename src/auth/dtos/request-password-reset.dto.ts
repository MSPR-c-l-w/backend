import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'EMAIL_MUST_BE_VALID' })
  @IsNotEmpty({ message: 'EMAIL_IS_REQUIRED' })
  email: string;
}

