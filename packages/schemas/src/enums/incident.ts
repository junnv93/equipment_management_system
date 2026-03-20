import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 장비 사고/이벤트 유형 열거형
 *
 * 표준 유형값 (소문자 + 언더스코어):
 * - damage: 손상
 * - malfunction: 오작동
 * - change: 변경
 * - repair: 수리
 */
export const INCIDENT_TYPE_VALUES = [
  'damage', // 손상
  'malfunction', // 오작동
  'change', // 변경
  'repair', // 수리
  'calibration_overdue', // 교정 기한 초과
] as const;

export const IncidentTypeEnum = z.enum(INCIDENT_TYPE_VALUES as readonly [string, ...string[]]);
export type IncidentType = z.infer<typeof IncidentTypeEnum>;
