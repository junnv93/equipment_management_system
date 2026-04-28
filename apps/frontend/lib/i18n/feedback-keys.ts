/**
 * Feedback i18n Keys — SSOT
 *
 * 모든 사용자 피드백(navigation pending / loading / mutation / connection / autosave)
 * 메시지의 i18n key 단일 진입점.
 *
 * 사용:
 *   const t = useTranslations();
 *   toast.success(t(FEEDBACK_KEYS.saved));
 *
 * 룰:
 * - 호출자는 FEEDBACK_KEYS 상수만 사용 (문자열 리터럴 키 직접 입력 금지)
 * - ko/en parity는 messages/{ko,en}/feedback.json 양쪽 동시 관리
 * - 신규 키 추가 시 두 파일 모두 동시 추가 (verify 스킬에서 강제)
 *
 * @see messages/ko/feedback.json
 * @see messages/en/feedback.json
 */
export const FEEDBACK_KEYS = {
  // navigation
  navigating: 'feedback.navigating',
  navigatingPage: 'feedback.navigatingPage',
  loadingPage: 'feedback.loadingPage',
  loadingList: 'feedback.loadingList',
  loadingDetail: 'feedback.loadingDetail',
  loadingForm: 'feedback.loadingForm',
  loadingDashboard: 'feedback.loadingDashboard',
  loadingScan: 'feedback.loadingScan',

  // mutation in-flight
  processing: 'feedback.processing',
  saving: 'feedback.saving',
  deleting: 'feedback.deleting',
  creating: 'feedback.creating',
  updating: 'feedback.updating',
  approving: 'feedback.approving',
  rejecting: 'feedback.rejecting',
  uploading: 'feedback.uploading',
  uploaded: 'feedback.uploaded',
  exporting: 'feedback.exporting',
  exported: 'feedback.exported',
  bulkProcessing: 'feedback.bulkProcessing',
  bulkProcessed: 'feedback.bulkProcessed',
  searching: 'feedback.searching',
  noResults: 'feedback.noResults',

  // result (success)
  success: 'feedback.success',
  saved: 'feedback.saved',
  deleted: 'feedback.deleted',
  created: 'feedback.created',
  updated: 'feedback.updated',
  approved: 'feedback.approved',
  rejected: 'feedback.rejected',

  // result (error / conflict)
  failed: 'feedback.failed',
  staleConflict: 'feedback.staleConflict',
  retry: 'feedback.retry',

  // connection / system (L0)
  offline: 'feedback.offline',
  swUpdateAvailable: 'feedback.swUpdateAvailable',
  reload: 'feedback.reload',
  sseReconnecting: 'feedback.sseReconnecting',
  tokenExpiringSoon: 'feedback.tokenExpiringSoon',

  // auto-save (L4ext)
  autosaveIdle: 'feedback.autosave.idle',
  autosaveSaving: 'feedback.autosave.saving',
  autosaveSaved: 'feedback.autosave.saved',
  autosaveConflict: 'feedback.autosave.conflict',
} as const;

export type FeedbackKey = (typeof FEEDBACK_KEYS)[keyof typeof FEEDBACK_KEYS];
