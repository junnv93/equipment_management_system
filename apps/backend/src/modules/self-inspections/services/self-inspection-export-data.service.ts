import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray, type SQL } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import {
  equipmentSelfInspections,
  selfInspectionItems,
} from '@equipment-management/db/schema/equipment-self-inspections';
import { inspectionDocumentItems } from '@equipment-management/db/schema/inspection-document-items';
import { inspectionResultSections } from '@equipment-management/db/schema/inspection-result-sections';
import { documents } from '@equipment-management/db/schema/documents';
import { teams } from '@equipment-management/db/schema/teams';
import { users } from '@equipment-management/db/schema/users';
import type {
  EquipmentClassification,
  SelfInspectionItemJudgment,
} from '@equipment-management/schemas';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import type { InspectionResultSectionPreFetched } from '../../reports/docx-xml-helper';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';

/** 자체점검표(UL-QP-18-05) 헤더 셀 값 집합. */
export interface SelfInspectionHeader {
  /** snapshot enum (렌더러가 QP18_CLASSIFICATION_LABELS로 변환) */
  classification: EquipmentClassification;
  teamName: string;
  managementNumber: string;
  location: string;
  equipmentName: string;
  modelName: string;
  /** "{n}개월" 포맷 문자열 (데이터 서비스에서 조립) */
  inspectionCycle: string;
  /** snapshot — 양식 헤더 "교정유효기간" */
  validityPeriod: string;
}

/** 점검 항목 단일 행 데이터. */
export interface SelfInspectionItem {
  id: string;
  itemNumber: number;
  checkItem: string;
  /** snapshot enum (렌더러가 SELF_INSPECTION_RESULT_LABELS로 변환) */
  checkResult: SelfInspectionItemJudgment;
  /** detailed 결과(멀티라인 포함). null이면 렌더러가 checkResult 라벨로 대체. */
  detailedResult: string | null;
}

/** 기타 특기사항 단일 행 데이터. */
export interface SelfInspectionSpecialNote {
  number: string;
  content: string;
  date: string;
}

/** 결재란용 사용자 정보. */
export interface SelfInspectionSigner {
  name: string;
  signaturePath: string | null;
}

/** 항목별 첨부 사진 메타. */
export interface SelfInspectionItemPhoto {
  inspectionItemId: string;
  sortOrder: number;
  filePath: string;
  mimeType: string;
  originalFileName: string;
}

/** 렌더러가 소비할 자체점검 양식 전체 데이터. */
export interface SelfInspectionExportData {
  /** 자체점검 기록 PK */
  recordId: string;
  managementNumber: string;
  equipmentName: string;
  inspectionDate: Date | null;
  remarks: string;
  header: SelfInspectionHeader;
  items: SelfInspectionItem[];
  specialNotes: SelfInspectionSpecialNote[];
  itemPhotos: SelfInspectionItemPhoto[];
  inspector: SelfInspectionSigner;
  submitter: SelfInspectionSigner;
  approver: SelfInspectionSigner;
  /**
   * 동적 결과 섹션 선조회 데이터.
   * Renderer가 renderResultSections 호출 시 전달 — DB 접근 불필요.
   */
  resultSections: InspectionResultSectionPreFetched;
}

/**
 * UL-QP-18-05 자체점검표 데이터 집계 서비스.
 *
 * form-template-export.service.ts 의 exportSelfInspection 내 DB 쿼리 블록을 이관.
 *
 * snapshot 규칙 (Phase 4):
 * - classification = record.classification ?? (eqRow.calibrationRequired === 'required' ? 'calibrated' : 'non_calibrated')
 * - validityPeriod = record.calibrationValidityPeriod ?? '-'
 *
 * 기존 L713~714 "비교정기기 ? 'N/A' : '-'" 하드코딩은 제거 (SSOT CLASSIFICATION_LABELS + snapshot 직접 사용).
 */
@Injectable()
export class SelfInspectionExportDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async getData(
    equipmentId: string,
    inspectionId: string | undefined,
    filter: EnforcedScope
  ): Promise<SelfInspectionExportData> {
    // 장비 정보 조회 (헤더용) — 스코프 경계를 WHERE에 직접 적용
    const conditions: SQL<unknown>[] = [eq(equipment.id, equipmentId)];
    if (filter.site) conditions.push(eq(equipment.site, filter.site));
    if (filter.teamId) conditions.push(eq(equipment.teamId, filter.teamId));

    const [eqRow] = await this.db
      .select({
        id: equipment.id,
        name: equipment.name,
        modelName: equipment.modelName,
        managementNumber: equipment.managementNumber,
        location: equipment.location,
        site: equipment.site,
        calibrationRequired: equipment.calibrationRequired,
        teamId: equipment.teamId,
      })
      .from(equipment)
      .where(and(...conditions))
      .limit(1);

    if (!eqRow) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: 'Equipment not found or not accessible from your site.',
      });
    }

    // 팀 정보
    const [teamRow] = eqRow.teamId
      ? await this.db
          .select({ teamName: teams.name })
          .from(teams)
          .where(eq(teams.id, eqRow.teamId))
          .limit(1)
      : [null];

    // 대상 점검 기록: inspectionId가 있으면 해당 건, 없으면 최근 1건
    const [record] = inspectionId
      ? await this.db
          .select()
          .from(equipmentSelfInspections)
          .where(
            and(
              eq(equipmentSelfInspections.id, inspectionId),
              eq(equipmentSelfInspections.equipmentId, equipmentId)
            )
          )
          .limit(1)
      : await this.db
          .select()
          .from(equipmentSelfInspections)
          .where(eq(equipmentSelfInspections.equipmentId, equipmentId))
          .orderBy(desc(equipmentSelfInspections.inspectionDate))
          .limit(1);

    if (!record) {
      throw new NotFoundException({
        code: 'SELF_INSPECTION_NOT_FOUND',
        message: 'No self-inspection records found for this equipment.',
      });
    }

    // 점검자/제출자/승인자/점검항목/결과섹션 — 독립 쿼리 병렬 실행
    const [[inspectorRow], [submitterRow], [approverRow], itemRows, sectionRows] =
      await Promise.all([
        this.db
          .select({ name: users.name, signaturePath: users.signatureImagePath })
          .from(users)
          .where(eq(users.id, record.inspectorId))
          .limit(1),
        record.submittedBy
          ? this.db
              .select({ name: users.name, signaturePath: users.signatureImagePath })
              .from(users)
              .where(eq(users.id, record.submittedBy))
              .limit(1)
          : Promise.resolve([null] as [null]),
        record.approvedBy
          ? this.db
              .select({ name: users.name, signaturePath: users.signatureImagePath })
              .from(users)
              .where(eq(users.id, record.approvedBy))
              .limit(1)
          : Promise.resolve([null] as [null]),
        this.db
          .select()
          .from(selfInspectionItems)
          .where(eq(selfInspectionItems.inspectionId, record.id))
          .orderBy(selfInspectionItems.itemNumber),
        this.db
          .select()
          .from(inspectionResultSections)
          .where(
            and(
              eq(inspectionResultSections.inspectionId, record.id),
              eq(inspectionResultSections.inspectionType, 'self')
            )
          )
          .orderBy(asc(inspectionResultSections.sortOrder)),
      ] as const);

    // snapshot 우선, 없으면 장비 마스터에서 fallback
    const classification: EquipmentClassification =
      record.classification ??
      (eqRow.calibrationRequired === 'required' ? 'calibrated' : 'non_calibrated');
    const validityPeriod = record.calibrationValidityPeriod ?? '-';

    // 유연 항목이 있으면 items 사용, 없으면 레거시 fallback 생성
    const items: SelfInspectionItem[] =
      itemRows.length > 0
        ? itemRows.map((item) => ({
            id: item.id,
            itemNumber: item.itemNumber,
            checkItem: item.checkItem,
            checkResult: item.checkResult,
            detailedResult: item.detailedResult ?? null,
          }))
        : [
            {
              id: 'legacy-appearance',
              itemNumber: 1,
              checkItem: '외관검사',
              checkResult: record.appearance,
              detailedResult: null,
            },
            {
              id: 'legacy-functionality',
              itemNumber: 2,
              checkItem: '기능 점검',
              checkResult: record.functionality,
              detailedResult: null,
            },
            {
              id: 'legacy-safety',
              itemNumber: 3,
              checkItem: '안전 점검',
              checkResult: record.safety,
              detailedResult: null,
            },
            {
              id: 'legacy-calibration-status',
              itemNumber: 4,
              checkItem: '교정 상태 점검',
              checkResult: record.calibrationStatus,
              detailedResult: null,
            },
          ];

    // 기타 특기사항 — JSONB 런타임 안전 파싱 (레거시 데이터 shape 불일치 방어)
    const rawNotes = record.specialNotes;
    const parsedNotes = Array.isArray(rawNotes)
      ? (rawNotes as { content?: string; date?: string | null }[]).filter(
          (n) => typeof n?.content === 'string'
        )
      : null;

    const specialNotes: SelfInspectionSpecialNote[] =
      parsedNotes && parsedNotes.length > 0
        ? parsedNotes.map((note, idx) => ({
            number: String(idx + 1),
            content: note.content ?? '-',
            date: note.date ?? '-',
          }))
        : record.remarks
          ? [{ number: '1', content: record.remarks, date: '-' }]
          : [{ number: '', content: '-', date: '-' }];

    // 항목별 첨부 사진 (유연 항목만 — 레거시 fallback 항목은 미지원)
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
                eq(inspectionDocumentItems.inspectionItemType, 'self'),
                eq(documents.status, 'active')
              )
            )
            .orderBy(inspectionDocumentItems.inspectionItemId, inspectionDocumentItems.sortOrder)
        : [];

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
      recordId: record.id,
      managementNumber: eqRow.managementNumber ?? '-',
      equipmentName: eqRow.name,
      inspectionDate: record.inspectionDate,
      remarks: record.remarks ?? '-',
      header: {
        classification,
        teamName: teamRow?.teamName ?? '-',
        managementNumber: eqRow.managementNumber ?? '-',
        location: eqRow.location ?? '-',
        equipmentName: eqRow.name,
        modelName: eqRow.modelName ?? '-',
        inspectionCycle: `${record.inspectionCycle}개월`,
        validityPeriod,
      },
      items,
      specialNotes,
      itemPhotos,
      inspector: {
        name: inspectorRow?.name ?? '-',
        signaturePath: inspectorRow?.signaturePath ?? null,
      },
      submitter: {
        name: submitterRow?.name ?? '-',
        signaturePath: submitterRow?.signaturePath ?? null,
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

/** Date → YYYY/MM/DD formatting — renderer가 그대로 셀에 주입. 미사용 시 제거 가능. */
export function formatInspectionDate(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
}
