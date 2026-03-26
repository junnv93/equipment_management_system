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

// ─── Locale ───────────────────────────────────────────────────────────────────

export const SUPPORTED_LOCALES = ['ko', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'ko';

// ─── System Settings ─────────────────────────────────────────────────────────

export const systemSettingsSchema = z.object({
  auditLogRetentionDays: z.number().int().min(0).max(9999),
  notificationRetentionDays: z.number().int().min(30).max(365),
  notificationHighGraceDays: z.number().int().min(0).max(365),
  notificationMediumUnreadGraceDays: z.number().int().min(0).max(180),
  documentRetentionDays: z.number().int().min(1).max(365),
  maintenanceMessage: z.string().max(500),
});

export type SystemSettings = z.infer<typeof systemSettingsSchema>;

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  auditLogRetentionDays: 0, // 0 = 무제한
  notificationRetentionDays: 90,
  notificationHighGraceDays: 90, // 실질 보존: 90 + 90 = 180일
  notificationMediumUnreadGraceDays: 30, // 실질 보존: 90 + 30 = 120일
  documentRetentionDays: 30, // soft-delete 후 물리 파일 보존 기간
  maintenanceMessage: '',
};

// ─── Display Preferences ─────────────────────────────────────────────────────

export const ITEMS_PER_PAGE_OPTIONS = ['10', '20', '50'] as const;
export const DATE_FORMAT_OPTIONS = ['YYYY-MM-DD', 'YYYY.MM.DD'] as const;
export const EQUIPMENT_SORT_OPTIONS = ['managementNumber', 'name', 'updatedAt'] as const;

export const displayPreferencesSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  itemsPerPage: z.enum(ITEMS_PER_PAGE_OPTIONS),
  dateFormat: z.enum(DATE_FORMAT_OPTIONS),
  defaultEquipmentSort: z.enum(EQUIPMENT_SORT_OPTIONS),
  showRetiredEquipment: z.boolean(),
});

export type DisplayPreferences = z.infer<typeof displayPreferencesSchema>;

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  locale: 'ko',
  itemsPerPage: '20',
  dateFormat: 'YYYY-MM-DD',
  defaultEquipmentSort: 'managementNumber',
  showRetiredEquipment: false,
};

// ─── Calibration Alert Settings ──────────────────────────────────────────────

export const DEFAULT_CALIBRATION_ALERT_DAYS = [30, 7, 1, 0];

// 교정 D-day 선택 가능 옵션 (SSOT)
// 프론트엔드 캘리브레이션 설정 칩 선택지와 동일해야 함
export const CALIBRATION_ALERT_DAYS_OPTIONS = [0, 1, 3, 7, 14, 30, 60, 90] as const;

// ─── Settings API Response Types ────────────────────────────────────────────

export interface CalibrationAlertSettingsResponse {
  alertDays: number[];
}
