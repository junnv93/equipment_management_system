import { SetMetadata } from '@nestjs/common';

/**
 * @SkipAudit 데코레이터
 *
 * POST/PATCH/DELETE 엔드포인트의 기본 감사 로그를 명시적으로 건너뛰기 위한 데코레이터.
 *
 * 용도:
 * - 읽기 전용 작업이지만 POST/PATCH를 사용하는 경우
 * - 민감한 정보가 포함되어 감사 로그에 기록하면 안 되는 경우
 * - 너무 빈번하게 호출되어 감사 로그가 과도하게 쌓이는 경우
 *
 * 참고:
 * - GET 엔드포인트는 기본적으로 감사하지 않으므로 이 데코레이터가 필요 없습니다.
 * - @AuditLog()와 함께 사용하면 @SkipAudit()가 우선합니다.
 *
 * @example
 * ```typescript
 * @Post('health-check')
 * @SkipAudit()
 * async healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const SKIP_AUDIT_KEY = 'skipAudit';
export const SkipAudit = (): ReturnType<typeof SetMetadata> => SetMetadata(SKIP_AUDIT_KEY, true);
