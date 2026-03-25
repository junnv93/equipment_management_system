/**
 * 알림 설정 상수 — Backend/Frontend 공유 SSOT
 *
 * 알림 만료, 배치 처리 등 알림 관련 설정의 단일 소스입니다.
 * ⚠️ 이 파일이 유일한 소스이며, 로컬 재정의는 금지됩니다.
 *
 * @example
 * import { NOTIFICATION_CONFIG } from '@equipment-management/shared-constants';
 * const expiresAt = new Date(Date.now() + NOTIFICATION_CONFIG.DEFAULT_TTL_DAYS * 86_400_000);
 */
export const NOTIFICATION_CONFIG: {
  readonly DEFAULT_TTL_DAYS: number;
  readonly SYSTEM_ACTOR_ID: string;
} = {
  /** 알림 기본 만료 기간 (일) — DB 설정 조회 실패 시 폴백 */
  DEFAULT_TTL_DAYS: 90,

  /**
   * 시스템 자동화 이벤트의 actorId 식별자
   *
   * 스케줄러(교정기한 초과, 반출기한 초과, 중간점검)가 emit할 때 사용.
   * 디스패처의 normalizeActorForDb()가 이 값을 null로 변환하여 UUID 컬럼 호환성 보장.
   * resolveActorName()이 이 값을 '시스템'으로 변환하여 UI 표시.
   */
  SYSTEM_ACTOR_ID: 'system',
};

/**
 * SSE 승인 변경 sentinel 값
 *
 * Backend SSE 서비스가 승인 변경 브로드캐스트 시 title에 설정하는 값.
 * Frontend SSE 스트림 훅이 이 값을 감지하여 approval counts 쿼리만 무효화.
 *
 * SSOT: 이 상수가 유일한 정의이며, Backend/Frontend 양쪽에서 참조합니다.
 */
export const SSE_APPROVAL_CHANGED_SENTINEL = '__approval_changed__' as const;

/**
 * 다이제스트 이메일 시간 옵션 — Backend/Frontend 공유 SSOT
 *
 * 사용자가 선택 가능한 일간 다이제스트 발송 시간 (UTC).
 * Backend DTO 검증 + Frontend Select 옵션 + DigestEmailScheduler에서 참조.
 *
 * @example
 * import { DIGEST_TIME_OPTIONS, DEFAULT_DIGEST_TIME } from '@equipment-management/shared-constants';
 * // DTO: z.enum(DIGEST_TIME_OPTIONS)
 * // UI: DIGEST_TIME_OPTIONS.map(t => <option>{t}</option>)
 */
export const DIGEST_TIME_OPTIONS = ['07:00', '08:00', '09:00', '10:00'] as const;

export type DigestTime = (typeof DIGEST_TIME_OPTIONS)[number];

export const DEFAULT_DIGEST_TIME: DigestTime = '09:00';
