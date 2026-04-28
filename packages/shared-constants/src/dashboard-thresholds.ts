/**
 * 대시보드 임계값 SSOT (Single Source of Truth).
 *
 * **반드시 이 모듈만 import해서 사용**:
 *  - 프론트엔드 `lib/design-tokens/components/dday-tone.ts`
 *  - 백엔드 `apps/backend/src/modules/dashboard/dashboard.service.ts`
 *
 * 임계값을 컴포넌트나 서비스에 하드코딩하면 frontend/backend 간 분기가 발생해
 * "백엔드는 healthy인데 프론트는 warn" 같은 시각 불일치를 유발한다.
 *
 * 변경 시 영향 범위:
 *  - DDay 라벨 색상 (DDayTag, CalibrationDdayList)
 *  - 가동률 KPI 게이지 톤 (KpiStatusGrid)
 *  - 팀 분포 막대 톤 (TeamEquipmentDistribution)
 *  - 시스템 상태 카드 + 백엔드 overallStatus 계산
 */

// ============================================================================
// 1. D-day 4단계 의미론 톤 (대시보드 개선안 §1.1, §3.5).
// ============================================================================
//
// 입력 규약: `days` = 양수=초과 일수, 음수=남은 일수, 0=오늘.
//
// - days > 0                   → overdue (빨강)
// - -7 <= days <= 0            → urgent  (주황)
// - -30 <= days < -7           → soon    (파랑)
// - days < -30                 → normal  (초록)
export const DDAY_THRESHOLDS = {
  /** urgent 톤 적용 최대 남은 일수 (포함). */
  urgent: 7,
  /** soon 톤 적용 최대 남은 일수 (포함). */
  soon: 30,
} as const;

// ============================================================================
// 2. 가동률 KPI 게이지 (명세서 §3.2).
// ============================================================================
//
// - utilizationPct ≥ 60 → ok    (목표 도달)
// - utilizationPct ≥ 40 → warn  (경계)
// - utilizationPct < 40 → danger (미달)
export const UTILIZATION_GAUGE_THRESHOLDS = {
  ok: 60,
  warn: 40,
} as const;

// ============================================================================
// 3. 팀 분포 막대 톤 (명세서 §3.6, §A.6).
// ============================================================================
//
// 가동률 미달 팀 강조용 — KPI 게이지와는 의미가 달라 별도 임계값 유지:
//  - utilizationPct < 50 → danger (가동률 미달)
//  - utilizationPct < 60 → warn   (경계)
//  - 그 외               → default (정상, 강조 없음)
export const DISTRIBUTION_BAR_THRESHOLDS = {
  danger: 50,
  warn: 60,
} as const;

// ============================================================================
// 4. 시스템 상태 메트릭 (명세서 §3.9).
// ============================================================================
//
// 4-1. 개별 메트릭 임계값 (게이지 색 결정).
//
// 각 메트릭은 ok/warn/danger 3단계 톤으로 평가된다.
// "임계값 미만"이 ok, "임계값 이상"이 다음 단계.
export const SYSTEM_HEALTH_THRESHOLDS = {
  /** DB 응답시간 (ms) */
  dbMs: { ok: 100, warn: 300 },
  /** 스토리지 사용률 (%) */
  storagePct: { ok: 65, warn: 80 },
  /** 대기 큐 길이 */
  queueSize: { ok: 10, warn: 30 },
} as const;

// 4-2. 게이지 막대 정규화 capacity (게이지 너비 % 계산용).
//
// 게이지는 0~100% 범위로 그려지므로, 메트릭 raw 값을 capacity로 나눠 정규화한다.
// capacity = "게이지가 100%로 가득 찰 raw 값". 100%를 넘는 값은 100%로 clamp.
export const SYSTEM_HEALTH_GAUGE_CAPS = {
  /** DB 응답시간 게이지의 100% 기준 (이상은 모두 100% 폭). */
  dbMs: 200,
  /** 대기 큐 게이지의 100% 기준. */
  queueSize: 50,
} as const;

// 4-3. 전체 상태 판정 (백엔드 overallStatus 계산 + 프론트 meta pill 색상).
//
// 한 메트릭이라도 다음 임계값을 넘으면 degraded/down으로 판정한다.
// 우선순위: down > degraded > healthy. 동시 충족 시 더 심각한 상태가 우선.
export const SYSTEM_HEALTH_OVERALL_THRESHOLDS = {
  /** degraded 진입 조건 — 한 메트릭이라도 이 임계값 이상이면. */
  degraded: {
    dbMs: 500,
    storagePct: 90,
  },
  /** down 진입 조건 — 한 메트릭이라도 이 임계값 이상이면. */
  down: {
    dbMs: 1500,
  },
} as const;

// ============================================================================
// 5. 검토 대기 처리율 색상 임계값 (명세서 §A.13).
// ============================================================================
//
// processingRate 색상 구분:
//  - >= 90 : green
//  - >= 60 : amber
//  - <  60 : red
export const REVIEW_PROCESSING_RATE_THRESHOLDS = {
  green: 90,
  amber: 60,
} as const;

// ============================================================================
// 6. TeamEquipmentDistribution 6행 표시 (명세서 §A.6).
// ============================================================================
export const TEAM_DISTRIBUTION_DEFAULT_VISIBLE_ROWS = 6;

// ============================================================================
// 7. 대시보드 시간 윈도우 (명세서 §3.5, §A.4, §A.5, §A.13).
// ============================================================================
//
// 모든 "최근 N일" / "이번 주" / "임박 교정" 시간 윈도우를 단일 소스로 관리.
// 백엔드 SQL 조건과 프론트 표시 모두 이 상수를 import해야 한다.
export const DASHBOARD_TIME_WINDOWS = {
  /** "최근 N일 활동" / "이번 주 처리" — RecentActivities, ReviewPendingHero processingRate. */
  recentActivityDays: 7,
  /** "교정 등록 임박" / DDay soon 톤 — MyQuickSummaryCard, CalibrationDdayList. */
  upcomingCalibrationDays: 30,
} as const;

// ============================================================================
// 8. 대시보드 카드 표시 행 수 제한 (CalibrationDdayList 등).
// ============================================================================
//
// 카드 안에 한꺼번에 노출하는 최대 행 수. 그 이상은 "전체 보기" 링크로 유도.
export const DASHBOARD_CARD_DISPLAY_LIMITS = {
  /** CalibrationDdayList의 한 카드 내 최대 표시 행. */
  calibrationDday: 8,
  /** PendingApprovalCard heavy variant 임계값 — count >= heavyMinCount AND 최대값일 때 heavy 적용. */
  approvalHeavyMinCount: 5,
} as const;
