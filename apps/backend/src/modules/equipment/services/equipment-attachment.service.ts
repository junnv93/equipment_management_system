import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { equipmentAttachments } from '@equipment-management/db/schema';
import type { AppDatabase } from '@equipment-management/db';
import { FileUploadService } from '../../../common/file-upload/file-upload.service';
import type { EquipmentAttachment } from '@equipment-management/db/schema/equipment-attachments';
import type { MulterFile } from '../../../types/common.types';

/**
 * 장비 첨부 파일 서비스
 * 파일 업로드 후 데이터베이스에 메타데이터를 저장합니다.
 */
@Injectable()
export class EquipmentAttachmentService {
  private readonly logger = new Logger(EquipmentAttachmentService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly fileUploadService: FileUploadService
  ) {}

  /**
   * 파일 업로드 및 데이터베이스 저장
   */
  async createAttachment(
    file: MulterFile,
    attachmentType: 'inspection_report' | 'history_card' | 'other',
    equipmentId?: string,
    requestId?: string,
    description?: string
  ): Promise<EquipmentAttachment> {
    try {
      // 파일 저장
      const savedFile = await this.fileUploadService.saveFile(file, 'equipment');

      // 데이터베이스에 메타데이터 저장 (id는 자동 생성됨)
      const [attachment] = await this.db
        .insert(equipmentAttachments)
        .values({
          equipmentId,
          requestId,
          attachmentType,
          fileName: savedFile.fileName,
          originalFileName: savedFile.originalFileName,
          filePath: savedFile.filePath,
          fileSize: savedFile.fileSize,
          mimeType: savedFile.mimeType,
          description,
        })
        .returning();

      this.logger.log(`Attachment created: ${attachment.id}`);
      return attachment;
    } catch (error: unknown) {
      this.logger.error(`Failed to create attachment: ${error}`);
      throw error;
    }
  }

  /**
   * 여러 파일 업로드 및 저장
   */
  async createAttachments(
    files: MulterFile[],
    attachmentType: 'inspection_report' | 'history_card' | 'other',
    equipmentId?: string,
    requestId?: string
  ): Promise<EquipmentAttachment[]> {
    if (files.length === 0) return [];

    // 파일 저장 병렬 처리
    const savedFiles = await Promise.all(
      files.map((file) => this.fileUploadService.saveFile(file, 'equipment'))
    );

    // 단일 배치 INSERT
    const attachments = await this.db
      .insert(equipmentAttachments)
      .values(
        savedFiles.map((saved) => ({
          equipmentId,
          requestId,
          attachmentType,
          fileName: saved.fileName,
          originalFileName: saved.originalFileName,
          filePath: saved.filePath,
          fileSize: saved.fileSize,
          mimeType: saved.mimeType,
        }))
      )
      .returning();

    this.logger.log(`Batch created ${attachments.length} attachments`);
    return attachments;
  }

  /**
   * UUID로 첨부 파일 조회
   */
  async findByUuid(uuid: string): Promise<EquipmentAttachment> {
    const attachment = await this.db.query.equipmentAttachments.findFirst({
      where: eq(equipmentAttachments.id, uuid),
    });

    if (!attachment) {
      throw new NotFoundException({
        code: 'ATTACHMENT_NOT_FOUND',
        message: `Attachment UUID ${uuid} not found.`,
      });
    }

    return attachment;
  }

  /**
   * 장비별 첨부 파일 조회
   */
  async findByEquipmentId(equipmentId: string): Promise<EquipmentAttachment[]> {
    return this.db.query.equipmentAttachments.findMany({
      where: eq(equipmentAttachments.equipmentId, equipmentId),
    });
  }

  /**
   * 요청별 첨부 파일 조회
   */
  async findByRequestId(requestId: string): Promise<EquipmentAttachment[]> {
    return this.db.query.equipmentAttachments.findMany({
      where: eq(equipmentAttachments.requestId, requestId),
    });
  }

  /**
   * 첨부 파일 삭제
   */
  async deleteAttachment(uuid: string): Promise<void> {
    try {
      const attachment = await this.findByUuid(uuid);

      // 파일 시스템에서 파일 삭제
      await this.fileUploadService.deleteFile(attachment.filePath);

      // 데이터베이스에서 레코드 삭제
      await this.db.delete(equipmentAttachments).where(eq(equipmentAttachments.id, uuid));

      this.logger.log(`Attachment deleted: ${uuid}`);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete attachment: ${error}`);
      throw error;
    }
  }
}
