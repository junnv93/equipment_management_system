import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 알림(Notification) sort 필드 SSOT.
 *
 * 기존 `notifications.service.ts`는 sort 처리가 없어 `desc(createdAt)` 하드코딩.
 * 본 sprint에서 sort enum + mapper 도입으로 격상 (`createdAt` default `desc`).
 */
export const NOTIFICATION_SORT_FIELDS = ['createdAt', 'priority'] as const;

export type NotificationSortField = (typeof NOTIFICATION_SORT_FIELDS)[number];

export const NotificationSortEnum = buildSortEnum(NOTIFICATION_SORT_FIELDS);
export type NotificationSortValue = z.infer<typeof NotificationSortEnum>;
