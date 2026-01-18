import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * 파일 업로드 서비스
 * 파일을 로컬 파일 시스템에 저장하고 메타데이터를 반환합니다.
 * 프로덕션 환경에서는 Azure Blob Storage 등 외부 스토리지로 마이그레이션 권장
 */
@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadDir: string;
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
  ];

  constructor(private configService: ConfigService) {
    // 업로드 디렉토리 설정
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    this.ensureUploadDirectory();
  }

  /**
   * 업로드 디렉토리 생성
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ensured: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error}`);
      throw new Error('Failed to initialize upload directory');
    }
  }

  /**
   * 파일 유효성 검사
   */
  private validateFile(file: any): void {
    // 파일 크기 검증
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `파일 크기는 ${this.maxFileSize / 1024 / 1024}MB를 초과할 수 없습니다.`
      );
    }

    // MIME 타입 검증
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `허용되지 않은 파일 형식입니다. 허용된 형식: ${this.allowedMimeTypes.join(', ')}`
      );
    }
  }

  /**
   * 파일 저장
   * @param file 업로드된 파일
   * @param subdirectory 하위 디렉토리 (예: 'equipment', 'attachments')
   * @returns 파일 메타데이터
   */
  async saveFile(
    file: any,
    subdirectory: string = 'equipment'
  ): Promise<{
    uuid: string;
    fileName: string;
    originalFileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }> {
    try {
      // 파일 유효성 검사
      this.validateFile(file);

      // UUID 생성
      const uuid = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuid}${fileExtension}`;

      // 저장 경로 생성
      const subDirPath = path.join(this.uploadDir, subdirectory);
      await fs.mkdir(subDirPath, { recursive: true });
      const filePath = path.join(subDirPath, fileName);

      // 파일 저장
      await fs.writeFile(filePath, file.buffer);

      this.logger.log(`File saved: ${filePath}`);

      return {
        uuid,
        fileName,
        originalFileName: file.originalname,
        filePath: path.relative(process.cwd(), filePath),
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to save file: ${error}`);
      throw new BadRequestException('파일 저장에 실패했습니다.');
    }
  }

  /**
   * 여러 파일 저장
   */
  async saveFiles(
    files: any[],
    subdirectory: string = 'equipment'
  ): Promise<
    Array<{
      uuid: string;
      fileName: string;
      originalFileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
    }>
  > {
    const results = await Promise.all(files.map((file) => this.saveFile(file, subdirectory)));
    return results;
  }

  /**
   * 파일 삭제
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${fullPath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${filePath}`, error);
      // 파일 삭제 실패는 에러로 처리하지 않음 (이미 삭제되었을 수 있음)
    }
  }

  /**
   * 파일 읽기 (다운로드용)
   */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      return await fs.readFile(fullPath);
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error);
      throw new BadRequestException('파일을 읽을 수 없습니다.');
    }
  }
}
