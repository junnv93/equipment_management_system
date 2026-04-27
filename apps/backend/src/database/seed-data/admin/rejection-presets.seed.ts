/**
 * Rejection Presets seed data — UL-QP-18 반출 반려 사유 프리셋 5건
 *
 * 반려 모달에서 1-click 선택 → 텍스트에어리어 자동 채움.
 * is_default=true 항목은 삭제 불가 (서비스 정책).
 *
 * @see apps/backend/src/modules/checkouts/checkouts.service.ts — getRejectionPresets()
 * @see apps/backend/drizzle/0047_add_rejection_presets.sql
 */

import { rejectionPresets } from '@equipment-management/db/schema';

export const REJECTION_PRESETS_SEED_DATA: (typeof rejectionPresets.$inferInsert)[] = [
  {
    label: '교정 유효기간 만료',
    template:
      '해당 장비의 교정 유효기간이 반출 예정 기간 내에 만료됩니다. ' +
      '교정 완료 후 재신청하시기 바랍니다.',
    isDefault: true,
    sortOrder: 1,
  },
  {
    label: '장비 상태 부적합',
    template:
      '현재 장비 상태가 반출 기준에 적합하지 않습니다. ' +
      '이상 현상을 확인하고 수리 또는 점검 완료 후 재신청하시기 바랍니다.',
    isDefault: true,
    sortOrder: 2,
  },
  {
    label: '반출 정보 오류',
    template:
      '신청서에 기재된 반출 목적, 수탁기관 또는 반입 예정일 정보가 올바르지 않습니다. ' +
      '정보를 수정하여 재신청하시기 바랍니다.',
    isDefault: true,
    sortOrder: 3,
  },
  {
    label: '중복 신청',
    template:
      '동일 장비에 대한 반출 신청이 이미 진행 중입니다. ' + '기존 신청 상태를 확인하시기 바랍니다.',
    isDefault: false,
    sortOrder: 4,
  },
  {
    label: '신청 요건 미충족',
    template:
      '해당 반출 유형(교정/수리/대여)에 필요한 사전 요건이 충족되지 않았습니다. ' +
      '담당 기술책임자에게 문의하시기 바랍니다.',
    isDefault: false,
    sortOrder: 5,
  },
];
