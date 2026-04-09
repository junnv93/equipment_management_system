import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * FormData 파서 인터셉터
 * multipart/form-data 요청에서 JSON 필드를 파싱합니다.
 */
@Injectable()
export class FormDataParserInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FormDataParserInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // FormData인 경우 JSON 필드 파싱
    if (request.body && typeof request.body === 'object') {
      // JSON 문자열 필드가 있으면 파싱
      if (request.body.data && typeof request.body.data === 'string') {
        try {
          request.body = { ...JSON.parse(request.body.data), ...request.body };
          delete request.body.data;
        } catch (error) {
          this.logger.warn(
            `FormData JSON parse failed: ${error instanceof Error ? error.message : String(error)}`
          );
          throw new BadRequestException({
            code: 'FORM_DATA_PARSE_FAILED',
            message: 'Invalid JSON in form data field.',
          });
        }
      }

      // 개별 필드가 문자열인 경우 파싱 시도
      // 날짜 필드 처리
      const dateFields = [
        'lastCalibrationDate',
        'nextCalibrationDate',
        'intermediateCheckSchedule',
        'lastIntermediateCheckDate',
        'nextIntermediateCheckDate',
        'installationDate',
      ];

      for (const field of dateFields) {
        if (request.body[field] && typeof request.body[field] === 'string') {
          const dateValue = new Date(request.body[field]);
          if (!isNaN(dateValue.getTime())) {
            request.body[field] = dateValue;
          }
        }
      }

      // 숫자 필드 처리
      // ⚠️ teamId는 UUID 문자열이므로 숫자 변환 대상에서 제외
      const numberFields = ['calibrationCycle', 'purchaseYear', 'price', 'intermediateCheckCycle'];

      for (const field of numberFields) {
        if (request.body[field] && typeof request.body[field] === 'string') {
          const numValue = Number(request.body[field]);
          if (!isNaN(numValue)) {
            request.body[field] = numValue;
          }
        }
      }

      // 불린 필드 처리
      const booleanFields = ['needsIntermediateCheck', 'isActive', 'isShared'];
      for (const field of booleanFields) {
        if (request.body[field] !== undefined) {
          if (typeof request.body[field] === 'string') {
            request.body[field] = request.body[field] === 'true';
          }
        }
      }
    }

    return next.handle();
  }
}
