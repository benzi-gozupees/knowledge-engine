import { ApiProperty } from '@nestjs/swagger';

export class ScrapeDto {
    @ApiProperty({ example: 'https://example.com' })
    url: string;

    @ApiProperty({ example: 'tenant_123' })
    tenantId: string;

    @ApiProperty({ example: 'Example Company' })
    businessName: string;
}
