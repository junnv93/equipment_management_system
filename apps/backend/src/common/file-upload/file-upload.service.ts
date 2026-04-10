import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import type { MulterFile } from '../../types/common.types';
import { STORAGE_PROVIDER, IStorageProvider } from '../storage/storage.interface';

/**
 * 파일 업로드 서비스
 *
 * 스토리지 추상화 계층을 통해 파일을 저장합니다.
 * STORAGE_DRIVER=local → 로컬 파일시스템 (LocalStorageProvider)
 * STORAGE_DRIVER=s3    → S3 호환 오브젝트 스토리지 (S3StorageProvider / RustFS)
 *
 * 반환되는 filePath는 스토리지 키 형식: '{subdirectory}/{uuid}.{ext}'
 */
@Injectable()
export class FileUploadService implements OnModuleInit {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes: string[] = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];

  private readonly MAGIC_BYTES: Record<string, number[][]> = {
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'image/jpeg': [[0xff, 0xd8, 0xff]],
    'image/png': [[0x89, 0x50, 0x4e, 0x47]], // \x89PNG
    'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF8
    'application/msword': [[0xd0, 0xcf, 0x11, 0xe0]], // OLE compound
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      [0x50, 0x4b, 0x03, 0x04],
    ], // PK ZIP
    'application/vnd.ms-excel': [[0xd0, 0xcf, 0x11, 0xe0]],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4b, 0x03, 0x04]], // PK ZIP
  };

  constructor(@Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider) {}

  async onModuleInit(): Promise<void> {
    await this.provider.ensureContainer();
  }

  /**
   * S3 키 및 서브디렉토리 정규화 (Path Traversal 방지)
   * - null bytes, 백슬래시 제거
   * - '..', '.' 세그먼트 제거
   * - 선행 슬래시 제거
   */
  private sanitizeKey(key: string): string {
    return key
      .replace(/\0/g, '')
      .replace(/\\/g, '/')
      .split('/')
      .filter((seg) => seg !== '' && seg !== '.' && seg !== '..')
      .join('/');
  }

  /**
   * 파일 유효성 검사
   */
  private validateFile(file: MulterFile): void {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException({
        code: 'FILE_EMPTY',
        message: 'Empty file is not allowed.',
      });
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size cannot exceed ${this.maxFileSize / 1024 / 1024}MB.`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File format not allowed. Allowed formats: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    this.validateMagicBytes(file);
  }

  /**
   * 파일의 magic bytes를 검증하여 MIME 타입 위장 공격을 방지합니다.
   */
  private validateMagicBytes(file: MulterFile): void {
    if (!file.buffer || file.buffer.length === 0) return;

    const signatures = this.MAGIC_BYTES[file.mimetype];
    if (!signatures) return;

    const matches = signatures.some((sig) =>
      sig.every((byte, index) => file.buffer[index] === byte)
    );

    if (!matches) {
      throw new BadRequestException({
        code: 'FILE_CONTENT_MISMATCH',
        message: 'File content does not match the declared format.',
      });
    }
  }

  /**
   * 파일 저장
   * @param file 업로드된 파일
   * @param subdirectory 하위 디렉토리 (예: 'equipment', 'attachments')
   * @returns 파일 메타데이터 (filePath는 스토리지 키: '{subdirectory}/{uuid}.{ext}')
   */
  async saveFile(
    file: MulterFile,
    subdirectory: string = 'equipment'
  ): Promise<{
    uuid: string;
    fileName: string;
    originalFileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    fileHash: string;
  }> {
    try {
      this.validateFile(file);

      const uuid = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuid}${fileExtension}`;
      const safeSubdir = this.sanitizeKey(subdirectory);
      const key = `${safeSubdir}/${fileName}`;
      const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

      await this.provider.upload(key, file.buffer, file.mimetype);

      this.logger.log(`File saved: ${key} (hash: ${fileHash.substring(0, 12)}...)`);

      return {
        uuid,
        fileName,
        originalFileName: file.originalname,
        filePath: key,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileHash,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to save file: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new InternalServerErrorException({
        code: 'FILE_SAVE_FAILED',
        message: 'Failed to save file due to a server error.',
      });
    }
  }

  /**
   * 여러 파일 저장
   */
  async saveFiles(
    files: MulterFile[],
    subdirectory: string = 'equipment'
  ): Promise<
    Array<{
      uuid: string;
      fileName: string;
      originalFileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      fileHash: string;
    }>
  > {
    const results = await Promise.all(files.map((file) => this.saveFile(file, subdirectory)));
    return results;
  }

  /**
   * 파일 삭제
   * @param filePath 스토리지 키 또는 레거시 경로
   */
  async deleteFile(filePath: string): Promise<void> {
    await this.provider.delete(filePath);
    this.logger.log(`File deleted: ${filePath}`);
  }

  /**
   * 파일 읽기 (다운로드용)
   * @param filePath 스토리지 키 또는 레거시 경로
   */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await this.provider.download(filePath);
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error);
      throw new BadRequestException({
        code: 'FILE_READ_FAILED',
        message: 'Failed to read file.',
      });
    }
  }
}
