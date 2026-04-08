/**
 * Notifications seed data
 *
 * WF-25 (alerts → 장비 상세 → 반출 신청 cross-flow) 검증을 위한 최소 시드.
 * test_engineer (Suwon) 사용자에게 calibration_due 알림 1건을 deterministic 하게 생성하여
 * /alerts 페이지에서 linkUrl=/equipment/... 링크가 항상 1건 이상 존재하도록 보장한다.
 *
 * @see apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts
 */

import { notifications } from '@equipment-management/db/schema';
import { daysAgo } from '../../utils/date-helpers';
import {
  USER_TEST_ENGINEER_SUWON_ID,
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
} from '../../utils/uuid-constants';

export const NOTIFICATIONS_SEED_DATA: (typeof notifications.$inferInsert)[] = [
  {
    title: '교정 기한 임박: Spectrum Analyzer (수원 E)',
    content: '다음 교정 예정일이 7일 이내입니다. 반출 일정을 확인해주세요.',
    type: 'calibration_due',
    category: 'calibration',
    priority: 'high',
    recipientId: USER_TEST_ENGINEER_SUWON_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    entityType: 'equipment',
    entityId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    linkUrl: `/equipment/${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`,
    isRead: false,
    actorName: '시스템',
    recipientSite: 'suwon',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];
