import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { KnowledgeFile } from './knowledge-file.entity';
import { Business } from './business.entity';

@Entity('file_parts')
export class FilePart {
    @PrimaryGeneratedColumn()
    id: string;

    @Column('text')
    content: string;

    @Column()
    order: number;

    @Column()
    tenantId: string;

    @Column()
    fileName: string;

    @Column()
    contentHash: string;

    @Column() // 👈 Must explicitly define these for FK to work
    fileId: string;

    @Column()
    businessId: string;

    @ManyToOne(() => KnowledgeFile, (file) => file.parts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fileId' })
    file: KnowledgeFile;

    @ManyToOne(() => Business, (biz) => biz.fileParts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'businessId' })
    business: Business;
}
