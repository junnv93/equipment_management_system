import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from '../../modules/audit/audit.service';
import type { AuditLogMetadata } from '../decorators/audit-log.decorator';
import { AUDIT_LOG_KEY } from '../decorators/audit-log.decorator';
import { SKIP_AUDIT_KEY } from '../decorators/skip-audit.decorator';

/**
 * AuditInterceptor — access_denied path coverage
 *
 * 핵심 검증 (cross-site probing 추적):
 * 1. ForbiddenException 발생 시 audit_logs 에 access_denied 레코드 기록
 * 2. params.uuid 가 valid UUID 일 때만 DB 기록, 아니면 logger.warn fallback
 * 3. 5xx/404 등 다른 에러는 audit 안 함 (운영 노이즈 회피)
 * 4. 원본 에러는 그대로 전파 (audit 실패가 응답에 영향 없음)
 */
describe('AuditInterceptor — access_denied path', () => {
  const VALID_UUID = '11111111-1111-4111-8111-111111111111';
  const USER_UUID = '22222222-2222-4222-8222-222222222222';
  const TEAM_UUID = '33333333-3333-4333-8333-333333333333';

  let auditService: { create: jest.Mock };
  let reflector: { get: jest.Mock };
  let configService: { get: jest.Mock };
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    auditService = { create: jest.fn().mockResolvedValue(undefined) };
    reflector = { get: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('') };
    interceptor = new AuditInterceptor(
      reflector as unknown as Reflector,
      auditService as unknown as AuditService,
      configService as unknown as ConfigService
    );
  });

  function makeContext(opts: {
    method?: string;
    params?: Record<string, string>;
    user?: Record<string, unknown> | undefined;
    metadata?: AuditLogMetadata;
    skip?: boolean;
  }) {
    const request = {
      method: opts.method ?? 'GET',
      url: '/api/test',
      originalUrl: '/api/test',
      params: opts.params ?? {},
      body: {},
      query: {},
      headers: {},
      user: opts.user,
      ip: '10.0.0.1',
    };
    reflector.get.mockImplementation((key: string) => {
      if (key === SKIP_AUDIT_KEY) return opts.skip ?? false;
      if (key === AUDIT_LOG_KEY) return opts.metadata;
      return undefined;
    });
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
    } as never;
  }

  /**
   * tap.error 의 비동기 logAccessDeniedAsync(.catch) 가 microtask 큐에서
   * 끝날 때까지 대기. firstValueFrom 으로 원본 throw 만 받으면 동기적으로
   * 검증할 수 없으므로 setImmediate 한 틱 양보.
   */
  async function flushMicrotasks() {
    await new Promise((resolve) => setImmediate(resolve));
  }

  it('Forbidden + valid params.uuid → audit_logs 에 access_denied 기록', async () => {
    const metadata: AuditLogMetadata = {
      action: 'export',
      entityType: 'report',
      entityIdPath: 'response.id',
    };
    const ctx = makeContext({
      method: 'GET',
      params: { uuid: VALID_UUID },
      user: {
        userId: USER_UUID,
        name: 'TM Suwon',
        roles: ['technical_manager'],
        site: 'suwon',
        teamId: TEAM_UUID,
      },
      metadata,
    });
    const callHandler = {
      handle: () => throwError(() => new ForbiddenException('cross-site denied')),
    };

    await expect(
      firstValueFrom(interceptor.intercept(ctx, callHandler as never))
    ).rejects.toBeInstanceOf(ForbiddenException);
    await flushMicrotasks();

    expect(auditService.create).toHaveBeenCalledTimes(1);
    const dto = auditService.create.mock.calls[0][0];
    expect(dto).toMatchObject({
      action: 'access_denied',
      entityType: 'report',
      entityId: VALID_UUID,
      userId: USER_UUID,
      userSite: 'suwon',
      userTeamId: TEAM_UUID,
    });
    expect(dto.details.additionalInfo.deniedAction).toBe('export');
    expect(dto.details.additionalInfo.reason).toContain('cross-site denied');
  });

  it('Forbidden + non-UUID params(formNumber) → SYSTEM_USER_UUID sentinel + path-based entityName 으로 DB 기록', async () => {
    const ctx = makeContext({
      method: 'GET',
      params: { formNumber: 'UL-QP-18-04' },
      user: { userId: USER_UUID, name: 'X', roles: ['test_engineer'], site: 'suwon' },
      metadata: { action: 'export', entityType: 'report' },
    });
    const callHandler = {
      handle: () => throwError(() => new ForbiddenException('site mismatch')),
    };

    await expect(
      firstValueFrom(interceptor.intercept(ctx, callHandler as never))
    ).rejects.toBeInstanceOf(ForbiddenException);
    await flushMicrotasks();

    // 이전 동작: logger.warn fallback (DB 미기록 → SQL 분석 불가)
    // 새 동작: sentinel + path-based entityName 으로 audit_logs 에 정규 기록
    expect(auditService.create).toHaveBeenCalledTimes(1);
    const dto = (auditService.create as jest.Mock).mock.calls[0][0];
    expect(dto).toMatchObject({
      action: 'access_denied',
      entityType: 'report',
      entityId: '00000000-0000-0000-0000-000000000000', // SYSTEM_USER_UUID sentinel
    });
    expect(dto.entityName).toContain('GET');
    expect(dto.details.additionalInfo.entityIdSentinel).toBe(true);
    expect(dto.details.additionalInfo.reason).toContain('site mismatch');
  });

  it('NotFoundException 등 403 외 에러는 audit 안 함', async () => {
    const ctx = makeContext({
      params: { uuid: VALID_UUID },
      user: { userId: USER_UUID, name: 'X', roles: ['admin'] },
      metadata: { action: 'update', entityType: 'equipment' },
    });
    const callHandler = {
      handle: () => throwError(() => new NotFoundException('not found')),
    };

    await expect(
      firstValueFrom(interceptor.intercept(ctx, callHandler as never))
    ).rejects.toBeInstanceOf(NotFoundException);
    await flushMicrotasks();

    expect(auditService.create).not.toHaveBeenCalled();
  });

  it('성공 응답 경로는 기존대로 정상 audit (회귀 방지)', async () => {
    const ctx = makeContext({
      method: 'POST',
      params: {},
      user: { userId: USER_UUID, name: 'X', roles: ['admin'] },
      metadata: { action: 'create', entityType: 'equipment', entityIdPath: 'response.id' },
    });
    const callHandler = { handle: () => of({ id: VALID_UUID, name: 'New' }) };

    await firstValueFrom(interceptor.intercept(ctx, callHandler as never));
    await flushMicrotasks();

    expect(auditService.create).toHaveBeenCalledTimes(1);
    expect(auditService.create.mock.calls[0][0].action).toBe('create');
  });
});
