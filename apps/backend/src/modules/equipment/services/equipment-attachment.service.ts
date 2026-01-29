import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { equipmentAttachments } from '@equipment-management/db/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import { FileUploadService } from './file-upload.service';
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
    private readonly db: PostgresJsDatabase<typeof schema>,
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
        } as any)
        .returning();

      this.logger.log(`Attachment created: ${attachment.id}`);
      return attachment;
    } catch (error) {
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
    const attachments: EquipmentAttachment[] = [];

    for (const file of files) {
      const attachment = await this.createAttachment(file, attachmentType, equipmentId, requestId);
      attachments.push(attachment);
    }

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
      throw new NotFoundException(`첨부 파일 UUID ${uuid}를 찾을 수 없습니다.`);
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete attachment: ${error}`);
      throw error;
    }
  }
}
