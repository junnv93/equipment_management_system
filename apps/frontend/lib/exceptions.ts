/**
 * 예외 처리 클래스
 *
 * API 에러 처리를 위한 커스텀 예외 클래스
 */

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;

    // 스택 트레이스 유지
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * 에러를 JSON 형식으로 변환
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
