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
  /** CPU 사용률 경고 임계값 (%) */
  CPU_PERCENT: 90,
  /** 메모리 사용률 경고 임계값 (%) */
  MEMORY_PERCENT: 85,
  /** 에러율 경고 임계값 (%) */
  ERROR_RATE_PERCENT: 5,
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
