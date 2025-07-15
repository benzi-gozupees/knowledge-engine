import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { Business } from './business.entity';
import { ScrapeJob } from './scrape-job.entity';
import { FilePart } from './file-part.entity';

@Entity('knowledge_files')
export class KnowledgeFile {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    tenantId: string;

    @Column()
    fileName: string;

    @Column('text')
    content: string;

    @Column('jsonb', { nullable: true })
    metadata: any;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    uploadedAt: Date;

    @Column('text', { nullable: true })
    summary: string;

    // Foreign key to Business
    @Column()
    businessId: string;

    @ManyToOne(() => Business, business => business.knowledgeFiles, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'businessId' })
    business: Business;

    // Optional Foreign key to ScrapeJob
    @Column({ nullable: true })
    scrapeJobId: string;

    @ManyToOne(() => ScrapeJob, job => job.knowledgeFiles, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'scrapeJobId', referencedColumnName: 'jobId' })
    scrapeJob: ScrapeJob;

    @OneToMany(() => FilePart, part => part.file)
    parts: FilePart[];
}
