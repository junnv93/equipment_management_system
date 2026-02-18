import {
  EquipmentErrorCode,
  ApiError,
  mapBackendErrorCode,
  isConflictError,
  isRetryableError,
  isAuthError,
  httpStatusToErrorCode,
} from '../equipment-errors';

// ──────────────────────────────────────────
//  mapBackendErrorCode
// ──────────────────────────────────────────
describe('mapBackendErrorCode()', () => {
  it('VERSION_CONFLICT → EquipmentErrorCode.VERSION_CONFLICT', () => {
    expect(mapBackendErrorCode('VERSION_CONFLICT')).toBe(EquipmentErrorCode.VERSION_CONFLICT);
  });

  it('소문자도 대소문자 무시하여 매핑', () => {
    expect(mapBackendErrorCode('version_conflict')).toBe(EquipmentErrorCode.VERSION_CONFLICT);
  });

  it('DUPLICATE_MANAGEMENT_NUMBER → 정확한 코드로 매핑', () => {
    expect(mapBackendErrorCode('DUPLICATE_MANAGEMENT_NUMBER')).toBe(
      EquipmentErrorCode.DUPLICATE_MANAGEMENT_NUMBER
    );
  });

  it('FORBIDDEN → PERMISSION_DENIED로 매핑', () => {
    expect(mapBackendErrorCode('FORBIDDEN')).toBe(EquipmentErrorCode.PERMISSION_DENIED);
  });

  it('undefined → UNKNOWN_ERROR', () => {
    expect(mapBackendErrorCode(undefined)).toBe(EquipmentErrorCode.UNKNOWN_ERROR);
  });

  it('알 수 없는 코드 → UNKNOWN_ERROR', () => {
    expect(mapBackendErrorCode('UNKNOWN_CUSTOM_CODE')).toBe(EquipmentErrorCode.UNKNOWN_ERROR);
  });
});

// ──────────────────────────────────────────
//  isConflictError
// ──────────────────────────────────────────
describe('isConflictError()', () => {
  it('ApiError VERSION_CONFLICT → true', () => {
    const err = new ApiError('충돌', EquipmentErrorCode.VERSION_CONFLICT, 409);
    expect(isConflictError(err)).toBe(true);
  });

  it('ApiError statusCode 409 → true', () => {
    const err = new ApiError('중복', EquipmentErrorCode.DUPLICATE_ERROR, 409);
    expect(isConflictError(err)).toBe(true);
  });

  it('ApiError 404 → false', () => {
    const err = new ApiError('없음', EquipmentErrorCode.NOT_FOUND, 404);
    expect(isConflictError(err)).toBe(false);
  });

  it('plain object { code: VERSION_CONFLICT } → true', () => {
    expect(isConflictError({ code: 'VERSION_CONFLICT' })).toBe(true);
  });

  it('plain object { statusCode: 409 } → true', () => {
    expect(isConflictError({ statusCode: 409 })).toBe(true);
  });

  it('null → false', () => {
    expect(isConflictError(null)).toBe(false);
  });

  it('string → false', () => {
    expect(isConflictError('error')).toBe(false);
  });
});

// ──────────────────────────────────────────
//  isRetryableError
// ──────────────────────────────────────────
describe('isRetryableError()', () => {
  it.each([
    EquipmentErrorCode.NETWORK_ERROR,
    EquipmentErrorCode.TIMEOUT_ERROR,
    EquipmentErrorCode.SERVER_ERROR,
  ])('%s → true', (code) => {
    expect(isRetryableError(new ApiError('err', code))).toBe(true);
  });

  it('VERSION_CONFLICT → false (재시도 불가)', () => {
    expect(isRetryableError(new ApiError('충돌', EquipmentErrorCode.VERSION_CONFLICT))).toBe(false);
  });

  it('non-ApiError → false', () => {
    expect(isRetryableError(new Error('generic'))).toBe(false);
  });
});

// ──────────────────────────────────────────
//  isAuthError
// ──────────────────────────────────────────
describe('isAuthError()', () => {
  it('UNAUTHORIZED → true', () => {
    expect(isAuthError(new ApiError('인증 필요', EquipmentErrorCode.UNAUTHORIZED))).toBe(true);
  });

  it('SESSION_EXPIRED → true', () => {
    expect(isAuthError(new ApiError('세션 만료', EquipmentErrorCode.SESSION_EXPIRED))).toBe(true);
  });

  it('PERMISSION_DENIED → false', () => {
    expect(isAuthError(new ApiError('권한 없음', EquipmentErrorCode.PERMISSION_DENIED))).toBe(
      false
    );
  });
});

// ──────────────────────────────────────────
//  httpStatusToErrorCode
// ──────────────────────────────────────────
describe('httpStatusToErrorCode()', () => {
  it.each([
    [400, EquipmentErrorCode.VALIDATION_ERROR],
    [401, EquipmentErrorCode.UNAUTHORIZED],
    [403, EquipmentErrorCode.PERMISSION_DENIED],
    [404, EquipmentErrorCode.NOT_FOUND],
    [409, EquipmentErrorCode.DUPLICATE_ERROR],
    [500, EquipmentErrorCode.SERVER_ERROR],
  ])('HTTP %i → %s', (status, expected) => {
    expect(httpStatusToErrorCode(status)).toBe(expected);
  });

  it('알 수 없는 상태 코드 → UNKNOWN_ERROR', () => {
    expect(httpStatusToErrorCode(418)).toBe(EquipmentErrorCode.UNKNOWN_ERROR);
  });
});

// ──────────────────────────────────────────
//  ApiError
// ──────────────────────────────────────────
describe('ApiError', () => {
  it('getErrorInfo()가 VERSION_CONFLICT 한국어 정보를 반환한다', () => {
    const err = new ApiError('충돌', EquipmentErrorCode.VERSION_CONFLICT);
    const info = err.getErrorInfo();
    expect(info.title).toBe('데이터 충돌');
    expect(info.severity).toBe('warning');
  });

  it('getUserMessage()가 인스턴스 message를 우선 반환한다', () => {
    const err = new ApiError('커스텀 메시지', EquipmentErrorCode.VERSION_CONFLICT);
    expect(err.getUserMessage()).toBe('커스텀 메시지');
  });

  it('name이 ApiError이다', () => {
    const err = new ApiError('err', EquipmentErrorCode.SERVER_ERROR);
    expect(err.name).toBe('ApiError');
  });
});
