import { z } from 'zod';
import { DASHBOARD_SCOPES } from '@equipment-management/shared-constants';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * Dashboard scope query schema — SSOT는 `@equipment-management/shared-constants`의 `DASHBOARD_SCOPES`.
 *
 * `getCheckoutsByScope` 엔드포인트의 `scope` 쿼리 파라미터를 Zod enum으로 런타임 검증.
 * 잘못된 값(`scope=invalid`) 전달 시 ZodValidationPipe가 400 응답.
 *
 * 메모리 룰: ZodValidationPipe는 기본 `targets: ['body']`. query 파라미터 검증 시
 * `targets: ['query']` 명시 필수 (이걸 안 하면 @Param 오검증 위험).
 */
export const dashboardScopeSchema = z.object({
  scope: z.enum(DASHBOARD_SCOPES),
});

export type DashboardScopeQuery = z.infer<typeof dashboardScopeSchema>;

export const DashboardScopeValidationPipe = new ZodValidationPipe(dashboardScopeSchema, {
  targets: ['query'],
});
