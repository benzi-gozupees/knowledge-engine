import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { Business } from './entities/business.entity';
import { KnowledgeFile } from './entities/knowledge-file.entity';
import { ScrapeJob } from './entities/scrape-job.entity';
import { FilePart } from './entities/file-part.entity';
import { S3Service } from './utils/s3.service';

@Module({
    imports: [TypeOrmModule.forFeature([Business, KnowledgeFile, ScrapeJob, FilePart])],
    controllers: [KnowledgeController],
    providers: [KnowledgeService, S3Service],
})
export class KnowledgeModule { }
