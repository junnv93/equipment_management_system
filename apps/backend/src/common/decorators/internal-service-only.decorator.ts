import { applyDecorators, UseGuards } from '@nestjs/common';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { InternalApiKeyGuard } from '../guards/internal-api-key.guard';

/**
 * @InternalServiceOnly 데코레이터
 *
 * 서비스 간 통신(예: NextAuth SSR → NestJS)에만 허용되는 엔드포인트를 선언합니다.
 *
 * 적용 효과:
 * - @Public(): 글로벌 JwtAuthGuard 우회 (외부 클라이언트 JWT 없음)
 * - @UseGuards(InternalApiKeyGuard): X-Internal-Api-Key 헤더로 서비스 신원 검증
 *
 * @Public() + @UseGuards(InternalApiKeyGuard)를 직접 조합하는 것과 동일하지만,
 * 의도("내부 서비스 전용")를 명시적으로 표현하여 코드 리뷰어가 보안 판단을 쉽게 합니다.
 *
 * 보안 전제:
 * - INTERNAL_API_KEY는 32자 이상 랜덤 값 (env.validation.ts 강제)
 * - 이중 키 로테이션 지원 (INTERNAL_API_KEY_PREVIOUS)
 *
 * @example
 * ```typescript
 * @InternalServiceOnly()
 * @Post('sync')
 * @UsePipes(CreateUserValidationPipe)
 * async syncUser(@Body() dto: CreateUserDto) { ... }
 * ```
 */
export const InternalServiceOnly = (): MethodDecorator & ClassDecorator =>
  applyDecorators(Public(), UseGuards(InternalApiKeyGuard));
