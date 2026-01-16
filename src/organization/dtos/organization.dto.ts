import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
    @ApiProperty({ example: 'ACME' })
    @IsString({ message: 'NAME_MUST_BE_A_STRING' })
    @IsNotEmpty({ message: 'NAME_IS_REQUIRED' })
    name: string;

    @ApiProperty({ example: 'gym' })
    @IsString({ message: 'TYPE_MUST_BE_A_STRING' })
    @IsNotEmpty({ message: 'TYPE_IS_REQUIRED' })
    type: string;

    @ApiProperty({
        example: { primaryColor: '#111827', logoUrl: 'https://example.com/logo.png' },
    })
    @IsObject({ message: 'BRANDING_CONFIG_MUST_BE_AN_OBJECT' })
    branding_config: Record<string, any>;
}

export class UpdateOrganizationDto {
    @ApiPropertyOptional({ example: 'ACME' })
    @IsString({ message: 'NAME_MUST_BE_A_STRING' })
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ example: 'gym' })
    @IsString({ message: 'TYPE_MUST_BE_A_STRING' })
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({
        example: { primaryColor: '#111827', logoUrl: 'https://example.com/logo.png' },
    })
    @IsObject({ message: 'BRANDING_CONFIG_MUST_BE_AN_OBJECT' })
    @IsOptional()
    branding_config?: Record<string, any>;
}