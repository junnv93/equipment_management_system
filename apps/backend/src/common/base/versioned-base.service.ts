import { ConflictException, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@equipment-management/db/schema';

/**
 * Optimistic Locking (CAS) 추상 기반 서비스
 *
 * ✅ DRY: 5개 모듈(checkout, calibration, non-conformance, equipment-import, disposal)에서 공유
 * ✅ CAS: WHERE version = expectedVersion 조건으로 동시 수정 방지
 * ✅ 에러 분류: 404 (Not Found) vs 409 (Version Conflict)
 */
export abstract class VersionedBaseService {
  protected abstract readonly db: NodePgDatabase<typeof schema>;

  /**
   * CAS(Compare-And-Swap) 기반 업데이트
   *
   * 1. UPDATE ... SET version = version + 1 WHERE id = ? AND version = expectedVersion
   * 2. 영향 행 0 → 존재 여부 확인 → NotFoundException 또는 ConflictException
   *
   * @param table     Drizzle 테이블 참조 (e.g., checkouts, calibrations)
   * @param id        엔티티 UUID
   * @param expectedVersion 클라이언트가 보낸 version (낙관적 잠금 키)
   * @param updateData      업데이트할 필드 (version, updatedAt 자동 처리)
   * @param entityName      에러 메시지용 한국어 엔티티명 ("교정 기록", "부적합" 등)
   * @returns 업데이트된 엔티티 (version + 1 반영)
   *
   * @throws NotFoundException  엔티티가 존재하지 않을 때 (404)
   * @throws ConflictException  version 불일치 (동시 수정) (409)
   */
  protected async updateWithVersion<T>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    table: any,
    id: string,
    expectedVersion: number,
    updateData: Record<string, unknown>,
    entityName: string
  ): Promise<T> {
    const [updated] = await this.db
      .update(table)
      .set({
        ...updateData,
        version: sql`version + 1`,
        updatedAt: new Date(),
      } as Record<string, unknown>)
      .where(and(eq(table.id, id), eq(table.version, expectedVersion)))
      .returning();

    if (!updated) {
      const [existing] = await this.db
        .select({ id: table.id, version: table.version })
        .from(table)
        .where(eq(table.id, id))
        .limit(1);

      if (!existing) {
        throw new NotFoundException({
          code: 'ENTITY_NOT_FOUND',
          message: `${entityName} with UUID ${id} not found`,
        });
      }

      throw new ConflictException({
        message: 'This record has been modified by another user. Please refresh the page.',
        code: 'VERSION_CONFLICT',
        currentVersion: existing.version,
        expectedVersion,
      });
    }

    return updated as T;
  }
}
