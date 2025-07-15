import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDto {
    @ApiProperty({ example: 'tenant_123' })
    @IsString()
    @IsNotEmpty()
    tenantId: string;

    @ApiProperty({ example: 'about-us.json' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiProperty({
        example: JSON.stringify({
            "Business Overview": "We are a leading digital agency...",
            "Services & Products": "Web design, mobile apps...",
        }),
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ example: 'Example Corp' })
    @IsString()
    @IsNotEmpty()
    businessName: string;

    @ApiProperty({ example: 'Technology' })
    @IsString()
    @IsNotEmpty()
    industry: string;
}

export class UploadDtoWithFile extends UploadDto {
    @ApiProperty({ type: 'string', format: 'binary' })
    file: any;
}