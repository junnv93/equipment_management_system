/**
 * Calibrations seed data
 * 18 calibrations with various approval statuses and results
 * Covers workflow scenarios: pending → approved, rejected, FAIL results
 */

import { calibrations } from '@equipment-management/db/schema';
import { CalibrationResult } from '@equipment-management/schemas';
import { daysAgo, daysLater, monthsAgo, toDateString } from '../../utils/date-helpers';
import {
  // Equipment IDs
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_POWER_METER_SUW_E_ID,
  EQUIP_OSCILLOSCOPE_SUW_R_ID,
  EQUIP_POWER_SUPPLY_SUW_R_ID,
  EQUIP_SAR_SYSTEM_SUW_S_ID,
  EQUIP_HARNESS_COUPLER_SUW_A_ID,
  EQUIP_CURRENT_PROBE_SUW_A_ID,
  EQUIP_RECEIVER_UIW_W_ID,
  EQUIP_TRANSMITTER_UIW_W_ID,
  EQUIP_EMC32_SUW_P_ID,
  // User IDs
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../utils/uuid-constants';

const now = new Date();

function createCalibration(
  equipmentId: string,
  result: CalibrationResult,
  approvalStatus: 'pending_approval' | 'approved' | 'rejected',
  registeredByRole: 'test_engineer' | 'technical_manager',
  calibrationDate: Date,
  completionDate: Date,
  overrides?: Partial<typeof calibrations.$inferInsert>
): typeof calibrations.$inferInsert {
  const registeredBy =
    registeredByRole === 'test_engineer'
      ? USER_TEST_ENGINEER_SUWON_ID
      : USER_TECHNICAL_MANAGER_SUWON_ID;
  const approvedBy = approvalStatus === 'approved' ? USER_TECHNICAL_MANAGER_SUWON_ID : undefined;

  const nextCalibrationDate = new Date(completionDate);
  nextCalibrationDate.setMonth(nextCalibrationDate.getMonth() + 12);

  return {
    id: undefined, // Auto-generated UUID
    equipmentId,
    status: 'completed',
    calibrationDate,
    completionDate,
    nextCalibrationDate,
    agencyName: 'Korea Calibration Lab',
    certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    result,
    approvalStatus,
    registeredBy,
    approvedBy,
    registeredByRole,
    registrarComment:
      registeredByRole === 'technical_manager' ? '기술책임자가 직접 등록하였습니다.' : undefined,
    approverComment: approvalStatus === 'approved' ? '교정 결과 승인합니다.' : undefined,
    rejectionReason:
      approvalStatus === 'rejected' ? '성적서 내용이 불충분합니다. 다시 등록해주세요.' : undefined,
    createdAt: calibrationDate,
    updatedAt: now,
    ...overrides,
  };
}

export const CALIBRATIONS_SEED_DATA: (typeof calibrations.$inferInsert)[] = [
  // =========================================================================
  // Approved Calibrations (10 total)
  // =========================================================================

  // Spectrum Analyzer - passed, approved (intermediate check: 5일 초과 — overdue)
  createCalibration(
    EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    'pass',
    'approved',
    'test_engineer',
    monthsAgo(12),
    monthsAgo(12),
    {
      intermediateCheckDate: toDateString(daysAgo(5)),
    }
  ),

  // Signal Generator - passed, approved (intermediate check: D-3 — 3일 후)
  createCalibration(
    EQUIP_SIGNAL_GEN_SUW_E_ID,
    'pass',
    'approved',
    'technical_manager',
    monthsAgo(11),
    monthsAgo(11),
    {
      registrarComment: '기술책임자가 직접 등록하였습니다.',
      approverComment: '자가 승인',
      intermediateCheckDate: toDateString(daysLater(3)),
    }
  ),

  // Network Analyzer - passed, approved (intermediate check: D-14 — 14일 후)
  createCalibration(
    EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    'pass',
    'approved',
    'test_engineer',
    monthsAgo(11),
    monthsAgo(11),
    {
      intermediateCheckDate: toDateString(daysLater(14)),
    }
  ),

  // Oscilloscope - passed, approved (intermediate check: 10일 초과 — overdue)
  createCalibration(
    EQUIP_OSCILLOSCOPE_SUW_R_ID,
    'pass',
    'approved',
    'test_engineer',
    monthsAgo(14),
    monthsAgo(14),
    {
      intermediateCheckDate: toDateString(daysAgo(10)),
    }
  ),

  // Power Supply - conditional, approved (intermediate check: D-1 — 내일)
  createCalibration(
    EQUIP_POWER_SUPPLY_SUW_R_ID,
    'conditional',
    'approved',
    'test_engineer',
    monthsAgo(11),
    monthsAgo(11),
    {
      approverComment: '조건부 적합. 주파수 범위 제한 적용.',
      intermediateCheckDate: toDateString(daysLater(1)),
    }
  ),

  // SAR System - passed, approved
  createCalibration(
    EQUIP_SAR_SYSTEM_SUW_S_ID,
    'pass',
    'approved',
    'technical_manager',
    monthsAgo(3),
    monthsAgo(3)
  ),

  // Harness Coupler - passed, approved
  createCalibration(
    EQUIP_HARNESS_COUPLER_SUW_A_ID,
    'pass',
    'approved',
    'test_engineer',
    monthsAgo(6),
    monthsAgo(6)
  ),

  // Current Probe - conditional, approved
  createCalibration(
    EQUIP_CURRENT_PROBE_SUW_A_ID,
    'conditional',
    'approved',
    'test_engineer',
    monthsAgo(11),
    monthsAgo(11)
  ),

  // RF Receiver - passed, approved
  createCalibration(
    EQUIP_RECEIVER_UIW_W_ID,
    'pass',
    'approved',
    'test_engineer',
    monthsAgo(9),
    monthsAgo(9)
  ),

  // RF Transmitter - passed, approved
  createCalibration(
    EQUIP_TRANSMITTER_UIW_W_ID,
    'pass',
    'approved',
    'test_engineer',
    monthsAgo(11),
    monthsAgo(11)
  ),

  // =========================================================================
  // Pending Approval Calibrations (6 total)
  // Waiting for technical manager approval
  // =========================================================================

  // Power Meter - pass, pending approval
  createCalibration(
    EQUIP_POWER_METER_SUW_E_ID,
    'pass',
    'pending_approval',
    'test_engineer',
    daysAgo(5),
    daysAgo(5)
  ),

  // EMC32 Software - pass, pending approval (test_engineer)
  createCalibration(
    EQUIP_EMC32_SUW_P_ID,
    'pass',
    'pending_approval',
    'test_engineer',
    daysAgo(3),
    daysAgo(3)
  ),

  // Network Analyzer #2 - pass, pending approval
  createCalibration(
    EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    'pass',
    'pending_approval',
    'test_engineer',
    daysAgo(2),
    daysAgo(2)
  ),

  // Signal Generator #2 - pass, pending approval
  createCalibration(
    EQUIP_SIGNAL_GEN_SUW_E_ID,
    'pass',
    'pending_approval',
    'test_engineer',
    daysAgo(7),
    daysAgo(7)
  ),

  // Oscilloscope #2 - conditional, pending approval
  createCalibration(
    EQUIP_OSCILLOSCOPE_SUW_R_ID,
    'conditional',
    'pending_approval',
    'test_engineer',
    daysAgo(4),
    daysAgo(4)
  ),

  // SAR System #2 - pass, pending approval
  createCalibration(
    EQUIP_SAR_SYSTEM_SUW_S_ID,
    'pass',
    'pending_approval',
    'test_engineer',
    daysAgo(1),
    daysAgo(1)
  ),

  // =========================================================================
  // Rejected Calibrations (2 total)
  // Returned by technical manager for revision
  // =========================================================================

  // Harness Coupler - fail, rejected (triggers non-conformance)
  createCalibration(
    EQUIP_HARNESS_COUPLER_SUW_A_ID,
    'fail',
    'rejected',
    'test_engineer',
    daysAgo(20),
    daysAgo(20),
    {
      rejectionReason: '성적서 내용이 불충분합니다. 부적합 원인 분석을 추가해주세요.',
    }
  ),

  // Current Probe - fail, rejected
  createCalibration(
    EQUIP_CURRENT_PROBE_SUW_A_ID,
    'fail',
    'rejected',
    'test_engineer',
    daysAgo(15),
    daysAgo(15),
    {
      rejectionReason: '측정 범위 초과. 부적합입니다.',
    }
  ),
];
