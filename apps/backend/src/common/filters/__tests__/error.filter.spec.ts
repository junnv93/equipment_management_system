import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from '../error.filter';
import { AuditService } from '../../../modules/audit/audit.service';
import { AppError, ErrorCode } from '@equipment-management/schemas';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000000';
const USER_UUID = '22222222-2222-4222-8222-222222222222';

/** fire-and-forget 비동기 audit 완료 대기 */
async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

function makeHost(
  request: Record<string, unknown>
): ArgumentsHost & { _status: jest.Mock; _json: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => request,
    }),
    _status: status,
    _json: json,
  } as unknown as ArgumentsHost & { _status: jest.Mock; _json: jest.Mock };
}

function makeRequest(
  overrides: Partial<{
    method: string;
    url: string;
    originalUrl: string;
    params: Record<string, string>;
    user: Record<string, unknown> | undefined;
    __auditLogged: boolean;
    headers: Record<string, string>;
    ip: string;
  }>
): Record<string, unknown> {
  return {
    method: overrides.method ?? 'PATCH',
    url: '/api/equipment',
    originalUrl: overrides.originalUrl ?? '/api/equipment',
    params: overrides.params ?? {},
    user: overrides.user,
    __auditLogged: overrides.__auditLogged,
    headers: overrides.headers ?? {},
    ip: overrides.ip ?? '10.0.0.1',
    route: { path: '/api/equipment/:uuid' },
    ...overrides,
  };
}

describe('GlobalExceptionFilter — 보안 감사 통합', () => {
  let auditService: { create: jest.Mock };
  let filter: GlobalExceptionFilter;
  const mockUser = {
    userId: USER_UUID,
    name: '테스트 사용자',
    roles: ['lab_manager'],
    site: 'site-a',
    teamId: 'team-1',
  };

  beforeEach(() => {
    auditService = { create: jest.fn().mockResolvedValue(undefined) };
    filter = new GlobalExceptionFilter(auditService as unknown as AuditService);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // M-3: Guard-level 403 → audit_logs 기록
  // ────────────────────────────────────────────────────────────────────────────

  it('Guard-level ForbiddenException + valid UUID → auditService.create 1회, access_denied 기록', async () => {
    const request = makeRequest({
      params: { uuid: VALID_UUID },
      user: mockUser,
    });
    const host = makeHost(request);

    filter.catch(new ForbiddenException(), host);
    await flushMicrotasks();

    expect(auditService.create).toHaveBeenCalledTimes(1);
    const dto = auditService.create.mock.calls[0][0];
    expect(dto.action).toBe('access_denied');
    expect(dto.entityId).toBe(VALID_UUID);
    expect(dto.details?.additionalInfo?.triggeredBy).toBe('global-filter');
    expect(dto.userId).toBe(USER_UUID);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // M-4: dedup — Handler-level __auditLogged → filter skip
  // ────────────────────────────────────────────────────────────────────────────

  it('request.__auditLogged === true → auditService.create 0회 (dedup)', async () => {
    const request = makeRequest({
      params: { uuid: VALID_UUID },
      user: mockUser,
      __auditLogged: true,
    });
    const host = makeHost(request);

    filter.catch(new ForbiddenException(), host);
    await flushMicrotasks();

    expect(auditService.create).not.toHaveBeenCalled();
    // 응답은 정상 반환
    expect(host._status).toHaveBeenCalledWith(403);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // M-5: fail-close AppError → audit_logs 기록
  // ────────────────────────────────────────────────────────────────────────────

  it('fail-close AppError (DisposalRejectCommentRequired, 400) → auditService.create 1회', async () => {
    const request = makeRequest({
      params: { uuid: VALID_UUID },
      user: mockUser,
    });
    const host = makeHost(request);
    const err = new AppError(ErrorCode.DisposalRejectCommentRequired, '반려 코멘트 필요');

    filter.catch(err, host);
    await flushMicrotasks();

    expect(auditService.create).toHaveBeenCalledTimes(1);
    const dto = auditService.create.mock.calls[0][0];
    expect(dto.action).toBe('access_denied');
    expect(dto.details?.additionalInfo?.errorCode).toBe(ErrorCode.DisposalRejectCommentRequired);
    expect(dto.details?.additionalInfo?.triggeredBy).toBe('global-filter');
  });

  it('CalibrationPlanInvalidStatusForReject AppError → auditService.create 1회', async () => {
    const request = makeRequest({ params: { uuid: VALID_UUID }, user: mockUser });
    const host = makeHost(request);

    filter.catch(new AppError(ErrorCode.CalibrationPlanInvalidStatusForReject, 'FSM 위반'), host);
    await flushMicrotasks();

    expect(auditService.create).toHaveBeenCalledTimes(1);
  });

  it('VersionConflict AppError (운영 노이즈) → auditService.create 0회', async () => {
    const request = makeRequest({ params: { uuid: VALID_UUID }, user: mockUser });
    const host = makeHost(request);

    filter.catch(new AppError(ErrorCode.VersionConflict, '낙관적 잠금 충돌'), host);
    await flushMicrotasks();

    expect(auditService.create).not.toHaveBeenCalled();
  });

  it('NotFoundException (운영 노이즈) → auditService.create 0회', async () => {
    const request = makeRequest({ params: { uuid: VALID_UUID }, user: mockUser });
    const host = makeHost(request);

    filter.catch(new NotFoundException(), host);
    await flushMicrotasks();

    expect(auditService.create).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // M-6: auditService.create() rejects → 응답 영향 없음 (fire-and-forget)
  // ────────────────────────────────────────────────────────────────────────────

  it('auditService.create rejects → 응답 정상 반환 + Logger.error 1회 호출', async () => {
    auditService.create.mockRejectedValue(new Error('DB 연결 실패'));
    const request = makeRequest({ params: { uuid: VALID_UUID }, user: mockUser });
    const host = makeHost(request);

    // Logger.error spy
    const loggerErrorSpy = jest.spyOn(filter['logger'] as unknown as { error: jest.Mock }, 'error');

    // catch 자체는 에러 없이 완료
    expect(() => filter.catch(new ForbiddenException(), host)).not.toThrow();
    await flushMicrotasks();

    // 응답은 정상 반환 (403)
    expect(host._status).toHaveBeenCalledWith(403);
    // audit 실패는 Logger.error로 기록
    expect(loggerErrorSpy).toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // non-UUID params → SYSTEM_USER_UUID sentinel
  // ────────────────────────────────────────────────────────────────────────────

  it('non-UUID params (formNumber) → SYSTEM_USER_UUID sentinel + path entityName', async () => {
    const request = makeRequest({
      params: { id: 'UL-QP-18-01' },
      user: mockUser,
      originalUrl: '/api/reports/export/form/UL-QP-18-01',
    });
    const host = makeHost(request);

    filter.catch(new ForbiddenException(), host);
    await flushMicrotasks();

    expect(auditService.create).toHaveBeenCalledTimes(1);
    const dto = auditService.create.mock.calls[0][0];
    expect(dto.entityId).toBe(SYSTEM_USER_UUID);
    expect(dto.entityName).toContain('PATCH');
    expect(dto.details?.additionalInfo?.entityIdSentinel).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // request.user 미존재 + 인증 외 코드 → skip
  // ────────────────────────────────────────────────────────────────────────────

  it('request.user 없음 + Forbidden → auditService.create 0회 (운영 노이즈 차단)', async () => {
    const request = makeRequest({ params: { uuid: VALID_UUID }, user: undefined });
    const host = makeHost(request);

    filter.catch(new ForbiddenException(), host);
    await flushMicrotasks();

    expect(auditService.create).not.toHaveBeenCalled();
  });
});
