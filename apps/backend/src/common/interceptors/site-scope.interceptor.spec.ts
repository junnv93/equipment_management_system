import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { SiteScopeInterceptor } from './site-scope.interceptor';
import type { SiteScopedOptions } from '../decorators/site-scoped.decorator';
import {
  EQUIPMENT_DATA_SCOPE,
  CHECKOUT_DATA_SCOPE,
  CALIBRATION_PLAN_DATA_SCOPE,
  AUDIT_LOG_SCOPE,
} from '@equipment-management/shared-constants';

/** mock ExecutionContext + request 객체 생성 */
function createMockContext(user: Record<string, unknown> | null = {}) {
  const request = { user, query: {} as Record<string, string> };
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
function createCallHandler() {
  return { handle: jest.fn().mockReturnValue(of('response')) };
}

/** Reflector mock + SiteScopeInterceptor 인스턴스 생성 */
function createInterceptor(options: SiteScopedOptions | undefined) {
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

    it('lab_manager는 CALIBRATION_PLAN_DATA_SCOPE에서 all → query 변경 없이 통과한다', () => {
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

      expect(request.query).toEqual({});
    });
  });

  describe('policy 모드 — scope=site', () => {
    it('test_engineer는 EQUIPMENT_DATA_SCOPE에서 site → query.site에 user.site를 주입한다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        site: 'suwon',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.site).toBe('suwon');
    });

    it('siteField 커스텀 옵션이 있으면 해당 필드에 주입한다', () => {
      const interceptor = createInterceptor({
        policy: CALIBRATION_PLAN_DATA_SCOPE,
        siteField: 'siteId',
      });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        site: 'uiwang',
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.siteId).toBe('uiwang');
      expect(request.query.site).toBeUndefined();
    });

    it('scope=site이고 user.site가 없으면 ForbiddenException을 던진다', () => {
      const interceptor = createInterceptor({ policy: EQUIPMENT_DATA_SCOPE });
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

    it('teamId가 없고 site가 있으면 siteField로 폴백한다', () => {
      const interceptor = createInterceptor({ policy: CHECKOUT_DATA_SCOPE });
      const { context, request } = createMockContext({
        userId: 'u1',
        roles: ['test_engineer'],
        site: 'pyeongtaek',
        // teamId 없음
      });
      const callHandler = createCallHandler();

      interceptor.intercept(context as never, callHandler as never);

      expect(request.query.site).toBe('pyeongtaek');
      expect(request.query.teamId).toBeUndefined();
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
});
