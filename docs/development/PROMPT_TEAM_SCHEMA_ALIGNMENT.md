# 프롬프트: 장비-팀 스키마 일치화 및 팀별 권한 체크 근본적 개선

## 개요

현재 `equipment.teamId`는 `integer` 타입이고 `teams.id`는 `uuid` 타입으로, 타입 불일치로 인해 다음과 같은 문제가 발생합니다:

1. **CAST 연산 필요**: `CAST(${equipment.teamId} AS TEXT) = ${teams.id}`로 인한 성능 저하
2. **인덱스 미활용**: 타입 변환으로 인해 인덱스를 활용할 수 없음
3. **외래 키 제약 조건 없음**: 데이터 무결성 보장 불가
4. **코드 중복**: checkouts, rentals 서비스에서 동일한 CAST 조인 로직 반복
5. **타입 안전성 부족**: 런타임 오류 가능성

이 프롬프트는 **장기적 근본 해결책**으로 스키마를 완전히 일치시키고, Drizzle relations를 활용한 타입 안전한 조인으로 전환하는 것을 목표로 합니다.

---

## 목표

1. ✅ `equipment.teamId`를 `integer`에서 `uuid`로 변경
2. ✅ 외래 키 제약 조건 추가로 데이터 무결성 보장
3. ✅ Drizzle relations 설정으로 타입 안전한 조인 가능
4. ✅ CAST 연산 제거 및 인덱스 활용으로 성능 최적화
5. ✅ 코드 중복 제거 및 간결성 향상
6. ✅ 모든 관련 코드 리팩토링

---

## 작업 단계

### 1단계: 기존 데이터 분석 및 매핑 테이블 생성

**목적**: 기존 `integer` 타입의 `teamId`를 `uuid`로 변환하기 위한 매핑 전략 수립

**작업 내용:**

1. 현재 `equipment` 테이블의 `team_id` 값 분포 확인
2. `teams` 테이블의 모든 팀 ID 조회
3. integer -> uuid 매핑 전략 수립
   - 옵션 A: teams 테이블에 임시 `legacy_id` 컬럼 추가하여 매핑
   - 옵션 B: 매핑 테이블 생성 (`team_id_mapping`)
   - 옵션 C: teams 테이블의 기존 데이터 패턴 분석하여 자동 매핑

**확인 사항:**

- 기존 `equipment.teamId` 값이 실제로 `teams` 테이블의 어떤 레코드를 참조하는지
- NULL 값 처리 방법
- 데이터 손실 없이 변환 가능한지

---

### 2단계: 마이그레이션 스크립트 작성

**파일**: `apps/backend/drizzle/0007_convert_equipment_team_id_to_uuid.sql`

**마이그레이션 내용:**

```sql
-- 1. 임시 컬럼 추가 (새로운 uuid 타입의 team_id)
ALTER TABLE "equipment"
  ADD COLUMN IF NOT EXISTS "team_id_new" UUID;

-- 2. teams 테이블에 임시 legacy_id 컬럼 추가 (기존 integer ID 매핑용)
-- 또는 매핑 테이블 생성
CREATE TABLE IF NOT EXISTS "team_id_mapping" (
  "legacy_id" INTEGER PRIMARY KEY,
  "uuid" UUID NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 3. 기존 데이터 매핑
-- 방법 1: teams 테이블에 legacy_id가 있는 경우
UPDATE "equipment" e
SET "team_id_new" = t.id
FROM "teams" t
WHERE CAST(e.team_id AS TEXT) = t.id::TEXT
  AND e.team_id IS NOT NULL;

-- 방법 2: 매핑 테이블 사용
UPDATE "equipment" e
SET "team_id_new" = m.uuid
FROM "team_id_mapping" m
WHERE e.team_id = m.legacy_id
  AND e.team_id IS NOT NULL;

-- 4. NULL 값 처리 (team_id가 없는 경우는 NULL 유지)
-- 이미 처리됨

-- 5. 기존 컬럼 삭제 및 새 컬럼으로 교체
ALTER TABLE "equipment"
  DROP COLUMN IF EXISTS "team_id";

ALTER TABLE "equipment"
  RENAME COLUMN "team_id_new" TO "team_id";

-- 6. 외래 키 제약 조건 추가
ALTER TABLE "equipment"
  ADD CONSTRAINT "equipment_team_id_fkey"
  FOREIGN KEY ("team_id")
  REFERENCES "teams"("id")
  ON DELETE SET NULL;

-- 7. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS "equipment_team_id_idx" ON "equipment" ("team_id");

-- 8. 임시 테이블/컬럼 정리
DROP TABLE IF EXISTS "team_id_mapping";
-- teams 테이블의 legacy_id 컬럼도 제거 (있는 경우)
```

**주의사항:**

- 프로덕션 환경에서는 트랜잭션으로 감싸서 롤백 가능하도록
- 데이터 백업 필수
- 단계별 검증 필요

---

### 3단계: Drizzle 스키마 수정

**파일**: `packages/db/src/schema/equipment.ts`

**변경 내용:**

```typescript
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams } from './teams';

export const equipment = pgTable(
  'equipment',
  {
    // ... 기존 필드들 ...

    // 관리 정보
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }), // ✅ uuid + 외래 키
    managerId: varchar('manager_id', { length: 36 }),
    site: varchar('site', { length: 20 }),
    // ... 나머지 필드들 ...
  },
  (table) => {
    return {
      // ... 기존 인덱스들 ...
      teamIdIdx: index('equipment_team_id_idx').on(table.teamId), // 인덱스 추가
    };
  }
);

// ✅ Drizzle relations 설정
export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  team: one(teams, {
    fields: [equipment.teamId],
    references: [teams.id],
  }),
  // ... 기존 relations ...
}));
```

**파일**: `packages/db/src/schema/teams.ts`

**변경 내용:**

```typescript
// teamsRelations는 이미 정의되어 있지만, equipment relation과 일치하는지 확인
export const teamsRelations = relations(teams, ({ many }) => ({
  equipments: many(equipment), // ✅ 이미 정의되어 있음
}));
```

---

### 4단계: 코드 리팩토링

#### 4.1 EquipmentService 개선

**파일**: `apps/backend/src/modules/equipment/equipment.service.ts`

**변경 내용:**

```typescript
// 기존: CAST를 사용한 조인
// 제거: getEquipmentTeamType 메서드 (더 이상 필요 없음)

// 개선: Drizzle relations를 사용한 타입 안전한 조인
async findOne(uuid: string): Promise<Equipment> {
  const cacheKey = this.buildCacheKey('detail', { uuid });

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      try {
        // ✅ Drizzle relations 사용 (CAST 불필요)
        const equipmentData = await this.db.query.equipment.findFirst({
          where: and(eq(equipment.uuid, uuid), eq(equipment.isActive, true)),
          with: {
            team: true, // ✅ 타입 안전한 조인
          },
        });

        if (!equipmentData) {
          throw new NotFoundException(`UUID ${uuid}의 장비를 찾을 수 없습니다.`);
        }

        return equipmentData;
      } catch (error) {
        // ... 에러 처리 ...
      }
    },
    this.CACHE_TTL
  );
}

// ✅ 팀 타입 조회 헬퍼 메서드 (간단해짐)
async getEquipmentTeamType(uuid: string): Promise<string | null> {
  const equipmentData = await this.findOne(uuid);
  return equipmentData.team?.type || null;
}
```

#### 4.2 CheckoutsService 개선

**파일**: `apps/backend/src/modules/checkouts/checkouts.service.ts`

**변경 내용:**

```typescript
// 기존 (420-427 라인): CAST를 사용한 조인
// ❌ 제거
const teamTypeResult = await this.db
  .select({ teamType: teams.type })
  .from(equipment)
  .innerJoin(teams, sql`CAST(${equipment.teamId} AS TEXT) = ${teams.id}`)
  .where(eq(equipment.uuid, equipmentId))
  .limit(1);

// ✅ 개선: EquipmentService의 헬퍼 메서드 사용
private async checkTeamPermission(
  equipmentId: string,
  userTeamId?: string
): Promise<void> {
  if (!userTeamId) {
    return;
  }

  // 장비 정보 조회 (팀 정보 포함)
  const equipment = await this.equipmentService.findOne(equipmentId);

  if (!equipment.teamId) {
    return; // 팀이 없으면 체크하지 않음
  }

  // 사용자 팀 정보 조회
  const userTeam = await this.teamsService.findOne(userTeamId);
  if (!userTeam) {
    return;
  }

  const userTeamType = userTeam.type?.toUpperCase();
  const equipmentTeamType = equipment.team?.type?.toUpperCase();

  // EMC팀은 RF팀 장비 반출 신청/승인 불가
  if (userTeamType === 'EMC' && equipmentTeamType === 'RF') {
    throw new ForbiddenException(
      'EMC팀은 RF팀 장비에 대한 반출 신청/승인 권한이 없습니다.'
    );
  }
}
```

#### 4.3 RentalsService 개선

**파일**: `apps/backend/src/modules/rentals/rentals.service.ts`

**변경 내용:**

```typescript
// CheckoutsService와 동일한 패턴으로 개선
// CAST 조인 제거, EquipmentService 활용
```

---

### 5단계: 타입 정의 업데이트

**파일**: `packages/db/src/schema/equipment.ts`

**변경 내용:**

```typescript
// EquipmentWithRelations 타입 업데이트
export type EquipmentWithRelations = Equipment & {
  team?: typeof teams.$inferSelect; // ✅ 이제 실제로 사용 가능
  manager?: typeof users.$inferSelect;
  loans?: Array<typeof loans.$inferSelect>;
};
```

**파일**: `packages/schemas/src/equipment.ts`

**확인 사항:**

- `teamId` 필드 타입이 `string | null` (uuid)로 올바르게 정의되어 있는지
- Zod 스키마가 uuid 형식을 검증하는지

---

### 6단계: 테스트 작성 및 업데이트

#### 6.1 단위 테스트

**파일**: `apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts`

**추가 테스트:**

```typescript
describe('findOne with team relation', () => {
  it('should return equipment with team information', async () => {
    // 팀 생성
    const team = await teamsService.create({
      id: 'test-team-uuid',
      name: 'RF Team',
      type: 'RF',
    });

    // 장비 생성 (팀 연결)
    const equipment = await service.create({
      name: 'Test Equipment',
      managementNumber: 'TEST-001',
      teamId: team.id, // ✅ uuid 타입
      status: 'available',
    });

    // 조회 (팀 정보 포함)
    const result = await service.findOne(equipment.uuid);

    expect(result.team).toBeDefined();
    expect(result.team?.type).toBe('RF');
  });
});
```

#### 6.2 E2E 테스트

**파일**: `apps/backend/test/team-permissions.e2e-spec.ts`

**추가 테스트:**

```typescript
describe('팀별 권한 체크 (스키마 일치화 후)', () => {
  it('EMC팀은 RF팀 장비 반출 신청 불가', async () => {
    // RF팀 생성
    const rfTeam = await createTeam({ type: 'RF' });

    // RF팀 장비 생성
    const rfEquipment = await createEquipment({ teamId: rfTeam.id });

    // EMC팀 사용자로 로그인
    const emcToken = await loginAsEMCUser();

    // 반출 신청 시도 (실패해야 함)
    await request(app.getHttpServer())
      .post('/checkouts')
      .set('Authorization', `Bearer ${emcToken}`)
      .send({
        equipmentIds: [rfEquipment.uuid],
        // ... 기타 필드
      })
      .expect(403); // Forbidden
  });
});
```

---

### 7단계: 마이그레이션 실행 및 검증

**실행 순서:**

```bash
# 1. 마이그레이션 스크립트 검토
cat apps/backend/drizzle/0007_convert_equipment_team_id_to_uuid.sql

# 2. 개발 환경에서 테스트 실행
cd apps/backend
pnpm db:migrate

# 3. 데이터 검증
pnpm db:verify

# 4. 타입 체크
pnpm tsc --noEmit

# 5. 테스트 실행
pnpm test
pnpm test:e2e
```

**검증 체크리스트:**

- [ ] 모든 `equipment.teamId` 값이 올바르게 uuid로 변환되었는지
- [ ] NULL 값이 올바르게 처리되었는지
- [ ] 외래 키 제약 조건이 정상 작동하는지
- [ ] 인덱스가 생성되었는지
- [ ] 기존 기능이 정상 작동하는지
- [ ] 팀별 권한 체크가 올바르게 작동하는지

---

## 예상 결과

### Before (현재)

```typescript
// CAST 필요, 성능 저하, 타입 안전성 부족
const teamTypeResult = await this.db
  .select({ teamType: teams.type })
  .from(equipment)
  .innerJoin(teams, sql`CAST(${equipment.teamId} AS TEXT) = ${teams.id}`)
  .where(eq(equipment.uuid, equipmentId))
  .limit(1);
```

### After (개선 후)

```typescript
// 타입 안전, 인덱스 활용, 간결한 코드
const equipment = await this.equipmentService.findOne(equipmentId);
const teamType = equipment.team?.type; // ✅ 간단하고 안전
```

---

## 주의사항

1. **데이터 백업 필수**: 마이그레이션 전 반드시 데이터베이스 백업
2. **단계별 검증**: 각 단계마다 데이터 무결성 확인
3. **롤백 계획**: 문제 발생 시 롤백 방법 준비
4. **프로덕션 배포**: 개발 환경에서 충분한 테스트 후 배포
5. **다운타임 고려**: 대용량 데이터의 경우 다운타임 필요할 수 있음

---

## 성공 기준

- [ ] `equipment.teamId`가 `uuid` 타입으로 변경됨
- [ ] 외래 키 제약 조건이 정상 작동함
- [ ] Drizzle relations를 사용한 조인이 작동함
- [ ] CAST 연산이 모든 코드에서 제거됨
- [ ] 팀별 권한 체크가 올바르게 작동함
- [ ] 모든 테스트 통과
- [ ] 성능 개선 확인 (인덱스 활용)
- [ ] 타입 안전성 보장

---

## 참고 자료

- [Drizzle Relations 문서](https://orm.drizzle.team/docs/relations)
- [PostgreSQL Foreign Key 문서](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Drizzle Migrations 문서](https://orm.drizzle.team/docs/migrations)

---

**이 프롬프트를 따라 작업하면 장기적으로 유지보수 가능하고 성능이 최적화된 구조로 개선됩니다.**
