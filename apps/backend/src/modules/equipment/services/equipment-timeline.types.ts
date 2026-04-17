import type { TimelineEntryType } from '@equipment-management/schemas';

/**
 * 통합 이력 엔트리 — incident/repair/nonConformance 3개 테이블을 정규화한 공통 도메인 타입.
 *
 * `equipment-timeline.service.ts`가 각 테이블 row를 어댑터로 변환하여 DESC 정렬된 배열로 반환한다.
 * 이력카드 renderer는 이 배열을 UNIFIED_INCIDENT 섹션에 `[formatDate(occurredAt), '[{label}] {content}']`로 주입.
 *
 * FK 역참조 기반 중복 제거 정책:
 * - incident.non_conformance_id === nc.id → NC 스킵 (incident가 더 최근 관점)
 * - nc.repair_history_id === repair.id → NC 스킵 (repair가 더 구체적인 조치)
 *
 * @see packages/schemas/src/equipment-history.ts — TimelineEntryTypeEnum SSOT
 * @see docs/procedure/절차서/장비관리절차서.md §7.7, §9.9
 */
export interface TimelineEntry {
  /** 이벤트 발생 시점 (incident.occurredAt / repair.repairDate / nc.discoveryDate로 정규화) */
  readonly occurredAt: Date;
  /** 유형 — IncidentType 5종 + 'repair_record' + 'non_conformance' */
  readonly type: TimelineEntryType;
  /** UI 표시용 한국어 라벨 (TIMELINE_ENTRY_TYPE_LABELS에서 매핑) */
  readonly label: string;
  /** 이벤트 본문 (incident.content / repair.repairDescription / nc.cause 중 하나) */
  readonly content: string;
  /** 원본 테이블 식별자 — 중복 제거/디버깅용 */
  readonly sourceTable: 'incident' | 'repair' | 'non_conformance';
  /** 원본 row UUID */
  readonly sourceId: string;
  /**
   * 연계 레코드 참조 (생략 가능) — 주로 incident가 NC를 참조하거나
   * repair가 NC와 1:1 연결된 경우 content에 "(연계: {table}#{shortId})" 주석용.
   */
  readonly crossRef?: {
    readonly table: 'incident' | 'repair' | 'non_conformance';
    readonly id: string;
  };
}
