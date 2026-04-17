import {
  BadRequestException,
  Injectable,
  PipeTransform,
  type ArgumentMetadata,
} from '@nestjs/common';
import { parseManagementNumber } from '@equipment-management/schemas';

/**
 * `@Param('mgmt', ParseManagementNumberPipe)`로 사용.
 *
 * 경로 파라미터 `mgmt`가 UL-QP-18 관리번호 형식(예: `SUW-E0001`)인지 검증한다.
 * 유효성 로직은 `parseManagementNumber` SSOT(packages/schemas)를 재사용하여
 * 정규식 재정의를 방지한다.
 *
 * 실패 시 `400 Bad Request` + 에러 코드 `INVALID_MANAGEMENT_NUMBER`.
 *
 * 임시 관리번호(`TEMP-...`)는 Phase 1 범위 외 — 별도 폴백을 도입하기 전까지 거절.
 */
@Injectable()
export class ParseManagementNumberPipe implements PipeTransform<string, string> {
  transform(value: unknown, _metadata: ArgumentMetadata): string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new BadRequestException({
        code: 'INVALID_MANAGEMENT_NUMBER',
        message: 'Management number is required.',
      });
    }

    const trimmed = value.trim();

    if (!parseManagementNumber(trimmed)) {
      throw new BadRequestException({
        code: 'INVALID_MANAGEMENT_NUMBER',
        message: `"${trimmed}" is not a valid management number. Expected format: SUW-E0001.`,
      });
    }

    return trimmed;
  }
}
