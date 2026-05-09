import { ErrorCode } from '@equipment-management/schemas';
import { mapBackendErrorCode, mapUserErrorToToast } from '../user-errors';

const t = (key: string) => `t:${key}`;

describe('user error routing', () => {
  it('maps backend ErrorCode values to users i18n keys', () => {
    expect(mapBackendErrorCode(ErrorCode.UserNotFound)).toBe('errors.notFound');
    expect(mapBackendErrorCode(ErrorCode.UserEmailAlreadyExists)).toBe('errors.emailAlreadyExists');
    expect(mapBackendErrorCode(ErrorCode.UserNoRoleChangePermission)).toBe(
      'errors.noRoleChangePermission'
    );
  });

  it('maps backend code case-insensitively through the same table', () => {
    expect(mapBackendErrorCode('user_team_scope_only')).toBe('errors.teamScopeOnly');
  });

  it('closes unknown and undefined backend codes with an existing fallback key', () => {
    expect(mapBackendErrorCode(undefined)).toBe('errors.unknown');
    expect(mapBackendErrorCode('UNKNOWN_CUSTOM_CODE')).toBe('errors.unknown');
  });

  it('uses the same routing table for toast descriptions', () => {
    expect(mapUserErrorToToast({ code: ErrorCode.UserTeamScopeOnly }, t).description).toBe(
      't:errors.teamScopeOnly'
    );
  });

  it('falls back to errors.genericError i18n key for unmapped errors (ADR-0008)', () => {
    expect(mapUserErrorToToast(new Error('custom backend message'), t).description).toBe(
      'errors.genericError'
    );
  });
});
