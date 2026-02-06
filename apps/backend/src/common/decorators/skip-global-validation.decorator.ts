import { SetMetadata } from '@nestjs/common';

/**
 * 전역 ValidationPipe 건너뛰기 데코레이터
 *
 * Single Source of Truth 원칙:
 * - Zod 스키마를 사용하는 엔드포인트는 이 데코레이터를 사용하여
 *   전역 ValidationPipe와의 충돌을 방지합니다.
 *
 * 사용법:
 * ```typescript
 * @SkipGlobalValidation()
 * @UsePipes(ZodValidationPipe)
 * update(@Body() dto: UpdateDto) { ... }
 * ```
 */
export const SKIP_GLOBAL_VALIDATION_KEY = 'skipGlobalValidation';
export const SkipGlobalValidation = (): MethodDecorator =>
  SetMetadata(SKIP_GLOBAL_VALIDATION_KEY, true);
