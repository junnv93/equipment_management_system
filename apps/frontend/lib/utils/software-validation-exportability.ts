import { ValidationStatusValues, type ValidationStatus } from '@equipment-management/schemas';

// allowlist — 백엔드 EXPORTABLE_STATUSES 패턴과 방향 통일
// (software-validation-export-data.service.ts:56)
// 신규 ValidationStatus 추가 시 이 목록을 명시적으로 갱신해야 export 허용
export const EXPORTABLE_VALIDATION_STATUSES: readonly ValidationStatus[] = [
  ValidationStatusValues.SUBMITTED,
  ValidationStatusValues.APPROVED,
  ValidationStatusValues.QUALITY_APPROVED,
] as const;

export function isValidationExportable(status: ValidationStatus): boolean {
  return EXPORTABLE_VALIDATION_STATUSES.includes(status);
}
