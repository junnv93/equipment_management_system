/**
 * Test Software (UL-QP-18-07 관리대장) seed data
 *
 * P0001~P0020 대표 샘플: 시험분야별(SAR/RF/EMC/RED/HAC) 균형 배분
 * 실제 관리대장(docs/procedure/절차서/시험용소프트웨어관리대장.md)의 데이터 기반
 */

import { testSoftware } from '@equipment-management/db/schema';
import type { TestField, SoftwareAvailability } from '@equipment-management/schemas';
import {
  USER_TEST_ENGINEER_SUWON_SAR_ID,
  USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
  USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
} from '../../utils/uuid-constants';

// Stable UUIDs for test_software (referenced by equipment_test_software & validations)
export const TEST_SOFTWARE_DASY5_ID = '10000000-0000-0000-0000-000000000001';
export const TEST_SOFTWARE_DAK_ID = '10000000-0000-0000-0000-000000000002';
export const TEST_SOFTWARE_CLT_ID = '10000000-0000-0000-0000-000000000003';
export const TEST_SOFTWARE_UL_EMC_ID = '10000000-0000-0000-0000-000000000004';
export const TEST_SOFTWARE_EMC32_RED_ID = '10000000-0000-0000-0000-000000000005';
export const TEST_SOFTWARE_IECSOFT_ID = '10000000-0000-0000-0000-000000000006';
export const TEST_SOFTWARE_IEC_CONTROL_ID = '10000000-0000-0000-0000-000000000007';
export const TEST_SOFTWARE_SEMCAD_X_ID = '10000000-0000-0000-0000-000000000008';
export const TEST_SOFTWARE_POWER_VIEWER_ID = '10000000-0000-0000-0000-000000000009';
export const TEST_SOFTWARE_DASY6_ID = '10000000-0000-0000-0000-00000000000a';
export const TEST_SOFTWARE_DASY8_SAR_ID = '10000000-0000-0000-0000-00000000000b';
export const TEST_SOFTWARE_DASY8_HAC_ID = '10000000-0000-0000-0000-00000000000c';
export const TEST_SOFTWARE_DASY8_MMWAVE_ID = '10000000-0000-0000-0000-00000000000d';
export const TEST_SOFTWARE_SOUND_CHECK_ID = '10000000-0000-0000-0000-00000000000e';
export const TEST_SOFTWARE_UL_POWER_VERIF_ID = '10000000-0000-0000-0000-00000000000f';
export const TEST_SOFTWARE_EMC32_EMC_ID = '10000000-0000-0000-0000-000000000010';
export const TEST_SOFTWARE_ICD_CONTROL_ID = '10000000-0000-0000-0000-000000000011';
export const TEST_SOFTWARE_ISO_CONTROL_ID = '10000000-0000-0000-0000-000000000012';
export const TEST_SOFTWARE_UL_IM_ID = '10000000-0000-0000-0000-000000000013';
export const TEST_SOFTWARE_ELEKTRA_ID = '10000000-0000-0000-0000-000000000014';

type SeedRow = typeof testSoftware.$inferInsert;

const sw = (
  id: string,
  managementNumber: string,
  name: string,
  softwareVersion: string | null,
  testField: TestField,
  primaryManagerId: string,
  secondaryManagerId: string,
  installedAt: string,
  manufacturer: string,
  location: string,
  availability: SoftwareAvailability,
  requiresValidation: boolean = true
): SeedRow => ({
  id,
  managementNumber,
  name,
  softwareVersion,
  testField,
  primaryManagerId,
  secondaryManagerId,
  installedAt: new Date(installedAt),
  manufacturer,
  location,
  availability,
  requiresValidation,
  site: 'SUW',
});

export const TEST_SOFTWARE_SEED_DATA: SeedRow[] = [
  // SAR 분야 (8개)
  sw(
    TEST_SOFTWARE_DASY5_ID,
    'P0001',
    'DASY5',
    '2.8',
    'SAR',
    USER_TEST_ENGINEER_SUWON_SAR_ID,
    USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    '2014-10-10',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_DAK_ID,
    'P0002',
    'DAK',
    '1.12.332',
    'SAR',
    USER_TEST_ENGINEER_SUWON_SAR_ID,
    USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    '2014-10-10',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_SEMCAD_X_ID,
    'P0027',
    'SEMCAD X',
    '14.6.13 (7474)',
    'SAR',
    USER_TEST_ENGINEER_SUWON_SAR_ID,
    USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    '2020-03-05',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_DASY6_ID,
    'P0035',
    'DASY6',
    '6.14.0.959',
    'SAR',
    USER_TEST_ENGINEER_SUWON_SAR_ID,
    USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    '2020-11-11',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_SOUND_CHECK_ID,
    'P0049',
    'Sound Check',
    '19.02.55852',
    'SAR',
    USER_TEST_ENGINEER_SUWON_SAR_ID,
    USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    '2022-04-12',
    'Listen',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_UL_POWER_VERIF_ID,
    'P0050',
    'UL Power Verification',
    '3.4.9',
    'SAR',
    USER_TEST_ENGINEER_SUWON_SAR_ID,
    USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    '2022-04-29',
    'UL',
    'SAR',
    'available',
    false
  ),
  sw(
    TEST_SOFTWARE_DASY8_SAR_ID,
    'P0055',
    'DASY8 Module SAR',
    '16.2.2.1588',
    'SAR',
    USER_TEST_ENGINEER_SUWON_SAR_ID,
    USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    '2023-01-11',
    'SPEAG',
    'SAR',
    'available'
  ),
  // P0043 — 동일 관리번호로 3개 모듈 등록 (실제 관리대장 사례)
  sw(
    TEST_SOFTWARE_DASY8_HAC_ID,
    'P0043-HAC',
    'DASY8 Module HAC',
    '1.2.0.1049',
    'HAC',
    USER_TEST_ENGINEER_SUWON_SAR_ID,
    USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    '2021-05-14',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_DASY8_MMWAVE_ID,
    'P0043-mmW',
    'DASY8 Module mmWave',
    '2.4.0.44',
    'SAR',
    USER_TEST_ENGINEER_SUWON_SAR_ID,
    USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    '2021-05-14',
    'SPEAG',
    'SAR',
    'unavailable'
  ),

  // RF 분야 (3개)
  sw(
    TEST_SOFTWARE_CLT_ID,
    'P0044',
    'CLT',
    '3.4.0',
    'RF',
    USER_TEST_ENGINEER_SUWON_ID,
    USER_TECHNICAL_MANAGER_SUWON_ID,
    '2021-07-26',
    'UL',
    'RF',
    'available'
  ),
  sw(
    TEST_SOFTWARE_POWER_VIEWER_ID,
    'P0048',
    'Power Viewer',
    'V11.3',
    'RF',
    USER_TEST_ENGINEER_SUWON_ID,
    USER_TECHNICAL_MANAGER_SUWON_ID,
    '2022-02-24',
    'Rohde&Schwarz',
    'RF',
    'available'
  ),
  sw(
    TEST_SOFTWARE_UL_IM_ID,
    'P0036',
    'UL iM',
    '1.04',
    'RF',
    USER_TEST_ENGINEER_SUWON_ID,
    USER_TECHNICAL_MANAGER_SUWON_ID,
    '2020-11-26',
    'UL',
    'RF',
    'available'
  ),

  // EMC 분야 (2개)
  sw(
    TEST_SOFTWARE_UL_EMC_ID,
    'P0007',
    'UL EMC',
    '9.5',
    'EMC',
    USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
    USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
    '2015-06-26',
    'UL',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_EMC32_EMC_ID,
    'P0030',
    'EMC32',
    '10.60.10',
    'EMC',
    USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
    USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
    '2020-07-31',
    'Rohde&Schwarz',
    'Auto',
    'unavailable'
  ),

  // RED 분야 (5개)
  sw(
    TEST_SOFTWARE_EMC32_RED_ID,
    'P0022',
    'EMC32',
    '10.50.40',
    'RED',
    USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
    USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
    '2019-09-03',
    'Rohde&Schwarz',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_IECSOFT_ID,
    'P0045',
    'IECSoft',
    '2_6-U',
    'RED',
    USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
    USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
    '2021-09-22',
    'Newtons4th Ltd',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_IEC_CONTROL_ID,
    'P0014',
    'IEC.CONTROL',
    '6.0.6',
    'RED',
    USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
    USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
    '2017-03-13',
    'EMtest',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_ICD_CONTROL_ID,
    'P0038',
    'ICD.CONTROL',
    '6.2.5',
    'RED',
    USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
    USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
    '2021-01-06',
    'Ametek',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_ELEKTRA_ID,
    'P0073',
    'ELEKTRA',
    '5.11.1',
    'RED',
    USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
    USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
    '2025-04-24',
    'Rohde&Schwarz',
    'Auto',
    'available'
  ),
];
