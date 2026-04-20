import { ValidationStatusValues, type ValidationStatus } from '@equipment-management/schemas';

// 유효성 확인서(UL-QP-18-09) export 불가 상태
// 백엔드 EXPORTABLE_STATUSES = ['submitted', 'approved', 'quality_approved'] 정책과 동기화
export const NON_EXPORTABLE_VALIDATION_STATUSES: readonly ValidationStatus[] = [
  ValidationStatusValues.DRAFT,
  ValidationStatusValues.REJECTED,
] as const;

export function isValidationExportable(status: ValidationStatus): boolean {
  return !NON_EXPORTABLE_VALIDATION_STATUSES.includes(status);
}
