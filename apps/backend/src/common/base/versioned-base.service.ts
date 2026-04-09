import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { ErrorCode } from '@equipment-management/schemas';
import type { AnyPgTable, AnyPgColumn } from 'drizzle-orm/pg-core';

/**
 * CAS(낙관적 잠금) 대상 테이블의 최소 컬럼 계약
 *
 * 이 타입을 만족하는 테이블은 updateWithVersion의 안전한 CAS 연산을 지원합니다.
 * - AnyPgTable: Drizzle update()/select() API 호환
 * - id: UUID 기반 엔티티 식별
 * - version: 낙관적 잠금 버전 카운터
 */
type CasPgTable = AnyPgTable & {
  id: AnyPgColumn;
  version: AnyPgColumn;
};

/**
 * VERSION_CONFLICT 에러 메시지 — SSOT
 *
 * 모든 CAS 실패 에러는 이 상수를 사용합니다.
 * 프론트엔드에서 code 필드('VERSION_CONFLICT')로 매핑하므로 message는 사용자에게 직접 노출되지 않습니다.
 */
export const VERSION_CONFLICT_MESSAGE =
  'This record has been modified by another user. Please refresh the page.';

/** VERSION_CONFLICT ConflictException 생성 헬퍼 */
export function createVersionConflictException(
  currentVersion?: number,
  expectedVersion?: number
): ConflictException {
  return new ConflictException({
    message: VERSION_CONFLICT_MESSAGE,
    code: ErrorCode.VersionConflict,
    ...(currentVersion !== undefined && { currentVersion }),
    ...(expectedVersion !== undefined && { expectedVersion }),
  });
}

/**
 * CAS `updateWithVersion` 에 병합할 추가 WHERE 조건 (precondition).
 *
 * **왜 필요한가:**
 * 승인/반려/상태 전이 핸들러는 전통적으로 "findOne → 상태 검사 → updateWithVersion"
 * 순서로 작성되는데, findOne 과 update 사이 윈도우에 다른 트랜잭션이 동일 레코드의
 * 상태를 바꿀 수 있다. 이 경우 후행자는 비결정적으로 400(상태 불일치) 또는 409(버전
 * 불일치) 를 받아 E2E 테스트와 클라이언트 재시도 로직이 양쪽 경로를 모두 알아야 한다.
 *
 * Precondition 을 CAS WHERE 절에 병합하면:
 *   `WHERE id = ? AND version = ? AND status = 'PENDING'`
 * 단일 원자 UPDATE 로 상태 전이가 보장되며, 실패 시 분류 순서는
 *   NotFound(404) → VersionConflict(409) → Precondition(400)
 * 으로 결정적이 된다.
 *
 * **사용 예 (equipment-imports.service.approve):**
 * ```
 * await this.updateWithVersion(equipmentImports, id, dto.version, { ... }, 'Equipment import', undefined, 'ENTITY_NOT_FOUND', 'version', [
 *   { column: equipmentImports.status, expected: EIVal.PENDING,
 *     errorCode: 'IMPORT_ONLY_PENDING_CAN_APPROVE',
 *     errorMessage: 'Only pending import requests can be approved.' }
 * ]);
 * ```
 */
export interface CasPrecondition {
  /** 비교 대상 컬럼 (동일 테이블) */
  column: AnyPgColumn;
  /** 기대값 — `column = expected` 형태로 병합 */
  expected: unknown;
  /** precondition 실패 시 반환할 에러 코드 (e.g., 'IMPORT_ONLY_PENDING_CAN_APPROVE') */
  errorCode: string;
  /** precondition 실패 시 사용자에게 노출할 메시지 */
  errorMessage: string;
}

/**
 * Optimistic Locking (CAS) 추상 기반 서비스
 *
 * ✅ DRY: 13개 모듈(checkout, calibration, non-conformance, equipment-import, disposal,
 *        calibration-factors, equipment, software-validations, intermediate-inspections,
 *        cables, test-software, self-inspections, calibration-plans*)에서 공유
 * ✅ CAS: WHERE version = expectedVersion 조건으로 동시 수정 방지
 * ✅ 에러 분류: 404 (Not Found) vs 409 (Version Conflict)
 * ✅ Cache coherence: onVersionConflict() 훅으로 stale detail 캐시 자동 무효화
 */
export abstract class VersionedBaseService {
  private readonly versionedBaseLogger = new Logger(VersionedBaseService.name);

  protected abstract readonly db: AppDatabase;

  /**
   * CAS 충돌(409) 발생 시 호출되는 정책 훅 — 서브클래스에서 override 권장
   *
   * **왜 필요한가:**
   * 클라이언트가 stale version 으로 PATCH 시도 → 서버는 409 throw → 클라이언트는
   * detail 캐시를 invalidate 한 뒤 재조회 → 여기서 서버 detail 캐시가 stale 이면
   * "정상 갱신된 데이터"가 아닌 "다른 사용자가 갱신한 직전 스냅샷의 stale 캐시"가
   * 반환되어 재시도가 다시 409 로 떨어지는 flakiness 가 발생.
   *
   * **계약:**
   * - 호출 시점: `updateWithVersion` 이 ConflictException 을 throw 하기 직전
   * - 책임: 해당 엔티티의 detail 캐시(혹은 동등 캐시)를 무효화
   * - 실패 정책: throw 금지 — 무효화 실패가 원본 409 에러를 가리지 않도록
   *   내부에서 catch + log warning 처리. base class 가 외곽 보호도 적용.
   * - default: no-op (캐시가 없는 도메인 안전 보장 — backward compatible)
   *
   * **⚠️ 트랜잭션 안전성 주의 (DB write 금지):**
   * `updateWithVersion(tx)` 형태로 호출되어도 본 훅은 항상 outer connection
   * (`this.db`) 를 통해 실행되며, 곧이어 throw 되는 ConflictException 이 호출자
   * 트랜잭션을 rollback 시킨다. 따라서 훅 본문에서 **DB write (audit row 삽입,
   * 다른 테이블 version bump 등) 를 수행하면 split-brain** 이 발생: 본 훅의
   * write 는 commit 되었으나 호출자 tx 의 다른 변경은 rollback 되어 데이터
   * 정합성이 깨진다. 본 훅에서는 in-memory 캐시 / Redis 무효화 / 로그만 수행하고,
   * persistent state mutation 은 절대 하지 말 것.
   *
   * @param id  CAS 충돌이 발생한 엔티티 UUID
   */
  protected async onVersionConflict(_id: string): Promise<void> {
    // default no-op — 캐시가 없는 도메인은 그대로 패스
  }

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
  /**
   * @param tx  선택적 트랜잭션 컨텍스트 — 다중 테이블 원자성이 필요할 때 전달
   * @param casColumnKey 선택적 CAS 컬럼 JS property 명 (default: 'version').
   *                     `version` 컬럼이 도메인적 의미(예: 계획서 개정 번호)로 이미
   *                     사용되어 별도 `casVersion` 컬럼을 CAS 잠금에 사용하는 테이블은
   *                     `'casVersion'` 전달. WHERE / SET / SELECT 모두 이 컬럼 기준.
   *                     리터럴 유니언으로 좁혀져 오타는 컴파일 시 잡힌다.
   */
  protected async updateWithVersion<T>(
    table: CasPgTable,
    id: string,
    expectedVersion: number,
    updateData: Record<string, unknown>,
    entityName: string,
    tx?: AppDatabase,
    notFoundCode = 'ENTITY_NOT_FOUND',
    casColumnKey: 'version' | 'casVersion' = 'version',
    preconditions: readonly CasPrecondition[] = []
  ): Promise<T> {
    const executor = tx ?? this.db;
    const casColumn = (table as unknown as Record<string, AnyPgColumn | undefined>)[casColumnKey];
    if (!casColumn) {
      throw new Error(
        `updateWithVersion: table does not expose column '${casColumnKey}' for CAS lock`
      );
    }

    // CAS WHERE: id + version + (선택적) precondition 컬럼들을 단일 원자 조건으로 병합
    const whereConditions = [
      eq(table.id, id),
      eq(casColumn, expectedVersion),
      ...preconditions.map((p) => eq(p.column, p.expected)),
    ];

    const [updated] = await executor
      .update(table)
      .set({
        ...updateData,
        [casColumnKey]: sql`${casColumn} + 1`,
        updatedAt: new Date(),
      } as Record<string, unknown>)
      .where(and(...whereConditions))
      .returning();

    if (!updated) {
      // 실패 원인 분류: 단일 SELECT 로 CAS 컬럼 + 모든 precondition 컬럼 조회.
      // 분류 순서는 NotFound(404) → VersionConflict(409) → Precondition(400).
      const selection: Record<string, AnyPgColumn> = {
        id: table.id,
        [casColumnKey]: casColumn,
      };
      preconditions.forEach((p, idx) => {
        selection[`__pre_${idx}`] = p.column;
      });

      const [existing] = await executor
        .select(selection)
        .from(table)
        .where(eq(table.id, id))
        .limit(1);

      if (!existing) {
        throw new NotFoundException({
          code: notFoundCode,
          message: `${entityName} with UUID ${id} not found`,
        });
      }

      const existingRecord = existing as Record<string, unknown>;
      const currentVersion = existingRecord[casColumnKey] as number;

      if (currentVersion !== expectedVersion) {
        // CAS 충돌 — stale detail 캐시 무효화 훅 호출 (서브클래스 정책 위임)
        // 훅 실패가 원본 409 에러를 가리지 않도록 외곽 보호.
        try {
          await this.onVersionConflict(id);
        } catch (hookErr) {
          this.versionedBaseLogger.warn(
            `onVersionConflict hook failed for ${entityName} ${id}: ${
              hookErr instanceof Error ? hookErr.message : String(hookErr)
            }`
          );
        }
        throw createVersionConflictException(currentVersion, expectedVersion);
      }

      // 버전은 일치 → precondition 중 첫 번째 불일치 항목이 실패 원인
      for (let i = 0; i < preconditions.length; i++) {
        const precondition = preconditions[i];
        if (existingRecord[`__pre_${i}`] !== precondition.expected) {
          throw new BadRequestException({
            code: precondition.errorCode,
            message: precondition.errorMessage,
          });
        }
      }

      // 이론적으로 도달 불가 (UPDATE 0 rows 인데 SELECT 는 모든 조건 만족).
      // 동시 DELETE + INSERT 같은 극단 경로 방어용.
      throw createVersionConflictException(currentVersion, expectedVersion);
    }

    return updated as T;
  }
}
