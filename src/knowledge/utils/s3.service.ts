// src/utils/s3.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import * as path from 'path';

@Injectable()
export class S3Service {
    private s3 = new S3Client({
        region: process.env.AWS_REGION || '',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
    });

    async uploadFile(buffer: Buffer, bucket: string, key: string, contentType: string) {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });
        try {
            const result = await this.s3.send(command);
            return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

}
