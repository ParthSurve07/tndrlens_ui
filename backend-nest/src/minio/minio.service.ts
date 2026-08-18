import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;
  private readonly logger = new Logger(MinioService.name);

  constructor(private config: ConfigService) {
    this.client = new Minio.Client({
      endPoint: config.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(config.get<string>('MINIO_PORT') || '9000'),
      useSSL: config.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: config.get<string>('MINIO_ACCESS_KEY') || 'tender_minio_access',
      secretKey: config.get<string>('MINIO_SECRET_KEY') || 'tender_minio_secret',
    });
    this.bucket = config.get<string>('MINIO_BUCKET') || 'tender-documents';
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        this.logger.log(`Created MinIO bucket: ${this.bucket}`);
      } else {
        this.logger.log(`MinIO bucket ready: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.warn(`MinIO init warning: ${error.message}`);
    }
  }

  /**
   * Upload a file buffer to MinIO.
   * Returns the object key (path) in the bucket.
   */
  async uploadFile(
    objectName: string,
    buffer: Buffer,
    mimeType: string = 'application/pdf',
  ): Promise<string> {
    const stream = Readable.from(buffer);
    await this.client.putObject(this.bucket, objectName, stream, buffer.length, {
      'Content-Type': mimeType,
    });
    this.logger.log(`Uploaded to MinIO: ${objectName} (${buffer.length} bytes)`);
    return objectName;
  }

  /**
   * Download a file from MinIO and return as Buffer.
   */
  async downloadFile(objectName: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, objectName);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Generate a pre-signed URL for temporary direct download.
   */
  async getPresignedUrl(objectName: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, objectName, expirySeconds);
  }

  /**
   * Delete a file from MinIO.
   */
  async deleteFile(objectName: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectName);
    this.logger.log(`Deleted from MinIO: ${objectName}`);
  }
}
