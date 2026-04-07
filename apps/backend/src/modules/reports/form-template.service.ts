import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { eq, and, desc } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import type { AppDatabase } from '@equipment-management/db';
import { formTemplates } from '@equipment-management/db/schema/form-templates';
import {
  FORM_CATALOG,
  getFormCatalogEntryByName,
  EXTENSION_TO_MIME,
  resolveFormTemplateExtension,
  FORM_TEMPLATE_ALLOWED_EXTENSIONS,
} from '@equipment-management/shared-constants';
import { ErrorCode } from '@equipment-management/schemas';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../common/storage/storage.interface';

type FormTemplateRow = typeof formTemplates.$inferSelect;

interface FormTemplateMutationInput {
  formName: string;
  file: Buffer;
  filename: string;
  mimeType: string;
  userId: string;
}

/**
 * 양식 템플릿 관리 서비스
 *
 * 식별자 모델:
 * - `formName`: 안정 키 (양식명). 메타데이터는 FORM_CATALOG에서 조회
 * - `formNumber`: 가변 번호. 역사적으로 전역 유니크 → 과거 번호로도 조회 가능
 *
 * 연산:
 * - `createFormTemplateVersion`: 최초 등록 + 개정 통합. 이전 현행 row가 있으면 자동으로
 *   supersede(`isCurrent=false`, `supersededAt=now`)하고 새 row INSERT. 없으면 단순 INSERT.
 * - `replaceCurrentFile`: 같은 formNumber 내에서 파일만 교체. 이력 보존 없음
 *   (UL-QP-18 절차서에서 요구하지 않음).
 */
@Injectable()
export class FormTemplateService {
  private readonly logger = new Logger(FormTemplateService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider
  ) {}

  // ── 조회 ──────────────────────────────────────────────────────────────────

  /** 양식별 현행 row 일괄 조회 (N+1 방지) */
  async listAllCurrent(): Promise<FormTemplateRow[]> {
    return this.db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.isCurrent, true))
      .orderBy(formTemplates.formName);
  }

  /** 특정 양식명의 현행 row. 없으면 null (최초 등록 판단용) */
  async findCurrentByName(formName: string): Promise<FormTemplateRow | null> {
    const [row] = await this.db
      .select()
      .from(formTemplates)
      .where(and(eq(formTemplates.formName, formName), eq(formTemplates.isCurrent, true)))
      .limit(1);
    return row ?? null;
  }

  /** 현행 row를 강제로 요구 (없으면 NotFound 던짐) */
  async getCurrentByName(formName: string): Promise<FormTemplateRow> {
    const row = await this.findCurrentByName(formName);
    if (!row) {
      throw new NotFoundException({
        code: ErrorCode.FormTemplateNotFound,
        message: `현행 양식 템플릿을 찾을 수 없습니다: ${formName}`,
      });
    }
    return row;
  }

  /** row ID로 단건 조회 (다운로드용) */
  async getById(id: string): Promise<FormTemplateRow> {
    const [row] = await this.db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException({
        code: ErrorCode.FormTemplateNotFound,
        message: `양식 템플릿을 찾을 수 없습니다: ${id}`,
      });
    }
    return row;
  }

  /** 양식명의 전체 이력 (현행 + 과거), 최신순 */
  async listHistoryByName(formName: string): Promise<FormTemplateRow[]> {
    return this.db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.formName, formName))
      .orderBy(desc(formTemplates.uploadedAt));
  }

  /**
   * 과거 formNumber로 검색 (옛 문서에서 본 번호로 찾기).
   * 현행이든 과거든 해당 formNumber의 row를 반환. 없으면 null.
   */
  async findByFormNumber(formNumber: string): Promise<FormTemplateRow | null> {
    const [row] = await this.db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.formNumber, formNumber))
      .limit(1);
    return row ?? null;
  }

  /** 파일 버퍼 다운로드 */
  async downloadBuffer(row: FormTemplateRow): Promise<Buffer> {
    return this.storage.download(row.storageKey);
  }

  /**
   * 호환 API: FORM_CATALOG의 키(initial formNumber)로 현행 템플릿 버퍼 조회.
   *
   * 다른 모듈들이 "UL-QP-18-01 현행 파일 내놓으라"는 식으로 호출하는데,
   * 이는 형식상 formNumber 기반이지만 실제로는 FORM_CATALOG 키(= 안정적 initial formNumber)로
   * 양식명을 역조회한 뒤 DB의 현행 row를 가져오는 의미입니다.
   */
  async getTemplateBuffer(initialFormNumber: string): Promise<Buffer> {
    const entry = FORM_CATALOG[initialFormNumber];
    if (!entry) {
      throw new NotFoundException({
        code: ErrorCode.FormTemplateNotFound,
        message: `알 수 없는 양식 번호: ${initialFormNumber}`,
      });
    }
    const row = await this.getCurrentByName(entry.name);
    return this.downloadBuffer(row);
  }

  // ── 변경 ──────────────────────────────────────────────────────────────────

  /**
   * 양식 템플릿 버전 생성 — 최초 등록과 개정 등록을 **하나의 경로**로 처리합니다.
   *
   * - 기존 현행 row 없음 → 최초 등록 (단순 INSERT)
   * - 기존 현행 row 있음 → 개정 등록 (기존 row supersede + 새 row INSERT, 같은 트랜잭션)
   *
   * 이 통합이 서비스 계약을 단순화합니다: 호출자는 "이 양식에 이 파일을 등록"만 표현하면 되고,
   * "이게 최초인지 개정인지"는 DB 상태가 결정합니다.
   */
  async createFormTemplateVersion(
    input: FormTemplateMutationInput & { formNumber: string }
  ): Promise<FormTemplateRow> {
    const { formName, formNumber, file, filename, mimeType, userId } = input;

    // 1. 비즈니스 규칙: 양식명은 FORM_CATALOG에 등록된 것만 허용
    const catalogEntry = getFormCatalogEntryByName(formName);
    if (!catalogEntry) {
      throw new BadRequestException({
        code: ErrorCode.InvalidFormName,
        message: `알 수 없는 양식명: ${formName}`,
      });
    }

    // 2. 비즈니스 규칙: formNumber는 역사적으로 전역 유니크 (과거 번호 재사용 금지)
    const existingByNumber = await this.findByFormNumber(formNumber);
    if (existingByNumber) {
      throw new ConflictException({
        code: ErrorCode.FormNumberAlreadyExists,
        message: `양식 번호 ${formNumber}는 이미 존재합니다`,
      });
    }

    // 3. 파일 MIME 검증 및 storageKey 생성
    //    확장자는 FILE_TYPES SSOT에서 MIME 기준으로 파생. 하드코딩 없음.
    const ext = resolveFormTemplateExtension(mimeType, filename);
    const storageKey = this.buildStorageKey(formNumber, ext);

    // 4. 스토리지 업로드를 트랜잭션 밖에서 먼저 실행 (orphan 방지 + DB 실패 시 cleanup 가능)
    await this.storage.upload(storageKey, file, mimeType);

    try {
      const [inserted] = await this.db.transaction(async (tx) => {
        const now = new Date();

        // 기존 현행 row supersede (row가 없으면 영향 0, 즉 최초 등록 경로)
        await tx
          .update(formTemplates)
          .set({ isCurrent: false, supersededAt: now, updatedAt: now })
          .where(and(eq(formTemplates.formName, formName), eq(formTemplates.isCurrent, true)));

        return tx
          .insert(formTemplates)
          .values({
            formName,
            formNumber,
            storageKey,
            originalFilename: filename,
            mimeType,
            fileSize: file.length,
            isCurrent: true,
            uploadedBy: userId,
          })
          .returning();
      });

      this.logger.log(
        `Form template version created: ${formName} @ ${formNumber} (${filename}, ${file.length} bytes)`
      );
      return inserted;
    } catch (err) {
      // DB 실패 시 방금 업로드한 storage 파일 정리
      await this.safeDeleteStorage(storageKey, 'createFormTemplateVersion rollback');
      throw err;
    }
  }

  /**
   * 동일 formNumber의 현행 row 파일 교체.
   *
   * 이력 보존 없음 (UL-QP-18이 요구하지 않음). 이전 파일은 DB 커밋 후 스토리지에서 삭제됩니다.
   * 스토리지 키는 매번 새 UUID로 생성해 CDN 캐시/동시성 이슈를 피합니다.
   */
  async replaceCurrentFile(input: FormTemplateMutationInput): Promise<FormTemplateRow> {
    const { formName, file, filename, mimeType, userId } = input;

    // 1. 양식명 검증 (카탈로그 기반)
    if (!getFormCatalogEntryByName(formName)) {
      throw new BadRequestException({
        code: ErrorCode.InvalidFormName,
        message: `알 수 없는 양식명: ${formName}`,
      });
    }

    // 2. 현행 row 필수 (없으면 replace 대상이 없음 → NotFound)
    const current = await this.getCurrentByName(formName);
    const previousStorageKey = current.storageKey;

    // 3. 새 storageKey 생성 (UUID 기반). 같은 formNumber 디렉토리 내.
    const ext = resolveFormTemplateExtension(mimeType, filename);
    const storageKey = this.buildStorageKey(current.formNumber, ext);

    // 4. 업로드 → DB UPDATE → 이전 파일 삭제 순서 (storage orphan 최소화)
    await this.storage.upload(storageKey, file, mimeType);

    let updated: FormTemplateRow;
    try {
      [updated] = await this.db
        .update(formTemplates)
        .set({
          storageKey,
          originalFilename: filename,
          mimeType,
          fileSize: file.length,
          uploadedBy: userId,
          uploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(formTemplates.id, current.id))
        .returning();
    } catch (err) {
      // DB 실패 → 방금 업로드한 파일 정리, 이전 파일은 건들지 않음 (DB 일관)
      await this.safeDeleteStorage(storageKey, 'replaceCurrentFile rollback');
      throw err;
    }

    // 5. DB 커밋 성공 — 이전 파일 삭제. 실패해도 DB는 이미 일관, orphan만 남음.
    if (previousStorageKey && previousStorageKey !== storageKey) {
      await this.safeDeleteStorage(previousStorageKey, 'replaceCurrentFile cleanup');
    }

    this.logger.log(
      `Form template file replaced: ${formName} (${current.formNumber}, ${filename})`
    );
    return updated;
  }

  // ── 시드 (부트스트랩) ──────────────────────────────────────────────────────

  /**
   * 파일시스템에서 초기 시드. 각 FORM_CATALOG 항목의 formName에 현행 row가 없으면 INSERT.
   *
   * MIME/확장자 판정은 `EXTENSION_TO_MIME` (FILE_TYPES SSOT)을 사용합니다.
   */
  async seedFromFilesystem(templateDir: string): Promise<void> {
    const absoluteDir = path.isAbsolute(templateDir)
      ? templateDir
      : path.resolve(process.cwd(), templateDir);

    if (!fs.existsSync(absoluteDir)) {
      this.logger.warn(`Template directory not found: ${absoluteDir} — skipping seed`);
      return;
    }

    const files = fs.readdirSync(absoluteDir);

    for (const [formNumber, entry] of Object.entries(FORM_CATALOG)) {
      const existing = await this.findCurrentByName(entry.name);
      if (existing) continue;

      const matchingFile = files.find((f) => f.includes(formNumber));
      if (!matchingFile) continue;

      const ext = path.extname(matchingFile).toLowerCase();
      if (!FORM_TEMPLATE_ALLOWED_EXTENSIONS.includes(ext)) {
        this.logger.warn(
          `Skipping seed for ${formNumber}: unsupported extension "${ext}" in ${matchingFile}`
        );
        continue;
      }
      const mimeType = EXTENSION_TO_MIME.get(ext);
      if (!mimeType) {
        this.logger.warn(`Skipping seed for ${formNumber}: no MIME mapping for extension "${ext}"`);
        continue;
      }

      const filePath = path.join(absoluteDir, matchingFile);
      const buffer = fs.readFileSync(filePath);
      const storageKey = this.buildStorageKey(formNumber, ext);

      await this.storage.upload(storageKey, buffer, mimeType);

      await this.db.insert(formTemplates).values({
        formName: entry.name,
        formNumber,
        storageKey,
        originalFilename: matchingFile,
        mimeType,
        fileSize: buffer.length,
        isCurrent: true,
        uploadedBy: null,
      });

      this.logger.log(`Seeded template: ${entry.name} (${formNumber}) ← ${matchingFile}`);
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  /**
   * storageKey 생성 규칙 (단일 소스).
   * 구조: `form-templates/{formNumber}/{uuid}{ext}`
   * - formNumber 디렉토리는 역사적 감사 추적에 유용
   * - UUID 파일명으로 replace 시 덮어쓰기/캐시 이슈 회피
   */
  private buildStorageKey(formNumber: string, ext: string): string {
    return `form-templates/${formNumber}/${randomUUID()}${ext}`;
  }

  /** 스토리지 삭제 실패를 warn 레벨로 로깅하고 삼킴 (상위 로직 차단 금지) */
  private async safeDeleteStorage(storageKey: string, context: string): Promise<void> {
    try {
      await this.storage.delete(storageKey);
    } catch (err) {
      this.logger.warn(
        `Storage delete failed [${context}] key=${storageKey}: ${(err as Error)?.message ?? err}`
      );
    }
  }
}
