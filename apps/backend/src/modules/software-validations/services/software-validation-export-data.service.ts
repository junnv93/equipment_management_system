import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { softwareValidations } from '@equipment-management/db/schema/software-validations';
import { testSoftware } from '@equipment-management/db/schema/test-software';
import { users } from '@equipment-management/db/schema/users';
import type { AcquisitionOrProcessingItem, ControlItem } from '@equipment-management/schemas';
import {
  acquisitionOrProcessingArraySchema,
  controlItemArraySchema,
  ValidationStatusValues,
} from '@equipment-management/schemas';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';
import type { Site } from '@equipment-management/schemas';

/** 서명 렌더링에 필요한 사용자 정보 */
export interface SoftwareValidationSigner {
  name: string;
  signaturePath: string | null;
}

/** 렌더러에 전달하는 완전한 export 데이터 집합 */
export interface SoftwareValidationExportData {
  validationType: 'vendor' | 'self';
  status: string;
  softwareName: string;
  softwareVersion: string | null;
  testDate: Date | null;
  infoDate: Date | null;
  softwareAuthor: string | null;
  // 방법 1: 공급자 시연
  vendorName: string | null;
  vendorSummary: string | null;
  receivedDate: Date | null;
  attachmentNote: string | null;
  receiver: SoftwareValidationSigner | null;
  // 방법 2: 자체 시험
  referenceDocuments: string | null;
  operatingUnitDescription: string | null;
  softwareComponents: string | null;
  hardwareComponents: string | null;
  acquisitionFunctions: AcquisitionOrProcessingItem[];
  processingFunctions: AcquisitionOrProcessingItem[];
  controlFunctions: ControlItem[];
  performer: SoftwareValidationSigner | null;
  // 승인
  techApprover: SoftwareValidationSigner | null;
  qualityApprover: SoftwareValidationSigner | null;
}

const EXPORTABLE_STATUSES = [
  ValidationStatusValues.SUBMITTED,
  ValidationStatusValues.APPROVED,
  ValidationStatusValues.QUALITY_APPROVED,
] as const;

/**
 * UL-QP-18-09 내보내기용 데이터 조회 서비스.
 *
 * DB 조회 + scope 검증 + Zod 파싱을 담당. 렌더링 로직 포함 금지.
 */
@Injectable()
export class SoftwareValidationExportDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async fetchExportData(
    validationId: string,
    filter: EnforcedScope
  ): Promise<SoftwareValidationExportData> {
    if (!validationId) {
      throw new BadRequestException({
        code: 'MISSING_VALIDATION_ID',
        message: 'validationId query parameter is required for software validation export.',
      });
    }

    // Software validation은 site 단위 리소스. team 스코프 사용자는 접근 불가.
    if (filter.teamId) {
      throw new ForbiddenException({
        code: 'SCOPE_RESOURCE_MISMATCH',
        message:
          '팀 스코프 사용자는 소프트웨어 유효성 확인 리포트를 조회할 수 없습니다 (site 단위 리소스).',
      });
    }

    const [record] = await this.db
      .select({
        id: softwareValidations.id,
        validationType: softwareValidations.validationType,
        status: softwareValidations.status,
        softwareVersion: softwareValidations.softwareVersion,
        testDate: softwareValidations.testDate,
        infoDate: softwareValidations.infoDate,
        softwareAuthor: softwareValidations.softwareAuthor,
        vendorName: softwareValidations.vendorName,
        vendorSummary: softwareValidations.vendorSummary,
        receivedBy: softwareValidations.receivedBy,
        receivedDate: softwareValidations.receivedDate,
        attachmentNote: softwareValidations.attachmentNote,
        referenceDocuments: softwareValidations.referenceDocuments,
        operatingUnitDescription: softwareValidations.operatingUnitDescription,
        softwareComponents: softwareValidations.softwareComponents,
        hardwareComponents: softwareValidations.hardwareComponents,
        acquisitionFunctions: softwareValidations.acquisitionFunctions,
        processingFunctions: softwareValidations.processingFunctions,
        controlFunctions: softwareValidations.controlFunctions,
        performedBy: softwareValidations.performedBy,
        technicalApproverId: softwareValidations.technicalApproverId,
        qualityApproverId: softwareValidations.qualityApproverId,
        softwareName: testSoftware.name,
        softwareSite: testSoftware.site,
      })
      .from(softwareValidations)
      .innerJoin(testSoftware, eq(softwareValidations.testSoftwareId, testSoftware.id))
      .where(
        and(
          eq(softwareValidations.id, validationId),
          filter.site ? eq(testSoftware.site, filter.site as Site) : undefined
        )
      )
      .limit(1);

    if (!record) {
      throw new NotFoundException({
        code: 'VALIDATION_NOT_FOUND',
        message: `Software validation ${validationId} not found.`,
      });
    }

    // draft / rejected 상태는 내보내기 불가 (절차서: 승인 완료된 문서만 공식 기록)
    if (!EXPORTABLE_STATUSES.includes(record.status as (typeof EXPORTABLE_STATUSES)[number])) {
      throw new BadRequestException({
        code: 'NON_EXPORTABLE_VALIDATION_STATUS',
        message: `Status '${record.status}' is not exportable. Must be submitted, approved, or quality_approved.`,
      });
    }

    // 관련 사용자 일괄 조회
    const userIdSet = [
      ...new Set(
        [
          record.receivedBy,
          record.performedBy,
          record.technicalApproverId,
          record.qualityApproverId,
        ].filter((id): id is string => id !== null)
      ),
    ];
    const userMap = new Map<string, SoftwareValidationSigner>();
    if (userIdSet.length > 0) {
      const userRows = await this.db
        .select({ id: users.id, name: users.name, signaturePath: users.signatureImagePath })
        .from(users)
        .where(inArray(users.id, userIdSet));
      for (const u of userRows) {
        userMap.set(u.id, { name: u.name, signaturePath: u.signaturePath });
      }
    }

    return {
      validationType: record.validationType as 'vendor' | 'self',
      status: record.status,
      softwareName: record.softwareName,
      softwareVersion: record.softwareVersion,
      testDate: record.testDate,
      infoDate: record.infoDate,
      softwareAuthor: record.softwareAuthor,
      vendorName: record.vendorName,
      vendorSummary: record.vendorSummary,
      receivedDate: record.receivedDate,
      attachmentNote: record.attachmentNote,
      receiver: record.receivedBy ? (userMap.get(record.receivedBy) ?? null) : null,
      referenceDocuments: record.referenceDocuments,
      operatingUnitDescription: record.operatingUnitDescription,
      softwareComponents: record.softwareComponents,
      hardwareComponents: record.hardwareComponents,
      acquisitionFunctions: this.parseAcqProc(record.acquisitionFunctions),
      processingFunctions: this.parseAcqProc(record.processingFunctions),
      controlFunctions: this.parseControl(record.controlFunctions),
      performer: record.performedBy ? (userMap.get(record.performedBy) ?? null) : null,
      techApprover: record.technicalApproverId
        ? (userMap.get(record.technicalApproverId) ?? null)
        : null,
      qualityApprover: record.qualityApproverId
        ? (userMap.get(record.qualityApproverId) ?? null)
        : null,
    };
  }

  private parseAcqProc(raw: unknown): AcquisitionOrProcessingItem[] {
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const result = acquisitionOrProcessingArraySchema.safeParse(parsed);
      if (result.success) return result.data;
      // 구형 seed 호환 폴백 (name/criteria/result 필드만 있는 경우)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item: unknown) => typeof (item as Record<string, unknown>)?.name === 'string')
          .map((item: Record<string, unknown>) => ({
            name: String(item.name),
            independentMethod: String(item.independentMethod ?? item.means ?? '-'),
            acceptanceCriteria: String(item.acceptanceCriteria ?? item.criteria ?? '-'),
            result: (item.result as 'pass' | 'fail' | 'na') ?? undefined,
          }));
      }
      return [];
    } catch {
      return [];
    }
  }

  private parseControl(raw: unknown): ControlItem[] {
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const result = controlItemArraySchema.safeParse(parsed);
      if (result.success) return result.data;
      // 구형 seed 호환 폴백
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (item: unknown) =>
              typeof (item as Record<string, unknown>)?.equipmentFunction === 'string' ||
              typeof (item as Record<string, unknown>)?.name === 'string'
          )
          .map((item: Record<string, unknown>) => ({
            equipmentFunction: String(item.equipmentFunction ?? item.name ?? '-'),
            expectedFunction: String(item.expectedFunction ?? '-'),
            observedFunction: String(item.observedFunction ?? '-'),
            independentMethod: String(item.independentMethod ?? item.means ?? '-'),
            acceptanceCriteria: String(item.acceptanceCriteria ?? item.criteria ?? '-'),
            result: (item.result as 'pass' | 'fail' | 'na') ?? undefined,
          }));
      }
      return [];
    } catch {
      return [];
    }
  }
}
