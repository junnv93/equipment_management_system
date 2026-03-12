import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCode, ErrorResponse, handleZodError } from '@equipment-management/schemas';
import { Logger } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let errorResponse: ErrorResponse;

    // 요청 정보 로깅
    this.logger.error(
      `Exception occurred during ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : ''
    );

    if (exception instanceof AppError) {
      // 이미 AppError인 경우 그대로 사용
      errorResponse = exception.toResponse();
      return response.status(exception.statusCode).json(errorResponse);
    } else if (exception instanceof ZodError) {
      // Zod 유효성 검사 오류 처리
      const appError = handleZodError(exception);
      errorResponse = appError.toResponse();
      return response.status(appError.statusCode).json(errorResponse);
    } else if (exception instanceof HttpException) {
      // NestJS HTTP 예외 처리
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract message and custom fields
      const message =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
          ? (exceptionResponse as Record<string, unknown>).message || 'An HTTP error occurred'
          : exceptionResponse;

      // SSOT: Preserve custom error code if present (e.g., VERSION_CONFLICT for optimistic locking)
      const customCode =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'code' in exceptionResponse
          ? ((exceptionResponse as Record<string, unknown>).code as ErrorCode)
          : undefined;

      // Build error response with custom fields at top level
      errorResponse = {
        code: customCode || this.mapHttpStatusToErrorCode(status),
        message: Array.isArray(message) ? message.join(', ') : String(message),
        timestamp: new Date().toISOString(),
      };

      // Preserve additional custom fields (e.g., currentVersion, expectedVersion) at top level
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        Object.keys(exceptionResponse).forEach((key) => {
          if (key !== 'message' && key !== 'code' && key !== 'statusCode') {
            (errorResponse as Record<string, unknown>)[key] = (
              exceptionResponse as Record<string, unknown>
            )[key];
          }
        });
      }

      return response.status(status).json(errorResponse);
    } else {
      // 미처리 예외는 서버 오류로 처리
      // 프로덕션 환경에서는 내부 에러 메시지를 마스킹하여 정보 유출 방지
      const errorMessage =
        process.env.NODE_ENV === 'production'
          ? 'A server error occurred.'
          : exception instanceof Error
            ? exception.message
            : 'An unknown server error occurred';

      errorResponse = {
        code: ErrorCode.InternalServerError,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: exception instanceof Error ? exception.stack : undefined }
            : undefined,
      };

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  private mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BadRequest;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.Unauthorized;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.Forbidden;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NotFound;
      case HttpStatus.CONFLICT:
        return ErrorCode.Conflict;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.TooManyRequests;
      default:
        return ErrorCode.InternalServerError;
    }
  }
}
