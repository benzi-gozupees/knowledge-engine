import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { Business } from './entities/business.entity';
import { KnowledgeFile } from './entities/knowledge-file.entity';
import { ScrapeJob } from './entities/scrape-job.entity';
import { ScrapeDto } from './dto/scrape.dto';
import { UploadDto } from './dto/upload.dto';
import { scrapeWebsite } from './utils/scrapper';
import { categorizeContent } from './utils/openai-processor';

@Injectable()
export class KnowledgeService {
    constructor(
        @InjectRepository(Business)
        private businessRepo: Repository<Business>,

        @InjectRepository(KnowledgeFile)
        private fileRepo: Repository<KnowledgeFile>,

        @InjectRepository(ScrapeJob)
        private jobRepo: Repository<ScrapeJob>,
    ) { }

    async scrapeAndProcess(dto: ScrapeDto) {
        const jobId = uuidv4();

        let business = await this.businessRepo.findOne({
            where: { name: dto.businessName },
        });

        if (!business) {
            business = await this.businessRepo.save({
                name: dto.businessName,
                details: {
                    source: 'Scraped',
                    note: `Auto-generated from ${dto.url}`,
                },
            });
        }


        await this.jobRepo.save({
            jobId,
            status: 'processing',
            businessId: business.id,
        });

        try {
            const rawText = await scrapeWebsite(dto.url);
            const categorizedJson = await categorizeContent(rawText);
            const categorized = JSON.parse(categorizedJson);

            await this.fileRepo.save({
                tenantId: dto.tenantId,
                fileName: `scraped-${new URL(dto.url).hostname}`,
                content: rawText,
                metadata: categorized,
                summary: categorized.Summary ?? '',
                businessId: business.id,
                scrapeJobId: jobId,
            });

            await this.jobRepo.update({ jobId }, { status: 'completed' });
        } catch (err) {
            await this.jobRepo.update(
                { jobId },
                { status: 'failed', error: err.message },
            );
        }

        return { jobId };
    }

    async getScrapeStatus(jobId: string) {
        return this.jobRepo.findOne({ where: { jobId } });
    }

    async uploadFile(dto: UploadDto, file: Express.Multer.File) {
        const jobId = uuidv4();

        let business = await this.businessRepo.findOne({
            where: { name: dto.businessName },
        });

        if (!business) {
            business = await this.businessRepo.save({
                name: dto.businessName,
                details: {},
            });
        }

        await this.jobRepo.save({
            jobId,
            status: 'processing',
            businessId: business.id,
        });

        try {
            if (!file) {
                throw new Error('No file received');
            }
            const content = file.buffer.toString('utf-8');

            const categorizedJson = await categorizeContent(content);
            const categorized = JSON.parse(categorizedJson);

            const saved = await this.fileRepo.save({
                tenantId: dto.tenantId,
                fileName: dto.fileName || file.originalname,
                content,
                metadata: categorized,
                summary: categorized.Summary ?? '',
                businessId: business.id,
                scrapeJobId: jobId,
            });

            await this.jobRepo.update({ jobId }, { status: 'completed' });

            return { jobId};
        } catch (err) {
            await this.jobRepo.update({ jobId }, {
                status: 'failed',
                error: err.message,
            });

            throw new HttpException('File upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async listFiles(tenantId: string) {
        return this.fileRepo.find({
            where: { tenantId },
            relations: ['business'],
        });
    }

    async deleteFile(fileId: string) {
        await this.fileRepo.delete({ id: fileId });
        return { success: true };
    }
}
