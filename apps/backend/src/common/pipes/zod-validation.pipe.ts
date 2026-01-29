import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { getErrorMessage } from '../utils/error';

/**
 * Zod 기반 검증 파이프
 *
 * ✅ Single Source of Truth 원칙: 모든 검증은 Zod 스키마를 사용합니다.
 *
 * 검증 전략:
 * - 모든 검증은 @equipment-management/schemas 패키지의 Zod 스키마를 사용
 * - 전역 ValidationPipe는 제거되어 충돌 없음
 * - 타입 안전성과 일관성 보장
 *
 * 사용법:
 * - 컨트롤러에서 @UsePipes(ZodValidationPipe) 데코레이터 사용
 * - 또는 DTO에서 export된 ValidationPipe 인스턴스 사용
 *
 * @example
 * ```typescript
 * @UsePipes(UpdateEquipmentValidationPipe)
 * update(@Body() dto: UpdateEquipmentDto) { ... }
 * ```
 *
 * 장점:
 * - 타입 안전성: Zod 스키마에서 TypeScript 타입 자동 추론
 * - 일관성: 프론트엔드와 백엔드가 동일한 스키마 사용
 * - 유지보수성: 한 곳에서 스키마 관리
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    // ⚠️ 중요: ZodValidationPipe는 body에만 적용되어야 합니다
    // @Param, @Query 등은 다른 파이프(ParseUUIDPipe 등)로 처리됩니다
    if (metadata.type !== 'body') {
      // body가 아니면 검증하지 않고 그대로 반환
      return value;
    }

    // 빈 객체나 null/undefined 체크
    if (value === null || value === undefined) {
      // 업데이트 스키마의 경우 빈 객체는 허용하지 않음
      // 하지만 .partial() 스키마는 빈 객체도 허용하므로 여기서는 체크하지 않음
      return value;
    }

    try {
      // 스키마를 통해 검증 수행
      // .partial() 스키마는 모든 필드를 선택적으로 만들지만,
      // 제공된 필드에 대해서는 여전히 검증을 수행합니다
      const result = this.schema.parse(value);
      return result;
    } catch (error) {
      // Zod 오류를 NestJS BadRequestException으로 변환
      if (error instanceof ZodError) {
        // 디버깅을 위해 상세 에러 정보 로깅 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
          console.error(
            'ZodValidationPipe Error:',
            JSON.stringify(
              {
                value,
                issues: error.issues.map((issue) => ({
                  path: issue.path,
                  message: issue.message,
                  code: issue.code,
                  received: (issue as any).received,
                  expected: (issue as any).expected,
                })),
                metadata: metadata.type,
              },
              null,
              2
            )
          );
        }
        throw new BadRequestException({
          message: '입력 데이터 검증 실패',
          errors: error.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      throw new BadRequestException({
        message: '입력 데이터 검증 실패',
        errors: getErrorMessage(error) || '알 수 없는 오류',
      });
    }
  }
}
