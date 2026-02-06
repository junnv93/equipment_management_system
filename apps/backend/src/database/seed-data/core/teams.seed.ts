/**
 * Teams seed data
 * 6 teams across 3 sites (Suwon, Uiwang, Pyeongtaek)
 * Each team maps to a classification code (E, R, W, S, A, P)
 */

import { teams } from '@equipment-management/db/schema';
import { CLASSIFICATION_TO_CODE } from '@equipment-management/schemas';
import {
  TEAM_FCC_EMC_RF_SUWON_ID,
  TEAM_GENERAL_EMC_SUWON_ID,
  TEAM_SAR_SUWON_ID,
  TEAM_AUTOMOTIVE_EMC_SUWON_ID,
  TEAM_GENERAL_RF_UIWANG_ID,
  TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
  TEAM_PLACEHOLDER_ID,
} from '../../utils/uuid-constants';

export const TEAMS_SEED_DATA: (typeof teams.$inferInsert)[] = [
  // =========================================================================
  // Placeholder Team (for test users)
  // =========================================================================
  {
    id: TEAM_PLACEHOLDER_ID,
    name: 'Test Team',
    type: 'GENERAL_EMC',
    site: 'suwon',
    classificationCode: CLASSIFICATION_TO_CODE['general_emc'],
    description: 'Placeholder team for test users (E2E/development)',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // =========================================================================
  // Suwon Site (4 teams)
  // =========================================================================
  {
    id: TEAM_FCC_EMC_RF_SUWON_ID,
    name: 'FCC EMC/RF',
    type: 'FCC_EMC_RF',
    site: 'suwon',
    classificationCode: CLASSIFICATION_TO_CODE['fcc_emc_rf'],
    description: 'FCC EMC/RF Team - Suwon',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: TEAM_GENERAL_EMC_SUWON_ID,
    name: 'General EMC',
    type: 'GENERAL_EMC',
    site: 'suwon',
    classificationCode: CLASSIFICATION_TO_CODE['general_emc'],
    description: 'General EMC Team - Suwon',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: TEAM_SAR_SUWON_ID,
    name: 'SAR',
    type: 'SAR',
    site: 'suwon',
    classificationCode: CLASSIFICATION_TO_CODE['sar'],
    description: 'SAR (Specific Absorption Rate) Team - Suwon',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: TEAM_AUTOMOTIVE_EMC_SUWON_ID,
    name: 'Automotive EMC',
    type: 'AUTOMOTIVE_EMC',
    site: 'suwon',
    classificationCode: CLASSIFICATION_TO_CODE['automotive_emc'],
    description: 'Automotive EMC Team - Suwon',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // =========================================================================
  // Uiwang Site (1 team)
  // =========================================================================
  {
    id: TEAM_GENERAL_RF_UIWANG_ID,
    name: 'General RF',
    type: 'GENERAL_RF',
    site: 'uiwang',
    classificationCode: CLASSIFICATION_TO_CODE['general_rf'],
    description: 'General RF Team - Uiwang',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // =========================================================================
  // Pyeongtaek Site (1 team)
  // =========================================================================
  {
    id: TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
    name: 'Automotive EMC',
    type: 'AUTOMOTIVE_EMC',
    site: 'pyeongtaek',
    classificationCode: CLASSIFICATION_TO_CODE['automotive_emc'],
    description: 'Automotive EMC Team - Pyeongtaek',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
