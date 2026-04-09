import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { SiteScopeInterceptor } from './site-scope.interceptor';
import type { SiteScopedOptions } from '../decorators/site-scoped.decorator';
import {
  EQUIPMENT_DATA_SCOPE,
  CHECKOUT_DATA_SCOPE,
  CALIBRATION_PLAN_DATA_SCOPE,
  CALIBRATION_DATA_SCOPE,
  NON_CONFORMANCE_DATA_SCOPE,
  EQUIPMENT_IMPORT_DATA_SCOPE,
  TEST_SOFTWARE_DATA_SCOPE,
  USER_DATA_SCOPE,
  NOTIFICATION_DATA_SCOPE,
  DISPOSAL_DATA_SCOPE,
  AUDIT_LOG_SCOPE,
} from '@equipment-management/shared-constants';

/** mock ExecutionContext + request 객체 생성 */
function createMockContext(user: Record<string, unknown> | null = {}): {
  context: Record<string, jest.Mock>;
  request: {
    user: Record<string, unknown> | null;
    query: Record<string, string>;
    dataScope?: unknown;
    enforcedScope?: unknown;
  };
} {
  const request: {
    user: Record<string, unknown> | null;
    query: Record<string, string>;
    dataScope?: unknown;
    enforcedScope?: unknown;
  } = { user, query: {} as Record<string, string> };
  const context = {
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
    }),
  };
  return { context, request };
}

/** mock CallHandler 생성 */
function createCallHandler(): { handle: jest.Mock } {
  return { handle: jest.fn().mockReturnValue(of('response')) };
}

/** Reflector mock + SiteScopeInterceptor 인스턴스 생성 */
function createInterceptor(options: SiteScopedOptions | undefined): SiteScopeInterceptor {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(options),
  } as unknown as Reflector;
  return new SiteScopeInterceptor(reflector);
}

describe('SiteScopeInterceptor', () => {
  describe('@SiteScoped 데코레이터 없는 경우', () => {
    it('options가 undefined이면 즉시 스킵하고 handle()을 호출한다', () => {
      const interceptor = createInterceptor(undefined);
      const { context } = createMockContext();
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(callHandler.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('인증되지 않은 요청', () => {
    it('user가 null이면 즉시 스킵한다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
      const { context } = createMockContext(null);
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(callHandler.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('policy 모드 — scope=all', () => {
    it('technical_manager는 EQUIPMENT_DATA_SCOPE에서 all → query 변경 없이 통과한다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['technical_manager'],
        site: 'suwon',
        teamId: 'team-uuid-001',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query).toEqual({});
      expect(callHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('test_engineer는 EQUIPMENT_DATA_SCOPE에서 all → query 변경 없이 통과한다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        site: 'suwon',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query).toEqual({});
      expect(callHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('test_engineer는 EQUIPMENT_DATA_SCOPE에서 all → site 없어도 통과한다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        // site 없음 — all 스코프이므로 무관
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query).toEqual({});
      expect(callHandler.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('policy 모드 — scope=site', () => {
    it('lab_manager는 CALIBRATION_PLAN_DATA_SCOPE에서 site → query.siteId에 user.site를 주입한다', () => {
      const interceptor = createInterceptor({
        policy: CALIBRATION_PLAN_DATA_SCOPE,
        siteField: 'siteId',
      });
      const { context, request } = createMockContext({
        userId: 'u2',
        roles: ['lab_manager'],
        site: 'uiwang',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.siteId).toBe('uiwang');
    });

    it('lab_manager는 EQUIPMENT_DATA_SCOPE에서 site → query.site에 user.site를 주입한다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['lab_manager'],
        site: 'suwon',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.site).toBe('suwon');
    });

    it('scope=site이고 user.site가 없으면 ForbiddenException을 던진다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
      const { context } = createMockContext({
        userId: 'u1',
        roles: ['lab_manager'],
        // site 없음
      });
      const callHandler = createCallHandler();

      expect(() => interceptor.intercept(context as never, callHandler as never)).toThrow(
        ForbiddenException
      );
    });
  });

  describe('policy 모드 — scope=team', () => {
    it('teamId가 있으면 query.teamId에 주입한다', () => {
      const interceptor = createInterceptor({ policy: CHECKOUT_DATA_SCOPE });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        site: 'suwon',
        teamId: 'team-uuid-001',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.teamId).toBe('team-uuid-001');
    });

    it('teamField 커스텀 옵션이 있으면 해당 필드에 주입한다', () => {
      const interceptor = createInterceptor({
        policy: CHECKOUT_DATA_SCOPE,
        teamField: 'requesterTeamId',
      });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        site: 'suwon',
        teamId: 'team-uuid-002',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.requesterTeamId).toBe('team-uuid-002');
      expect(request.query.teamId).toBeUndefined();
    });

    it('teamId가 없으면 resolveDataScope가 none을 반환하여 ForbiddenException을 던진다', () => {
      const interceptor = createInterceptor({ policy: CHECKOUT_DATA_SCOPE });
      const { context } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        site: 'pyeongtaek',
        // teamId 없음 → resolveDataScope returns 'none' (팀 미배정)
      });
      const callHandler = createCallHandler();

      expect(() => interceptor.intercept(context as never, callHandler as never)).toThrow(
        ForbiddenException
      );
    });

    it('teamId도 site도 없으면 ForbiddenException을 던진다', () => {
      const interceptor = createInterceptor({ policy: CHECKOUT_DATA_SCOPE });
      const { context } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        // teamId, site 모두 없음
      });
      const callHandler = createCallHandler();

      expect(() => interceptor.intercept(context as never, callHandler as never)).toThrow(
        ForbiddenException
      );
    });
  });

  describe('policy 모드 — scope=none', () => {
    it('test_engineer는 AUDIT_LOG_SCOPE에서 none → ForbiddenException을 던진다', () => {
      const interceptor = createInterceptor({ policy: AUDIT_LOG_SCOPE });
      const { context } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        site: 'suwon',
      });
      const callHandler = createCallHandler();

      expect(() => interceptor.intercept(context as never, callHandler as never)).toThrow(
        ForbiddenException
      );
    });
  });

  describe('failLoud 모드 + dataScope/enforcedScope attach', () => {
    it('silent (default) 모드는 query 에 silent 주입하면서 동시에 enforcedScope 도 attach 한다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['lab_manager'],
        site: 'suwon',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.site).toBe('suwon'); // silent 주입 (backward compat)
      expect(request.dataScope).toMatchObject({ type: 'site', site: 'suwon' });
      expect(request.enforcedScope).toEqual({ site: 'suwon', teamId: undefined });
      expect(callHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('failLoud 모드는 query mutation 을 생략하고 enforcedScope attach 만 수행한다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE, failLoud: true });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['lab_manager'],
        site: 'suwon',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.site).toBeUndefined(); // silent 주입 안 함
      expect(request.dataScope).toMatchObject({ type: 'site', site: 'suwon' });
      expect(request.enforcedScope).toEqual({ site: 'suwon', teamId: undefined });
      expect(callHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('failLoud + cross-site mismatch → 즉시 ForbiddenException (audit access_denied 통합)', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE, failLoud: true });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['lab_manager'],
        site: 'suwon',
      });
      // 클라이언트가 다른 site 명시
      request.query = { site: 'uiwang' };
      const callHandler = createCallHandler();

      expect(() => interceptor.intercept(context as never, callHandler as never)).toThrow(
        ForbiddenException
      );
      expect(callHandler.handle).not.toHaveBeenCalled();
    });

    it('scope.type === all 도 dataScope/enforcedScope attach (controller 일관성)', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['system_admin'],
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.dataScope).toMatchObject({ type: 'all' });
      expect(request.enforcedScope).toBeDefined();
      expect(callHandler.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('bypassRoles 레거시 모드', () => {
    it('bypassRoles에 포함된 역할이면 query 변경 없이 통과한다', () => {
      const interceptor = createInterceptor({
        bypassRoles: ['lab_manager', 'system_admin'],
      });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['lab_manager'],
        site: 'suwon',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query).toEqual({});
      expect(request.dataScope).toMatchObject({ type: 'all' });
      expect(request.enforcedScope).toBeDefined();
      expect(callHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('bypassRoles에 미포함 역할이면 query.site에 user.site를 주입한다', () => {
      const interceptor = createInterceptor({
        bypassRoles: ['lab_manager', 'system_admin'],
      });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        site: 'pyeongtaek',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.site).toBe('pyeongtaek');
      expect(request.dataScope).toMatchObject({ type: 'site', site: 'pyeongtaek' });
      expect(request.enforcedScope).toMatchObject({ site: 'pyeongtaek' });
    });

    it('bypassRoles에 미포함 역할이고 user.site가 없으면 ForbiddenException을 던진다', () => {
      const interceptor = createInterceptor({
        bypassRoles: ['lab_manager'],
      });
      const { context } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        // site 없음
      });
      const callHandler = createCallHandler();

      expect(() => interceptor.intercept(context as never, callHandler as never)).toThrow(
        ForbiddenException
      );
    });
  });

  // failLoud 마이그레이션 커버리지: 18개 라우트 도메인별 cross-site 거부 정책 검증
  // (각 정책이 enforceScope SSOT 를 통과하는지 확인 — 회귀 방지)
  describe('failLoud cross-site rejection — domain coverage', () => {
    const domainCases: Array<{
      name: string;
      policy: Parameters<typeof createInterceptor>[0];
      siteField?: string;
    }> = [
      { name: 'checkouts', policy: { policy: CHECKOUT_DATA_SCOPE, failLoud: true } },
      {
        name: 'non-conformances',
        policy: { policy: NON_CONFORMANCE_DATA_SCOPE, failLoud: true },
      },
      {
        name: 'equipment-imports',
        policy: { policy: EQUIPMENT_IMPORT_DATA_SCOPE, failLoud: true },
      },
      { name: 'calibration', policy: { policy: CALIBRATION_DATA_SCOPE, failLoud: true } },
      {
        name: 'calibration-plans (siteId)',
        policy: {
          policy: CALIBRATION_PLAN_DATA_SCOPE,
          siteField: 'siteId',
          failLoud: true,
        },
        siteField: 'siteId',
      },
      {
        name: 'test-software',
        policy: { policy: TEST_SOFTWARE_DATA_SCOPE, failLoud: true },
      },
      { name: 'users', policy: { policy: USER_DATA_SCOPE, failLoud: true } },
      {
        name: 'notifications (recipientSite)',
        policy: {
          policy: NOTIFICATION_DATA_SCOPE,
          siteField: 'recipientSite',
          failLoud: true,
        },
        siteField: 'recipientSite',
      },
      { name: 'disposal', policy: { policy: DISPOSAL_DATA_SCOPE, failLoud: true } },
    ];

    domainCases.forEach(({ name, policy, siteField }) => {
      it(`${name}: suwon 사용자가 uiwang 명시 요청 → ForbiddenException`, () => {
        const interceptor = createInterceptor(policy);
        const { context, request } = createMockContext({
          userId: 'u1',
          roles: ['lab_manager'],
          site: 'suwon',
        });
        request.query = { [siteField ?? 'site']: 'uiwang' };
        const callHandler = createCallHandler();

        expect(() => interceptor.intercept(context as never, callHandler as never)).toThrow(
          ForbiddenException
        );
        expect(callHandler.handle).not.toHaveBeenCalled();
      });
    });
  });
});
