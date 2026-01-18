# 팀별 권한 체크 로직 개선 분석

## 현재 문제점

### 1. 스키마 타입 불일치

```typescript
// packages/db/src/schema/equipment.ts
teamId: integer('team_id'),  // ❌ integer 타입

// packages/db/src/schema/teams.ts
id: uuid('id').primaryKey()  // ✅ uuid 타입
```

**문제점:**

- 타입 불일치로 인한 CAST 필요: `CAST(${equipment.teamId} AS TEXT) = ${teams.id}`
- 인덱스 활용 불가 (타입 변환으로 인해)
- 외래 키 제약 조건 설정 불가
- 쿼리 성능 저하 가능성

### 2. 현재 구현의 문제

```typescript
// checkouts.service.ts (420-427)
const teamTypeResult = await this.db
  .select({ teamType: teams.type })
  .from(equipment)
  .innerJoin(teams, sql`CAST(${equipment.teamId} AS TEXT) = ${teams.id}`)
  .where(eq(equipment.uuid, equipmentId))
  .limit(1);
```

**문제점:**

- 매번 조인 쿼리 실행 (성능 저하)
- CAST 연산으로 인한 인덱스 미활용
- 코드 중복 (checkouts, rentals 서비스에서 동일한 로직)
- 타입 안전성 부족

## 해결책 옵션 비교

### 옵션 1: 스키마 일치화 (권장 ⭐)

**구현:**

```typescript
// equipment.ts
teamId: uuid('team_id').references(() => teams.id),  // ✅ uuid + 외래 키

// Drizzle relations 사용
export const equipmentRelations = relations(equipment, ({ one }) => ({
  team: one(teams, {
    fields: [equipment.teamId],
    references: [teams.id],
  }),
}));
```

**장점:**

- ✅ 타입 안전성 보장
- ✅ 외래 키 제약 조건으로 데이터 무결성 보장
- ✅ 인덱스 활용 가능 (성능 최적화)
- ✅ Drizzle relations로 타입 안전한 조인
- ✅ 코드 간결성 향상
- ✅ 장기적으로 유지보수 용이

**단점:**

- ⚠️ 마이그레이션 필요 (기존 데이터 변환)
- ⚠️ 초기 작업량 증가

**구현 복잡도:** 중간
**장기적 이점:** 매우 높음

---

### 옵션 2: EquipmentService에 팀 정보 포함 메서드 추가

**구현:**

```typescript
// equipment.service.ts
async findOneWithTeam(uuid: string): Promise<Equipment & { team?: Team }> {
  return this.db.query.equipment.findFirst({
    where: eq(equipment.uuid, uuid),
    with: { team: true },  // Drizzle relations 사용
  });
}

// checkouts.service.ts
const equipment = await this.equipmentService.findOneWithTeam(equipmentId);
if (equipment.team?.type === 'RF' && userTeamType === 'EMC') {
  throw new ForbiddenException(...);
}
```

**장점:**

- ✅ 기존 스키마 유지 (마이그레이션 불필요)
- ✅ EquipmentService에서 중앙 관리
- ✅ 코드 재사용성 향상
- ✅ 점진적 개선 가능

**단점:**

- ⚠️ 여전히 타입 불일치 문제 존재
- ⚠️ CAST 연산 필요 (성능 이슈 지속)
- ⚠️ 외래 키 제약 조건 없음

**구현 복잡도:** 낮음
**장기적 이점:** 중간

---

### 옵션 3: 캐싱된 팀 정보 사용

**구현:**

```typescript
// equipment.service.ts
async findOne(uuid: string): Promise<Equipment> {
  // 팀 정보도 함께 캐싱
  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      const equipment = await this.db.query.equipment.findFirst({
        where: eq(equipment.uuid, uuid),
        with: { team: true },
      });
      return equipment;
    }
  );
}

// checkouts.service.ts
const equipment = await this.equipmentService.findOne(equipmentId);
if (equipment.team?.type === 'RF' && userTeamType === 'EMC') {
  throw new ForbiddenException(...);
}
```

**장점:**

- ✅ 조인 쿼리 캐싱으로 성능 향상
- ✅ 기존 스키마 유지

**단점:**

- ⚠️ 캐시 무효화 복잡도 증가
- ⚠️ 여전히 타입 불일치 문제
- ⚠️ 캐시 일관성 관리 필요

**구현 복잡도:** 중간
**장기적 이점:** 낮음

---

### 옵션 4: Denormalization (teamType 필드 추가)

**구현:**

```typescript
// equipment.ts
teamId: uuid('team_id'),
teamType: varchar('team_type', { length: 50 }),  // RF, EMC, SAR 등

// checkouts.service.ts
const equipment = await this.equipmentService.findOne(equipmentId);
if (equipment.teamType === 'RF' && userTeamType === 'EMC') {
  throw new ForbiddenException(...);
}
```

**장점:**

- ✅ 조인 불필요 (성능 최고)
- ✅ 간단한 구현
- ✅ 빠른 조회

**단점:**

- ❌ 데이터 중복
- ❌ 동기화 문제 (팀 타입 변경 시)
- ❌ 정규화 원칙 위반
- ❌ 데이터 일관성 관리 복잡

**구현 복잡도:** 낮음
**장기적 이점:** 낮음 (데이터 일관성 문제)

---

## 권장 사항

### 단기적 개선 (즉시 적용 가능)

**옵션 2: EquipmentService에 팀 정보 포함 메서드 추가**

```typescript
// equipment.service.ts
async findOneWithTeam(uuid: string): Promise<Equipment & { team?: Team }> {
  const cacheKey = this.buildCacheKey('detail-with-team', { uuid });

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      // 현재는 CAST 필요하지만, 중앙화된 로직으로 관리
      const result = await this.db
        .select({
          equipment: equipment,
          teamType: teams.type,
        })
        .from(equipment)
        .leftJoin(teams, sql`CAST(${equipment.teamId} AS TEXT) = ${teams.id}`)
        .where(and(eq(equipment.uuid, uuid), eq(equipment.isActive, true)))
        .limit(1);

      if (!result[0]) {
        throw new NotFoundException(`UUID ${uuid}의 장비를 찾을 수 없습니다.`);
      }

      return {
        ...result[0].equipment,
        team: result[0].teamType ? { type: result[0].teamType } : undefined,
      };
    },
    this.CACHE_TTL
  );
}
```

**이점:**

- 코드 중복 제거
- 중앙화된 로직 관리
- 캐싱으로 성능 개선
- 기존 스키마 유지

### 장기적 개선 (마이그레이션 계획)

**옵션 1: 스키마 일치화**

**마이그레이션 계획:**

1. `equipment.teamId`를 `integer`에서 `uuid`로 변경
2. 기존 데이터 변환 (integer -> uuid 매핑 테이블 생성)
3. 외래 키 제약 조건 추가
4. Drizzle relations 설정
5. 코드 리팩토링

**예상 작업량:**

- 마이그레이션 스크립트: 2-3시간
- 데이터 변환: 1-2시간
- 코드 리팩토링: 2-3시간
- 테스트: 2-3시간
- **총 예상 시간: 7-11시간**

---

## 결론

### 즉시 적용 (옵션 2)

- ✅ 빠른 개선 (1-2시간)
- ✅ 기존 시스템 영향 최소화
- ✅ 코드 품질 향상

### 장기 계획 (옵션 1)

- ✅ 근본적 해결
- ✅ 최적의 성능과 데이터 무결성
- ✅ 유지보수성 향상

**권장 접근:**

1. **지금:** 옵션 2로 즉시 개선 (코드 중복 제거, 중앙화)
2. **다음 스프린트:** 옵션 1 마이그레이션 계획 수립 및 실행
