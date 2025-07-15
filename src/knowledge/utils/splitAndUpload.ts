// utils/splitAndUpload.ts
import { Repository } from 'typeorm';
import { FilePart } from '../entities/file-part.entity';
import * as crypto from 'crypto';
import { S3Service } from './s3.service';

interface SplitAndUploadParams {
    content: string;
    tenantId: string;
    businessId: string;
    fileId: string;
    businessName: string;
    category?: string; // Optional, fallback to "Content"
    s3Service: S3Service;
    bucket: string;
    startIndex?: number;
}

export async function splitAndUpload(
    partRepo: Repository<FilePart>,
    {
        content,
        tenantId,
        businessId,
        fileId,
        businessName,
        category = 'Content',
        s3Service,
        bucket,
        startIndex = 0,
    }: SplitAndUploadParams,
): Promise<void> {
    const CHUNK_SIZE = 300 * 1024;
    const chunks = splitContentIntoChunks(content, CHUNK_SIZE);
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    const parts: FilePart[] = [];
    console.log(`💡 Chunks generated: ${chunks.length}`);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const order = startIndex + i;
        const fileName = `${sanitize(businessName)}-${sanitize(category)}-${order + 1}.txt`;
        const key = `knowledge/${businessName}/${fileName}`;

        // Upload to S3
        await s3Service.uploadFile(Buffer.from(chunk), bucket, key, 'text/plain');

        const part = partRepo.create({
            content: chunk,
            order,
            tenantId,
            businessId,
            fileId,
            contentHash,
            fileName,
        });

        parts.push(part);
    }

    await partRepo.save(parts);
}

function splitContentIntoChunks(content: string, maxBytes: number): string[] {
    const paragraphs = content.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentSize = 0;

    for (const para of paragraphs) {
        const paragraph = para.trim();
        if (!paragraph) continue;

        const paragraphWithSpacing = '\n\n' + paragraph;
        const paragraphSize = Buffer.byteLength(paragraphWithSpacing, 'utf-8');

        // Check if adding this paragraph exceeds limit
        if (currentSize + paragraphSize > maxBytes) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = paragraph;
            currentSize = Buffer.byteLength(paragraph, 'utf-8');
        } else {
            currentChunk += paragraphWithSpacing;
            currentSize += paragraphSize;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}


function sanitize(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
