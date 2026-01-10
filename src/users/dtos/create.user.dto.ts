import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @IsNumber({}, { message: 'ORGANIZATION_ID_MUST_BE_A_NUMBER' })
    @IsOptional()
    organization_id?: number;
    
    @IsEmail({}, { message: 'EMAIL_MUST_BE_VALID' })
    @IsNotEmpty({ message: 'EMAIL_IS_REQUIRED' })
    email: string;

    @IsString({ message: 'PASSWORD_MUST_BE_A_STRING' })
    @IsNotEmpty({ message: 'PASSWORD_IS_REQUIRED' })
    password: string;

    @IsString({ message: 'FIRST_NAME_MUST_BE_A_STRING' })
    @IsNotEmpty({ message: 'FIRST_NAME_IS_REQUIRED' })
    first_name: string;

    @IsString({ message: 'LAST_NAME_MUST_BE_A_STRING' })
    @IsNotEmpty({ message: 'LAST_NAME_IS_REQUIRED' })
    last_name: string;

    @IsDateString({}, { message: 'DATE_OF_BIRTH_MUST_BE_A_DATE' })
    @IsNotEmpty({ message: 'DATE_OF_BIRTH_IS_REQUIRED' })
    date_of_birth: string;

    @IsString({ message: 'GENDER_MUST_BE_A_STRING' })
    @IsNotEmpty({ message: 'GENDER_IS_REQUIRED' })
    gender: string;

    @IsNumber({}, { message: 'HEIGHT_MUST_BE_A_NUMBER' })
    @IsNotEmpty({ message: 'HEIGHT_IS_REQUIRED' })
    height: number;
}