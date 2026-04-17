import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { and, eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import { calibrations } from '@equipment-management/db/schema/calibrations';
import { equipmentLocationHistory } from '@equipment-management/db/schema/equipment-location-history';
import { equipmentMaintenanceHistory } from '@equipment-management/db/schema/equipment-maintenance-history';
import { documents } from '@equipment-management/db/schema/documents';
import { teams } from '@equipment-management/db/schema/teams';
import { users } from '@equipment-management/db/schema/users';
import { equipmentTestSoftware } from '@equipment-management/db/schema/equipment-test-software';
import { testSoftware } from '@equipment-management/db/schema/test-software';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  HISTORY_CARD_QUERY_LIMIT,
} from '@equipment-management/shared-constants';
import {
  SPEC_MATCH_LABELS,
  CALIBRATION_REQUIRED_LABELS,
  MANAGEMENT_METHOD_LABELS,
  CALIBRATION_RESULT_LABELS,
} from '@equipment-management/schemas';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../../common/storage/storage.interface';
import { EquipmentTimelineService } from './equipment-timeline.service';
import type { TimelineEntry } from './equipment-timeline.types';

/**
 * 이력카드 기본정보 셀 텍스트 값 컬렉션 — renderer가 소비.
 *
 * 모든 필드는 `'-'` 기본값을 가진 완전한 string (null 없음) — renderer 단순화.
 */
export interface HistoryCardEquipmentInfo {
  managementNumber: string;
  name: string;
  modelName: string;
  manufacturer: string;
  serialNumber: string;
  status: string;
  site: string;
  location: string;
  teamName: string;
  managerName: string;
  deputyManagerName: string;
  purchaseYear: string;
  installationDate: string;
  description: string;
  assetNumber: string;
  /** 부속품 + 주요기능(description) 개행 병합 — "부속품 & 주요기능" 셀 대응 */
  accessories: string;
  manufacturerContact: string;
  supplier: string;
  supplierContact: string;
  specMatch: string;
  calibrationRequired: string;
  calibrationCycle: string;
  managementMethod: string;
  /** manual_location + equipment_test_software 이름 + firmware_version 병합 — "관련 S/W 및 매뉴얼" 셀 대응 */
  manualLocation: string;
  initialLocation: string;
  needsIntermediateCheck: string;
  approverName: string;
  /** equipment.approvedAt ?? updatedAt 기반 (승인 시점 단일 기록) */
  approvalDate: string;
}

export interface HistoryCardCalibration {
  [key: string]: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  status: string;
  result: string;
  agency: string;
  technicianId: string;
  certificateNumber: string;
}

export interface HistoryCardLocationHistory {
  [key: string]: string;
  changedAt: string;
  previousLocation: string;
  newLocation: string;
  notes: string;
}

export interface HistoryCardMaintenanceHistory {
  [key: string]: string;
  performedAt: string;
  content: string;
}

/**
 * 이력카드 DOCX 렌더링을 위해 집계된 전체 데이터.
 *
 * 기존 대비 변경:
 * - `checkouts` 제거 (양식에 반출 섹션 없음)
 * - `repairs`/`nonConformances`/`incidentHistory` 3개 배열 → 단일 `timeline` (EquipmentTimelineService 산출)
 */
export interface HistoryCardData {
  equipment: HistoryCardEquipmentInfo;
  calibrations: HistoryCardCalibration[];
  locationHistory: HistoryCardLocationHistory[];
  maintenanceHistory: HistoryCardMaintenanceHistory[];
  /**
   * 통합 이력 섹션 (incident + repair + non_conformances 병합).
   * renderer는 각 entry를 `[formatDate(occurredAt), '[{label}] {content}']`로 주입.
   */
  timeline: TimelineEntry[];
  approverSignaturePath: string | null;
  equipmentPhotoPath: string | null;
  generatedAt: string;
}

/**
 * 이력카드 DOCX 생성을 위한 데이터 집계 서비스.
 *
 * 기존 `HistoryCardService.aggregateData()`에서 다음 개선:
 * - **checkouts 쿼리 제거** — 양식 섹션에 반출 내역 없음 (불필요한 JOIN 제거)
 * - **equipment_test_software + test_software 조인** — "관련 S/W" 정보 수집
 * - **description + accessories 병합** — "부속품 & 주요기능" 셀에 주요기능 포함
 * - **manual_location + S/W + firmware_version 병합** — "관련 S/W 및 매뉴얼" 셀
 * - **approvedAt ?? updatedAt fallback** — 승인 시점 정확한 기록
 * - **3개 이력 테이블 → EquipmentTimelineService.getTimeline() 단일 필드**
 *
 * @see docs/procedure/양식/QP-18-02_시험설비이력카드.md
 * @see docs/procedure/절차서/장비관리절차서.md §7.7 §9.9
 */
@Injectable()
export class HistoryCardDataService {
  private readonly logger = new Logger(HistoryCardDataService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    @Inject(STORAGE_PROVIDER)
    private readonly _storage: IStorageProvider,
    private readonly timelineService: EquipmentTimelineService
  ) {
    // storage는 Phase 5 renderer에서 사용 — 현재 unused placeholder
    void this._storage;
  }

  async aggregate(equipmentId: string): Promise<HistoryCardData> {
    const [equipmentRow] = await this.db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!equipmentRow) {
      throw new NotFoundException(`장비를 찾을 수 없습니다: ${equipmentId}`);
    }

    // 관계 조회 — team, manager, deputy manager, approver
    const [team] = equipmentRow.teamId
      ? await this.db.select().from(teams).where(eq(teams.id, equipmentRow.teamId)).limit(1)
      : [null];

    const [manager] = equipmentRow.managerId
      ? await this.db.select().from(users).where(eq(users.id, equipmentRow.managerId)).limit(1)
      : [null];

    const [deputyManager] = equipmentRow.deputyManagerId
      ? await this.db
          .select()
          .from(users)
          .where(eq(users.id, equipmentRow.deputyManagerId))
          .limit(1)
      : [null];

    const [approver] = equipmentRow.approvedBy
      ? await this.db.select().from(users).where(eq(users.id, equipmentRow.approvedBy)).limit(1)
      : [null];

    // 독립 쿼리 병렬 실행 — calibrations, locationHistory, maintenanceHistory, 사진, S/W, timeline
    const [
      calibrationRows,
      locationRows,
      maintenanceRows,
      [photoDoc],
      testSoftwareLinks,
      timeline,
    ] = await Promise.all([
      this.db
        .select()
        .from(calibrations)
        .where(eq(calibrations.equipmentId, equipmentId))
        .orderBy(desc(calibrations.calibrationDate))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
        .select()
        .from(equipmentLocationHistory)
        .where(eq(equipmentLocationHistory.equipmentId, equipmentId))
        .orderBy(desc(equipmentLocationHistory.changedAt))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
        .select()
        .from(equipmentMaintenanceHistory)
        .where(eq(equipmentMaintenanceHistory.equipmentId, equipmentId))
        .orderBy(desc(equipmentMaintenanceHistory.performedAt))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
        .select({ filePath: documents.filePath })
        .from(documents)
        .where(
          and(
            eq(documents.equipmentId, equipmentId),
            eq(documents.documentType, 'equipment_photo'),
            eq(documents.status, 'active'),
            eq(documents.isLatest, true)
          )
        )
        .orderBy(desc(documents.createdAt))
        .limit(1),
      this.db
        .select({
          name: testSoftware.name,
          managementNumber: testSoftware.managementNumber,
          version: testSoftware.softwareVersion,
        })
        .from(equipmentTestSoftware)
        .innerJoin(testSoftware, eq(equipmentTestSoftware.testSoftwareId, testSoftware.id))
        .where(eq(equipmentTestSoftware.equipmentId, equipmentId))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.timelineService.getTimeline(equipmentId),
    ]);

    return {
      equipment: {
        managementNumber: equipmentRow.managementNumber ?? '-',
        name: equipmentRow.name,
        modelName: equipmentRow.modelName ?? '-',
        manufacturer: equipmentRow.manufacturer ?? '-',
        serialNumber: equipmentRow.serialNumber ?? '-',
        status: equipmentRow.status,
        site: equipmentRow.site ?? '-',
        location: equipmentRow.location ?? '-',
        teamName: team?.name ?? '-',
        managerName: manager?.name ?? '-',
        deputyManagerName: deputyManager?.name ?? '-',
        purchaseYear: equipmentRow.purchaseYear ? String(equipmentRow.purchaseYear) : '-',
        installationDate: formatDate(equipmentRow.installationDate),
        description: equipmentRow.description ?? '-',
        assetNumber: equipmentRow.assetNumber ?? '-',
        accessories: mergeAccessoriesAndFunctions(
          equipmentRow.accessories,
          equipmentRow.description
        ),
        manufacturerContact: equipmentRow.manufacturerContact ?? '-',
        supplier: equipmentRow.supplier ?? '-',
        supplierContact: equipmentRow.supplierContact ?? '-',
        specMatch: equipmentRow.specMatch ? SPEC_MATCH_LABELS[equipmentRow.specMatch] : '-',
        calibrationRequired: equipmentRow.calibrationRequired
          ? CALIBRATION_REQUIRED_LABELS[equipmentRow.calibrationRequired]
          : '-',
        calibrationCycle: equipmentRow.calibrationCycle
          ? `${equipmentRow.calibrationCycle}개월`
          : '-',
        managementMethod: equipmentRow.managementMethod
          ? ((MANAGEMENT_METHOD_LABELS as Record<string, string>)[equipmentRow.managementMethod] ??
            '-')
          : '-',
        manualLocation: mergeManualAndSoftware(
          equipmentRow.manualLocation,
          testSoftwareLinks,
          equipmentRow.firmwareVersion
        ),
        initialLocation: equipmentRow.initialLocation ?? '-',
        needsIntermediateCheck: equipmentRow.needsIntermediateCheck ? 'O' : 'X',
        approverName: approver?.name ?? '-',
        // 승인 시점 SSOT: approvedAt 우선, legacy 데이터는 updatedAt fallback
        approvalDate: formatDate(equipmentRow.approvedAt ?? equipmentRow.updatedAt),
      },
      calibrations: calibrationRows.map((row) => ({
        calibrationDate: formatDate(row.calibrationDate),
        nextCalibrationDate: formatDate(row.nextCalibrationDate),
        status: row.status ?? '-',
        result: row.result
          ? ((CALIBRATION_RESULT_LABELS as Record<string, string>)[row.result] ?? row.result)
          : '-',
        agency: row.agencyName ?? '',
        technicianId: row.technicianId ?? '-',
        certificateNumber: row.certificateNumber ?? '-',
      })),
      locationHistory: locationRows.map((row) => ({
        changedAt: formatDate(row.changedAt),
        previousLocation: row.previousLocation ?? '-',
        newLocation: row.newLocation,
        notes: row.notes ?? '-',
      })),
      maintenanceHistory: maintenanceRows.map((row) => ({
        performedAt: formatDate(row.performedAt),
        content: row.content,
      })),
      timeline,
      approverSignaturePath: approver?.signatureImagePath ?? null,
      equipmentPhotoPath: photoDoc?.filePath ?? null,
      generatedAt: new Date().toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE }),
    };
  }
}

// ============================================================================
// 병합 헬퍼 — 순수 함수 (유닛 테스트 가능)
// ============================================================================

/**
 * "부속품 & 주요기능" 셀 값 구성.
 *
 * 양식은 한 셀에 부속품과 주요기능을 같이 기록한다. 스키마에 별도 `mainFunctions` 필드가 없으므로
 * `equipment.description`(사양)을 주요기능으로 간주한다.
 *
 * - 둘 다 있으면: `{accessories}\n주요기능: {description}`
 * - 하나만 있으면: 해당 값만
 * - 둘 다 없으면: `'-'`
 */
export function mergeAccessoriesAndFunctions(
  accessories: string | null,
  description: string | null
): string {
  const a = accessories?.trim();
  const d = description?.trim();
  if (a && d) return `${a}\n주요기능: ${d}`;
  if (a) return a;
  if (d) return `주요기능: ${d}`;
  return '-';
}

type TestSoftwareLink = {
  name: string;
  managementNumber: string;
  version: string | null;
};

/**
 * "관련 S/W 및 매뉴얼" 셀 값 구성.
 *
 * UL-QP-18 §7.7 항목 7 "관련 소프트웨어(펌웨어) 및 매뉴얼"을 한 셀에 결합.
 *
 * - 보관장소(manual_location) + 각 test_software(`{번호} {이름} v{버전}`) + firmware_version
 * - 각 조각을 줄바꿈으로 구분하여 양식 셀 내 가독성 확보
 */
export function mergeManualAndSoftware(
  manualLocation: string | null,
  softwareLinks: readonly TestSoftwareLink[],
  firmwareVersion: string | null
): string {
  const segments: string[] = [];
  if (manualLocation?.trim()) segments.push(`보관장소: ${manualLocation.trim()}`);
  for (const sw of softwareLinks) {
    const versionSuffix = sw.version ? ` v${sw.version}` : '';
    segments.push(`S/W: ${sw.managementNumber} ${sw.name}${versionSuffix}`);
  }
  if (firmwareVersion?.trim()) segments.push(`FW: ${firmwareVersion.trim()}`);
  return segments.length > 0 ? segments.join('\n') : '-';
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}
