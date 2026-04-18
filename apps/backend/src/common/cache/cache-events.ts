/**
 * 캐시 전용 이벤트 상수 (SSOT)
 *
 * NOTIFICATION_EVENTS와 분리된 캐시 무효화 전용 이벤트.
 * - NOTIFICATION_EVENTS: DB notifications 테이블 insert + 알림 발송
 * - CACHE_EVENTS: 캐시 무효화만 (알림 없음, 에러 허용 UX)
 *
 * emit 위치: Service 계층 전용 (Controller emitAsync 금지 — .eslintrc.js AD-8)
 */
export const CACHE_EVENTS = {
  // ─── 부적합 첨부 (NC Attachment) ───
  NC_ATTACHMENT_UPLOADED: 'nonConformance.attachmentUploaded',
  NC_ATTACHMENT_DELETED: 'nonConformance.attachmentDeleted',
} as const;

export type CacheEventName = (typeof CACHE_EVENTS)[keyof typeof CACHE_EVENTS];

/** NC 첨부 캐시 이벤트 페이로드 */
export interface NCAttachmentCachePayload {
  ncId: string;
  equipmentId: string;
  documentId: string;
  actorId: string | null;
}
