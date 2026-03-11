import { Inject, Injectable } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import type { NotificationCategory } from '../config/notification-registry';

/**
 * 알림 설정 서비스
 *
 * 사용자별 카테고리 토글 관리.
 * 카테고리 비활성화 시 해당 알림 미생성.
 */

export interface NotificationPreferencesData {
  id: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  checkoutEnabled: boolean;
  calibrationEnabled: boolean;
  calibrationPlanEnabled: boolean;
  nonConformanceEnabled: boolean;
  disposalEnabled: boolean;
  equipmentImportEnabled: boolean;
  equipmentEnabled: boolean;
  systemEnabled: boolean;
  frequency: string;
  digestTime: string;
}

// 카테고리 → DB 컬럼 매핑
const CATEGORY_COLUMN_MAP: Record<
  NotificationCategory,
  keyof typeof schema.notificationPreferences.$inferSelect
> = {
  checkout: 'checkoutEnabled',
  calibration: 'calibrationEnabled',
  calibration_plan: 'calibrationPlanEnabled',
  non_conformance: 'nonConformanceEnabled',
  disposal: 'disposalEnabled',
  equipment_import: 'equipmentImportEnabled',
  equipment: 'equipmentEnabled',
  system: 'systemEnabled',
};

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  /**
   * 사용자의 알림 설정을 조회하거나 기본값을 생성한다.
   */
  async getOrCreate(userId: string): Promise<NotificationPreferencesData> {
    const existing = await this.db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0] as NotificationPreferencesData;
    }

    // 기본값 생성
    const [created] = await this.db
      .insert(schema.notificationPreferences)
      .values({ userId })
      .returning();

    return created as NotificationPreferencesData;
  }

  /**
   * 사용자의 알림 설정을 업데이트한다.
   */
  async update(
    userId: string,
    data: Partial<Omit<NotificationPreferencesData, 'id' | 'userId'>>
  ): Promise<NotificationPreferencesData> {
    // upsert: 없으면 생성 후 업데이트
    await this.getOrCreate(userId);

    const [updated] = await this.db
      .update(schema.notificationPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.notificationPreferences.userId, userId))
      .returning();

    return updated as NotificationPreferencesData;
  }

  /**
   * 주어진 사용자들 중 해당 카테고리의 알림이 활성화된 사용자만 필터링한다.
   *
   * 설정이 없는 사용자는 기본값(활성화)으로 처리.
   */
  async filterEnabledUsers(userIds: string[], category: NotificationCategory): Promise<string[]> {
    if (userIds.length === 0) return [];

    const columnName = CATEGORY_COLUMN_MAP[category];
    if (!columnName) return userIds;

    // 설정이 있는 사용자들의 비활성화 여부 조회
    const prefs = await this.db
      .select({
        userId: schema.notificationPreferences.userId,
        inAppEnabled: schema.notificationPreferences.inAppEnabled,
        categoryEnabled: schema.notificationPreferences[columnName] as unknown as ReturnType<
          typeof eq
        >,
      })
      .from(schema.notificationPreferences)
      .where(inArray(schema.notificationPreferences.userId, userIds));

    // 비활성화된 사용자 ID 집합
    const disabledUserIds = new Set(
      prefs
        .filter((p) => {
          const inAppEnabled = p.inAppEnabled as unknown as boolean;
          const categoryEnabled = p.categoryEnabled as unknown as boolean;
          return !inAppEnabled || !categoryEnabled;
        })
        .map((p) => p.userId)
    );

    // 설정이 없는 사용자는 기본값(활성화)이므로 포함
    return userIds.filter((id) => !disabledUserIds.has(id));
  }

  /**
   * 이메일 알림이 활성화된 사용자만 필터링한다.
   * 설정이 없는 사용자는 false(opt-in 모델)로 처리 → 포함하지 않음.
   */
  async filterEmailEnabledUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];

    const prefs = await this.db
      .select({
        userId: schema.notificationPreferences.userId,
        emailEnabled: schema.notificationPreferences.emailEnabled,
      })
      .from(schema.notificationPreferences)
      .where(inArray(schema.notificationPreferences.userId, userIds));

    // emailEnabled = true인 사용자만 포함 (설정 없는 사용자는 opt-in이므로 제외)
    const emailEnabledUserIds = new Set(prefs.filter((p) => p.emailEnabled).map((p) => p.userId));

    return userIds.filter((id) => emailEnabledUserIds.has(id));
  }
}
