/**
 * ============================================================================
 * SSOT: Settings 타입 & 기본값 (Single Source of Truth)
 * ============================================================================
 *
 * 이 파일은 시스템 설정, 표시 설정, 교정 알림 설정의 유일한 소스입니다.
 * 백엔드 DTO와 프론트엔드 폼에서 이 파일의 타입/기본값을 import합니다.
 *
 * 사용처:
 * - Backend: settings.service.ts, system-settings.dto.ts, calibration-settings.dto.ts
 * - Backend: user-preferences.dto.ts
 * - Frontend: SystemSettingsContent.tsx, DisplayPreferencesContent.tsx
 *
 * ============================================================================
 */

import { z } from 'zod';

// ─── System Settings ─────────────────────────────────────────────────────────

export const systemSettingsSchema = z.object({
  auditLogRetentionDays: z.number().int().min(0).max(9999),
  notificationRetentionDays: z.number().int().min(30).max(365),
  notificationHighGraceDays: z.number().int().min(0).max(365),
  notificationMediumUnreadGraceDays: z.number().int().min(0).max(180),
  maintenanceMessage: z.string().max(500),
});

export type SystemSettings = z.infer<typeof systemSettingsSchema>;

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  auditLogRetentionDays: 0, // 0 = 무제한
  notificationRetentionDays: 90,
  notificationHighGraceDays: 90, // 실질 보존: 90 + 90 = 180일
  notificationMediumUnreadGraceDays: 30, // 실질 보존: 90 + 30 = 120일
  maintenanceMessage: '',
};

// ─── Display Preferences ─────────────────────────────────────────────────────

export const ITEMS_PER_PAGE_OPTIONS = ['10', '20', '50'] as const;
export const DATE_FORMAT_OPTIONS = ['YYYY-MM-DD', 'YYYY.MM.DD'] as const;
export const EQUIPMENT_SORT_OPTIONS = ['managementNumber', 'name', 'updatedAt'] as const;

export const displayPreferencesSchema = z.object({
  itemsPerPage: z.enum(ITEMS_PER_PAGE_OPTIONS),
  dateFormat: z.enum(DATE_FORMAT_OPTIONS),
  defaultEquipmentSort: z.enum(EQUIPMENT_SORT_OPTIONS),
  showRetiredEquipment: z.boolean(),
});

export type DisplayPreferences = z.infer<typeof displayPreferencesSchema>;

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  itemsPerPage: '20',
  dateFormat: 'YYYY-MM-DD',
  defaultEquipmentSort: 'managementNumber',
  showRetiredEquipment: false,
};

// ─── Calibration Alert Settings ──────────────────────────────────────────────

export const DEFAULT_CALIBRATION_ALERT_DAYS = [30, 7, 0];
