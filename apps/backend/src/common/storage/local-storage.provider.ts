import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IStorageProvider } from './storage.interface';

/**
 * 로컬 파일시스템 스토리지 Provider
 *
 * STORAGE_DRIVER=local (기본값)일 때 사용됩니다.
 * 개발 환경 및 단일 서버 온프레미스 배포에 적합합니다.
 *
 * 레거시 경로 지원:
 *   - 기존 DB 레코드: 'uploads/equipment/uuid.pdf' (cwd 기준 상대경로)
 *   - 신규 레코드: 'equipment/uuid.pdf' (uploadDir 내부 키)
 *   → resolvePath()에서 자동으로 양쪽 형식을 처리합니다.
 */
@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') ?? './uploads';
  }

  async ensureContainer(): Promise<void> {
    await fs.mkdir(path.resolve(this.uploadDir), { recursive: true });
    this.logger.log(`Upload directory ensured: ${this.uploadDir}`);
  }

  async upload(key: string, body: Buffer, _contentType: string): Promise<void> {
    const filePath = this.resolveNewPath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
    this.logger.debug(`File uploaded: ${filePath}`);
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.resolvePath(key);
    return fs.readFile(filePath);
  }

  supportsPresignedUrl(): boolean {
    return false;
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.resolvePath(key);
      await fs.unlink(filePath);
      this.logger.debug(`File deleted: ${filePath}`);
    } catch (error) {
      // 이미 삭제된 파일은 무시 — 그 외 에러(권한 등)는 전파
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        this.logger.warn(`File already deleted: ${key}`);
        return;
      }
      throw error;
    }
  }

  /**
   * 신규 키 → 절대 경로 (upload 전용 — 항상 uploadDir 내부)
   */
  private resolveNewPath(key: string): string {
    const uploadDirAbs = path.resolve(this.uploadDir);
    const resolved = path.resolve(uploadDirAbs, key);
    this.assertWithinDir(resolved, uploadDirAbs, key);
    return resolved;
  }

  /**
   * DB에 저장된 경로 → 절대 경로 (download/delete 전용)
   *
   * 레거시 형식 처리:
   *   'uploads/equipment/uuid.pdf' → uploadDir 상위에서 해석 (cwd 기준)
   *   'equipment/uuid.pdf'         → uploadDir 내부로 해석 (신규 형식)
   */
  private resolvePath(key: string): string {
    const uploadDirAbs = path.resolve(this.uploadDir);
    const dirBasename = path.basename(uploadDirAbs); // 'uploads'

    let resolved: string;
    if (path.isAbsolute(key)) {
      resolved = key;
    } else if (key.startsWith(dirBasename + '/') || key.startsWith(dirBasename + path.sep)) {
      // 레거시: 'uploads/equipment/uuid.pdf' → /cwd/uploads/equipment/uuid.pdf
      resolved = path.resolve(key);
    } else {
      // 신규: 'equipment/uuid.pdf' → /uploadDir/equipment/uuid.pdf
      resolved = path.resolve(uploadDirAbs, key);
    }

    this.assertWithinDir(resolved, uploadDirAbs, key);
    return resolved;
  }

  private assertWithinDir(resolved: string, uploadDirAbs: string, original: string): void {
    if (!resolved.startsWith(uploadDirAbs + path.sep) && resolved !== uploadDirAbs) {
      this.logger.warn(`Path traversal attempt blocked: ${original}`);
      throw new Error(`Invalid file path: ${original}`);
    }
  }
}
