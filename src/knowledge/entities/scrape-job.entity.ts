import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { KnowledgeFile } from './knowledge-file.entity';

@Entity('scrape_jobs')
export class ScrapeJob {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({ unique: true })
    jobId: string;

    @Column()
    status: string; // e.g., "pending", "completed", "failed"

    @Column({ nullable: true })
    error: string;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    // Foreign key to Business
    @Column()
    businessId: string;

    @ManyToOne(() => Business, business => business.scrapeJobs, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'businessId' })
    business: Business;

    // One-to-Many link back to knowledge files (optional)
    @OneToMany(() => KnowledgeFile, file => file.scrapeJob)
    knowledgeFiles: KnowledgeFile[];
}
