import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
  type CustomDecorator,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ApiResponse, createSuccessResponse } from '../types/api-response';

/**
 * 응답 변환 건너뛰기 메타데이터 키
 */
export const SKIP_TRANSFORM_KEY = 'skipResponseTransform';

/**
 * 응답 변환을 건너뛰는 데코레이터
 *
 * @example
 * @SkipResponseTransform()
 * @Get('raw')
 * getRawData() {
 *   return { raw: 'data' };
 * }
 */
export const SkipResponseTransform = (): CustomDecorator<string> =>
  SetMetadata(SKIP_TRANSFORM_KEY, true);

/**
 * 커스텀 메시지 메타데이터 키
 */
export const RESPONSE_MESSAGE_KEY = 'responseMessage';

/**
 * 응답 메시지 설정 데코레이터
 *
 * @example
 * @ResponseMessage('장비가 성공적으로 생성되었습니다.')
 * @Post()
 * create() { ... }
 */
export const ResponseMessage = (message: string): CustomDecorator<string> =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

/**
 * 응답 변환 인터셉터
 *
 * 모든 성공 응답을 ApiResponse 형식으로 래핑합니다.
 *
 * Best Practice:
 * - 일관된 응답 구조 제공
 * - 프론트엔드에서 예측 가능한 응답 처리
 * - 메타데이터(timestamp 등) 자동 추가
 *
 * @example
 * // 컨트롤러에서 반환:
 * return equipment;
 *
 * // 실제 응답:
 * {
 *   success: true,
 *   message: '요청이 성공적으로 처리되었습니다.',
 *   data: equipment,
 *   timestamp: '2024-01-01T00:00:00.000Z'
 * }
 */
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    // 변환 건너뛰기 체크
    const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTransform) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    // 커스텀 메시지 가져오기
    const customMessage = this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((data) => {
        // 이미 ApiResponse 형식인 경우 그대로 반환
        if (this.isApiResponse(data)) {
          return data;
        }

        // ApiResponse 형식으로 래핑
        return createSuccessResponse(data, customMessage);
      })
    );
  }

  /**
   * ApiResponse 형식인지 확인
   */
  private isApiResponse(data: unknown): data is ApiResponse<T> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      'data' in data &&
      'timestamp' in data
    );
  }
}
