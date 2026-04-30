import { Injectable, Logger } from '@nestjs/common';
import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NextStepDescriptorSchema } from '@equipment-management/schemas';

/**
 * FSM Meta Guard Interceptor
 *
 * Checkout 응답에서 meta 필드 완전성을 tap으로 검사.
 * 누락/drift 시 Logger.warn 발행만 하고 예외는 절대 던지지 않음 (defense-in-depth).
 * Sprint 1.3 fail-closed 보안 패턴 보완 — 런타임 감지 계층 추가.
 *
 * 적용 범위: checkouts.controller.ts 클래스 레벨 @UseInterceptors
 * (전역 APP_INTERCEPTOR는 다른 응답에 false-positive warn 유발 → 금지)
 */
@Injectable()
export class FsmMetaGuardInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FsmMetaGuardInterceptor.name);

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap((data) => {
        try {
          this.checkMeta(ctx, data);
        } catch {
          // 검사 로직 자체 오류도 삼킴 — 응답 차단 불가
        }
      })
    );
  }

  private checkMeta(ctx: ExecutionContext, data: unknown): void {
    if (!data || typeof data !== 'object') return;

    const req = ctx.switchToHttp().getRequest<{ url?: string }>();
    const url = req?.url ?? 'unknown';

    // 단건 응답: meta 필드를 갖는 Checkout-like 객체
    if ('id' in (data as object) && 'status' in (data as object)) {
      this.validateSingleMeta(data as Record<string, unknown>, url);
      return;
    }

    // 목록 응답: data 배열을 갖는 경우
    if ('data' in (data as object)) {
      const list = (data as { data?: unknown }).data;
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && typeof item === 'object' && 'id' in item && 'status' in item) {
            this.validateSingleMeta(item as Record<string, unknown>, url);
          }
        }
      }
    }
  }

  private validateSingleMeta(item: Record<string, unknown>, url: string): void {
    const id = (item.id as string | undefined) ?? 'unknown';

    // meta 키 자체 누락
    if (!('meta' in item)) {
      this.logger.warn(`[fsm-meta-drift] route=${url} id=${id} reason=meta_field_missing`);
      return;
    }

    const meta = item.meta;
    if (!meta || typeof meta !== 'object') {
      this.logger.warn(`[fsm-meta-drift] route=${url} id=${id} reason=meta_null_or_not_object`);
      return;
    }

    const metaObj = meta as Record<string, unknown>;

    // availableActions / nextStep 중 하나만 있는 drift
    const hasActions = 'availableActions' in metaObj;
    const hasNextStep = 'nextStep' in metaObj;

    if (hasActions !== hasNextStep) {
      this.logger.warn(
        `[fsm-meta-drift] route=${url} id=${id} reason=partial_meta hasActions=${String(hasActions)} hasNextStep=${String(hasNextStep)}`
      );
    }

    // nextStep schema 검증
    if (hasNextStep) {
      const result = NextStepDescriptorSchema.safeParse(metaObj.nextStep);
      if (!result.success) {
        this.logger.warn(
          `[fsm-meta-drift] route=${url} id=${id} reason=invalid_nextStep issues=${JSON.stringify(result.error.issues.slice(0, 2))}`
        );
      }
    }
  }
}
