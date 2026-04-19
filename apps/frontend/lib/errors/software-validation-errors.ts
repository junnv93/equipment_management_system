/**
 * 소프트웨어 유효성 확인 에러 코드 SSOT (UL-QP-18-09)
 *
 * 백엔드 서비스와 프론트엔드 UI가 동일한 에러 코드를 사용합니다.
 * i18n 키 매핑: errors.softwareValidation.<code>
 */
export enum SoftwareValidationErrorCode {
  NOT_FOUND = 'SOFTWARE_VALIDATION_NOT_FOUND',
  VERSION_CONFLICT = 'SOFTWARE_VALIDATION_VERSION_CONFLICT',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  SELF_APPROVAL_FORBIDDEN = 'SELF_APPROVAL_FORBIDDEN',
  DUAL_APPROVAL_SAME_PERSON = 'DUAL_APPROVAL_SAME_PERSON_FORBIDDEN',
  NON_EXPORTABLE_STATUS = 'NON_EXPORTABLE_VALIDATION_STATUS',
  MISSING_VALIDATION_ID = 'MISSING_VALIDATION_ID',
  SCOPE_RESOURCE_MISMATCH = 'SCOPE_RESOURCE_MISMATCH',
}

/** 에러 코드로 사용자 메시지 키 반환 (i18n SSOT) */
export function getSoftwareValidationErrorMessageKey(code: string | undefined): string {
  if (!code) return 'errors.softwareValidation.unknown';
  const known = Object.values(SoftwareValidationErrorCode) as string[];
  if (known.includes(code)) {
    return `errors.softwareValidation.${code}`;
  }
  return 'errors.softwareValidation.unknown';
}
