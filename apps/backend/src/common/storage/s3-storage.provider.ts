import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { IStorageProvider } from './storage.interface';

/**
 * S3 호환 오브젝트 스토리지 Provider (RustFS / MinIO / AWS S3)
 *
 * STORAGE_DRIVER=s3일 때 사용됩니다.
 * 컨테이너 재시작 후에도 파일이 영속되며, 다중 인스턴스 배포를 지원합니다.
 *
 * 필수 환경변수 (STORAGE_DRIVER=s3):
 *   S3_ENDPOINT — 오브젝트 스토리지 URL (예: http://rustfs:9000)
 *   S3_ACCESS_KEY — 액세스 키
 *   S3_SECRET_KEY — 시크릿 키
 *   S3_BUCKET — 버킷명 (기본: equipment-files)
 */
@Injectable()
export class S3StorageProvider implements IStorageProvider, OnModuleDestroy {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly client: S3Client | null = null;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET') ?? 'equipment-files';

    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');

    if (endpoint && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        endpoint,
        region: 'us-east-1', // RustFS/MinIO는 region을 사용하지 않지만 SDK 필수
        forcePathStyle: true, // S3 호환 오브젝트 스토리지는 path-style 필수
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  /**
   * S3 클라이언트가 초기화되었는지 확인하고 반환한다.
   * STORAGE_DRIVER=s3인데 환경변수가 누락되면 명시적 에러를 던진다.
   */
  private assertClient(): S3Client {
    if (!this.client) {
      throw new Error(
        'S3 client not initialized — S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY 환경변수를 확인하세요.'
      );
    }
    return this.client;
  }

  async ensureContainer(): Promise<void> {
    if (!this.client) {
      throw new Error(
        'S3 client not initialized — S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY 확인 필요'
      );
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`S3 bucket verified: ${this.bucket}`);
    } catch (error) {
      if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`S3 bucket created: ${this.bucket}`);
      } else {
        throw error;
      }
    }
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.assertClient().send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: body.length,
      })
    );
    this.logger.debug(`S3 upload: ${key}`);
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.assertClient().send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );

    // 스트림 반드시 소비 — 미소비 시 연결 누수 발생
    // Body는 SdkStream<IncomingMessage|Readable> & SdkStreamMixin 타입 (transformToByteArray 포함)
    const body = response.Body as NonNullable<GetObjectCommandOutput['Body']>;
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  supportsPresignedUrl(): boolean {
    return true;
  }

  async getPresignedDownloadUrl(
    key: string,
    originalFileName: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const encodedFileName = encodeURIComponent(originalFileName);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
    });

    const url = await getSignedUrl(this.assertClient(), command, { expiresIn });
    this.logger.debug(`Presigned download URL generated: ${key} (expires ${expiresIn}s)`);
    return url;
  }

  async delete(key: string): Promise<void> {
    try {
      await this.assertClient().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      this.logger.debug(`S3 delete: ${key}`);
    } catch (error) {
      // 이미 삭제된 파일은 무시 — 그 외 에러(인증/네트워크)는 전파
      if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
        this.logger.warn(`S3 object already deleted: ${key}`);
        return;
      }
      throw error;
    }
  }

  onModuleDestroy(): void {
    this.client?.destroy();
  }
}
