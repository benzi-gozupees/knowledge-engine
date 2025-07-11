import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { Business } from './entities/business.entity';
import { KnowledgeFile } from './entities/knowledge-file.entity';
import { ScrapeJob } from './entities/scrape-job.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Business, KnowledgeFile, ScrapeJob])],
    controllers: [KnowledgeController],
    providers: [KnowledgeService],
})
export class KnowledgeModule { }
