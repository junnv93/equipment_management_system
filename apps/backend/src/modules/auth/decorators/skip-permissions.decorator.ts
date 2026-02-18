import { SetMetadata } from '@nestjs/common';

/**
 * SkipPermissions 데코레이터
 *
 * 글로벌 PermissionsGuard가 활성화된 상태에서 특정 엔드포인트의 권한 검사를 건너뛰기 위해 사용합니다.
 * @Public()과 달리 JWT 인증은 여전히 필요하지만, 역할 기반 권한 검사만 생략합니다.
 *
 * 사용 사례:
 * - 인증된 모든 사용자가 접근 가능한 엔드포인트
 * - 비즈니스 로직에서 직접 권한을 검사하는 경우
 *
 * @example
 * ```typescript
 * @SkipPermissions()
 * @Get('my-profile')
 * async getMyProfile(@Request() req: AuthenticatedRequest) {
 *   return this.usersService.findOne(req.user.userId);
 * }
 * ```
 */
export const SKIP_PERMISSIONS_KEY = 'skipPermissions';

export const SkipPermissions = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(SKIP_PERMISSIONS_KEY, true);
