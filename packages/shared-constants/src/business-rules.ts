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
  /** 엔티티별 감사 로그 최대 조회 수 (findByEntity) */
  AUDIT_LOGS_PER_ENTITY: 500,
  /** cursor 기반 감사 로그 페이지 크기 (UI/UX 최적화) */
  AUDIT_CURSOR_PAGE_SIZE: 30,
  /** 사용자별 최근 감사 로그 최대 수 (findByUser) */
  AUDIT_LOGS_BY_USER: 100,
  /** 장비별 첨부파일 최대 조회 수 */
  ATTACHMENTS_PER_ENTITY: 100,
  /** 보정계수 대장 최대 조회 수 (cold cache 보호) */
  CALIBRATION_FACTORS_REGISTRY: 1000,
  /** 반출별 상태확인 최대 조회 수 */
  CONDITION_CHECKS_PER_CHECKOUT: 100,
} as const;

/**
 * 보고서 폼 내보내기(form-template-export) 조회 제한
 *
 * 엑셀/PDF 양식 생성 시 적용되는 상한.
 * 보고 기간 내 전체 데이터를 포함해야 하므로 QUERY_SAFETY_LIMITS보다 크게 설정.
 */
export const EXPORT_QUERY_LIMITS = {
  /** 전체 목록 내보내기 최대 건수 (기간별 장비/교정 이력 집계) */
  FULL_EXPORT: 1000,
  /** 섹션별 내보내기 최대 건수 (세부 이력 테이블) */
  SECTION_EXPORT: 500,
} as const;

/**
 * 서명 이미지 업로드 제한 — UL-QP-18 서명 품질 기준
 *
 * 사용자 서명 이미지 업로드 시 적용되는 파일 형식/크기 정책.
 * 변경 시 관련 UI 안내 문구도 함께 수정해야 함.
 */
export const SIGNATURE_UPLOAD_LIMITS = {
  /** 최대 파일 크기 (bytes) — 2 MB */
  MAX_SIZE_BYTES: 2 * 1024 * 1024,
  /** 허용 MIME 타입 */
  ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg'] as const,
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
  /** 데이터 마이그레이션 배치 INSERT 청크 크기 */
  MIGRATION_CHUNK_SIZE: 100,
} as const;

/** 마이그레이션 세션 캐시 유효 시간 (1시간) */
export const MIGRATION_SESSION_TTL_MS = 3_600_000;

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

/**
 * 이력카드 조회 상한 — 장비별 이력 조회 OOM 방지
 *
 * 이력카드 생성 시 각 이력 섹션(교정/반출/수리/부적합 등)에 적용되는 상한.
 * docx 렌더링 성능을 고려한 값으로, 현장 운영 데이터 기준 충분한 여유.
 */
export const HISTORY_CARD_QUERY_LIMITS = {
  /** 이력카드 섹션(교정/반출/수리/부적합/위치이동/유지보수/사고) 최대 조회 건수 */
  SECTION_ITEMS: 50,
} as const;

/** @deprecated Use HISTORY_CARD_QUERY_LIMITS.SECTION_ITEMS instead */
export const HISTORY_CARD_QUERY_LIMIT = HISTORY_CARD_QUERY_LIMITS.SECTION_ITEMS;
