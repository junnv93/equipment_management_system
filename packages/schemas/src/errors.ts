import { z } from 'zod';

// 에러 코드 타입 정의
export enum ErrorCode {
  // 일반 오류
  BadRequest = 'BAD_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  TooManyRequests = 'TOO_MANY_REQUESTS',
  InternalServerError = 'INTERNAL_SERVER_ERROR',
  
  // 장비 관련 오류
  EquipmentNotAvailable = 'EQUIPMENT_NOT_AVAILABLE',
  EquipmentAlreadyAssigned = 'EQUIPMENT_ALREADY_ASSIGNED',
  EquipmentMaintenance = 'EQUIPMENT_MAINTENANCE',
  
  // 사용자 관련 오류
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
  
  // 데이터 유효성 오류
  InvalidData = 'INVALID_DATA',
  ValidationError = 'VALIDATION_ERROR',
}

// HTTP 상태 코드와 에러 코드 매핑
export const errorCodeToStatusCode: Record<ErrorCode, number> = {
  [ErrorCode.BadRequest]: 400,
  [ErrorCode.Unauthorized]: 401,
  [ErrorCode.Forbidden]: 403,
  [ErrorCode.NotFound]: 404,
  [ErrorCode.Conflict]: 409,
  [ErrorCode.TooManyRequests]: 429,
  [ErrorCode.InternalServerError]: 500,
  
  [ErrorCode.EquipmentNotAvailable]: 400,
  [ErrorCode.EquipmentAlreadyAssigned]: 409,
  [ErrorCode.EquipmentMaintenance]: 400,
  
  [ErrorCode.InvalidCredentials]: 401,
  [ErrorCode.UserNotFound]: 404,
  [ErrorCode.EmailAlreadyExists]: 409,
  
  [ErrorCode.InvalidData]: 400,
  [ErrorCode.ValidationError]: 400,
};

// 에러 응답 스키마
export const ErrorResponseSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.string().datetime(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// 애플리케이션 에러 클래스
export class AppError extends Error {
  code: ErrorCode;
  details?: any;
  statusCode: number;
  
  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.statusCode = errorCodeToStatusCode[code];
    this.name = 'AppError';
    
    // 스택 트레이스 유지를 위한 설정
    // TS2339 오류 회피
    const captureStackTrace = (Error as any).captureStackTrace;
    if (captureStackTrace) {
      captureStackTrace(this, AppError);
    }
  }
  
  // 응답 형식으로 변환
  toResponse(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
  
  // 특정 에러 타입 생성을 위한 팩토리 메서드들
  static badRequest(message: string, details?: any): AppError {
    return new AppError(ErrorCode.BadRequest, message, details);
  }
  
  static unauthorized(message: string = '인증이 필요합니다', details?: any): AppError {
    return new AppError(ErrorCode.Unauthorized, message, details);
  }
  
  static forbidden(message: string = '권한이 없습니다', details?: any): AppError {
    return new AppError(ErrorCode.Forbidden, message, details);
  }
  
  static notFound(message: string = '리소스를 찾을 수 없습니다', details?: any): AppError {
    return new AppError(ErrorCode.NotFound, message, details);
  }
  
  static conflict(message: string, details?: any): AppError {
    return new AppError(ErrorCode.Conflict, message, details);
  }
  
  static internalServerError(message: string = '서버 오류가 발생했습니다', details?: any): AppError {
    return new AppError(ErrorCode.InternalServerError, message, details);
  }
  
  static validationError(message: string = '유효성 검사 오류', details?: any): AppError {
    return new AppError(ErrorCode.ValidationError, message, details);
  }
}

// Zod 검증 에러를 AppError로 변환하는 유틸리티 함수
export function handleZodError(error: z.ZodError): AppError {
  return AppError.validationError('입력 데이터가 유효하지 않습니다', {
    issues: error.format(),
  });
} 