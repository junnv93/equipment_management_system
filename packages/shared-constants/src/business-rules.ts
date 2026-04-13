/**
 * 비즈니스 규칙 상수 — Backend/Frontend SSOT
 *
 * UL-QP-18 절차서 및 시험소 운영 기준에서 도출된 상수들
 *
 * ⚠️ 이 파일이 유일한 소스이며, 로컬 재정의는 금지됩니다.
 */

/**
 * 리포트 계산 상수
 */
export const REPORT_CONSTANTS = {
  /** 반출 1건당 가정 작업 시간 (8시간/일) */
  HOURS_PER_CHECKOUT: 8,
  /** 리포트 상위 항목 표시 개수 */
  TOP_N_LIMIT: 5,
  /** 리포트 하위 항목 표시 개수 */
  BOTTOM_N_LIMIT: 3,
} as const;

/**
 * 모니터링 임계값
 */
export const MONITORING_THRESHOLDS = {
  /** CPU 사용률 위험 임계값 (%) — 이 이상이면 critical */
  CPU_PERCENT: 90,
  /** 메모리 사용률 위험 임계값 (%) — 이 이상이면 critical */
  MEMORY_PERCENT: 85,
  /** 리소스 사용률 경고 임계값 (%) — 이 이상이면 warning (CPU/Memory/Disk 공통) */
  RESOURCE_WARNING_PERCENT: 70,
  /** 에러율 위험 임계값 (%) — 이 이상이면 critical */
  ERROR_RATE_PERCENT: 5,
  /** 에러율 경고 임계값 (%) — 이 이상이면 warning */
  ERROR_RATE_WARNING_PERCENT: 1,
  /** 추적할 엔드포인트 최대 수 (메모리 누수 방지) */
  MAX_TRACKED_ENDPOINTS: 500,
  /** 시스템 메트릭 갱신 간격 (ms) */
  METRICS_UPDATE_INTERVAL_MS: 30_000,
} as const;

/**
 * 알림 보존 기간 (일)
 */
export const NOTIFICATION_RETENTION_DAYS = 90;

/**
 * 교정 관리 임계값 — Backend/Frontend SSOT
 *
 * 교정 예정 경고 일수, 중간점검 임계값 등
 * 프론트엔드 design-tokens와 백엔드 서비스 양쪽에서 참조
 */
export const CALIBRATION_THRESHOLDS = {
  /** 교정 예정 경고 임계값 (일) — 이 값 이내면 '교정 예정' 상태 */
  WARNING_DAYS: 30,
  /** 교정 긴급 임계값 (일) — 이 값 이내면 긴급(빨간색) 표시 */
  URGENT_DAYS: 3,
  /** 중간점검 upcoming 임계값 (일) — 이 값 이내면 upcoming 상태 */
  INTERMEDIATE_CHECK_UPCOMING_DAYS: 7,
} as const;

/**
 * API 쿼리 안전 상한 — 무제한 조회로 인한 OOM/응답 지연 방지
 *
 * 페이지네이션이 없는 엔티티별 단순 조회 메서드에 적용.
 * 페이지네이션이 이미 적용된 메서드(cursor/offset)는 별도 limit 불필요.
 */
export const QUERY_SAFETY_LIMITS = {
  /** 엔티티별 감사 로그 최대 조회 수 */
  AUDIT_LOGS_PER_ENTITY: 500,
  /** 장비별 첨부파일 최대 조회 수 */
  ATTACHMENTS_PER_ENTITY: 100,
  /** 보정계수 대장 최대 조회 수 (cold cache 보호) */
  CALIBRATION_FACTORS_REGISTRY: 1000,
  /** 반출별 상태확인 최대 조회 수 */
  CONDITION_CHECKS_PER_CHECKOUT: 100,
} as const;

/**
 * 스케줄러/배치 조회 제한
 */
export const BATCH_QUERY_LIMITS = {
  /** 교정 기한 초과 장비 조회 제한 */
  OVERDUE_CALIBRATIONS: 100,
  /** 교정 예정 장비 조회 제한 */
  UPCOMING_CALIBRATIONS: 100,
  /** 교정 예정 장비 전체 조회 (스케줄러용) */
  CALIBRATION_DUE_EQUIPMENT: 500,
} as const;

/**
 * 대시보드 KPI 임계값 — UL-QP-18 시험소 운영 기준
 */
export const UTILIZATION_THRESHOLDS = {
  /** 가동률 양호 기준 (%) */
  HIGH: 70,
  /** 가동률 보통 기준 (%) */
  MEDIUM: 40,
} as const;

/**
 * 리포트 가동률 분석 임계값 — 장비 활용 리포트 전용
 * (대시보드 KPI UTILIZATION_THRESHOLDS와 별도 기준)
 */
/**
 * 리포트 내보내기 최대 행 수 제한 — OOM 방지
 * 감사 로그·장비 현황·교정 현황 등 모든 내보내기 엔드포인트 공통 적용
 */
export const REPORT_EXPORT_ROW_LIMIT = 10_000;

export const REPORT_UTILIZATION_THRESHOLDS = {
  /** 고가동률 기준 (%) */
  HIGH: 80,
  /** 저가동률 기준 (%) */
  LOW: 20,
} as const;
