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
export const NOTIFICATION_CONFIG: { readonly DEFAULT_TTL_DAYS: number } = {
  /** 알림 기본 만료 기간 (일) — DB 설정 조회 실패 시 폴백 */
  DEFAULT_TTL_DAYS: 90,
};
