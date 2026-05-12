/**
 * QR Handover Item — 다중 핸드오버 응답 모델 SSOT (qr-visual-redesign TASK 3 / 2026-05-11).
 *
 * 한 사용자가 동시에 여러 건의 수령/반환 대기를 가질 수 있다 (여러 시험소에서 같은 날 도착).
 * 단일 ID 값으로는 어느 건인지 구분 불가 — 잘못된 checkout 확정 위험. 본 스키마는 array
 * shape 으로 확장하여 picker UI 에 충분한 컨텍스트 제공.
 *
 * BE 가 `QRAccessResult.handovers: HandoverItem[]` 로 반환 → FE `HandoverPickerSheet` 가
 * 카드 형태로 렌더. 단일이면 자동 라우팅, 다중이면 사용자 선택.
 *
 * 양측 SSOT (backend service + frontend hook) — Zod 검증으로 contract drift 차단.
 *
 * @see apps/backend/src/modules/equipment/services/qr-access.service.ts (resolveHandoverActions)
 * @see apps/frontend/components/mobile/HandoverPickerSheet.tsx
 */
import { z } from 'zod';
import { ConditionStatusEnum, AccessoriesStatusEnum } from './enums/return-condition';

/**
 * 핸드오버 종류:
 * - `receive`: borrower 가 lender 점검 완료 장비를 수령 (checkout status `lender_checked`)
 * - `return`: lender 가 borrower 반환 장비를 수령 (checkout status `borrower_returned`)
 */
export const HandoverTypeEnum = z.enum(['receive', 'return']);
export type HandoverType = z.infer<typeof HandoverTypeEnum>;

/**
 * 직전 lender 점검 결과 요약 (borrower 가 수령 전 상태 미리 확인).
 *
 * accessories 는 lender 점검에서 부속품을 평가했을 때만 존재. 없으면 undefined.
 */
export const HandoverLastCheckSchema = z.object({
  appearance: ConditionStatusEnum,
  operation: ConditionStatusEnum,
  accessories: AccessoriesStatusEnum.optional(),
});
export type HandoverLastCheck = z.infer<typeof HandoverLastCheckSchema>;

/**
 * 단일 핸드오버 카드 데이터 — UI 가 picker 항목 한 줄을 렌더하기에 충분한 컨텍스트.
 */
export const HandoverItemSchema = z.object({
  /** checkout uuid — 라우팅 키 */
  id: z.string().uuid(),
  /** 핸드오버 종류 — UI 분기 (수령 시트 vs 반환 시트 step prefill) */
  type: HandoverTypeEnum,
  /** 빌려준 측 팀명 — picker 표시 ("lender → borrower") */
  lenderTeamName: z.string(),
  /** 빌려준 측 사이트 라벨 — "수원랩 → 평택랩" 식 표시 */
  lenderSiteLabel: z.string(),
  /** 빌리는 측 사이트 라벨 */
  borrowerSiteLabel: z.string(),
  /** lender 점검 시각 (ISO 8601 datetime) */
  checkedAt: z.string().datetime(),
  /** lender 점검 결과 요약 (외관/작동/부속) */
  lastCheck: HandoverLastCheckSchema,
  /** lender 점검자 이름 — 추적성 */
  inspectorName: z.string(),
});
export type HandoverItem = z.infer<typeof HandoverItemSchema>;

/**
 * QR 액세스 응답의 handovers 필드 스키마 (선택, 빈 배열 또는 N개).
 */
export const HandoverItemsSchema = z.array(HandoverItemSchema);
