import { Injectable, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { eq, and, desc, sql, or, inArray } from 'drizzle-orm';
import { documents } from '@equipment-management/db/schema';
import { calibrations } from '@equipment-management/db/schema';
import type { DocumentRecord, NewDocument } from '@equipment-management/db/schema/documents';
import type { AppDatabase } from '@equipment-management/db';
import type { DocumentType, DocumentStatus } from '@equipment-management/schemas';
import { FileUploadService } from './file-upload.service';
import type { MulterFile } from '../../types/common.types';

export interface CreateDocumentOptions {
  documentType: DocumentType;
  equipmentId?: string;
  calibrationId?: string;
  requestId?: string;
  description?: string;
  uploadedBy?: string;
  subdirectory?: string;
}

export interface DocumentWithIntegrity {
  valid: boolean;
  expectedHash: string | null;
  actualHash: string;
  hashMissing?: boolean;
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly fileUploadService: FileUploadService
  ) {}

  /**
   * 문서 생성 (파일 업로드 + DB 메타데이터)
   */
  async createDocument(file: MulterFile, options: CreateDocumentOptions): Promise<DocumentRecord> {
    // 최소 1개 소유자 FK 필수 — 고아 문서 방지
    if (!options.equipmentId && !options.calibrationId && !options.requestId) {
      throw new BadRequestException({
        code: 'DOCUMENT_OWNER_REQUIRED',
        message: 'At least one owner (equipmentId, calibrationId, or requestId) is required.',
      });
    }

    const subdirectory = options.subdirectory ?? this.resolveSubdirectory(options);
    const savedFile = await this.fileUploadService.saveFile(file, subdirectory);

    const [document] = await this.db
      .insert(documents)
      .values({
        equipmentId: options.equipmentId,
        calibrationId: options.calibrationId,
        requestId: options.requestId,
        documentType: options.documentType,
        status: 'active' as DocumentStatus,
        fileName: savedFile.fileName,
        originalFileName: savedFile.originalFileName,
        filePath: savedFile.filePath,
        fileSize: savedFile.fileSize,
        mimeType: savedFile.mimeType,
        fileHash: savedFile.fileHash,
        description: options.description,
        uploadedBy: options.uploadedBy,
      })
      .returning();

    this.logger.log(`Document created: ${document.id} (type: ${options.documentType})`);
    return document;
  }

  /**
   * 복수 문서 생성
   */
  async createDocuments(
    files: MulterFile[],
    options: CreateDocumentOptions[]
  ): Promise<DocumentRecord[]> {
    if (files.length === 0) return [];
    return Promise.all(files.map((file, i) => this.createDocument(file, options[i])));
  }

  /**
   * ID로 문서 조회
   */
  async findById(id: string): Promise<DocumentRecord> {
    const document = await this.db.query.documents.findFirst({
      where: and(eq(documents.id, id), eq(documents.status, 'active' as DocumentStatus)),
    });

    if (!document) {
      throw new NotFoundException({
        code: 'DOCUMENT_NOT_FOUND',
        message: `Document ${id} not found.`,
      });
    }

    return document;
  }

  /**
   * ID로 문서 조회 (상태 무관 — 버전 이력 조회용)
   */
  async findByIdAnyStatus(id: string): Promise<DocumentRecord> {
    const document = await this.db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!document) {
      throw new NotFoundException({
        code: 'DOCUMENT_NOT_FOUND',
        message: `Document ${id} not found.`,
      });
    }

    return document;
  }

  /**
   * 교정별 문서 목록 (활성 문서만)
   */
  async findByCalibrationId(calibrationId: string, type?: DocumentType): Promise<DocumentRecord[]> {
    const conditions = [
      eq(documents.calibrationId, calibrationId),
      eq(documents.status, 'active' as DocumentStatus),
    ];
    if (type) {
      conditions.push(eq(documents.documentType, type));
    }

    return this.db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.uploadedAt));
  }

  /**
   * 장비별 문서 목록 (활성 문서만)
   */
  async findByEquipmentId(equipmentId: string, type?: DocumentType): Promise<DocumentRecord[]> {
    const conditions = [
      eq(documents.equipmentId, equipmentId),
      eq(documents.status, 'active' as DocumentStatus),
    ];
    if (type) {
      conditions.push(eq(documents.documentType, type));
    }

    return this.db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.uploadedAt));
  }

  /**
   * 장비 관련 전체 문서 (장비 직접 첨부 + 해당 장비 교정 문서)
   *
   * 단일 쿼리로 equipment_id 직접 연결 + calibration_id 경유 문서를 모두 반환.
   * 프론트엔드에서 calibrationId로 그룹핑하여 N+1 방지.
   */
  async findAllByEquipmentId(equipmentId: string): Promise<DocumentRecord[]> {
    // 해당 장비의 모든 교정 ID 조회
    const equipmentCalibrations = await this.db
      .select({ id: calibrations.id })
      .from(calibrations)
      .where(eq(calibrations.equipmentId, equipmentId));

    const calibrationIds = equipmentCalibrations.map((c) => c.id);

    // 장비 직접 문서 OR 교정 경유 문서를 단일 쿼리로 조회
    const ownerConditions = [eq(documents.equipmentId, equipmentId)];
    if (calibrationIds.length > 0) {
      ownerConditions.push(inArray(documents.calibrationId, calibrationIds));
    }

    return this.db
      .select()
      .from(documents)
      .where(and(or(...ownerConditions), eq(documents.status, 'active' as DocumentStatus)))
      .orderBy(desc(documents.uploadedAt));
  }

  /**
   * 요청별 문서 목록
   */
  async findByRequestId(requestId: string): Promise<DocumentRecord[]> {
    return this.db
      .select()
      .from(documents)
      .where(
        and(eq(documents.requestId, requestId), eq(documents.status, 'active' as DocumentStatus))
      )
      .orderBy(desc(documents.uploadedAt));
  }

  /**
   * 문서 논리 삭제 (스토리지 파일은 보존 — 감사 추적 + 복구 가능)
   *
   * 물리 삭제는 별도 retention 스케줄러에서 처리합니다.
   */
  async deleteDocument(id: string): Promise<void> {
    await this.findByIdAnyStatus(id);

    await this.db
      .update(documents)
      .set({ status: 'deleted' as DocumentStatus, updatedAt: new Date() })
      .where(eq(documents.id, id));

    this.logger.log(`Document soft-deleted: ${id}`);
  }

  /**
   * 개정판 생성 (새 버전 업로드)
   */
  async createRevision(
    parentDocumentId: string,
    file: MulterFile,
    uploadedBy?: string,
    description?: string
  ): Promise<DocumentRecord> {
    const parentDoc = await this.findByIdAnyStatus(parentDocumentId);

    const subdirectory = this.resolveSubdirectoryFromDoc(parentDoc);
    const savedFile = await this.fileUploadService.saveFile(file, subdirectory);

    const newDocument = await this.db.transaction(async (tx) => {
      // 기존 문서를 superseded 상태로 변경
      await tx
        .update(documents)
        .set({
          status: 'superseded' as DocumentStatus,
          isLatest: false,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, parentDocumentId));

      // 새 개정판 INSERT
      const [doc] = await tx
        .insert(documents)
        .values({
          equipmentId: parentDoc.equipmentId,
          calibrationId: parentDoc.calibrationId,
          requestId: parentDoc.requestId,
          documentType: parentDoc.documentType as DocumentType,
          status: 'active' as DocumentStatus,
          fileName: savedFile.fileName,
          originalFileName: savedFile.originalFileName,
          filePath: savedFile.filePath,
          fileSize: savedFile.fileSize,
          mimeType: savedFile.mimeType,
          fileHash: savedFile.fileHash,
          revisionNumber: parentDoc.revisionNumber + 1,
          parentDocumentId: parentDoc.id,
          isLatest: true,
          description,
          uploadedBy,
        })
        .returning();

      return doc;
    });

    this.logger.log(
      `Revision created: ${newDocument.id} (rev ${newDocument.revisionNumber}) for parent ${parentDocumentId}`
    );
    return newDocument;
  }

  /**
   * 개정 이력 조회 — 단일 CTE 재귀 쿼리
   *
   * 양방향 탐색: 현재 문서에서 상위(root)까지 + 하위(최신)까지를 단일 쿼리로 처리.
   * N+1 루프 없이 전체 계보를 조회합니다.
   */
  async getRevisionHistory(documentId: string): Promise<DocumentRecord[]> {
    const result = await this.db.execute(sql`
      WITH RECURSIVE
        ancestors AS (
          SELECT * FROM documents WHERE id = ${documentId}
          UNION ALL
          SELECT d.* FROM documents d
          INNER JOIN ancestors a ON d.id = a.parent_document_id
        ),
        descendants AS (
          SELECT * FROM documents WHERE parent_document_id = ${documentId}
          UNION ALL
          SELECT d.* FROM documents d
          INNER JOIN descendants dc ON d.parent_document_id = dc.id
        )
      SELECT * FROM ancestors
      UNION
      SELECT * FROM descendants
      ORDER BY revision_number DESC
    `);

    // raw SQL은 snake_case 컬럼명을 반환하므로 camelCase로 변환
    return (result.rows as Record<string, unknown>[]).map((row) =>
      this.snakeToCamelRow(row)
    ) as DocumentRecord[];
  }

  /**
   * snake_case → camelCase 행 변환 (raw SQL execute 결과용)
   */
  private snakeToCamelRow(row: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      result[camelKey] = value;
    }
    return result;
  }

  /**
   * SHA-256 무결성 검증
   */
  async verifyIntegrity(id: string): Promise<DocumentWithIntegrity> {
    const document = await this.findByIdAnyStatus(id);

    // 마이그레이션된 레거시 문서는 해시가 없음 — 검증 불가 표시
    if (!document.fileHash) {
      return {
        valid: true,
        expectedHash: null,
        actualHash: '',
        hashMissing: true,
      };
    }

    const buffer = await this.fileUploadService.readFile(document.filePath);
    const actualHash = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      valid: document.fileHash === actualHash,
      expectedHash: document.fileHash,
      actualHash,
    };
  }

  /**
   * documentType + 소유자 정보로 subdirectory 결정
   */
  private resolveSubdirectory(options: CreateDocumentOptions): string {
    if (options.calibrationId) {
      return `calibration/${options.calibrationId}`;
    }
    return 'equipment';
  }

  /**
   * 기존 문서에서 subdirectory 추출
   */
  private resolveSubdirectoryFromDoc(doc: DocumentRecord): string {
    // filePath에서 마지막 세그먼트(파일명) 제거
    const parts = doc.filePath.split('/');
    if (parts.length > 1) {
      return parts.slice(0, -1).join('/');
    }
    return 'equipment';
  }
}
