import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsNumber({}, { message: 'ORGANIZATION_ID_MUST_BE_A_NUMBER' })
    organization_id?: number;
    
    @IsEmail({}, { message: 'EMAIL_MUST_BE_VALID' })
    @IsOptional()
    email: string;

    @IsString({ message: 'FIRST_NAME_MUST_BE_A_STRING' })
    @IsOptional()
    first_name: string;

    @IsString({ message: 'LAST_NAME_MUST_BE_A_STRING' })
    @IsOptional()
    last_name: string;

    @IsNumber({}, { message: 'HEIGHT_MUST_BE_A_NUMBER' })
    @IsOptional()
    height: number;
}