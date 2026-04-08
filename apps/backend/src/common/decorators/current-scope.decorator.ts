import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../types/auth';

/**
 * @CurrentScope() — `req.dataScope` 를 controller method param 으로 주입
 *
 * `@SiteScoped({ policy })` 데코레이터가 붙은 라우트에서만 사용 가능.
 * 인터셉터가 attach 한 raw `ResolvedDataScope` (label/type 포함) 을 반환.
 *
 * 누락 시 (데코레이터 없이 호출 등) 즉시 500 으로 실패 — fail-fast 보장.
 */
export const CurrentScope = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!req.dataScope) {
    throw new InternalServerErrorException(
      '@CurrentScope() requires @SiteScoped({ policy }) on the route'
    );
  }
  return req.dataScope;
});

/**
 * @CurrentEnforcedScope() — `req.enforcedScope` 를 controller method param 으로 주입
 *
 * 인터셉터가 `enforceScope(query, dataScope)` 결과를 attach. cross-border 검증을
 * 통과한 `{ site?, teamId? }` 만 반환되므로 controller / service 는 그대로
 * SQL WHERE 에 바인딩하면 된다.
 *
 * 누락 시 fail-fast.
 */
export const CurrentEnforcedScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.enforcedScope) {
      throw new InternalServerErrorException(
        '@CurrentEnforcedScope() requires @SiteScoped({ policy }) on the route'
      );
    }
    return req.enforcedScope;
  }
);
