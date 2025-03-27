import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try {
      // 스키마를 통해 검증 수행
      const result = this.schema.parse(value);
      return result;
    } catch (error) {
      // Zod 오류를 NestJS BadRequestException으로 변환
      throw new BadRequestException({
        message: '입력 데이터 검증 실패',
        errors: error.errors || error.message,
      });
    }
  }
} 