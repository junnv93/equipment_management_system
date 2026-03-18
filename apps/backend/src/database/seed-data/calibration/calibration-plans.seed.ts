/**
 * Calibration Plans seed data
 * 6 plans covering all 3-step approval workflow states
 * 12 plan items with equipment snapshots and confirmation tracking
 *
 * Workflow: draft → pending_review (QM) → pending_approval (LM) → approved
 *           ↘ rejected (at review or approval stage)
 *           ↘ re-submitted (v2 from rejected plan)
 *
 * Site isolation: 각 계획의 reviewer/approver는 반드시 동일 사이트 사용자
 * (@SiteScoped 인터셉터가 크로스 사이트 접근을 차단하므로)
 */

import {
  type NewCalibrationPlan,
  type NewCalibrationPlanItem,
  rejectionStage as REJECTION_STAGES,
} from '@equipment-management/db/schema/calibration-plans';
import { CalibrationPlanStatusValues as CPStatus } from '@equipment-management/schemas';
import { daysAgo, monthsAgo, monthsLater } from '../../utils/date-helpers';
import {
  // Plan IDs
  CPLAN_001_ID,
  CPLAN_002_ID,
  CPLAN_003_ID,
  CPLAN_004_ID,
  CPLAN_005_ID,
  CPLAN_006_ID,
  // Plan Item IDs
  CPLAN_ITEM_001_ID,
  CPLAN_ITEM_002_ID,
  CPLAN_ITEM_003_ID,
  CPLAN_ITEM_004_ID,
  CPLAN_ITEM_005_ID,
  CPLAN_ITEM_006_ID,
  CPLAN_ITEM_007_ID,
  CPLAN_ITEM_008_ID,
  CPLAN_ITEM_009_ID,
  CPLAN_ITEM_010_ID,
  CPLAN_ITEM_011_ID,
  CPLAN_ITEM_012_ID,
  // Team IDs
  TEAM_FCC_EMC_RF_SUWON_ID,
  TEAM_GENERAL_EMC_SUWON_ID,
  TEAM_GENERAL_RF_UIWANG_ID,
  // User IDs — 수원
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_QUALITY_MANAGER_SUWON_ID,
  USER_LAB_MANAGER_SUWON_ID,
  // User IDs — 의왕
  USER_TECHNICAL_MANAGER_UIWANG_ID,
  // Equipment IDs (external calibration targets)
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_EMC_RECEIVER_SUW_E_ID,
  EQUIP_OSCILLOSCOPE_SUW_R_ID,
  EQUIP_RECEIVER_UIW_W_ID,
  EQUIP_TRANSMITTER_UIW_W_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_CURRENT_PROBE_SUW_A_ID,
} from '../../utils/uuid-constants';

// rejectionStage 타입 안전 참조 (DB 스키마 SSOT)
const REVIEW_STAGE = REJECTION_STAGES[0]; // 'review'
const _APPROVAL_STAGE = REJECTION_STAGES[1]; // 'approval'

/**
 * 교정계획서 시드 데이터 (6건)
 *
 * 상태 분포:
 * - draft (1건): 2026년 수원 FCC EMC/RF, 작성 중
 * - pending_review (1건): 2026년 의왕 General RF, QM 검토 대기
 * - pending_approval (1건): 2026년 수원 General EMC, LM 승인 대기
 * - approved (1건): 2025년 수원 FCC EMC/RF, 승인 완료
 * - rejected (1건): 2024년 수원 FCC EMC/RF, 검토 단계 반려
 * - pending_review v2 (1건): 2024년 수원 FCC EMC/RF, 반려 후 재제출
 *
 * 사이트 격리 원칙:
 * - 수원 계획: 수원 QM/LM만 검토/승인
 * - 의왕 계획: 의왕에 QM/LM이 없으므로 아직 검토 전(pending_review) 상태
 * - 평택 계획: 평택에 QM이 없으므로 제외 → 수원 General EMC 팀으로 대체
 */
export const CALIBRATION_PLANS_SEED_DATA: NewCalibrationPlan[] = [
  // 1. draft — 기술책임자가 작성 중 (2026년 수원 FCC EMC/RF)
  {
    id: CPLAN_001_ID,
    year: 2026,
    siteId: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    status: CPStatus.DRAFT,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    version: 1,
    casVersion: 1,
    isLatestVersion: true,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },

  // 2. pending_review — 의왕 TM이 제출, QM 검토 대기 (2026년 의왕)
  //    의왕에 QM/LM이 없으므로 자연스럽게 검토 대기 상태에 머무름
  {
    id: CPLAN_002_ID,
    year: 2026,
    siteId: 'uiwang',
    teamId: TEAM_GENERAL_RF_UIWANG_ID,
    status: CPStatus.PENDING_REVIEW,
    createdBy: USER_TECHNICAL_MANAGER_UIWANG_ID,
    submittedAt: daysAgo(3),
    version: 1,
    casVersion: 2, // submit 시 CAS 증가
    isLatestVersion: true,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
  },

  // 3. pending_approval — 수원 General EMC, QM 검토 완료 → LM 승인 대기
  //    수원 QM이 검토했으므로 사이트 격리 준수
  {
    id: CPLAN_003_ID,
    year: 2026,
    siteId: 'suwon',
    teamId: TEAM_GENERAL_EMC_SUWON_ID,
    status: CPStatus.PENDING_APPROVAL,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    submittedAt: daysAgo(12),
    reviewedBy: USER_QUALITY_MANAGER_SUWON_ID,
    reviewedAt: daysAgo(8),
    reviewComment: '검토 완료, 승인 요청합니다.',
    version: 1,
    casVersion: 3, // submit(2) + review(3)
    isLatestVersion: true,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(8),
  },

  // 4. approved — 전체 워크플로우 완료 (2025년 수원 FCC EMC/RF)
  //    동일 사이트: 수원 TM → 수원 QM → 수원 LM
  {
    id: CPLAN_004_ID,
    year: 2025,
    siteId: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    status: CPStatus.APPROVED,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    submittedAt: new Date('2025-01-10'),
    reviewedBy: USER_QUALITY_MANAGER_SUWON_ID,
    reviewedAt: new Date('2025-01-12'),
    reviewComment: '적합',
    approvedBy: USER_LAB_MANAGER_SUWON_ID,
    approvedAt: new Date('2025-01-15'),
    version: 1,
    casVersion: 4, // submit(2) + review(3) + approve(4)
    isLatestVersion: true,
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-15'),
  },

  // 5. rejected — 검토 단계에서 반려 (2024년 수원 FCC EMC/RF)
  //    isLatestVersion=false: CPLAN_006이 v2로 재제출됨
  {
    id: CPLAN_005_ID,
    year: 2024,
    siteId: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    status: CPStatus.REJECTED,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    submittedAt: new Date('2024-01-05'),
    rejectedBy: USER_QUALITY_MANAGER_SUWON_ID,
    rejectedAt: new Date('2024-01-08'),
    rejectionReason: '교정 일자 재검토 필요. 3월 예정 장비가 2월로 잘못 입력되었습니다.',
    rejectionStage: REVIEW_STAGE,
    version: 1,
    casVersion: 3, // submit(2) + reject(3)
    isLatestVersion: false, // v2가 존재
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-08'),
  },

  // 6. pending_review v2 — 반려 후 수정하여 재제출 (2024년 수원)
  //    parentPlanId로 CPLAN_005 참조
  {
    id: CPLAN_006_ID,
    year: 2024,
    siteId: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    status: CPStatus.PENDING_REVIEW,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    submittedAt: new Date('2024-01-12'),
    parentPlanId: CPLAN_005_ID,
    version: 2,
    casVersion: 2, // submit(2)
    isLatestVersion: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
  },
];

/**
 * 교정계획서 항목 시드 데이터 (12건)
 *
 * 각 계획서당 2개 항목, 외부교정 대상 장비의 스냅샷 포함
 * - 장비는 반드시 해당 계획의 사이트/팀에 속하는 장비만 참조
 * - CPLAN_004 (approved) 항목: confirmedBy/confirmedAt + actualCalibrationDate 포함
 * - CPLAN_005 (rejected) 항목: 잘못된 교정일 (반려 사유)
 * - CPLAN_006 (v2 re-submitted) 항목: 수정된 교정일
 */
export const CALIBRATION_PLAN_ITEMS_SEED_DATA: NewCalibrationPlanItem[] = [
  // ── CPLAN_001 (draft, 2026 수원 FCC EMC/RF) ─────────────────────────

  {
    id: CPLAN_ITEM_001_ID,
    planId: CPLAN_001_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    sequenceNumber: 1,
    snapshotValidityDate: monthsAgo(3),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'HCT',
    plannedCalibrationDate: monthsLater(9),
    plannedCalibrationAgency: 'HCT',
  },
  {
    id: CPLAN_ITEM_002_ID,
    planId: CPLAN_001_ID,
    equipmentId: EQUIP_SIGNAL_GEN_SUW_E_ID,
    sequenceNumber: 2,
    snapshotValidityDate: monthsAgo(2),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'HCT',
    plannedCalibrationDate: monthsLater(10),
    plannedCalibrationAgency: 'HCT',
  },

  // ── CPLAN_002 (pending_review, 2026 의왕 General RF) ─────────────────

  {
    id: CPLAN_ITEM_003_ID,
    planId: CPLAN_002_ID,
    equipmentId: EQUIP_RECEIVER_UIW_W_ID,
    sequenceNumber: 1,
    snapshotValidityDate: monthsAgo(9),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'SPEAG',
    plannedCalibrationDate: monthsLater(3),
    plannedCalibrationAgency: 'SPEAG',
  },
  {
    id: CPLAN_ITEM_004_ID,
    planId: CPLAN_002_ID,
    equipmentId: EQUIP_TRANSMITTER_UIW_W_ID,
    sequenceNumber: 2,
    snapshotValidityDate: monthsAgo(11),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'KTC',
    plannedCalibrationDate: monthsLater(1),
    plannedCalibrationAgency: 'KTC',
  },

  // ── CPLAN_003 (pending_approval, 2026 수원 General EMC) ──────────────
  //    수원 장비 중 General EMC 팀 또는 공유 장비 참조

  {
    id: CPLAN_ITEM_005_ID,
    planId: CPLAN_003_ID,
    equipmentId: EQUIP_OSCILLOSCOPE_SUW_R_ID, // General EMC (R) 장비
    sequenceNumber: 1,
    snapshotValidityDate: monthsAgo(14),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'HCT',
    plannedCalibrationDate: monthsLater(2),
    plannedCalibrationAgency: 'HCT',
  },
  {
    id: CPLAN_ITEM_006_ID,
    planId: CPLAN_003_ID,
    equipmentId: EQUIP_CURRENT_PROBE_SUW_A_ID, // Automotive EMC (A), 수원 사이트 내
    sequenceNumber: 2,
    snapshotValidityDate: monthsAgo(11),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'KATRI',
    plannedCalibrationDate: monthsLater(1),
    plannedCalibrationAgency: 'KATRI',
  },

  // ── CPLAN_004 (approved, 2025 수원 FCC EMC/RF) ──────────────────────
  //    교정 완료 + 기술책임자 확인 포함

  {
    id: CPLAN_ITEM_007_ID,
    planId: CPLAN_004_ID,
    equipmentId: EQUIP_EMC_RECEIVER_SUW_E_ID,
    sequenceNumber: 1,
    snapshotValidityDate: new Date('2024-09-01'),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'KTC',
    plannedCalibrationDate: new Date('2025-09-01'),
    plannedCalibrationAgency: 'KTC',
    actualCalibrationDate: new Date('2025-08-28'),
    confirmedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    confirmedAt: new Date('2025-09-02'),
  },
  {
    id: CPLAN_ITEM_008_ID,
    planId: CPLAN_004_ID,
    equipmentId: EQUIP_OSCILLOSCOPE_SUW_R_ID,
    sequenceNumber: 2,
    snapshotValidityDate: new Date('2024-07-01'),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'HCT',
    plannedCalibrationDate: new Date('2025-07-01'),
    plannedCalibrationAgency: 'HCT',
    actualCalibrationDate: new Date('2025-06-25'),
    confirmedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    confirmedAt: new Date('2025-07-01'),
  },

  // ── CPLAN_005 (rejected, 2024 수원 FCC EMC/RF) ──────────────────────
  //    잘못된 교정일이 반려 사유

  {
    id: CPLAN_ITEM_009_ID,
    planId: CPLAN_005_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    sequenceNumber: 1,
    snapshotValidityDate: new Date('2023-12-01'),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'HCT',
    plannedCalibrationDate: new Date('2024-02-01'), // 잘못된 날짜 (반려 사유: 3월 예정)
    plannedCalibrationAgency: 'HCT',
    notes: '교정일 재검토 필요 (3월 예정)',
  },
  {
    id: CPLAN_ITEM_010_ID,
    planId: CPLAN_005_ID,
    equipmentId: EQUIP_CURRENT_PROBE_SUW_A_ID,
    sequenceNumber: 2,
    snapshotValidityDate: new Date('2023-10-01'),
    snapshotCalibrationCycle: 6,
    snapshotCalibrationAgency: 'KATRI',
    plannedCalibrationDate: new Date('2024-04-01'),
    plannedCalibrationAgency: 'KATRI',
  },

  // ── CPLAN_006 (v2 re-submitted, 2024 수원 FCC EMC/RF) ───────────────
  //    반려 피드백 반영: 2월→3월 교정일 수정

  {
    id: CPLAN_ITEM_011_ID,
    planId: CPLAN_006_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    sequenceNumber: 1,
    snapshotValidityDate: new Date('2023-12-01'),
    snapshotCalibrationCycle: 12,
    snapshotCalibrationAgency: 'HCT',
    plannedCalibrationDate: new Date('2024-03-01'), // 수정됨: 2월→3월
    plannedCalibrationAgency: 'HCT',
    notes: '반려 피드백 반영: 교정일 3월로 수정',
  },
  {
    id: CPLAN_ITEM_012_ID,
    planId: CPLAN_006_ID,
    equipmentId: EQUIP_CURRENT_PROBE_SUW_A_ID,
    sequenceNumber: 2,
    snapshotValidityDate: new Date('2023-10-01'),
    snapshotCalibrationCycle: 6,
    snapshotCalibrationAgency: 'KATRI',
    plannedCalibrationDate: new Date('2024-04-01'),
    plannedCalibrationAgency: 'KATRI',
  },
];
