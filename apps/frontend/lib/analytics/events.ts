/**
 * Analytics Event Registry — SSOT for event names
 *
 * 호출자에서 매직 스트링 대신 이 레지스트리 키를 사용해야 합니다.
 * 새 이벤트 추가 시 여기에 등록하고 호출처에서 import.
 *
 * 명명 규칙:
 *   - 도메인.액션 (snake_case 액션) — `lib/analytics/track.ts`의 콜론 표기와 일치
 *   - 예: 'sidebar.checkouts.click', 'checkout.bulk_approve'
 *
 * 타입 안전성:
 *   - `as const` + `ReadonlyArray<...>` 추론 → 호출자에서 typo 시 컴파일 오류
 *
 * 외부 telemetry 통합 시:
 *   - 본 레지스트리가 sender(track.ts)와 receiver(GA/Amplitude listener) 양쪽 SSOT
 *   - 이벤트 추가/제거 시 한 곳만 변경
 */
export const ANALYTICS_EVENTS = {
  /** 사이드바 반출 메뉴 클릭 — pendingCount 동반 */
  SIDEBAR_CHECKOUTS_CLICK: 'sidebar.checkouts.click',

  // ─── Inspection Form Workflow (Phase 1A 디자인 리뷰 §N + LIMS 표준) ───
  // PII 금지: equipmentId / inspectionId 등 도메인 ID는 OK (PII 아님).
  // 사용자 ID/이메일은 PII deny-list에서 차단 — track()에서 throw/drop.

  /**
   * 직전 점검 prefill 적용됨 — 표/사진/텍스트 카운트 동반.
   * 호출 위치: InspectionFormDialog의 prefill effect (1A-a).
   */
  INSPECTION_PREFILL_USED: 'inspection.prefill.used',

  /**
   * Prefill 토글 OFF — 작성 중 데이터 삭제 confirmation 후 진행 (0A-3).
   * 사용자 의도(데이터 폐기) 추적 — gallery 진입 또는 빈 양식 시작 분기 분석.
   */
  INSPECTION_PREFILL_TOGGLE_OFF: 'inspection.prefill.toggle_off',

  /**
   * Prefill banner dismissed — 사용자가 안내 닫음 (1A-a).
   * UX 노이즈 측정 (자주 닫히면 banner 영향 작음).
   */
  INSPECTION_PREFILL_BANNER_DISMISSED: 'inspection.prefill.banner_dismissed',

  /**
   * Soft fork 결정 — Phase 1B-backend 출시 시 활성.
   * 옵션: 'this_only' / 'apply_forward' / 'cancel' (사전 등록).
   */
  INSPECTION_SOFT_FORK: 'inspection.soft_fork',

  /**
   * Template gallery 카드 선택 — Phase 1D 출시 시 활성 (사전 등록).
   * matchingReason: 'same_model' / 'same_classification' / 'same_measurement_area' / 'blank'.
   */
  INSPECTION_GALLERY_SELECTED: 'inspection.gallery.selected',

  /**
   * Cancel/X/Esc confirmation 진입 (0A-ext).
   * dialog: 'inspection_form' / 'self_inspection_form' / 'result_section_form'.
   * action: 'discard' / 'keep'.
   */
  INSPECTION_FORM_CLOSE_GUARDED: 'inspection.form.close_guarded',

  /**
   * Template prefill applied — Phase 1B-D 출시.
   * source: 'template' (latestInspection 의존 제거 후 단독 source).
   * version: template.version (정수). PII 미포함.
   */
  INSPECTION_TEMPLATE_USED: 'inspection.template.used',

  /**
   * Version badge 노출 — DialogHeader에 v{N} 표시 (Phase 1B-D).
   * 사용자가 양식 버전 인지 효과 측정 (LIMS 표준 — UL-QP-18 §7.5 양식 통제).
   */
  INSPECTION_TEMPLATE_VERSION_BADGE_VIEWED: 'inspection.template.version_badge_viewed',
} as const;

/** ANALYTICS_EVENTS 값들의 union type — track() 호출자 타입 좁히기 용 */
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
