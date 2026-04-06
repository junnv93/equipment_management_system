import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, and, desc, max } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import type { AppDatabase } from '@equipment-management/db';
import { formTemplates } from '@equipment-management/db/schema/form-templates';
import { FORM_CATALOG } from '@equipment-management/shared-constants';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../common/storage/storage.interface';

/**
 * 양식 템플릿 관리 서비스
 *
 * DB + 스토리지 기반으로 docx/xlsx 템플릿을 관리합니다.
 * 파일시스템 직접 접근을 제거하여 컨테이너 친화적 운영을 지원합니다.
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

  /**
   * 활성 템플릿 Buffer 반환
   *
   * @param formNumber 양식 번호 (예: 'UL-QP-18-03')
   * @returns 템플릿 파일 Buffer
   * @throws NotFoundException 활성 템플릿이 없을 경우
   */
  async getTemplateBuffer(formNumber: string): Promise<Buffer> {
    const [active] = await this.db
      .select()
      .from(formTemplates)
      .where(and(eq(formTemplates.formNumber, formNumber), eq(formTemplates.isActive, true)))
      .limit(1);

    if (!active) {
      throw new NotFoundException({
        code: 'TEMPLATE_NOT_FOUND',
        message: `Active template not found for form number: ${formNumber}`,
      });
    }

    return this.storage.download(active.storageKey);
  }

  /**
   * 새 템플릿 업로드 (기존 활성 템플릿 비활성화)
   */
  async uploadTemplate(
    formNumber: string,
    file: Buffer,
    filename: string,
    mimeType: string,
    userId: string
  ): Promise<typeof formTemplates.$inferSelect> {
    // FORM_CATALOG에 존재하는 양식인지 확인
    if (!FORM_CATALOG[formNumber]) {
      throw new BadRequestException({
        code: 'INVALID_FORM_NUMBER',
        message: `Unknown form number: ${formNumber}`,
      });
    }

    // 다음 버전 번호 계산
    const [maxRow] = await this.db
      .select({ maxVersion: max(formTemplates.version) })
      .from(formTemplates)
      .where(eq(formTemplates.formNumber, formNumber));

    const nextVersion = (maxRow?.maxVersion ?? 0) + 1;

    // 파일 확장자 추출
    const ext = path.extname(filename) || '.docx';
    const storageKey = `form-templates/${formNumber}/v${nextVersion}${ext}`;

    // 스토리지 업로드를 트랜잭션 밖에서 먼저 실행 (orphan 방지)
    await this.storage.upload(storageKey, file, mimeType);

    let record: typeof formTemplates.$inferSelect;
    try {
      // DB 트랜잭션: 기존 활성 비활성화 → 새 레코드 삽입
      const [inserted] = await this.db.transaction(async (tx) => {
        await tx
          .update(formTemplates)
          .set({ isActive: false, updatedAt: new Date() })
          .where(and(eq(formTemplates.formNumber, formNumber), eq(formTemplates.isActive, true)));

        return tx
          .insert(formTemplates)
          .values({
            formNumber,
            version: nextVersion,
            storageKey,
            originalFilename: filename,
            mimeType,
            fileSize: file.length,
            isActive: true,
            uploadedBy: userId,
          })
          .returning();
      });
      record = inserted;
    } catch (err) {
      // DB 실패 시 스토리지 파일 정리
      await this.storage.delete(storageKey);
      throw err;
    }

    this.logger.log(`Template uploaded: ${formNumber} v${nextVersion} (${filename})`);
    return record;
  }

  /**
   * 파일시스템에서 초기 시드 (부트스트랩용)
   *
   * 각 FORM_CATALOG 항목에 대해 활성 템플릿이 없으면 파일시스템에서 업로드합니다.
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

    for (const formNumber of Object.keys(FORM_CATALOG)) {
      // 이미 활성 템플릿이 있으면 스킵
      const [existing] = await this.db
        .select({ id: formTemplates.id })
        .from(formTemplates)
        .where(and(eq(formTemplates.formNumber, formNumber), eq(formTemplates.isActive, true)))
        .limit(1);

      if (existing) continue;

      // formNumber에 매칭하는 파일 검색 (예: UL-QP-18-03 → UL-QP-18-03(02) 중간점검표.docx)
      const matchingFile = files.find((f) => f.includes(formNumber));
      if (!matchingFile) continue;

      const filePath = path.join(absoluteDir, matchingFile);
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(matchingFile).toLowerCase();
      const mimeType =
        ext === '.xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const storageKey = `form-templates/${formNumber}/v1${ext}`;

      await this.storage.upload(storageKey, buffer, mimeType);

      await this.db.insert(formTemplates).values({
        formNumber,
        version: 1,
        storageKey,
        originalFilename: matchingFile,
        mimeType,
        fileSize: buffer.length,
        isActive: true,
        uploadedBy: null, // 시스템 시드
      });

      this.logger.log(`Seeded template: ${formNumber} ← ${matchingFile}`);
    }
  }

  /**
   * 양식 번호별 템플릿 이력 조회
   */
  async listTemplates(formNumber: string): Promise<Array<typeof formTemplates.$inferSelect>> {
    return this.db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.formNumber, formNumber))
      .orderBy(desc(formTemplates.version));
  }

  /**
   * 전체 활성 템플릿 1회 조회 (N+1 방지)
   */
  async listAllActive(): Promise<Array<typeof formTemplates.$inferSelect>> {
    return this.db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.isActive, true))
      .orderBy(formTemplates.formNumber);
  }
}
