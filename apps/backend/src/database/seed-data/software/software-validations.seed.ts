/**
 * Software Validations (UL-QP-18-09) seed data
 *
 * 10 records covering all workflow states × both validation types:
 *   - vendor (방법 1: 공급자 시연): draft, submitted, approved, quality_approved, rejected
 *   - self   (방법 2: UL 자체 시험): draft, submitted, approved, quality_approved, rejected
 *
 * Approvals/counts API에서 submitted + approved 상태를 카운트하므로
 * 해당 상태의 레코드가 반드시 존재해야 합니다.
 */

import type { NewSoftwareValidation } from '@equipment-management/db/schema';
import {
  SW_VALID_001_ID,
  SW_VALID_002_ID,
  SW_VALID_003_ID,
  SW_VALID_004_ID,
  SW_VALID_005_ID,
  SW_VALID_006_ID,
  SW_VALID_007_ID,
  SW_VALID_008_ID,
  SW_VALID_009_ID,
  SW_VALID_010_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_QUALITY_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_SUWON_SAR_ID,
  USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
} from '../../utils/uuid-constants';
import {
  TEST_SOFTWARE_DASY5_ID,
  TEST_SOFTWARE_DAK_ID,
  TEST_SOFTWARE_EMC32_RED_ID,
  TEST_SOFTWARE_IECSOFT_ID,
  TEST_SOFTWARE_SEMCAD_X_ID,
  TEST_SOFTWARE_DASY6_ID,
  TEST_SOFTWARE_DASY8_SAR_ID,
  TEST_SOFTWARE_SOUND_CHECK_ID,
  TEST_SOFTWARE_UL_POWER_VERIF_ID,
  TEST_SOFTWARE_EMC32_EMC_ID,
} from './test-software.seed';

type SeedRow = NewSoftwareValidation;

export const SOFTWARE_VALIDATIONS_SEED_DATA: SeedRow[] = [
  // ════════════════════════════════════════════════════════════════════════
  // 방법 1: 공급자 시연 (vendor) — 5 records
  // ════════════════════════════════════════════════════════════════════════

  // V-001: draft — 초안 작성 중
  {
    id: SW_VALID_001_ID,
    testSoftwareId: TEST_SOFTWARE_DASY5_ID, // DASY5 (SAR)
    validationType: 'vendor',
    status: 'draft',
    softwareVersion: '2.8',
    infoDate: new Date('2026-03-01'),
    softwareAuthor: 'Speag AG',
    vendorName: 'Speag AG',
    vendorSummary: 'DASY5 SAR 측정 소프트웨어 v2.8 공급자 시연 계획',
    createdBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
  },

  // V-002: submitted — 기술책임자 승인 대기 (approvals 카운트에 포함됨)
  {
    id: SW_VALID_002_ID,
    testSoftwareId: TEST_SOFTWARE_DAK_ID, // DAK (SAR)
    validationType: 'vendor',
    status: 'submitted',
    softwareVersion: '3.1',
    testDate: new Date('2026-03-10'),
    infoDate: new Date('2026-02-15'),
    softwareAuthor: 'Speag AG',
    vendorName: 'Speag AG',
    vendorSummary: 'DAK 유전체 특성 측정 SW v3.1 공급자 시연 완료. 결과 첨부.',
    receivedBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
    receivedDate: new Date('2026-02-20'),
    attachmentNote: '시연 결과 보고서 (DAK_v3.1_vendor_demo.pdf) 첨부',
    submittedAt: new Date('2026-03-15'),
    submittedBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
    createdBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
  },

  // V-003: approved — 기술책임자 승인 완료, 품질책임자 대기 (approvals 카운트에 포함됨)
  {
    id: SW_VALID_003_ID,
    testSoftwareId: TEST_SOFTWARE_EMC32_RED_ID, // EMC32 (RED)
    validationType: 'vendor',
    status: 'approved',
    softwareVersion: '12.30.01',
    testDate: new Date('2026-02-20'),
    infoDate: new Date('2026-01-10'),
    softwareAuthor: 'Rohde & Schwarz',
    vendorName: 'Rohde & Schwarz Korea',
    vendorSummary: 'EMC32 RED 시험 자동화 SW. 공급자 시연 통과.',
    receivedBy: USER_TEST_ENGINEER_SUWON_ID,
    receivedDate: new Date('2026-01-15'),
    attachmentNote: '시연 결과 및 교정 인증서 첨부',
    submittedAt: new Date('2026-02-25'),
    submittedBy: USER_TEST_ENGINEER_SUWON_ID,
    technicalApproverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    technicalApprovedAt: new Date('2026-03-01'),
    createdBy: USER_TEST_ENGINEER_SUWON_ID,
  },

  // V-004: quality_approved — P0045 공식 작성 사례 (절차서 원문 근거)
  // 출처: docs/procedure/P0045 시험 소프트웨어의 유효성확인-IECSoft-2_6-U.docx
  // 방법 1 (공급자 시연), IECSoft v2_6-U, 공급자 Newtons4th Ltd, 수령일 2021-09-22
  {
    id: SW_VALID_004_ID,
    testSoftwareId: TEST_SOFTWARE_IECSOFT_ID, // IECSoft (EMC)
    validationType: 'vendor',
    status: 'quality_approved',
    softwareVersion: '2_6-U',
    testDate: new Date('2021-09-22'),
    infoDate: new Date('2021-09-22'),
    softwareAuthor: 'Newtons4th Ltd',
    vendorName: 'Newtons4th Ltd',
    vendorSummary:
      'IECSoft v2_6-U 전도성 방해 시험 자동화 소프트웨어. 공급자(Newtons4th Ltd) 시연 및 설명서 검토 완료. 측정 불확도 산출, 교정 추적성, 한계치 적용 기능 확인.',
    receivedBy: USER_TEST_ENGINEER_SUWON_ID,
    receivedDate: new Date('2021-09-22'),
    attachmentNote: 'IECSoft v2_6-U 공급자 제공 사용설명서 및 시연 결과 보고서 스캔본 첨부',
    submittedAt: new Date('2021-09-23'),
    submittedBy: USER_TEST_ENGINEER_SUWON_ID,
    technicalApproverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    technicalApprovedAt: new Date('2021-09-24'),
    qualityApproverId: USER_QUALITY_MANAGER_SUWON_ID,
    qualityApprovedAt: new Date('2021-09-25'),
    createdBy: USER_TEST_ENGINEER_SUWON_ID,
  },

  // V-005: rejected — 반려됨
  {
    id: SW_VALID_005_ID,
    testSoftwareId: TEST_SOFTWARE_SEMCAD_X_ID, // SEMCAD X (SAR)
    validationType: 'vendor',
    status: 'rejected',
    softwareVersion: '14.8',
    testDate: new Date('2026-02-10'),
    infoDate: new Date('2026-01-05'),
    softwareAuthor: 'Speag AG',
    vendorName: 'Speag AG',
    vendorSummary: '시뮬레이션 결과와 측정값 간 편차 초과. 재시연 필요.',
    submittedAt: new Date('2026-02-15'),
    submittedBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
    rejectedBy: USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    rejectedAt: new Date('2026-02-20'),
    rejectionReason:
      '시뮬레이션 결과와 실측값 편차 15% 초과 (허용범위 10%). 버전 업그레이드 후 재시연 요청.',
    createdBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
  },

  // ════════════════════════════════════════════════════════════════════════
  // 방법 2: UL 자체 시험 (self) — 5 records
  // ════════════════════════════════════════════════════════════════════════

  // V-006: draft — 자체 시험 초안
  {
    id: SW_VALID_006_ID,
    testSoftwareId: TEST_SOFTWARE_DASY6_ID, // DASY6 (SAR)
    validationType: 'self',
    status: 'draft',
    softwareVersion: '6.2',
    infoDate: new Date('2026-03-20'),
    softwareAuthor: 'Speag AG',
    referenceDocuments: 'IEC 62209-1528:2020, UL Internal Test SOP-SAR-001',
    operatingUnitDescription: 'SAR 시험실 DASY6 시스템 (프로브 + 팬텀 + 로봇 암)',
    softwareComponents: 'DASY6 Core v6.2, Probe Driver v3.0, Phantom Controller v1.5',
    hardwareComponents: 'EX3DV4 프로브, SAM 팬텀 (Head/Body), UR5 로봇 암',
    createdBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
  },

  // V-007: submitted — 자체 시험 제출됨 (approvals 카운트에 포함)
  {
    id: SW_VALID_007_ID,
    testSoftwareId: TEST_SOFTWARE_DASY8_SAR_ID, // DASY8 (SAR)
    validationType: 'self',
    status: 'submitted',
    softwareVersion: '8.0.1',
    testDate: new Date('2026-03-25'),
    infoDate: new Date('2026-03-01'),
    softwareAuthor: 'Speag AG',
    referenceDocuments: 'IEC 62209-1528:2020, KS C 9137:2022',
    operatingUnitDescription: 'DASY8 통합 SAR 측정 시스템',
    softwareComponents: 'DASY8 Core v8.0.1, cDASY6 Module v6.5',
    hardwareComponents: 'EX3DV5 프로브, cSAR3D 스캐너, SAM v4.5 팬텀',
    acquisitionFunctions: [
      {
        name: '프로브 데이터 수집',
        independentMethod: '교정된 기준 프로브(NIST traceable)로 동일 조건 독립 측정',
        acceptanceCriteria: '±0.5dB 이내',
        result: 'pass',
      },
      {
        name: '위치 정밀도',
        independentMethod: '레이저 거리 측정기로 좌표 독립 검증',
        acceptanceCriteria: '±0.2mm',
        result: 'pass',
      },
    ],
    processingFunctions: [
      {
        name: 'SAR 외삽',
        independentMethod: 'IEEE Std 1528 기준 수식으로 수동 계산 후 비교',
        acceptanceCriteria: 'IEEE 기준 불확도 이내',
        result: 'pass',
      },
      {
        name: '피크 검출',
        independentMethod: '동일 데이터셋에 대해 MATLAB 스크립트로 독립 산출',
        acceptanceCriteria: '1g/10g 정규화 기준 일치',
        result: 'pass',
      },
    ],
    controlFunctions: [
      {
        equipmentFunction: '로봇 암 이동 제어',
        expectedFunction: '지정 좌표로 프로브 이동, 충돌 방지 정지',
        observedFunction: '지정 좌표 도달 확인, 경계 접근 시 자동 정지 확인',
        independentMethod: '스케일 자 및 육안으로 이동 거리·정지 동작 독립 검증',
        acceptanceCriteria: '충돌 방지 정상 동작, 위치 오차 ±1mm 이내',
        result: 'pass',
      },
    ],
    performedBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
    submittedAt: new Date('2026-03-28'),
    submittedBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
    createdBy: USER_TEST_ENGINEER_SUWON_SAR_ID,
  },

  // V-008: approved — 자체 시험 기술책임자 승인 (approvals 카운트에 포함)
  {
    id: SW_VALID_008_ID,
    testSoftwareId: TEST_SOFTWARE_SOUND_CHECK_ID, // SoundCheck (EMC)
    validationType: 'self',
    status: 'approved',
    softwareVersion: '22.0.1',
    testDate: new Date('2026-03-05'),
    infoDate: new Date('2026-02-01'),
    softwareAuthor: 'Listen Inc.',
    referenceDocuments: 'ANSI/CTA-2051, UL Internal SOP-AUDIO-001',
    operatingUnitDescription: 'HAC/음향 시험 시스템 (SoundCheck + 마이크 어레이)',
    softwareComponents: 'SoundCheck v22.0.1, TTS Module v5.0',
    hardwareComponents: 'GRAS 45CB 음향 커플러, NTi Audio XL2',
    acquisitionFunctions: [
      {
        name: '음압 레벨 측정',
        independentMethod: '교정된 기준 마이크로폰(GRAS 40AO)으로 동일 조건 독립 측정',
        acceptanceCriteria: '±1dB 이내',
        result: 'pass',
      },
    ],
    processingFunctions: [
      {
        name: 'HAC 등급 산출',
        independentMethod: 'ANSI C63.19 수식으로 수동 계산 후 비교',
        acceptanceCriteria: 'ANSI M/T Rating 일치',
        result: 'pass',
      },
    ],
    performedBy: USER_TEST_ENGINEER_SUWON_ID,
    submittedAt: new Date('2026-03-10'),
    submittedBy: USER_TEST_ENGINEER_SUWON_ID,
    technicalApproverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    technicalApprovedAt: new Date('2026-03-15'),
    createdBy: USER_TEST_ENGINEER_SUWON_ID,
  },

  // V-009: quality_approved — 자체 시험 최종 승인
  {
    id: SW_VALID_009_ID,
    testSoftwareId: TEST_SOFTWARE_UL_POWER_VERIF_ID, // UL Power Verification (RF)
    validationType: 'self',
    status: 'quality_approved',
    softwareVersion: '4.2.0',
    testDate: new Date('2026-01-20'),
    infoDate: new Date('2025-12-15'),
    softwareAuthor: 'UL Solutions',
    referenceDocuments: 'FCC Part 2.1046, UL Internal SOP-RF-POWER-001',
    operatingUnitDescription: 'RF 출력 검증 시스템 (스펙트럼 분석기 + 파워 미터)',
    softwareComponents: 'UL Power Verification v4.2.0, Data Logger v2.1',
    hardwareComponents: 'R&S FSW26 스펙트럼 분석기, R&S NRPxxS 파워 센서',
    acquisitionFunctions: [
      {
        name: '출력 레벨 측정',
        independentMethod: 'R&S NRPxxS 파워 센서로 소프트웨어와 독립적으로 직접 측정',
        acceptanceCriteria: '±0.3dB 이내',
        result: 'pass',
      },
      {
        name: '주파수 정확도',
        independentMethod: '주파수 카운터로 반송파 주파수 독립 측정',
        acceptanceCriteria: '±1kHz 이내',
        result: 'pass',
      },
    ],
    processingFunctions: [
      {
        name: '최대 출력 계산',
        independentMethod: 'FCC Part 2.1046 수식으로 측정 데이터 수동 재계산',
        acceptanceCriteria: 'FCC 기준 이내',
        result: 'pass',
      },
    ],
    performedBy: USER_TEST_ENGINEER_SUWON_ID,
    submittedAt: new Date('2026-01-25'),
    submittedBy: USER_TEST_ENGINEER_SUWON_ID,
    technicalApproverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    technicalApprovedAt: new Date('2026-01-30'),
    qualityApproverId: USER_QUALITY_MANAGER_SUWON_ID,
    qualityApprovedAt: new Date('2026-02-05'),
    createdBy: USER_TEST_ENGINEER_SUWON_ID,
  },

  // V-010: rejected — 자체 시험 반려
  {
    id: SW_VALID_010_ID,
    testSoftwareId: TEST_SOFTWARE_EMC32_EMC_ID, // EMC32 (EMC)
    validationType: 'self',
    status: 'rejected',
    softwareVersion: '12.30.01',
    testDate: new Date('2026-02-28'),
    infoDate: new Date('2026-02-01'),
    softwareAuthor: 'Rohde & Schwarz',
    referenceDocuments: 'CISPR 32, IEC 61000-4-3, UL Internal SOP-EMC-001',
    operatingUnitDescription: 'EMC 시험실 자동화 시스템 (턴테이블 + 안테나 마스트)',
    softwareComponents: 'EMC32 Core v12.30.01, EMS Control v5.2',
    hardwareComponents: 'R&S ESR EMI 수신기, EMCO 3115 안테나',
    acquisitionFunctions: [
      {
        name: '방사 방해 측정',
        independentMethod: '교정된 EMI 수신기로 소프트웨어 자동화 없이 수동 스캔',
        acceptanceCriteria: 'CISPR 32 Class B 한계치 이내',
        result: 'fail',
      },
    ],
    performedBy: USER_TEST_ENGINEER_SUWON_ID,
    submittedAt: new Date('2026-03-05'),
    submittedBy: USER_TEST_ENGINEER_SUWON_ID,
    rejectedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    rejectedAt: new Date('2026-03-10'),
    rejectionReason:
      '획득 기능 검증 항목 중 방사 방해 측정 결과 CISPR 32 Class B 기준 초과. 측정 불확도 재검토 필요.',
    createdBy: USER_TEST_ENGINEER_SUWON_ID,
  },
];
