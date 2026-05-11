/**
 * 장비 상태 → 시각 톤 매핑 SSOT (qr-visual-redesign TASK 2 / 2026-05-11)
 *
 * "지금 이 장비를 써도 되는가?" 1초 질문에 답하기 위한 4-tier 색 분리.
 * BE 알림/리포트와 FE 뱃지/카드가 동일한 톤을 사용 — cross-stack 단일 진실.
 *
 * - **ok**: 즉시 사용 가능 (available)
 * - **warn**: 사용 중이지만 예측 가능 (checked_out, temporary)
 * - **urgent**: 즉각 조치 필요 (non_conforming, pending_disposal)
 * - **mute**: 운영 외 — 안내성 비활성 (spare, disposed, inactive)
 *
 * `Record<EquipmentStatus, EquipmentStatusTone>` 컴파일타임 exhaustive 강제 —
 * EquipmentStatusEnum 에 신규 status 추가 시 본 매핑이 누락되면 tsc 에러.
 *
 * @see packages/schemas/src/enums/equipment.ts (EquipmentStatusEnum SSOT)
 * @see apps/frontend/components/ui/StatusBadge.tsx (FE 소비처)
 * @see apps/frontend/lib/design-tokens/brand.ts (BRAND_CLASS_MATRIX urgent/mute 톤)
 */

import { EquipmentStatusEnum, type EquipmentStatus } from '@equipment-management/schemas';

/**
 * 4-tier 시각 톤. `brand-ok / brand-warning / brand-urgent / brand-mute` Tailwind 클래스와 1:1.
 */
export type EquipmentStatusTone = 'ok' | 'warn' | 'urgent' | 'mute';

/**
 * EquipmentStatus → EquipmentStatusTone 매핑.
 *
 * UL-QP-18 운영 의미 기준:
 * - available → ok: 즉시 반출 가능
 * - checked_out → warn: 반출 중 (다른 사용자 점유 — 사용자가 인지하고 행동 결정)
 * - non_conforming → urgent: 부적합 (수리 전 사용 금지, 즉각 조치)
 * - spare → mute: 여분 (상시 관리 외, 필요 시 사용)
 * - pending_disposal → urgent: 폐기 대기 (시험소장 승인 흐름 진행 — 사용 중지)
 * - disposed → mute: 폐기 완료 (운영 외)
 * - temporary → warn: 임시 등록 (정규 자산 아님, 추적성 주의)
 * - inactive → mute: 비활성 (임시 장비 사용 완료)
 */
export const EQUIPMENT_STATUS_TONE = {
  available: 'ok',
  checked_out: 'warn',
  non_conforming: 'urgent',
  spare: 'mute',
  pending_disposal: 'urgent',
  disposed: 'mute',
  temporary: 'warn',
  inactive: 'mute',
} as const satisfies Record<EquipmentStatus, EquipmentStatusTone>;

/**
 * EquipmentStatus 별 i18n key 경로 (`equipment.status.{key}` 또는 `qr.statusBadge.status.{key}`).
 *
 * 라벨 텍스트 자체는 i18n catalog 가 결정 — 본 SSOT 는 key 만 보장.
 */
export const EQUIPMENT_STATUS_I18N_KEYS = {
  available: 'available',
  checked_out: 'checkedOut',
  non_conforming: 'nonConforming',
  spare: 'spare',
  pending_disposal: 'pendingDisposal',
  disposed: 'disposed',
  temporary: 'temporary',
  inactive: 'inactive',
} as const satisfies Record<EquipmentStatus, string>;

/**
 * 8 status 값을 배열로 노출 (스토리북, 단위 테스트 입력 등).
 */
export const EQUIPMENT_STATUS_VALUES = EquipmentStatusEnum.options;
