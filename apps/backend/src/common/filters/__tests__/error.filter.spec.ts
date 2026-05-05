import {
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from '../error.filter';
import { AuditService } from '../../../modules/audit/audit.service';
import { AppError, ErrorCode } from '@equipment-management/schemas';
import type { SystemErrorEventProvider } from '../../../modules/dashboard/health-providers/types';

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

// ============================================================================
// system_error_events 캡처 (5xx 전용 + PII deny-list)
// ============================================================================

describe('GlobalExceptionFilter — system_error_events 캡처', () => {
  let auditService: { create: jest.Mock };
  let systemErrorEventProvider: { record: jest.Mock; count24h: jest.Mock };
  let filter: GlobalExceptionFilter;

  const mockUser = {
    userId: USER_UUID,
    name: '테스트',
    roles: ['lab_manager'],
    site: 'site-a',
    teamId: 'team-1',
  };

  beforeEach(() => {
    auditService = { create: jest.fn().mockResolvedValue(undefined) };
    systemErrorEventProvider = {
      record: jest.fn().mockResolvedValue(undefined),
      count24h: jest.fn().mockResolvedValue({ errorCount24h: 0, source: 'system-error-events' }),
    };
    filter = new GlobalExceptionFilter(
      auditService as unknown as AuditService,
      systemErrorEventProvider as SystemErrorEventProvider
    );
  });

  it('5xx (InternalServerError) → record 1회 호출 + statusCode 500', async () => {
    const request = makeRequest({ method: 'POST', user: mockUser });
    const host = makeHost(request);

    filter.catch(new InternalServerErrorException('boom'), host);
    await flushMicrotasks();

    expect(systemErrorEventProvider.record).toHaveBeenCalledTimes(1);
    const event = systemErrorEventProvider.record.mock.calls[0][0];
    expect(event.statusCode).toBe(500);
    expect(event.httpMethod).toBe('POST');
    expect(event.userId).toBe(USER_UUID);
  });

  it('AppError InternalServerError → record 호출 (statusCode 500)', async () => {
    const request = makeRequest({ method: 'GET', user: undefined });
    const host = makeHost(request);

    const err = new AppError(ErrorCode.InternalServerError, 'crash');
    filter.catch(err, host);
    await flushMicrotasks();

    expect(systemErrorEventProvider.record).toHaveBeenCalledTimes(1);
    expect(systemErrorEventProvider.record.mock.calls[0][0].statusCode).toBe(500);
  });

  it('미처리 일반 예외 → record 호출 + statusCode 500', async () => {
    const request = makeRequest({ method: 'PATCH', user: mockUser });
    const host = makeHost(request);

    filter.catch(new Error('uncaught'), host);
    await flushMicrotasks();

    expect(systemErrorEventProvider.record).toHaveBeenCalledTimes(1);
    expect(systemErrorEventProvider.record.mock.calls[0][0].statusCode).toBe(500);
  });

  it('4xx (Forbidden) → record 호출 0회 (5xx-only)', async () => {
    const request = makeRequest({ params: { uuid: VALID_UUID }, user: mockUser });
    const host = makeHost(request);

    filter.catch(new ForbiddenException(), host);
    await flushMicrotasks();

    expect(systemErrorEventProvider.record).not.toHaveBeenCalled();
  });

  it('4xx (NotFound) → record 호출 0회', async () => {
    const request = makeRequest({ params: { uuid: VALID_UUID }, user: mockUser });
    const host = makeHost(request);

    filter.catch(new NotFoundException(), host);
    await flushMicrotasks();

    expect(systemErrorEventProvider.record).not.toHaveBeenCalled();
  });

  it('PII deny-list — record 호출 인자에 body/headers/query 필드 없음', async () => {
    const request = makeRequest({
      method: 'POST',
      user: mockUser,
      headers: { authorization: 'Bearer secret' },
    });
    // body / query 도 의도적으로 채워본다 — 캡처되지 않아야 한다.
    (request as Record<string, unknown>).body = { password: 'leak-me' };
    (request as Record<string, unknown>).query = { token: 'leak-me' };
    const host = makeHost(request);

    filter.catch(new InternalServerErrorException('boom'), host);
    await flushMicrotasks();

    const event = systemErrorEventProvider.record.mock.calls[0][0];
    expect(Object.keys(event)).toEqual(
      expect.arrayContaining([
        'errorCode',
        'httpMethod',
        'normalizedRoute',
        'statusCode',
        'userId',
        'stackHash',
        'stackPreview',
      ])
    );
    expect(event).not.toHaveProperty('body');
    expect(event).not.toHaveProperty('headers');
    expect(event).not.toHaveProperty('query');
    // 인자에 PII 누설이 없는지 직렬화 검사 — 'leak-me' 가 어떤 필드에도 등장하면 안 됨.
    expect(JSON.stringify(event)).not.toContain('leak-me');
    expect(JSON.stringify(event)).not.toContain('Bearer');
  });

  it('record() Promise rejection 은 응답 흐름을 깨지 않음', async () => {
    systemErrorEventProvider.record.mockRejectedValueOnce(new Error('DB down'));

    const request = makeRequest({ method: 'POST', user: mockUser });
    const host = makeHost(request);

    expect(() => filter.catch(new InternalServerErrorException('boom'), host)).not.toThrow();
    await flushMicrotasks();
    // 응답은 정상 처리됨 — 500 status
    expect(host._status).toHaveBeenCalledWith(500);
  });

  it('Provider 미주입 (undefined) 환경에서도 5xx 응답이 정상 처리', () => {
    const filterWithoutProvider = new GlobalExceptionFilter(
      auditService as unknown as AuditService
    );
    const request = makeRequest({ method: 'POST', user: undefined });
    const host = makeHost(request);

    expect(() =>
      filterWithoutProvider.catch(new InternalServerErrorException('boom'), host)
    ).not.toThrow();
    expect(host._status).toHaveBeenCalledWith(500);
  });
});
