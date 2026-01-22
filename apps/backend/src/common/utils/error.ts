/**
 * 타입 안전한 에러 메시지 추출 유틸리티
 * TypeScript strict 모드에서 catch 블록의 error는 unknown 타입이므로
 * 안전하게 메시지를 추출하기 위한 헬퍼 함수들
 */

/**
 * unknown 타입의 에러에서 메시지를 안전하게 추출
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

/**
 * unknown 타입의 에러에서 스택 트레이스를 안전하게 추출
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * unknown 타입을 Error 객체로 변환
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(getErrorMessage(error));
}

/**
 * 에러인지 확인하는 타입 가드
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
