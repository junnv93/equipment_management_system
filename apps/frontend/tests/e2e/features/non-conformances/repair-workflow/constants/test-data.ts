/**
 * Test data constants for NC-Repair workflow E2E tests
 *
 * SSOT: Import equipment IDs, NC IDs, and user IDs from backend constants
 * Never hardcode UUIDs or enum values in test files
 */

// Equipment IDs for testing
// Using Power Meter (non_conforming) as primary test equipment
export const TEST_EQUIPMENT_ID = 'eeee1004-0004-4004-8004-000000000004'; // EQUIP_POWER_METER_SUW_E_ID

// Alternative test equipment (available state)
export const TEST_EQUIPMENT_AVAILABLE_ID = 'eeee1001-0001-4001-8001-000000000001'; // EQUIP_SPECTRUM_ANALYZER_SUW_E_ID

// Non-Conformance IDs for testing
// NC_001: malfunction, open, no repair link - used for repair guidance card tests
export const NC_WITHOUT_REPAIR_ID = 'aaaa0001-0001-0001-0001-000000000001';

// NC_002: malfunction, analyzing, no repair link - alternative for repair guidance
export const NC_ANALYZING_NO_REPAIR_ID = 'aaaa0002-0002-0002-0002-000000000002';

// NC_006: calibration_failure, corrected, linked to REPAIR_001 - used for success message tests
export const NC_WITH_REPAIR_ID = 'aaaa0006-0006-0006-0006-000000000006';

// NC_004: malfunction, closed, linked to REPAIR_004 - used for closed state tests
export const NC_CLOSED_ID = 'aaaa0004-0004-0004-0004-000000000004';

// NC_003: damage, analyzing - used for damage type workflow
export const NC_DAMAGE_ANALYZING_ID = 'aaaa0003-0003-0003-0003-000000000003';

// NC_007: damage, corrected, linked to REPAIR_002
export const NC_DAMAGE_CORRECTED_ID = 'aaaa0007-0007-0007-0007-000000000007';

// User IDs
export const TEST_ENGINEER_ID = '00000000-0000-0000-0000-000000000001';
export const TECHNICAL_MANAGER_ID = '00000000-0000-0000-0000-000000000002';
export const LAB_MANAGER_ID = '00000000-0000-0000-0000-000000000003';

// Equipment for workflow testing (available state)
export const WORKFLOW_TEST_EQUIPMENT_ID = 'eeee1003-0003-4003-8003-000000000003'; // EQUIP_NETWORK_ANALYZER_SUW_E_ID

import { BASE_URLS } from '../../../../shared/constants/shared-test-data';
// Base URLs
export const FRONTEND_BASE_URL = BASE_URLS.FRONTEND;
export const BACKEND_BASE_URL = BASE_URLS.BACKEND;

/**
 * Expected dropdown label patterns (SSOT from schemas)
 *
 * Format: [유형라벨] 원인... (날짜)
 * Example: [오작동] 측정값 불안정성 발생 (2026-01-27)
 */
export const NC_DROPDOWN_LABEL_PATTERN = /\[.+\].+\(\d{4}-\d{2}-\d{2}\)/;

/**
 * Test timeouts (milliseconds)
 */
export const TIMEOUTS = {
  DIALOG_ANIMATION: 500,
  UI_UPDATE: 1000,
  API_RESPONSE: 5000,
  NAVIGATION: 10000,
} as const;

/**
 * CSS class patterns for UI element identification
 */
export const UI_CLASSES = {
  WARNING_CARD: '.bg-yellow-50, .bg-yellow-950',
  SUCCESS_TEXT: '.text-green-700, .text-green-400',
  INFO_CARD: '.bg-blue-50, .bg-blue-950',
  DIALOG: '[role="dialog"]',
  TOAST: '.toast, [role="status"]',
  COMBOBOX: '[role="combobox"], [role="listbox"], [role="menu"]',
} as const;
