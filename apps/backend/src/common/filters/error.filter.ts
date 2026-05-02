import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCode, ErrorResponse, handleZodError } from '@equipment-management/schemas';
import { AuditService } from '../../modules/audit/audit.service';
import { SECURITY_AUDITABLE_CODES } from '../constants/security-auditable-codes';
import {
  resolveAuditEntityIdWithSentinel,
  inferEntityTypeFromPath,
} from '../utils/audit-entity-id.util';
import type { AuditLogUserRole, CreateAuditLogDto } from '@equipment-management/schemas';
import type { AuthenticatedRequest, JwtUser } from '../../types/auth';
import type { AuditLogDetails } from '@equipment-management/db/schema';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly auditService: AuditService) {}

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
      errorResponse = exception.toResponse();
      this.maybeAuditSecurityEvent(exception, request, errorResponse);
      return response.status(exception.statusCode).json(errorResponse);
    } else if (exception instanceof ZodError) {
      const appError = handleZodError(exception);
      errorResponse = appError.toResponse();
      // ZodError = ValidationError → 운영 노이즈, audit 제외
      return response.status(appError.statusCode).json(errorResponse);
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

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

      this.maybeAuditSecurityEvent(exception, request, errorResponse);
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

  /**
   * 보안 감사 이벤트 조건 충족 시 audit_logs 비동기 기록 (fire-and-forget).
   *
   * 조건:
   * 1. request.__auditLogged === true → AuditInterceptor가 이미 처리한 Handler-level 에러 → skip (double-audit 방지)
   * 2. errorResponse.code 가 SECURITY_AUDITABLE_CODES 미포함 → skip (운영 노이즈)
   * 3. request.user 미존재 + 인증 코드(InvalidCredentials, SessionExpired) 외 → skip
   *
   * audit 실패는 응답에 영향 없음.
   */
  private maybeAuditSecurityEvent(
    _exception: unknown,
    request: Request,
    errorResponse: ErrorResponse
  ): void {
    // dedup: AuditInterceptor가 Handler-level에서 이미 기록한 경우 skip
    if ((request as unknown as Record<string, unknown>).__auditLogged === true) return;

    if (!SECURITY_AUDITABLE_CODES.has(errorResponse.code as ErrorCode)) return;

    const user = (request as AuthenticatedRequest).user as JwtUser | undefined;

    // 인증 정보 없음 + 인증 관련 코드가 아니면 → 운영 노이즈 (스캐너 등) skip
    const isAuthCode =
      errorResponse.code === ErrorCode.InvalidCredentials ||
      errorResponse.code === ErrorCode.SessionExpired;
    if (!user && !isAuthCode) return;

    void this.logFilterAuditAsync(request, errorResponse, user).catch((err: unknown) => {
      this.logger.error(
        `Security audit log failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined
      );
    });
  }

  private async logFilterAuditAsync(
    request: Request,
    errorResponse: ErrorResponse,
    user: JwtUser | undefined
  ): Promise<void> {
    const authRequest = request as AuthenticatedRequest;
    const { entityId, entityName, useSentinel } = resolveAuditEntityIdWithSentinel(authRequest);
    const entityType = inferEntityTypeFromPath(authRequest);

    const ipAddress = this.getClientIp(request);

    const details: AuditLogDetails = {
      additionalInfo: {
        errorCode: errorResponse.code,
        httpStatus: request.method,
        path: `${request.method} ${(request as Request & { originalUrl?: string }).originalUrl ?? request.url}`,
        triggeredBy: 'global-filter' as const,
        ...(useSentinel ? { entityIdSentinel: true } : {}),
      },
    };

    const dto: CreateAuditLogDto = {
      userId: user?.userId ?? null,
      userName: user?.name ?? 'Anonymous User',
      userRole: (user?.roles?.[0] ?? 'unknown') as AuditLogUserRole,
      action: 'access_denied',
      entityType,
      entityId,
      entityName,
      details,
      ipAddress,
      userSite: user?.site,
      userTeamId: user?.teamId,
    };

    await this.auditService.create(dto);
  }

  private getClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return forwardedValue?.split(',')[0].trim();
    }
    return (
      request.ip ??
      (request as Request & { socket?: { remoteAddress?: string } }).socket?.remoteAddress
    );
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
