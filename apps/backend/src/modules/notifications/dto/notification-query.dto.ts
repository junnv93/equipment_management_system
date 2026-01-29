import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  NotificationTypeEnum,
  NotificationPriorityEnum,
  NOTIFICATION_TYPE_VALUES,
  NOTIFICATION_PRIORITY_VALUES,
  type NotificationType,
  type NotificationPriority,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 문자열을 배열로 변환하는 헬퍼
 */
const toArray = <T extends string>(val: unknown): T[] | undefined => {
  if (val === undefined || val === null) return undefined;
  if (Array.isArray(val)) return val as T[];
  return [val as T];
};

/**
 * 알림 조회 쿼리 스키마
 */
export const notificationQuerySchema = z.object({
  recipientId: z.string().uuid({ message: '유효한 수신자 UUID가 아닙니다' }).optional(),
  teamId: z.string().uuid({ message: '유효한 팀 UUID가 아닙니다' }).optional(),
  equipmentId: z.string().uuid({ message: '유효한 장비 UUID가 아닙니다' }).optional(),
  calibrationId: z.string().uuid({ message: '유효한 교정 UUID가 아닙니다' }).optional(),
  rentalId: z.string().uuid({ message: '유효한 대여 UUID가 아닙니다' }).optional(),
  isRead: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional()
  ),
  search: z.string().optional(),
  types: z.preprocess((val) => toArray<string>(val), z.array(NotificationTypeEnum).optional()),
  priorities: z.preprocess(
    (val) => toArray<string>(val),
    z.array(NotificationPriorityEnum).optional()
  ),
  fromDate: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }).optional(),
  toDate: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }).optional(),
  sort: z.string().default('createdAt.desc'),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export const NotificationQueryValidationPipe = new ZodValidationPipe(notificationQuerySchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: '알림 수신자 ID' })
  recipientId?: string;

  @ApiPropertyOptional({ description: '팀 ID' })
  teamId?: string;

  @ApiPropertyOptional({ description: '장비 ID' })
  equipmentId?: string;

  @ApiPropertyOptional({ description: '교정 ID' })
  calibrationId?: string;

  @ApiPropertyOptional({ description: '대여 ID' })
  rentalId?: string;

  @ApiPropertyOptional({ description: '읽음 여부로 필터링' })
  isRead?: boolean;

  @ApiPropertyOptional({ description: '검색어 (제목, 내용)' })
  search?: string;

  @ApiPropertyOptional({
    description: '알림 유형 (여러 개 선택 가능)',
    enum: NOTIFICATION_TYPE_VALUES,
    isArray: true,
  })
  types?: NotificationType[];

  @ApiPropertyOptional({
    description: '알림 우선순위 (여러 개 선택 가능)',
    enum: NOTIFICATION_PRIORITY_VALUES,
    isArray: true,
  })
  priorities?: NotificationPriority[];

  @ApiPropertyOptional({ description: '시작 날짜 (ISO 형식)' })
  fromDate?: string;

  @ApiPropertyOptional({ description: '종료 날짜 (ISO 형식)' })
  toDate?: string;

  @ApiPropertyOptional({ description: '정렬 기준 (예: createdAt.desc)' })
  sort?: string = 'createdAt.desc';

  @ApiPropertyOptional({
    description: '페이지 번호',
    type: Number,
    minimum: 1,
    default: 1,
  })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  pageSize?: number = 20;
}
