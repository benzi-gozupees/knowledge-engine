import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { KnowledgeFile } from './knowledge-file.entity';
import { ScrapeJob } from './scrape-job.entity';
import { FilePart } from './file-part.entity';

@Entity('businesses')
export class Business {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    name: string;

    @Column('jsonb', { nullable: true })
    details: any;

    @Column('text')
    industry: string;

    @OneToMany(() => KnowledgeFile, file => file.business)
    knowledgeFiles: KnowledgeFile[];

    @OneToMany(() => ScrapeJob, job => job.business)
    scrapeJobs: ScrapeJob[];

    @OneToMany(() => FilePart, part => part.business)
    fileParts: FilePart[];
}
