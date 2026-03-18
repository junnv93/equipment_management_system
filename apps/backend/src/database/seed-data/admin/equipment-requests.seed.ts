/**
 * Equipment Requests seed data
 * 6 requests: create (2), update (2), delete (2)
 * Approval: pending_approval (2), approved (2), rejected (2)
 */

import { equipmentRequests } from '@equipment-management/db/schema';
import { CODE_TO_SITE, CODE_TO_CLASSIFICATION } from '@equipment-management/schemas';
import { daysAgo } from '../../utils/date-helpers';
import {
  EQUIP_REQ_001_ID,
  EQUIP_REQ_002_ID,
  EQUIP_REQ_003_ID,
  EQUIP_REQ_004_ID,
  EQUIP_REQ_005_ID,
  EQUIP_REQ_006_ID,
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_FILTER_SUW_E_ID,
  EQUIP_OSCILLOSCOPE_SUW_R_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
} from '../../utils/uuid-constants';

export const EQUIPMENT_REQUESTS_SEED_DATA: (typeof equipmentRequests.$inferInsert)[] = [
  // Create requests
  {
    id: EQUIP_REQ_001_ID,
    requestType: 'create',
    equipmentId: null,
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: daysAgo(7),
    approvalStatus: 'pending_approval',
    requestData: JSON.stringify({
      name: 'EMI 테스트 리시버 (신규)',
      managementNumber: 'SUW-E0501',
      site: CODE_TO_SITE.SUW,
      classification: CODE_TO_CLASSIFICATION.E,
    }),
    version: 1,
  },
  {
    id: EQUIP_REQ_002_ID,
    requestType: 'create',
    equipmentId: null,
    requestedBy: USER_TEST_ENGINEER_UIWANG_ID,
    requestedAt: daysAgo(14),
    approvalStatus: 'approved',
    approvedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    approvedAt: daysAgo(12),
    requestData: JSON.stringify({
      name: '디지털 파워미터 (신규)',
      managementNumber: 'UIW-W0201',
      site: CODE_TO_SITE.UIW,
      classification: CODE_TO_CLASSIFICATION.W,
    }),
    version: 1,
  },

  // Update requests
  {
    id: EQUIP_REQ_003_ID,
    requestType: 'update',
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: daysAgo(5),
    approvalStatus: 'pending_approval',
    requestData: JSON.stringify({
      location: '수원 본관 3층 RF 시험실',
      notes: '위치 변경 요청',
    }),
    version: 1,
  },
  {
    id: EQUIP_REQ_004_ID,
    requestType: 'update',
    equipmentId: EQUIP_SIGNAL_GEN_SUW_E_ID,
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: daysAgo(20),
    approvalStatus: 'rejected',
    approvedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    approvedAt: daysAgo(18),
    rejectionReason: '사양 변경 근거 자료 부족. 제조사 확인서 첨부 후 재요청 바랍니다.',
    requestData: JSON.stringify({
      specifications: '출력 범위: -140 ~ +20 dBm (변경 요청)',
    }),
    version: 1,
  },

  // Delete requests
  {
    id: EQUIP_REQ_005_ID,
    requestType: 'delete',
    equipmentId: EQUIP_FILTER_SUW_E_ID,
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: daysAgo(10),
    approvalStatus: 'approved',
    approvedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    approvedAt: daysAgo(8),
    requestData: JSON.stringify({
      reason: '여분 장비 폐기 대상. 10년 경과 및 교정 불가.',
    }),
    version: 1,
  },
  {
    id: EQUIP_REQ_006_ID,
    requestType: 'delete',
    equipmentId: EQUIP_OSCILLOSCOPE_SUW_R_ID,
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: daysAgo(3),
    approvalStatus: 'rejected',
    approvedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    approvedAt: daysAgo(2),
    rejectionReason: '해당 장비는 현재 교정 일정이 잡혀있어 삭제 불가.',
    requestData: JSON.stringify({
      reason: '교정 기한 초과 장비 정리',
    }),
    version: 1,
  },
];
