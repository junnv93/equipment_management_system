import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { getErrorMessage } from '../utils/error';

/**
 * 검증 대상 파라미터 타입
 *
 * - 'body': 요청 본문 (기본값, 가장 일반적)
 * - 'query': URL 쿼리 파라미터 (QueryDto 검증용)
 * - 'param': 경로 파라미터 (개별 param 검증 시에만 사용)
 */
export type ValidationTarget = 'body' | 'query' | 'param';

export interface ZodValidationPipeOptions {
  /**
   * 검증할 파라미터 타입을 명시적으로 지정합니다.
   *
   * @default ['body']
   *
   * ✅ SSOT 원칙: 파이프 인스턴스 생성 시점(DTO 파일)에서 검증 의도를 선언.
   * @UsePipes()가 메서드 레벨에서 모든 파라미터에 적용되더라도,
   * 파이프가 자신의 검증 대상만 처리합니다.
   *
   * @example
   * // Body 검증 (기본값 — 대부분의 DTO)
   * new ZodValidationPipe(createSchema)
   *
   * // Query 검증 (명시적 타겟)
   * new ZodValidationPipe(querySchema, { targets: ['query'] })
   */
  targets?: ValidationTarget[];
}

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
 * 사용법 (SSOT 패턴):
 * - Body DTO: `new ZodValidationPipe(schema)` (기본값: body만 검증)
 * - Query DTO: `new ZodValidationPipe(schema, { targets: ['query'] })`
 * - 컨트롤러에서 `@UsePipes(pipe)` 또는 `@Body(pipe)` 데코레이터 사용
 *
 * @example
 * ```typescript
 * // DTO 파일에서 파이프 생성 (검증 의도를 SSOT로 선언)
 * export const UpdateEquipmentPipe = new ZodValidationPipe(updateSchema);
 * export const EquipmentQueryPipe = new ZodValidationPipe(querySchema, { targets: ['query'] });
 *
 * // 컨트롤러에서 사용 — @UsePipes도 안전 (@Param에 적용되지 않음)
 * @UsePipes(UpdateEquipmentPipe)
 * update(@Param('uuid') uuid: string, @Body() dto: DTO) { ... }
 * ```
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly validationTargets: Set<string>;

  constructor(
    private schema: ZodSchema,
    options?: ZodValidationPipeOptions
  ) {
    this.validationTargets = new Set(options?.targets ?? ['body']);
  }

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // ✅ SSOT: 파이프 인스턴스 생성 시 지정된 타겟만 검증
    // 기본값 ['body'] — @UsePipes() 메서드 레벨에서도 @Param/@Request 안전
    if (!this.validationTargets.has(metadata.type)) {
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
    } catch (error: unknown) {
      // Zod 오류를 NestJS BadRequestException으로 변환
      if (error instanceof ZodError) {
        // ✅ 디버깅을 위해 상세 에러 정보 항상 로깅 (근본 원인 파악)
        console.error(
          '🔴 ZodValidationPipe Error:',
          JSON.stringify(
            {
              value,
              issues: error.issues.map((issue) => ({
                path: issue.path,
                message: issue.message,
                code: issue.code,
                received:
                  issue.code === 'invalid_type'
                    ? (issue as { received?: unknown }).received
                    : undefined,
              })),
              metadata: metadata.type,
            },
            null,
            2
          )
        );
        throw new BadRequestException({
          message: '입력 데이터 검증 실패',
          errors: error.issues.map((err) => ({
            path: err.path.join('.') || 'root',
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
