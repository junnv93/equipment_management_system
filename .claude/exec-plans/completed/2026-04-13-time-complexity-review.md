---
slug: time-complexity-review
mode: 2
created: 2026-04-13
status: active
---

# Time Complexity Review — 분석 결과

## 분석된 파일 목록

- [x] `apps/backend/src/modules/data-migration/data-migration.service.ts` — 루프 내 개별 INSERT (N+1) 확인
- [x] `apps/backend/src/modules/audit/audit.service.ts` — `findByEntity` limit 없는 쿼리 확인
- [x] `apps/backend/src/modules/equipment/equipment.service.ts` — findMany, batchStatusUpdate 루프 확인
- [x] `apps/frontend/app/(dashboard)/non-conformances/non-conformances.service.ts` → `apps/backend/src/modules/non-conformances/non-conformances.service.ts` — findMany 패턴 확인 (페이지네이션 적용됨)
- [x] `apps/backend/src/modules/equipment/disposal.service.ts` — getPendingReviewRequests / getPendingApprovalRequests 확인
- [x] `apps/backend/src/modules/equipment/equipment-approval.service.ts` — getPendingApprovals, findRequestByUuid 확인
- [x] `apps/backend/src/modules/equipment/equipment-attachment.service.ts` — findByEquipmentId / findByRequestId 확인
- [x] `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` — select().from() 패턴 / 인메모리 필터 확인
- [x] `apps/frontend/components/equipment/EquipmentFilters.tsx` — .find() 반복 패턴 확인 (7개 함수)
- [x] `apps/frontend/components/teams/TeamListContent.tsx` — reduce/filter 패턴 확인
- [x] `apps/backend/src/modules/checkouts/checkouts.service.ts` — N+1 패턴 / limit 없는 조회 확인
- [x] `apps/backend/src/modules/calibration/calibration.service.ts` — limit 없는 findAllIntermediateChecks / 3중 filter 확인
- [x] `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts` — getRegistry limit 없는 전체 조회 확인
- [x] `apps/backend/src/modules/approvals/approvals.service.ts` — N+1 이미 해결됨 확인 (COUNT + SQL WHERE 푸시다운)
- [x] `apps/backend/src/modules/dashboard/dashboard.service.ts` — limit 적용 및 Promise.allSettled 병렬화 확인 (정상)
- [x] `apps/backend/src/modules/reports/reports.service.ts` — REPORT_EXPORT_ROW_LIMIT / TOP_N_LIMIT 적용 확인 (정상)

---

## 발견된 이슈

### Critical

#### [C1] apps/backend/src/modules/data-migration/data-migration.service.ts:184-213 — execute() 내 루프별 개별 INSERT (N+1)

- **실제 코드 (라인 183-213)**:
  ```typescript
  await this.db.transaction(async (tx) => {
    for (const row of validRows) {
      const entity = this.buildEntityFromRow(row, userId);
      const [created] = await tx
        .insert(equipment)
        .values(entity as typeof equipment.$inferInsert)
        .returning();                                   // ← 행마다 INSERT 1회

      if (row.data.initialLocation || row.data.location) {
        await this.equipmentHistoryService.createLocationHistoryInternal(
          created.id, { ... }, userId, tx              // ← 행마다 추가 INSERT 1회
        );
      }
      createdCount++;
    }
  });
  ```
- **현재 Big-O**: O(n) DB 왕복 — 장비 n개 마이그레이션 시 최대 2n개 쿼리
- **개선 후 Big-O**: O(1) DB 왕복 — 배치 INSERT + 배치 위치이력 INSERT
- **수정 방향**:
  1. `tx.insert(equipment).values(entities[])` 로 배치 INSERT
  2. 반환된 `created[]` 에서 위치이력 데이터 수집 후 `tx.insert(locationHistory).values(historyRows[])` 배치 INSERT
  3. `CHUNK_SIZE=100` 상수는 이미 정의되어 있으므로 chunking 재활용

- **Before/After 예시**:
  ```typescript
  // Before — n번 왕복
  for (const row of validRows) {
    const [created] = await tx.insert(equipment).values(entity).returning();
    await tx.insert(locationHistory).values({ equipmentId: created.id, ... });
  }

  // After — 2번 왕복 (chunk 단위)
  const chunks = this.chunkArray(validRows, CHUNK_SIZE);
  for (const chunk of chunks) {
    const entities = chunk.map(row => this.buildEntityFromRow(row, userId));
    const created = await tx.insert(equipment).values(entities).returning();

    const historyRows = created
      .map((eq, i) => chunk[i].data.initialLocation
        ? { equipmentId: eq.id, newLocation: chunk[i].data.initialLocation, ... }
        : null
      )
      .filter(Boolean);

    if (historyRows.length > 0) {
      await tx.insert(locationHistory).values(historyRows);
    }
  }
  ```

---

#### [C2] apps/backend/src/modules/data-migration/data-migration.service.ts:432-465 — executeMultiSheet() 장비 시트 루프별 개별 INSERT (N+1)

- **실제 코드 (라인 432-465)**:
  ```typescript
  const chunks = this.chunkArray(validRows, CHUNK_SIZE);
  for (const chunk of chunks) {
    for (const row of chunk) {                          // ← chunk를 다시 개별 반복
      const [created] = await tx
        .insert(equipment)
        .values(entity as typeof equipment.$inferInsert)
        .returning();

      if (row.managementNumber) {
        mgmtNumToId.set(row.managementNumber, created.id);
      }

      if (row.data.initialLocation || row.data.location) {
        await this.equipmentHistoryService.createLocationHistoryInternal(
          created.id, { ... }, userId, tx              // ← 행마다 추가 INSERT 1회
        );
      }
    }
  }
  ```
- **현재 Big-O**: O(n) DB 왕복 — chunk 도입했지만 chunk 내부는 여전히 row별 INSERT
- **개선 후 Big-O**: O(n/CHUNK_SIZE) DB 왕복 — chunk당 배치 INSERT 1회
- **수정 방향**: C1과 동일 — chunk 내부를 배치 INSERT로 전환. `.returning()` 에서 managementNumber 포함 반환하여 `mgmtNumToId` 맵 구축
- **Before/After 예시**:
  ```typescript
  // Before — chunk 내에서도 row별 INSERT
  for (const chunk of chunks) {
    for (const row of chunk) {
      const [created] = await tx.insert(equipment).values(entity).returning();
      mgmtNumToId.set(row.managementNumber, created.id);
    }
  }

  // After — chunk당 배치 INSERT
  for (const chunk of chunks) {
    const entities = chunk.map(row => this.buildEntityFromRow(row, userId));
    const createdRows = await tx.insert(equipment).values(entities).returning();
    createdRows.forEach((eq, i) => {
      if (chunk[i].managementNumber) mgmtNumToId.set(chunk[i].managementNumber, eq.id);
    });
    // 위치이력 배치 INSERT (C1과 동일)
  }
  ```

---

#### [C3] apps/backend/src/modules/data-migration/data-migration.service.ts:512-544, 569-596, 621-648 — 교정/수리/사고 이력 row별 INSERT

- **실제 코드 (라인 512-544 — 교정 이력 예시)**:
  ```typescript
  const chunks = this.chunkArray(validRows, CHUNK_SIZE);
  for (const chunk of chunks) {
    for (const row of chunk) {                          // ← 여기도 동일 패턴
      await tx.insert(calibrations).values({
        equipmentId,
        calibrationDate: row.data.calibrationDate as Date,
        ...
      });                                               // ← 행마다 INSERT 1회
      createdCount++;
    }
  }
  ```
- **현재 Big-O**: O(n) DB 왕복 (이력 행 수 기준)
- **개선 후 Big-O**: O(n/CHUNK_SIZE) DB 왕복
- **수정 방향**: 각 이력 타입(calibrations, repairHistory, equipmentIncidentHistory)에 대해 chunk 내부를 `values(chunkRows)` 배치 INSERT로 전환

---

### High

#### [H1] apps/backend/src/modules/audit/audit.service.ts:361-365 — findByEntity() limit 없는 전체 감사로그 스캔

- **실제 코드 (라인 361-365)**:
  ```typescript
  return this.db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.timestamp));   // ← limit 없음
  ```
- **현재 Big-O**: O(n) — 엔티티에 쌓인 감사로그 전체 반환
- **개선 후 Big-O**: O(k) — k=limit 고정값
- **수정 방향**: `findByUser()`와 동일하게 `limit` 파라미터 추가 (기본값 200 권장). 호출측(컨트롤러)에서 limit를 선택적으로 조정 가능하도록 시그니처 변경
- **Before/After 예시**:
  ```typescript
  // Before
  async findByEntity(entityType: string, entityId: string, scope?: ResolvedDataScope)

  // After
  async findByEntity(entityType: string, entityId: string, limit = 200, scope?: ResolvedDataScope) {
    ...
    return this.db.select().from(auditLogs).where(...).orderBy(...).limit(limit);
  }
  ```

#### [H2] apps/backend/src/modules/equipment/equipment-attachment.service.ts:120-132 — findByEquipmentId / findByRequestId limit 없음

- **실제 코드 (라인 120-132)**:
  ```typescript
  async findByEquipmentId(equipmentId: string): Promise<EquipmentAttachment[]> {
    return this.db.query.equipmentAttachments.findMany({
      where: eq(equipmentAttachments.equipmentId, equipmentId),
      // limit 없음
    });
  }

  async findByRequestId(requestId: string): Promise<EquipmentAttachment[]> {
    return this.db.query.equipmentAttachments.findMany({
      where: eq(equipmentAttachments.requestId, requestId),
      // limit 없음
    });
  }
  ```
- **현재 Big-O**: O(n) — 첨부파일 수에 비례
- **개선 후 Big-O**: O(k) — k=limit (50~100 적당)
- **수정 방향**: 도메인 상 첨부파일이 수백 개 이상 쌓일 가능성은 낮지만, 방어적으로 `limit: 100` 추가 권장. 또는 호출처(equipment-approval.service.ts:344)에서 페이지네이션 필요 시 별도 처리

#### [H3] apps/backend/src/modules/equipment/equipment.service.ts:1184-1186 — batchStatusUpdate() 루프 내 await invalidateCache()

- **실제 코드 (라인 1183-1186)**:
  ```typescript
  for (const row of updated) {
    await this.invalidateCache(row.id, row.teamId ?? undefined);
  }
  ```
- **현재 Big-O**: O(n) 비동기 직렬 실행 — updated 행 수만큼 캐시 무효화 순차 대기
- **개선 후 Big-O**: O(1) — Promise.all 병렬 실행 또는 배치 무효화
- **수정 방향**: `invalidateCache`는 async 함수이므로 `await Promise.all(updated.map(row => this.invalidateCache(...)))` 로 병렬 처리. 단, invalidateCache 내부에서 `invalidateAllDashboard()` 를 중복 호출하는 문제도 함께 개선 필요
- **Before/After 예시**:
  ```typescript
  // Before — 직렬 실행
  for (const row of updated) {
    await this.invalidateCache(row.id, row.teamId ?? undefined);
  }

  // After — 병렬 실행
  await Promise.all(updated.map(row => this.invalidateCache(row.id, row.teamId ?? undefined)));
  ```

#### [H4] apps/backend/src/modules/calibration-factors/calibration-factors.service.ts:352 — getRegistry() limit 없는 전체 보정계수 조회

- **실제 코드 (라인 314-382)**:
  ```typescript
  async getRegistry(site?: string, teamId?: string) {
    ...
    const rows = await query.where(and(...conditions));  // ← limit 없음
    // 장비별 보정계수를 인메모리 Map으로 그룹핑
    const grouped = new Map<string, CalibrationFactorRecord[]>();
    for (const factor of normalized) {
      const existing = grouped.get(factor.equipmentId) ?? [];
      existing.push(factor);
      grouped.set(factor.equipmentId, existing);
    }
    ...
  }
  ```
- **현재 Big-O**: O(n) — 승인된 보정계수 전체 조회 + O(n) 인메모리 그룹핑
- **개선 후 Big-O**: O(k) — 장비 수 k 기준 limit 적용 또는 DB 레벨 GROUP BY
- **수정 방향**: `getRegistry`는 보정계수 대장 전체 조회이므로 완전 제거는 어렵지만, 현재 CACHE_TTL.VERY_LONG으로 캐싱되어 있어 반복 쿼리는 완화됨. 다만 캐시 미스 시 부하가 큼 — 장비 수 기준 페이지네이션 추가 또는 DB 레벨 `GROUP BY equipmentId`로 쿼리 전환 권장
- **심각도**: High (캐시 TTL로 완화되나 캐시 미스 시 전체 스캔)

---

### Medium

#### [M1] apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:166-177 — create() 내 인메모리 연도 필터링

- **실제 코드 (라인 166-177)**:
  ```typescript
  const externalEquipments = await tx
    .select()
    .from(equipment)
    .where(and(...conditions))
    .orderBy(equipment.nextCalibrationDate);   // ← 연도 필터 없이 전체 조회

  // 해당 연도에 교정 예정인 장비만 필터링
  const filteredEquipments = externalEquipments.filter((eq) => {
    if (!eq.nextCalibrationDate) return false;
    const nextDate = new Date(eq.nextCalibrationDate);
    return nextDate >= startOfYear && nextDate < endOfYear;
  });
  ```
- **현재 Big-O**: O(n) — 사이트의 외부교정 장비 전체를 메모리에 올린 후 JS filter
- **개선 후 Big-O**: O(k) — DB WHERE 절로 연도 범위 필터링 후 k개만 반환
- **수정 방향**: `conditions` 배열에 날짜 범위 조건 추가하여 DB 레벨 필터링 적용
- **Before/After 예시**:
  ```typescript
  // Before — 인메모리 필터
  const externalEquipments = await tx.select().from(equipment).where(and(...conditions));
  const filteredEquipments = externalEquipments.filter(eq => ...);

  // After — DB 레벨 필터
  conditions.push(
    sql`${equipment.nextCalibrationDate} >= ${startOfYear.toISOString()}::timestamp`,
    sql`${equipment.nextCalibrationDate} < ${endOfYear.toISOString()}::timestamp`,
  );
  const filteredEquipments = await tx.select().from(equipment).where(and(...conditions));
  ```

#### [M2] apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:869-876 — findExternalEquipment() 인메모리 연도 필터

- **실제 코드 (라인 850-876)**:
  ```typescript
  let result = await this.db
    .select({ ... })
    .from(equipment)
    .where(and(...conditions))
    .orderBy(equipment.nextCalibrationDate);  // ← 연도 필터 없음

  if (year) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    result = result.filter((eq) => {          // ← JS에서 필터
      if (!eq.nextCalibrationDate) return false;
      const nextDate = new Date(eq.nextCalibrationDate);
      return nextDate >= startOfYear && nextDate < endOfYear;
    });
  }
  ```
- **현재 Big-O**: O(n) 전체 조회 + O(n) JS filter
- **개선 후 Big-O**: O(k) DB 레벨 필터
- **수정 방향**: M1과 동일하게 `year` 파라미터가 있을 때 `conditions` 에 날짜 범위 SQL 조건 추가

#### [M3] apps/frontend/components/equipment/EquipmentFilters.tsx:235-283 — 라벨 조회에 .find() 반복 사용 (7개 함수)

- **실제 코드 (라인 235-283)**:
  ```typescript
  const getStatusLabel = useCallback(
    (status: EquipmentStatus) => {
      return statusOptions.find((opt) => opt.value === status)?.label || status;  // O(k)
    },
    [statusOptions]
  );

  const getSiteLabel = useCallback(
    (site: Site) => {
      return siteOptions.find((opt) => opt.value === site)?.label || site;        // O(k)
    },
    [siteOptions]
  );
  // ... 동일 패턴 5개 함수 (총 7개)
  ```
- **현재 Big-O**: O(k) per lookup — 활성 필터 배지 렌더링마다 배열 선형 탐색
- **개선 후 Big-O**: O(1) per lookup — useMemo로 Map 생성 후 Map.get() 사용
- **수정 방향**: 각 options 배열을 `useMemo`로 `Map<value, label>` 으로 변환 후 lookup
- **Before/After 예시**:
  ```typescript
  // Before — 배열 .find() O(k)
  const getStatusLabel = useCallback(
    (status) => statusOptions.find(opt => opt.value === status)?.label || status,
    [statusOptions]
  );

  // After — Map.get() O(1)
  const statusLabelMap = useMemo(
    () => new Map(statusOptions.map(opt => [opt.value, opt.label])),
    [statusOptions]
  );
  const getStatusLabel = useCallback(
    (status) => statusLabelMap.get(status) || status,
    [statusLabelMap]
  );
  ```

#### [M4] apps/backend/src/modules/calibration/calibration.service.ts:1603-1622 — findAllIntermediateChecks() limit 없는 전체 조회 + 3중 인메모리 filter

- **실제 코드 (라인 1578-1622)**:
  ```typescript
  const rows = await this.db
    .select({ ... })
    .from(schema.calibrations)
    .leftJoin(schema.equipment, ...)
    .leftJoin(schema.teams, ...)
    .where(and(...whereConditions))
    .orderBy(asc(schema.calibrations.intermediateCheckDate));  // ← limit 없음

  const flattenedItems: CalibrationRecord[] = rows.map(...);

  return {
    items: flattenedItems,
    meta: {
      totalItems: flattenedItems.length,
      overdueCount: flattenedItems.filter((cal) => { ... }).length,   // ← O(n) filter 1
      pendingCount: flattenedItems.filter((cal) => { ... }).length,   // ← O(n) filter 2
      dueCount: flattenedItems.filter((cal) => { ... }).length,       // ← O(n) filter 3
    },
  };
  ```
- **현재 Big-O**: O(n) 전체 조회 + O(3n) JS filter (4회 배열 순회)
- **개선 후 Big-O**: O(n) — 단일 reduce로 카운트 통합 (전체 조회 자체는 중간점검 대상 전체가 필요하므로 유지)
- **수정 방향**:
  1. 3개의 개별 `.filter()` 호출을 단일 `reduce`로 통합하여 O(3n) → O(n)으로 개선
  2. 페이지네이션이 필요한 경우 limit/offset 추가
- **Before/After 예시**:
  ```typescript
  // Before — 3회 순회
  overdueCount: flattenedItems.filter(cal => d < today).length,
  pendingCount: flattenedItems.filter(cal => d >= today).length,
  dueCount: flattenedItems.filter(cal => d <= today).length,

  // After — 1회 순회
  const counts = flattenedItems.reduce(
    (acc, cal) => {
      if (!cal.intermediateCheckDate) return acc;
      const d = getUtcStartOfDay(new Date(cal.intermediateCheckDate));
      const t = today.getTime();
      return {
        overdueCount: acc.overdueCount + (d.getTime() < t ? 1 : 0),
        pendingCount: acc.pendingCount + (d.getTime() >= t ? 1 : 0),
        dueCount: acc.dueCount + (d.getTime() <= t ? 1 : 0),
      };
    },
    { overdueCount: 0, pendingCount: 0, dueCount: 0 }
  );
  ```

---

### Low

#### [L1] apps/frontend/components/teams/TeamListContent.tsx:108-112 — totalMemberCount/noLeaderCount 별도 reduce/filter

- **실제 코드 (라인 108-112)**:
  ```typescript
  const totalMemberCount = useMemo(
    () => teams.reduce((acc, team) => acc + (team.memberCount || 0), 0),
    [teams]
  );
  const noLeaderCount = useMemo(() => teams.filter((team) => !team.leaderName).length, [teams]);
  ```
- **현재 Big-O**: O(2n) — `teams` 배열을 reduce + filter로 2회 순회
- **개선 후 Big-O**: O(n) — 단일 reduce로 합산
- **수정 방향**: 두 집계를 단일 `useMemo`로 합침
- **Before/After 예시**:
  ```typescript
  // Before — 2회 순회
  const totalMemberCount = useMemo(() => teams.reduce(...), [teams]);
  const noLeaderCount = useMemo(() => teams.filter(...).length, [teams]);

  // After — 1회 순회
  const { totalMemberCount, noLeaderCount } = useMemo(() =>
    teams.reduce(
      (acc, team) => ({
        totalMemberCount: acc.totalMemberCount + (team.memberCount || 0),
        noLeaderCount: acc.noLeaderCount + (team.leaderName ? 0 : 1),
      }),
      { totalMemberCount: 0, noLeaderCount: 0 }
    ),
    [teams]
  );
  ```

#### [L2] apps/frontend/components/teams/TeamListContent.tsx:307-311 — SitePanel 내 memberCount/noLeaderCount 재계산

- **실제 코드 (라인 307-311)**:
  ```typescript
  const memberCount = useMemo(
    () => teams.reduce((acc, team) => acc + (team.memberCount || 0), 0),
    [teams]
  );
  const noLeaderCount = useMemo(() => teams.filter((team) => !team.leaderName).length, [teams]);
  ```
- **현재 Big-O**: O(2n) — SitePanel 컴포넌트에서도 L1과 동일한 이중 순회
- **개선 후 Big-O**: O(n) — 단일 reduce로 합산
- **수정 방향**: L1과 동일하게 단일 `useMemo`로 통합

#### [L3] apps/backend/src/modules/checkouts/checkouts.service.ts:2108-2118 — getConditionChecks() limit 없는 조회

- **실제 코드 (라인 2108-2118)**:
  ```typescript
  const rows = await this.db
    .select({ ... })
    .from(conditionChecks)
    .leftJoin(schema.users, ...)
    .where(eq(conditionChecks.checkoutId, uuid))
    .orderBy(asc(conditionChecks.checkedAt));   // ← limit 없음
  ```
- **현재 Big-O**: O(n) — 반출 1건의 상태확인 이력 전체 반환
- **개선 후 Big-O**: O(k) — k=limit (도메인 상 최대 4~8 단계)
- **수정 방향**: 도메인 상 반출 1건당 최대 4단계(lender_checkout/return, borrower_received/returned) 이므로 현실적 위험은 낮음. 방어적으로 `limit: 20` 추가 권장
- **심각도**: Low (도메인 제약상 데이터 적음)

---

## 요약 테이블

| 순위 | 파일 | 라인 | 패턴 | 심각도 | 현재 | 개선 후 |
|------|------|------|------|--------|------|---------|
| 1 | `apps/backend/src/modules/data-migration/data-migration.service.ts` | 183-213 | 루프 내 개별 INSERT (단일시트) | Critical | O(2n) DB | O(1) DB |
| 2 | `apps/backend/src/modules/data-migration/data-migration.service.ts` | 432-465 | 루프 내 개별 INSERT (멀티시트 장비) | Critical | O(2n) DB | O(n/CHUNK) DB |
| 3 | `apps/backend/src/modules/data-migration/data-migration.service.ts` | 512-648 | 루프 내 개별 INSERT (교정/수리/사고) | Critical | O(n) DB | O(n/CHUNK) DB |
| 4 | `apps/backend/src/modules/audit/audit.service.ts` | 361-365 | limit 없는 감사로그 전체 스캔 | High | O(n) | O(k) |
| 5 | `apps/backend/src/modules/equipment/equipment-attachment.service.ts` | 120-132 | limit 없는 첨부파일 전체 조회 | High | O(n) | O(k) |
| 6 | `apps/backend/src/modules/equipment/equipment.service.ts` | 1184-1186 | 루프 내 직렬 await invalidateCache | High | O(n) 직렬 | O(1) 병렬 |
| 7 | `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts` | 352 | getRegistry() limit 없는 전체 보정계수 조회 | High | O(n)+O(n) | O(k) 또는 DB GROUP BY |
| 8 | `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` | 166-177 | 인메모리 연도 필터링 (계획 생성) | Medium | O(n)+O(n) JS | O(k) DB |
| 9 | `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` | 869-876 | 인메모리 연도 필터링 (외부교정 조회) | Medium | O(n)+O(n) JS | O(k) DB |
| 10 | `apps/frontend/components/equipment/EquipmentFilters.tsx` | 235-283 | 배지 라벨 .find() 반복 (7개 함수) | Medium | O(k) per call | O(1) per call |
| 11 | `apps/backend/src/modules/calibration/calibration.service.ts` | 1603-1622 | findAllIntermediateChecks() 3중 인메모리 filter | Medium | O(3n) JS | O(n) JS |
| 12 | `apps/frontend/components/teams/TeamListContent.tsx` | 108-112 | totalMemberCount + noLeaderCount 이중 순회 | Low | O(2n) | O(n) |
| 13 | `apps/frontend/components/teams/TeamListContent.tsx` | 307-311 | SitePanel 내 이중 순회 | Low | O(2n) | O(n) |
| 14 | `apps/backend/src/modules/checkouts/checkouts.service.ts` | 2108-2118 | getConditionChecks() limit 없는 조회 | Low | O(n) | O(k) |

---

## 추가 참고사항

### 문제 없음으로 확인된 항목 (오탐 방지)

- **equipment.service.ts:1560** — `findMany(where, limit: pageSize, offset)` — 페이지네이션 적용됨 ✅
- **equipment.service.ts:1612** — `findMany(where, limit: 500)` — 하드 limit 있음 ✅
- **non-conformances.service.ts:349** — `findMany(where, limit: pageSize, offset)` — 페이지네이션 적용됨 ✅
- **disposal.service.ts:641,696** — `inArray(filteredIds)` 패턴 — 먼저 JOIN으로 limit된 ID 추출 후 관계 로드, 안전함 ✅
- **equipment-approval.service.ts:265** — `findMany(where, limit: DASHBOARD_ITEM_LIMIT)` — limit 있음 ✅
- **calibration-plans.service.ts:919** — `for (const planId of planIds)` — DB 호출 없는 캐시 키 삭제, 루프 안 await 없음 ✅
- **TeamListContent.tsx:siteTeams** — `teams.forEach()` — O(n) 단일 순회, 정상 ✅
- **approvals.service.ts:1032** — N+1 이미 해결 — COUNT + SQL WHERE 푸시다운으로 개선됨 ✅
- **checkouts.service.ts:1077** — `findByIds` 배치 조회 — N+1 방지 이미 적용됨 ✅
- **dashboard.service.ts** — `DASHBOARD_ITEM_LIMIT+1` 패턴 + Promise.allSettled 병렬화 — 정상 ✅
- **reports.service.ts** — `REPORT_EXPORT_ROW_LIMIT` / `TOP_N_LIMIT` 일관 적용 — 정상 ✅
- **notifications.service.ts** — 페이지네이션 및 limit 적용됨 — 정상 ✅
- **calibration-factors.service.ts:findAll** — 페이지네이션 적용됨 ✅ (getRegistry만 이슈)
