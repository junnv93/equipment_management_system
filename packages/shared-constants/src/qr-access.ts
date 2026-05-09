/**
 * QR 모바일 랜딩 액션 권한 SSOT
 *
 * ⚠️ 이 파일이 "QR 스캔 후 수행 가능한 액션"의 단일 소스입니다.
 * - 백엔드: QRAccessService가 응답 shape에 포함시키는 `allowedActions` 배열의 element
 * - 프론트엔드: EquipmentActionSheet가 배열을 순회하며 CTA 렌더링
 *
 * 원칙:
 * - 클라이언트는 액션 판정을 중복하지 않음 — 서버가 SSOT
 * - 권한 + 관계(현재 사용자의 active checkout/import 소속 여부) + 장비 상태를 조합해 서버에서 계산
 * - Phase 2/3에서 새 액션 추가 시 이 enum만 확장하면 됨
 *
 * @see apps/backend/src/modules/equipment/services/qr-access.service.ts
 * @see apps/frontend/components/mobile/EquipmentActionSheet.tsx
 */

/**
 * 지원하는 QR 액션 목록.
 *
 * Phase 3 후보: `scan_continuous`(연속 스캔 — 재고 실사용)
 */
export const QR_ACTION_VALUES = [
  /**
   * 장비 상세 페이지로 이동 (기본 액션, VIEW_EQUIPMENT 권한자 모두 — cross-site 허용).
   */
  'view_detail',

  /**
   * QR 코드 보기/인쇄 (VIEW_EQUIPMENT 권한자 모두).
   */
  'view_qr',

  /**
   * 반출 신청 페이지로 이동 (CREATE_CHECKOUT 권한 + 장비 `available` + 사용자 사이트 === 장비 사이트).
   * Cross-site 반출은 lender/borrower 핸드오버 플로우에서 별도 처리.
   */
  'request_checkout',

  /**
   * 내가 현재 반출 중인 장비의 반납 기록 (checkouts.requesterId === 현재 사용자 + status `checked_out`).
   * Cross-site 장비도 허용 — 내가 빌린 장비는 내가 반납해야 한다.
   */
  'mark_checkout_returned',

  /**
   * 부적합 신고 (CREATE_NON_CONFORMANCE 권한자, cross-site 허용).
   * 현장 결함 발견 시 즉시 등록.
   */
  'report_nc',

  /**
   * 인수인계 — 빌리는 쪽(borrower) 수령 확인 (checkout status `lender_checked`).
   * 본인이 해당 checkout의 requester일 때만 서버가 도출.
   * 클릭 시 condition-check 페이지 + step=borrower_receive 자동 prefill.
   */
  'confirm_handover_receive',

  /**
   * 인수인계 — 반환(borrower → lender) 확인 (checkout status `borrower_returned`).
   * 본인이 해당 checkout의 approverId(lender 측)일 때만 서버가 도출.
   * 클릭 시 condition-check 페이지 + step=lender_return 자동 prefill.
   */
  'confirm_handover_return',
] as const;

export type QRAllowedAction = (typeof QR_ACTION_VALUES)[number];

/**
 * QR 액션 → i18n 메시지 키 매핑 (프론트엔드 `qr.mobileActionSheet.actions.*`).
 *
 * 서버는 enum 값만 전달, 표시 문구는 프론트가 i18n으로 해석.
 */
export const QR_ACTION_I18N_KEYS: Record<QRAllowedAction, string> = {
  view_detail: 'viewDetail',
  view_qr: 'viewQr',
  request_checkout: 'requestCheckout',
  mark_checkout_returned: 'markCheckoutReturned',
  report_nc: 'reportNc',
  confirm_handover_receive: 'confirmHandoverReceive',
  confirm_handover_return: 'confirmHandoverReturn',
};

/**
 * 액션별 우선순위 (높을수록 상단 노출 권장).
 * 프론트엔드 정렬 시 SSOT. 하드코딩된 정렬 순서 금지.
 */
export const QR_ACTION_PRIORITY: Record<QRAllowedAction, number> = {
  confirm_handover_receive: 115, // rental FSM lender_checked 단계 — 현장 대면 수령 확인 가장 시급
  confirm_handover_return: 110, // rental FSM borrower_returned 단계 — 반환 확인 시급
  mark_checkout_returned: 100, // 반납 누락 방지
  request_checkout: 80,
  report_nc: 60,
  view_detail: 40,
  view_qr: 20,
};
