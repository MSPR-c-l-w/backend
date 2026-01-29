import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestAccountVerificationDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'EMAIL_MUST_BE_VALID' })
  @IsNotEmpty({ message: 'EMAIL_IS_REQUIRED' })
  email: string;
}
