import { Injectable, Inject, Logger } from '@nestjs/common';
import { and, eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { equipmentIncidentHistory } from '@equipment-management/db/schema/equipment-incident-history';
import { repairHistory } from '@equipment-management/db/schema/repair-history';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import {
  TIMELINE_ENTRY_TYPE_LABELS,
  NON_CONFORMANCE_TYPE_LABELS,
  REPAIR_RESULT_LABELS,
  TimelineEntryTypeEnum,
  type RepairResult,
  type NonConformanceType,
  type TimelineEntryType,
} from '@equipment-management/schemas';
import { HISTORY_CARD_QUERY_LIMITS } from '@equipment-management/shared-constants';
import type { TimelineEntry } from './equipment-timeline.types';

/**
 * incident → repair → non_conformance 순서의 priority — 같은 occurredAt일 때 정렬 tie-breaker.
 *
 * 이유: 동일 순간의 이벤트라면 incident(사건 보고)가 사용자 관점에서 가장 직접적이고,
 * repair(조치 기록)가 다음, nc(부적합 판정)가 마지막이다.
 */
const SOURCE_PRIORITY: Record<TimelineEntry['sourceTable'], number> = {
  incident: 0,
  repair: 1,
  non_conformance: 2,
};

/**
 * UL-QP-18-02 이력카드 통합 이력 서비스.
 *
 * 양식 §5 "장비 손상, 오작동, 변경 또는 수리 내역"은 절차서 §7.7 항목 10 + §9.9 (개정14)에 의해
 * 3개 테이블을 합쳐 표시해야 한다:
 * - equipment_incident_history (5가지 유형)
 * - repair_history (독립 수리 기록)
 * - non_conformances (부적합 조치)
 *
 * FK 역참조 기반 중복 제거:
 * - `incident.non_conformance_id === nc.id` → NC 스킵 (incident가 이미 해당 사건을 기록)
 * - `nc.repair_history_id === repair.id` → NC 스킵 (repair가 더 구체적인 조치)
 *
 * 정렬: occurredAt DESC, tie-breaker는 SOURCE_PRIORITY.
 *
 * @see docs/procedure/절차서/장비관리절차서.md §7.7, §9.9
 * @see packages/schemas/src/equipment-history.ts — TimelineEntryTypeEnum
 */
@Injectable()
export class EquipmentTimelineService {
  private readonly logger = new Logger(EquipmentTimelineService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  /**
   * 장비의 통합 이력 엔트리를 반환한다.
   *
   * @param equipmentId 장비 UUID
   * @param limit 섹션당 상한 (기본: HISTORY_CARD_QUERY_LIMITS.SECTION_ITEMS)
   * @returns occurredAt DESC 정렬 + FK 중복 제거된 엔트리 배열. 최대 `limit` 건.
   */
  async getTimeline(
    equipmentId: string,
    limit: number = HISTORY_CARD_QUERY_LIMITS.SECTION_ITEMS
  ): Promise<TimelineEntry[]> {
    const [incidentRows, repairRows, ncRows] = await Promise.all([
      this.db
        .select()
        .from(equipmentIncidentHistory)
        .where(eq(equipmentIncidentHistory.equipmentId, equipmentId))
        .orderBy(desc(equipmentIncidentHistory.occurredAt))
        .limit(limit),
      this.db
        .select()
        .from(repairHistory)
        .where(and(eq(repairHistory.equipmentId, equipmentId), eq(repairHistory.isDeleted, false)))
        .orderBy(desc(repairHistory.repairDate))
        .limit(limit),
      this.db
        .select()
        .from(nonConformances)
        .where(eq(nonConformances.equipmentId, equipmentId))
        .orderBy(desc(nonConformances.discoveryDate))
        .limit(limit),
    ]);

    return mergeTimeline(incidentRows, repairRows, ncRows, limit);
  }
}

// ============================================================================
// 순수 함수 레이어 — 유닛 테스트 대상
//
// 아래 함수들은 DB 접근 없이 in-memory row만 받아 TimelineEntry[]를 반환한다.
// 서비스 주입 없이 직접 호출 가능하여 어댑터/중복 제거/정렬 로직을 독립 검증할 수 있다.
// ============================================================================

type IncidentRow = typeof equipmentIncidentHistory.$inferSelect;
type RepairRow = typeof repairHistory.$inferSelect;
type NcRow = typeof nonConformances.$inferSelect;

/**
 * 3개 row 배열을 받아 중복 제거 + 정렬 + 어댑터 변환된 통합 이력 배열을 반환한다.
 *
 * 중복 제거 로직:
 * 1. `referencedNcIds` 수집 — incident가 참조하는 NC + repair에 연결된 NC
 * 2. NC 중 `referencedNcIds`에 포함된 것은 단독 행으로 생략 (대응 incident/repair에 crossRef 표기)
 */
export function mergeTimeline(
  incidentRows: readonly IncidentRow[],
  repairRows: readonly RepairRow[],
  ncRows: readonly NcRow[],
  limit: number
): TimelineEntry[] {
  // 1) NC → repair 역참조 맵 구축 (nc.repairHistoryId → nc)
  const ncByRepairId = new Map<string, NcRow>();
  for (const nc of ncRows) {
    if (nc.repairHistoryId) {
      ncByRepairId.set(nc.repairHistoryId, nc);
    }
  }

  // 2) incident/repair가 참조하는 NC id 집합 — 이 NC는 단독 행으로 생략
  const referencedNcIds = new Set<string>();
  for (const inc of incidentRows) {
    if (inc.nonConformanceId) referencedNcIds.add(inc.nonConformanceId);
  }
  for (const nc of ncRows) {
    if (nc.repairHistoryId) referencedNcIds.add(nc.id); // repair에 연결된 NC는 repair 행에 crossRef
  }

  // 3) 각 row를 TimelineEntry로 변환
  const entries: TimelineEntry[] = [];

  for (const inc of incidentRows) {
    entries.push(incidentToTimelineEntry(inc));
  }

  for (const rep of repairRows) {
    const linkedNc = ncByRepairId.get(rep.id);
    entries.push(repairToTimelineEntry(rep, linkedNc));
  }

  for (const nc of ncRows) {
    if (referencedNcIds.has(nc.id)) continue;
    entries.push(ncToTimelineEntry(nc));
  }

  // 4) occurredAt DESC + source priority tie-breaker
  entries.sort((a, b) => {
    const diff = b.occurredAt.getTime() - a.occurredAt.getTime();
    if (diff !== 0) return diff;
    return SOURCE_PRIORITY[a.sourceTable] - SOURCE_PRIORITY[b.sourceTable];
  });

  return entries.slice(0, limit);
}

/**
 * incident_history row → TimelineEntry.
 *
 * incident_history.incident_type은 DB 레벨에서 varchar(no $type narrowing)이므로
 * TimelineEntryTypeEnum.safeParse로 런타임 검증 후 라벨 맵에 접근한다. 알 수 없는 값은
 * 원본 문자열을 type/label 모두에 그대로 사용 (이력 보존 우선).
 */
export function incidentToTimelineEntry(row: IncidentRow): TimelineEntry {
  const parsed = TimelineEntryTypeEnum.safeParse(row.incidentType);
  const type: TimelineEntryType = parsed.success ? parsed.data : 'change';
  const label = parsed.success ? TIMELINE_ENTRY_TYPE_LABELS[type] : row.incidentType;
  return {
    occurredAt: row.occurredAt,
    type,
    label,
    content: row.content,
    sourceTable: 'incident',
    sourceId: row.id,
    ...(row.nonConformanceId
      ? { crossRef: { table: 'non_conformance' as const, id: row.nonConformanceId } }
      : {}),
  };
}

/**
 * repair_history row → TimelineEntry.
 * 연계된 NC가 있으면 content 끝에 `(연계: 부적합 #{shortId})` 주석을 추가하고 crossRef 메타도 포함.
 */
export function repairToTimelineEntry(row: RepairRow, linkedNc?: NcRow): TimelineEntry {
  const resultSuffix =
    row.repairResult && row.repairResult in REPAIR_RESULT_LABELS
      ? ` [${REPAIR_RESULT_LABELS[row.repairResult as RepairResult]}]`
      : '';
  const ncSuffix = linkedNc ? ` (연계: 부적합 #${linkedNc.id.slice(0, 8)})` : '';
  return {
    occurredAt: row.repairDate,
    type: 'repair_record',
    label: TIMELINE_ENTRY_TYPE_LABELS.repair_record,
    content: `${row.repairDescription}${resultSuffix}${ncSuffix}`,
    sourceTable: 'repair',
    sourceId: row.id,
    ...(linkedNc ? { crossRef: { table: 'non_conformance' as const, id: linkedNc.id } } : {}),
  };
}

/**
 * non_conformances row → TimelineEntry.
 * 유형 + 원인을 content로 결합. discoveryDate는 `date` 타입(string) → Date로 정규화.
 */
export function ncToTimelineEntry(row: NcRow): TimelineEntry {
  const typeLabel =
    row.ncType && row.ncType in NON_CONFORMANCE_TYPE_LABELS
      ? NON_CONFORMANCE_TYPE_LABELS[row.ncType as NonConformanceType]
      : row.ncType;
  return {
    occurredAt: new Date(row.discoveryDate),
    type: 'non_conformance',
    label: TIMELINE_ENTRY_TYPE_LABELS.non_conformance,
    content: `${typeLabel} — ${row.cause}`,
    sourceTable: 'non_conformance',
    sourceId: row.id,
  };
}
