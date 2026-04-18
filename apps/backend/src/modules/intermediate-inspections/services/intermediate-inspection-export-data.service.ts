import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import {
  intermediateInspections,
  intermediateInspectionItems,
  intermediateInspectionEquipment,
} from '@equipment-management/db/schema/intermediate-inspections';
import { inspectionDocumentItems } from '@equipment-management/db/schema/inspection-document-items';
import { inspectionResultSections } from '@equipment-management/db/schema/inspection-result-sections';
import { documents } from '@equipment-management/db/schema/documents';
import { teams } from '@equipment-management/db/schema/teams';
import { users } from '@equipment-management/db/schema/users';
import type { EquipmentClassification, InspectionJudgment } from '@equipment-management/schemas';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import type { InspectionResultSectionPreFetched } from '../../reports/docx-xml-helper';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';

/**
 * 중간점검표(UL-QP-18-03) 헤더 셀 값 집합.
 * 렌더러가 바로 문자열로 주입할 수 있도록 snapshot 원본(enum/숫자)과 함께 제공.
 */
export interface IntermediateInspectionHeader {
  /** snapshot enum (렌더러가 QP18_CLASSIFICATION_LABELS로 변환) */
  classification: EquipmentClassification;
  teamName: string;
  managementNumber: string;
  location: string;
  equipmentName: string;
  modelName: string;
  /** 분기 별 숫자 — 렌더러가 "n개월" 또는 원본 문자열로 주입 */
  inspectionCycle: string;
  /** snapshot — 양식 헤더 "교정유효기간" */
  validityPeriod: string;
}

/** 점검 항목 단일 행 데이터. */
export interface IntermediateInspectionItem {
  id: string;
  itemNumber: number;
  checkItem: string;
  checkCriteria: string;
  /** detailedResult ?? checkResult 병합 (렌더러 입력) */
  resultText: string;
  /** snapshot enum (렌더러가 INSPECTION_JUDGMENT_LABELS로 변환) */
  judgment: InspectionJudgment | null;
  /** 멀티라인 원본 (renderer가 setCellMultilineText 대상 판단) */
  rawMultilineResult: string | null;
}

/** 측정 장비 단일 행 데이터. */
export interface IntermediateInspectionMeasureEquipment {
  managementNumber: string;
  equipmentName: string;
  calibrationDate: string;
}

/** 결재란용 사용자 정보 (이름 + 서명 경로). */
export interface IntermediateInspectionSigner {
  name: string;
  signaturePath: string | null;
}

/** 항목별 첨부 사진 메타데이터 — 렌더러가 스토리지에서 다운로드. */
export interface IntermediateInspectionItemPhoto {
  inspectionItemId: string;
  sortOrder: number;
  filePath: string;
  mimeType: string;
  originalFileName: string;
}

/** 렌더러가 소비할 중간점검 양식 전체 데이터. */
export interface IntermediateInspectionExportData {
  inspectionId: string;
  managementNumber: string;
  equipmentName: string;
  inspectionDate: Date | null;
  remarks: string;
  header: IntermediateInspectionHeader;
  items: IntermediateInspectionItem[];
  measureEquipment: IntermediateInspectionMeasureEquipment[];
  itemPhotos: IntermediateInspectionItemPhoto[];
  inspector: IntermediateInspectionSigner;
  approver: IntermediateInspectionSigner;
  /**
   * 동적 결과 섹션 선조회 데이터.
   * Renderer가 renderResultSections 호출 시 전달 — DB 접근 불필요.
   */
  resultSections: InspectionResultSectionPreFetched;
}

/**
 * UL-QP-18-03 중간점검표 데이터 집계 서비스.
 *
 * form-template-export.service.ts 의 exportIntermediateInspection 내 DB 쿼리 블록을 이관.
 * Scope enforcement(site/teamId)은 데이터 로드 후 soft deny — 경계 밖은 404로 은닉.
 */
@Injectable()
export class IntermediateInspectionExportDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async getData(
    inspectionId: string,
    filter: EnforcedScope
  ): Promise<IntermediateInspectionExportData> {
    // 점검 기록 + 장비 정보 조회 (기존 L328~353)
    const [inspection] = await this.db
      .select({
        id: intermediateInspections.id,
        inspectionDate: intermediateInspections.inspectionDate,
        classification: intermediateInspections.classification,
        inspectionCycle: intermediateInspections.inspectionCycle,
        calibrationValidityPeriod: intermediateInspections.calibrationValidityPeriod,
        overallResult: intermediateInspections.overallResult,
        remarks: intermediateInspections.remarks,
        approvalStatus: intermediateInspections.approvalStatus,
        approvedAt: intermediateInspections.approvedAt,
        equipmentName: equipment.name,
        equipmentModel: equipment.modelName,
        managementNumber: equipment.managementNumber,
        equipmentLocation: equipment.location,
        equipmentSite: equipment.site,
        equipmentTeamId: equipment.teamId,
        inspectorId: intermediateInspections.inspectorId,
        approvedById: intermediateInspections.approvedBy,
      })
      .from(intermediateInspections)
      .innerJoin(equipment, eq(intermediateInspections.equipmentId, equipment.id))
      .where(
        and(
          eq(intermediateInspections.id, inspectionId),
          filter.site ? eq(equipment.site, filter.site) : undefined,
          filter.teamId ? eq(equipment.teamId, filter.teamId) : undefined
        )
      )
      .limit(1);

    if (!inspection) {
      throw new NotFoundException({
        code: 'INSPECTION_NOT_FOUND',
        message: `Intermediate inspection ${inspectionId} not found.`,
      });
    }

    // 팀 정보 조회 — equipment.teamId 직접 JOIN (managementNumber는 중복 가능성이 있어 PK로 부적합).
    // equipmentTeamId는 위 inspection select에서 이미 확보됨.
    const [teamRow] = inspection.equipmentTeamId
      ? await this.db
          .select({ teamName: teams.name })
          .from(teams)
          .where(eq(teams.id, inspection.equipmentTeamId))
          .limit(1)
      : [null];

    // 점검자, 승인자, 점검 항목, 측정 장비, 결과섹션 — 독립 쿼리 병렬 실행
    const [[inspectorRow], [approverRow], itemRows, measureEquipmentRows, sectionRows] =
      await Promise.all([
        inspection.inspectorId
          ? this.db
              .select({ name: users.name, signaturePath: users.signatureImagePath })
              .from(users)
              .where(eq(users.id, inspection.inspectorId))
              .limit(1)
          : Promise.resolve([null] as [null]),
        inspection.approvedById
          ? this.db
              .select({ name: users.name, signaturePath: users.signatureImagePath })
              .from(users)
              .where(eq(users.id, inspection.approvedById))
              .limit(1)
          : Promise.resolve([null] as [null]),
        this.db
          .select()
          .from(intermediateInspectionItems)
          .where(eq(intermediateInspectionItems.inspectionId, inspectionId))
          .orderBy(intermediateInspectionItems.itemNumber),
        this.db
          .select({
            managementNumber: equipment.managementNumber,
            equipmentName: equipment.name,
            calibrationDate: intermediateInspectionEquipment.calibrationDate,
          })
          .from(intermediateInspectionEquipment)
          .innerJoin(equipment, eq(intermediateInspectionEquipment.equipmentId, equipment.id))
          .where(eq(intermediateInspectionEquipment.inspectionId, inspectionId)),
        this.db
          .select()
          .from(inspectionResultSections)
          .where(
            and(
              eq(inspectionResultSections.inspectionId, inspectionId),
              eq(inspectionResultSections.inspectionType, 'intermediate')
            )
          )
          .orderBy(asc(inspectionResultSections.sortOrder)),
      ] as const);

    // 항목별 첨부 사진 메타 조회 (렌더러가 스토리지 다운로드)
    const itemIds = itemRows.map((it) => it.id);
    const itemPhotos =
      itemIds.length > 0
        ? await this.db
            .select({
              inspectionItemId: inspectionDocumentItems.inspectionItemId,
              sortOrder: inspectionDocumentItems.sortOrder,
              filePath: documents.filePath,
              mimeType: documents.mimeType,
              originalFileName: documents.originalFileName,
            })
            .from(inspectionDocumentItems)
            .innerJoin(documents, eq(inspectionDocumentItems.documentId, documents.id))
            .where(
              and(
                inArray(inspectionDocumentItems.inspectionItemId, itemIds),
                eq(inspectionDocumentItems.inspectionItemType, 'intermediate'),
                eq(documents.status, 'active')
              )
            )
            .orderBy(inspectionDocumentItems.inspectionItemId, inspectionDocumentItems.sortOrder)
        : [];

    // snapshot 분류: null이면 비교정기기 fallback (비파괴 — 기존 L420~421 유지)
    const classification: EquipmentClassification = inspection.classification ?? 'non_calibrated';

    // 섹션 내 이미지 documentId 수집 → documents 테이블에서 경로 선조회
    // (sectionRows는 위 Promise.all에서 병렬 취득)
    const sectionDocumentIdSet = new Set<string>();
    for (const section of sectionRows) {
      if (section.sectionType === 'photo' && section.documentId) {
        sectionDocumentIdSet.add(section.documentId);
      } else if (section.sectionType === 'rich_table') {
        const rd = section.richTableData as {
          rows: Array<Array<{ type: string; documentId?: string }>>;
        } | null;
        if (rd) {
          for (const row of rd.rows) {
            for (const cell of row) {
              if (cell.type === 'image' && cell.documentId) {
                sectionDocumentIdSet.add(cell.documentId);
              }
            }
          }
        }
      }
    }

    const sectionDocIds = Array.from(sectionDocumentIdSet);
    const sectionDocRows =
      sectionDocIds.length > 0
        ? await this.db
            .select({
              id: documents.id,
              filePath: documents.filePath,
              mimeType: documents.mimeType,
            })
            .from(documents)
            .where(inArray(documents.id, sectionDocIds))
        : [];

    const sectionDocumentPaths = new Map(
      sectionDocRows.map((r) => [r.id, { filePath: r.filePath, mimeType: r.mimeType }])
    );

    return {
      inspectionId,
      managementNumber: inspection.managementNumber ?? '-',
      equipmentName: inspection.equipmentName ?? '-',
      inspectionDate: inspection.inspectionDate,
      remarks: inspection.remarks ?? '-',
      header: {
        classification,
        teamName: teamRow?.teamName ?? '-',
        managementNumber: inspection.managementNumber ?? '-',
        location: inspection.equipmentLocation ?? '-',
        equipmentName: inspection.equipmentName ?? '-',
        modelName: inspection.equipmentModel ?? '-',
        inspectionCycle: inspection.inspectionCycle ?? '-',
        validityPeriod: inspection.calibrationValidityPeriod ?? '-',
      },
      items: itemRows.map((item) => {
        const resultText = (item.detailedResult ?? item.checkResult) || '-';
        return {
          id: item.id,
          itemNumber: item.itemNumber,
          checkItem: item.checkItem,
          checkCriteria: item.checkCriteria ?? '-',
          resultText,
          judgment: item.judgment ?? null,
          rawMultilineResult:
            item.detailedResult && item.detailedResult.includes('\n') ? item.detailedResult : null,
        };
      }),
      measureEquipment: measureEquipmentRows.map((me) => ({
        managementNumber: me.managementNumber ?? '-',
        equipmentName: me.equipmentName ?? '-',
        calibrationDate: formatYmd(me.calibrationDate),
      })),
      itemPhotos,
      inspector: {
        name: inspectorRow?.name ?? '-',
        signaturePath: inspectorRow?.signaturePath ?? null,
      },
      approver: {
        name: approverRow?.name ?? '-',
        signaturePath: approverRow?.signaturePath ?? null,
      },
      resultSections: {
        sections: sectionRows,
        documentPaths: sectionDocumentPaths,
      },
    };
  }
}

/**
 * 기존 FormTemplateExportService.formatDate와 동등. 로케일 기반 YYYY. MM. DD. 포맷.
 * renderer는 이미 문자열로 받아 그대로 셀에 주입하므로 data 서비스에서 변환.
 */
function formatYmd(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
}
