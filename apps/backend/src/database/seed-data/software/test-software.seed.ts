/**
 * Test Software (UL-QP-18-07 관리대장) seed data
 *
 * P0001~P0073 전량 (75행, P0043 3건)
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
// Existing 20 entries (DO NOT change)
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

// New 55 entries (P0003-P0072 gaps)
export const TEST_SOFTWARE_IN_SERVICE_MONITOR_ID = '10000000-0000-0000-0000-000000000015';
export const TEST_SOFTWARE_N7607B_ID = '10000000-0000-0000-0000-000000000016';
export const TEST_SOFTWARE_POWER_PANEL_ID = '10000000-0000-0000-0000-000000000017';
export const TEST_SOFTWARE_CLT_P0006_ID = '10000000-0000-0000-0000-000000000018';
export const TEST_SOFTWARE_CLT_P0008_ID = '10000000-0000-0000-0000-000000000019';
export const TEST_SOFTWARE_CALL_BOX_ID = '10000000-0000-0000-0000-00000000001a';
export const TEST_SOFTWARE_CLT_P0010_ID = '10000000-0000-0000-0000-00000000001b';
export const TEST_SOFTWARE_CLT_P0011_ID = '10000000-0000-0000-0000-00000000001c';
export const TEST_SOFTWARE_CLT_P0012_ID = '10000000-0000-0000-0000-00000000001d';
export const TEST_SOFTWARE_IECSOFT_V2_5A_ID = '10000000-0000-0000-0000-00000000001e';
export const TEST_SOFTWARE_ICD_CONTROL_P0015_ID = '10000000-0000-0000-0000-00000000001f';
export const TEST_SOFTWARE_EMC32_AMS32_ID = '10000000-0000-0000-0000-000000000020';
export const TEST_SOFTWARE_ISO_CONTROL_P0017_ID = '10000000-0000-0000-0000-000000000021';
export const TEST_SOFTWARE_CLT_P0018_ID = '10000000-0000-0000-0000-000000000022';
export const TEST_SOFTWARE_POWER_VIEWER_PLUS_ID = '10000000-0000-0000-0000-000000000023';
export const TEST_SOFTWARE_CLT_P0020_ID = '10000000-0000-0000-0000-000000000024';
export const TEST_SOFTWARE_CLT_P0021_ID = '10000000-0000-0000-0000-000000000025';
export const TEST_SOFTWARE_CDASY6_MMWAVE_ID = '10000000-0000-0000-0000-000000000026';
export const TEST_SOFTWARE_UXM_5G_ID = '10000000-0000-0000-0000-000000000027';
export const TEST_SOFTWARE_WITUNES_ID = '10000000-0000-0000-0000-000000000028';
export const TEST_SOFTWARE_DASY5_P0026_ID = '10000000-0000-0000-0000-000000000029';
export const TEST_SOFTWARE_DASY5_P0028_ID = '10000000-0000-0000-0000-00000000002a';
export const TEST_SOFTWARE_SEMCAD_X_P0029_ID = '10000000-0000-0000-0000-00000000002b';
export const TEST_SOFTWARE_EMC32_P0031_ID = '10000000-0000-0000-0000-00000000002c';
export const TEST_SOFTWARE_ISO_CONTROL_P0032_ID = '10000000-0000-0000-0000-00000000002d';
export const TEST_SOFTWARE_EHP_200_TS_ID = '10000000-0000-0000-0000-00000000002e';
export const TEST_SOFTWARE_UL_POWER_VERIF_P0034_ID = '10000000-0000-0000-0000-00000000002f';
export const TEST_SOFTWARE_ANTENNA_PORT_ID = '10000000-0000-0000-0000-000000000030';
export const TEST_SOFTWARE_EMC32_P0039_ID = '10000000-0000-0000-0000-000000000031';
export const TEST_SOFTWARE_SOUND_CHECK_P0040_ID = '10000000-0000-0000-0000-000000000032';
export const TEST_SOFTWARE_EMC32_P0041_ID = '10000000-0000-0000-0000-000000000033';
export const TEST_SOFTWARE_DAK_P0042_ID = '10000000-0000-0000-0000-000000000034';
export const TEST_SOFTWARE_DASY8_SAR_P0043_ID = '10000000-0000-0000-0000-000000000035';
export const TEST_SOFTWARE_CLT_P0046_ID = '10000000-0000-0000-0000-000000000036';
export const TEST_SOFTWARE_EMC32_P0047_ID = '10000000-0000-0000-0000-000000000037';
export const TEST_SOFTWARE_SEO_RFA_ID = '10000000-0000-0000-0000-000000000038';
export const TEST_SOFTWARE_UL_LTE_POWERMEAS_ID = '10000000-0000-0000-0000-000000000039';
export const TEST_SOFTWARE_DASY5_SEMCAD_ID = '10000000-0000-0000-0000-00000000003a';
export const TEST_SOFTWARE_CDASY6_SAR_ID = '10000000-0000-0000-0000-00000000003b';
export const TEST_SOFTWARE_DASY52_ID = '10000000-0000-0000-0000-00000000003c';
export const TEST_SOFTWARE_SEMCAD_X_P0057_ID = '10000000-0000-0000-0000-00000000003d';
export const TEST_SOFTWARE_DAK_P0058_ID = '10000000-0000-0000-0000-00000000003e';
export const TEST_SOFTWARE_DASY8_MMWAVE_P0059_ID = '10000000-0000-0000-0000-00000000003f';
export const TEST_SOFTWARE_DASY8_MMWAVE_P0060_ID = '10000000-0000-0000-0000-000000000040';
export const TEST_SOFTWARE_CDASY6_MMWAVE_P0061_ID = '10000000-0000-0000-0000-000000000041';
export const TEST_SOFTWARE_NEWAMS_ID = '10000000-0000-0000-0000-000000000042';
export const TEST_SOFTWARE_DASY8_HAC_P0063_ID = '10000000-0000-0000-0000-000000000043';
export const TEST_SOFTWARE_CDASY6_WPT_ID = '10000000-0000-0000-0000-000000000044';
export const TEST_SOFTWARE_DASY8_SAR_P0065_ID = '10000000-0000-0000-0000-000000000045';
export const TEST_SOFTWARE_DASY8_HAC_P0066_ID = '10000000-0000-0000-0000-000000000046';
export const TEST_SOFTWARE_CDASY6_SAR_P0067_ID = '10000000-0000-0000-0000-000000000047';
export const TEST_SOFTWARE_CDASY6_WPT_P0068_ID = '10000000-0000-0000-0000-000000000048';
export const TEST_SOFTWARE_IECSOFT_P0069_ID = '10000000-0000-0000-0000-000000000049';
export const TEST_SOFTWARE_CMS_ID = '10000000-0000-0000-0000-00000000004a';
export const TEST_SOFTWARE_IECSOFT_P0071_ID = '10000000-0000-0000-0000-00000000004b';
export const TEST_SOFTWARE_IECSOFT_P0072_ID = '10000000-0000-0000-0000-00000000004c';

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

// User pair shortcuts
const SAR_PRIMARY = USER_TEST_ENGINEER_SUWON_SAR_ID;
const SAR_SECONDARY = USER_TECHNICAL_MANAGER_SUWON_SAR_ID;
const RF_PRIMARY = USER_TEST_ENGINEER_SUWON_ID;
const RF_SECONDARY = USER_TECHNICAL_MANAGER_SUWON_ID;
const EMC_PRIMARY = USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID;
const EMC_SECONDARY = USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID;

export const TEST_SOFTWARE_SEED_DATA: SeedRow[] = [
  // ── P0001 ~ P0002: SAR ──
  sw(
    TEST_SOFTWARE_DASY5_ID,
    'P0001',
    'DASY5',
    '2.8',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
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
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2014-10-10',
    'SPEAG',
    'SAR',
    'unavailable'
  ),

  // ── P0003 ~ P0006: RF ──
  sw(
    TEST_SOFTWARE_IN_SERVICE_MONITOR_ID,
    'P0003',
    'In Service Monitor Utility',
    null,
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2014-12-01',
    'Keysight',
    'RF',
    'available'
  ),
  sw(
    TEST_SOFTWARE_N7607B_ID,
    'P0004',
    'N7607B Signal Studio',
    '2.0.0.1',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2015-01-18',
    'Keysight',
    'RF',
    'available'
  ),
  sw(
    TEST_SOFTWARE_POWER_PANEL_ID,
    'P0005',
    'Power Panel',
    'R03.09.00',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2015-01-29',
    'Keysight',
    'RF',
    'available'
  ),
  sw(
    TEST_SOFTWARE_CLT_P0006_ID,
    'P0006',
    'CLT',
    '1.2.2',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2015-04-20',
    'UL',
    'EMC',
    'unavailable'
  ),

  // ── P0007: EMC ──
  sw(
    TEST_SOFTWARE_UL_EMC_ID,
    'P0007',
    'UL EMC',
    '9.5',
    'EMC',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2015-06-26',
    'UL',
    'EMC',
    'available'
  ),

  // ── P0008 ~ P0012: RF ──
  sw(
    TEST_SOFTWARE_CLT_P0008_ID,
    'P0008',
    'CLT',
    '1.4.2',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2015-07-27',
    'UL',
    'EMC',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_CALL_BOX_ID,
    'P0009',
    'Call Box Controller',
    '1.6.7',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2015-10-23',
    'UL',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_CLT_P0010_ID,
    'P0010',
    'CLT',
    '1.5.5',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2015-12-23',
    'UL',
    'RF',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_CLT_P0011_ID,
    'P0011',
    'CLT',
    '1.6',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2016-06-14',
    'UL',
    'RF',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_CLT_P0012_ID,
    'P0012',
    'CLT',
    '1.7',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2016-11-21',
    'UL',
    'RF',
    'unavailable'
  ),

  // ── P0013 ~ P0017: RED ──
  sw(
    TEST_SOFTWARE_IECSOFT_V2_5A_ID,
    'P0013',
    'IECSoft V2_5a-U',
    '2.153',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2017-03-13',
    'Newtons4th Ltd',
    'EMC',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_IEC_CONTROL_ID,
    'P0014',
    'IEC.CONTROL',
    '6.0.6',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2017-03-13',
    'EMtest',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_ICD_CONTROL_P0015_ID,
    'P0015',
    'ICD.CONTROL',
    '6.0.1(RC)',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2017-03-13',
    'EMtest',
    'EMC',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_EMC32_AMS32_ID,
    'P0016',
    'EMC32/AMS32/WMS32',
    '10.01.00',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2017-03-13',
    'Rohde&Schwarz',
    'EMC',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_ISO_CONTROL_P0017_ID,
    'P0017',
    'iso.control',
    '5.5.6',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2017-03-13',
    'EMtest',
    'EMC',
    'unavailable'
  ),

  // ── P0018 ~ P0021: RF ──
  sw(
    TEST_SOFTWARE_CLT_P0018_ID,
    'P0018',
    'CLT',
    '2.2',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2017-07-12',
    'UL',
    'RF',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_POWER_VIEWER_PLUS_ID,
    'P0019',
    'Power Viewer Plus',
    'v9.0',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2017-12-18',
    'Rohde&Schwarz',
    'RF',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_CLT_P0020_ID,
    'P0020',
    'CLT',
    '2.4',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2018-02-28',
    'UL',
    'RF',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_CLT_P0021_ID,
    'P0021',
    'CLT',
    '2.5',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2018-11-05',
    'UL',
    'RF',
    'available'
  ),

  // ── P0022: RED ──
  sw(
    TEST_SOFTWARE_EMC32_RED_ID,
    'P0022',
    'EMC32',
    '10.50.40',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2019-09-03',
    'Rohde&Schwarz',
    'EMC',
    'available'
  ),

  // ── P0023 ~ P0029: SAR / RF ──
  sw(
    TEST_SOFTWARE_CDASY6_MMWAVE_ID,
    'P0023',
    'cDASY6 Module mmWave',
    '2.0.2.34',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2020-01-21',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_UXM_5G_ID,
    'P0024',
    'UXM 5G Wireless Test Platform',
    '15.1805.161 8.8261',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2020-02-26',
    'Keysight',
    'RF',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_WITUNES_ID,
    'P0025',
    'WiTunes',
    '1.0.1.2209',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2020-02-26',
    'wainwright instruments',
    'RF',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_DASY5_P0026_ID,
    'P0026',
    'DASY5',
    '52.10.3.151 3',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2020-03-05',
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
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2020-03-05',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_DASY5_P0028_ID,
    'P0028',
    'DASY5',
    '52.10.4.152 7',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2020-07-13',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_SEMCAD_X_P0029_ID,
    'P0029',
    'SEMCAD X',
    '14.6.14 (7483)',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2020-07-13',
    'SPEAG',
    'SAR',
    'unavailable'
  ),

  // ── P0030 ~ P0032: EMC ──
  sw(
    TEST_SOFTWARE_EMC32_EMC_ID,
    'P0030',
    'EMC32',
    '10.60.10',
    'EMC',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2020-07-31',
    'Rohde&Schwarz',
    'Auto',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_EMC32_P0031_ID,
    'P0031',
    'EMC32',
    '10.60.15',
    'EMC',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2020-07-31',
    'Rohde&Schwarz',
    'Auto',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_ISO_CONTROL_P0032_ID,
    'P0032',
    'Iso.control',
    '5.5.8',
    'EMC',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2020-07-31',
    'EMtest',
    'Auto',
    'available'
  ),

  // ── P0033 ~ P0035: SAR ──
  sw(
    TEST_SOFTWARE_EHP_200_TS_ID,
    'P0033',
    'EHP 200-TS',
    '1.93',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2020-08-28',
    'NARDA',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_UL_POWER_VERIF_P0034_ID,
    'P0034',
    'UL Power Verification',
    '2.9',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2020-08-31',
    'UL',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_DASY6_ID,
    'P0035',
    'DASY6',
    '6.14.0.959',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2020-11-11',
    'SPEAG',
    'SAR',
    'unavailable'
  ),

  // ── P0036 ~ P0037: RF ──
  sw(
    TEST_SOFTWARE_UL_IM_ID,
    'P0036',
    'UL iM',
    '1.04',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2020-11-26',
    'UL',
    'RF',
    'available'
  ),
  sw(
    TEST_SOFTWARE_ANTENNA_PORT_ID,
    'P0037',
    'Antenna Port',
    '2020.1.8',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2020-11-26',
    'UL',
    'RF',
    'available'
  ),

  // ── P0038 ~ P0039: RED ──
  sw(
    TEST_SOFTWARE_ICD_CONTROL_ID,
    'P0038',
    'ICD.CONTROL',
    '6.2.5',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2021-01-06',
    'Ametek',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_EMC32_P0039_ID,
    'P0039',
    'EMC32',
    '10.60.10',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2021-01-12',
    'Rohde&Schwarz',
    'EMC',
    'available'
  ),

  // ── P0040: SAR ──
  sw(
    TEST_SOFTWARE_SOUND_CHECK_P0040_ID,
    'P0040',
    'Sound Check',
    '18.1',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2021-03-04',
    'Listen',
    'SAR',
    'unavailable'
  ),

  // ── P0041: RED ──
  sw(
    TEST_SOFTWARE_EMC32_P0041_ID,
    'P0041',
    'EMC32',
    '10.60.20',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2021-03-10',
    'Rohde&Schwarz',
    'Auto',
    'available'
  ),

  // ── P0042: SAR ──
  sw(
    TEST_SOFTWARE_DAK_P0042_ID,
    'P0042',
    'DAK',
    '3.0.0.26',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2021-03-19',
    'SPEAG',
    'SAR',
    'available'
  ),

  // ── P0043: 동일 관리번호 3개 모듈 (SAR, HAC, SAR) ──
  sw(
    TEST_SOFTWARE_DASY8_SAR_P0043_ID,
    'P0043',
    'DASY8 Module SAR',
    '16.0.0.65',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2021-05-14',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_DASY8_HAC_ID,
    'P0043',
    'DASY8 Module HAC',
    '1.2.0.1049',
    'HAC',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2021-05-14',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_DASY8_MMWAVE_ID,
    'P0043',
    'DASY8 Module mmWave',
    '2.4.0.44',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2021-05-14',
    'SPEAG',
    'SAR',
    'unavailable'
  ),

  // ── P0044 ~ P0046: RF ──
  sw(
    TEST_SOFTWARE_CLT_ID,
    'P0044',
    'CLT',
    '3.4.0',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2021-07-26',
    'UL',
    'RF',
    'available'
  ),
  sw(
    TEST_SOFTWARE_IECSOFT_ID,
    'P0045',
    'IECSoft',
    '2_6-U',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2021-09-22',
    'Newtons4th Ltd',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_CLT_P0046_ID,
    'P0046',
    'CLT',
    '1.2.2',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2015-04-20',
    'UL',
    'EMC',
    'unavailable'
  ),

  // ── P0047: RED ──
  sw(
    TEST_SOFTWARE_EMC32_P0047_ID,
    'P0047',
    'EMC32',
    '10.60.00',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2021-11-26',
    'Rohde&Schwarz',
    'RF',
    'available'
  ),

  // ── P0048: RF (existing seed keeps RF mapping despite ledger saying RED) ──
  sw(
    TEST_SOFTWARE_POWER_VIEWER_ID,
    'P0048',
    'Power Viewer',
    'V11.3',
    'RF',
    RF_PRIMARY,
    RF_SECONDARY,
    '2022-02-24',
    'Rohde&Schwarz',
    'RF',
    'available'
  ),

  // ── P0049 ~ P0050: SAR ──
  sw(
    TEST_SOFTWARE_SOUND_CHECK_ID,
    'P0049',
    'Sound Check',
    '19.02.55852',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
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
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2022-04-29',
    'UL',
    'SAR',
    'available',
    false
  ),

  // ── P0051 ~ P0054: SAR ──
  sw(
    TEST_SOFTWARE_SEO_RFA_ID,
    'P0051',
    'SEO-RFA-Software',
    'PS-XSN-100',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2022-05-27',
    'Keysight',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_UL_LTE_POWERMEAS_ID,
    'P0052',
    'UL LTE PowerMeas Tool',
    'V1',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2022-11-28',
    'Innovision',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_DASY5_SEMCAD_ID,
    'P0053',
    'Dasy 5 / SEMCAD X',
    '52.10.4.1535 / 14.6.13',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2022-12-26',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_CDASY6_SAR_ID,
    'P0054',
    'cDASY6 Module SAR',
    '16.2.2.1588',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2023-03-07',
    'SPEAG',
    'SAR',
    'available'
  ),

  // ── P0055: SAR (existing) ──
  sw(
    TEST_SOFTWARE_DASY8_SAR_ID,
    'P0055',
    'DASY8 Module SAR',
    '16.2.2.1588',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2023-01-11',
    'SPEAG',
    'SAR',
    'available'
  ),

  // ── P0056 ~ P0062: SAR ──
  sw(
    TEST_SOFTWARE_DASY52_ID,
    'P0056',
    'DASY52 V5.2',
    '52.10.4.153 5',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2023-03-27',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_SEMCAD_X_P0057_ID,
    'P0057',
    'SEMCAD X',
    '14.6.14 (7501)',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2023-03-27',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_DAK_P0058_ID,
    'P0058',
    'DAK',
    '3.0.6.14',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2023-03-26',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_DASY8_MMWAVE_P0059_ID,
    'P0059',
    'DASY8 Module mmWave',
    '3.0.0.841',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2023-05-24',
    'SPEAG',
    'SAR',
    'unavailable'
  ),
  sw(
    TEST_SOFTWARE_DASY8_MMWAVE_P0060_ID,
    'P0060',
    'DASY8 Module mmWave',
    '3.2.0.1840',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2023-05-25',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_CDASY6_MMWAVE_P0061_ID,
    'P0061',
    'CDASY6 Module mmWave',
    '3.2.2.2358',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2023-09-27',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_NEWAMS_ID,
    'P0062',
    'NewAMS',
    '2.4.6',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2023-10-01',
    'Anritsu',
    'SAR',
    'available'
  ),

  // ── P0063 ~ P0068: SAR ──
  sw(
    TEST_SOFTWARE_DASY8_HAC_P0063_ID,
    'P0063',
    'DASY8 Module HAC',
    '1.2.4.2179',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2024-03-08',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_CDASY6_WPT_ID,
    'P0064',
    'CDASY6 Module WPT',
    '2.6.0.5002',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2024-07-09',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_DASY8_SAR_P0065_ID,
    'P0065',
    'DASY8 Module SAR',
    '16.4.0.5005',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2024-07-15',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_DASY8_HAC_P0066_ID,
    'P0066',
    'DASY8 Module HAC',
    '1.2.6.5211',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2025-02-02',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_CDASY6_SAR_P0067_ID,
    'P0067',
    'cDASY6 Module SAR',
    '16.4.0.5005',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2025-02-04',
    'SPEAG',
    'SAR',
    'available'
  ),
  sw(
    TEST_SOFTWARE_CDASY6_WPT_P0068_ID,
    'P0068',
    'CDASY6 Module WPT',
    '2.8.0.5184',
    'SAR',
    SAR_PRIMARY,
    SAR_SECONDARY,
    '2025-04-04',
    'SPEAG',
    'SAR',
    'available'
  ),

  // ── P0069 ~ P0072: RED ──
  sw(
    TEST_SOFTWARE_IECSOFT_P0069_ID,
    'P0069',
    'IECSoft',
    '2_6-U',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2021-09-22',
    'Newtons4th Ltd',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_CMS_ID,
    'P0070',
    'CMS',
    '4.15',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2021-11-16',
    'EMTEST',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_IECSOFT_P0071_ID,
    'P0071',
    'IECSoft',
    '2_7-U',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2025-04-28',
    'Newtons4th Ltd',
    'EMC',
    'available'
  ),
  sw(
    TEST_SOFTWARE_IECSOFT_P0072_ID,
    'P0072',
    'IECSoft',
    '2_7_1-U',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2025-04-28',
    'Newtons4th Ltd',
    'EMC',
    'available'
  ),

  // ── P0073: RED (existing) ──
  sw(
    TEST_SOFTWARE_ELEKTRA_ID,
    'P0073',
    'ELEKTRA',
    '5.11.1',
    'RED',
    EMC_PRIMARY,
    EMC_SECONDARY,
    '2025-04-24',
    'Rohde&Schwarz',
    'Auto',
    'available'
  ),
];
