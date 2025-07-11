import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    UploadedFile,
    UseInterceptors,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiSecurity } from '@nestjs/swagger';

import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiConsumes,
} from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { ScrapeDto } from './dto/scrape.dto';
import { UploadDto, UploadDtoWithFile } from './dto/upload.dto';

@ApiTags('Knowledge')
@ApiSecurity('x-api-key')
@Controller('api/v1/knowledge')
export class KnowledgeController {
    constructor(private readonly knowledgeService: KnowledgeService) { }

    @Post('scrape')
    @ApiOperation({ summary: 'Scrape and categorize website content' })
    @ApiBody({ type: ScrapeDto })
    @ApiResponse({ status: 201, description: 'Scraping initiated' })
    async scrape(@Body() dto: ScrapeDto) {
        return this.knowledgeService.scrapeAndProcess(dto);
    }

    @Get('status/:jobId')
    @ApiOperation({ summary: 'Check scrape job status' })
    @ApiParam({ name: 'jobId', example: 'a3c9eaf1-3e4f-4f99-bd45-abc123456789' })
    @ApiResponse({ status: 200, description: 'Job status returned' })
    @ApiResponse({ status: 404, description: 'Job not found' })
    async status(@Param('jobId') jobId: string) {
        const job = await this.knowledgeService.getScrapeStatus(jobId);
        if (!job) {
            throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
        }
        return job;
    }

    @Post('upload')
    @ApiOperation({ summary: 'Upload content to knowledge base manually (file + metadata)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadDtoWithFile })
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({ status: 201, description: 'Upload successful' })
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadDto,
    ) {
        return this.knowledgeService.uploadFile(dto, file);
    }

    @Get('files/:tenantId')
    @ApiOperation({ summary: 'Get all knowledge files for a tenant' })
    @ApiParam({ name: 'tenantId', example: 'tenant_123' })
    @ApiResponse({ status: 200, description: 'List of knowledge files' })
    async getFiles(@Param('tenantId') tenantId: string) {
        return this.knowledgeService.listFiles(tenantId);
    }

    @Delete('files/:fileId')
    @ApiOperation({ summary: 'Delete a knowledge file by ID' })
    @ApiParam({ name: 'fileId', example: 1 })
    @ApiResponse({ status: 200, description: 'File deleted' })
    async deleteFile(@Param('fileId') fileId: string) {
        return this.knowledgeService.deleteFile(fileId);
    }
}
