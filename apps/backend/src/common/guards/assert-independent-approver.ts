import { ForbiddenException } from '@nestjs/common';

/**
 * ISO 17025 §6.2.2 독립성 요구 — 제출자와 승인자 동일인 금지.
 *
 * 승인 워크플로우가 있는 모든 모듈에서 approve/qualityApprove 시작부에 호출.
 * 서버 측에서만 enforcement (클라이언트 disabled 힌트와 대칭).
 *
 * @param submittedById - 문서/레코드를 제출한 사용자 ID (서버 추출값)
 * @param approverId    - 승인을 시도하는 사용자 ID (req.user.userId 서버 추출값)
 * @param errorCode     - GlobalExceptionFilter가 i18n 키로 매핑할 에러 코드
 */
export function assertIndependentApprover(
  submittedById: string | null | undefined,
  approverId: string,
  errorCode = 'SELF_APPROVAL_FORBIDDEN'
): void {
  if (submittedById && submittedById === approverId) {
    throw new ForbiddenException({
      code: errorCode,
      message: '제출자 본인은 동일 문서를 승인할 수 없습니다 (ISO 17025 §6.2.2).',
    });
  }
}
