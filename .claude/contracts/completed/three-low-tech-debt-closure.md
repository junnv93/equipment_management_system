# Contract: three-low-tech-debt-closure

**Mode**: 1 (Lightweight)
**Slug**: `three-low-tech-debt-closure`
**Started**: 2026-05-09
**Owner**: harness session

## Scope

`.claude/exec-plans/tech-debt-tracker.md` 3개 LOW priority 항목 통합 closure:
1. `calibration-history-result-filter-type-narrowing`
2. `sort-rejection-telemetry`
3. `notifications-teams-default-sort-spec`

## MUST Criteria (P/F)

### M-1: ResultFilter SSOT 정합 (Calibration)

`apps/frontend/components/equipment/CalibrationHistoryClient.tsx`:
- [ ] line 54의 인라인 union `'' | 'pass' | 'fail' | 'conditional'` 제거
- [ ] `'' | CalibrationResult` 타입으로 좁힘 (`@equipment-management/schemas` import)
- [ ] 모든 ResultFilter 참조 위치 (line 120, 145, 154) 타입 호환 유지
- [ ] tsc --noEmit PASS

**검증**:
```bash
grep -n "type ResultFilter" apps/frontend/components/equipment/CalibrationHistoryClient.tsx
# Expected: type ResultFilter = '' | CalibrationResult;
grep -n "from '@equipment-management/schemas'" apps/frontend/components/equipment/CalibrationHistoryClient.tsx | grep CalibrationResult
# Expected: CalibrationResult가 type-only import로 포함
```

### M-2: Sort Rejection Telemetry — 보안 이벤트 logging

새 service 추가: `apps/backend/src/common/security/`:

- [ ] `contract.ts` — `SORT_REJECTION_TELEMETRY` Symbol DI 토큰 + `SortRejectionTelemetry` 인터페이스 + `SortRejectionEvent` 타입
- [ ] `sort-rejection-telemetry.service.ts` — `@Injectable()` 구현체, in-memory rate limit (분당 최대 60회) + dedupe (동일 route+invalidValue 1분)
- [ ] `security.module.ts` 등록 (또는 기존 SecurityModule에 통합) — global module
- [ ] `error.filter.ts` ZodError 분기에서 sort 관련 issue 감지 + telemetry 호출
- [ ] PII deny-list: 요청 본문/헤더/쿼리 캡처 금지. invalidValue (sort 필드 값만), normalizedRoute, httpMethod, userId만 캡처
- [ ] zod v4 호환: `code === 'invalid_value'` (enum reject) 또는 `code === 'too_big'` (max length 초과 — DoS 시도) 감지 — `path[0] === 'sort'`
- [ ] Logger.warn 로 structured payload 출력 (SIEM ingest 가능 형식)
- [ ] fire-and-forget — telemetry 실패가 응답 흐름 차단 금지

**검증**:
```bash
test -f apps/backend/src/common/security/contract.ts
test -f apps/backend/src/common/security/sort-rejection-telemetry.service.ts
grep -c "SORT_REJECTION_TELEMETRY" apps/backend/src/common/security/contract.ts
grep -c "sortRejectionTelemetry" apps/backend/src/common/filters/error.filter.ts
# Expected: ≥ 2 (constructor inject + ZodError branch usage)
```

### M-3: Default Sort Spec — notifications + teams

신규 spec 추가:
- [ ] `apps/backend/src/modules/notifications/__tests__/notification-sort-mapper.spec.ts` — `resolveNotificationOrderBy(undefined)` → `desc(notifications.createdAt)` 검증
- [ ] `apps/backend/src/modules/teams/__tests__/team-sort-mapper.spec.ts` — `resolveTeamOrderBy(undefined)` → `asc(teams.name)` 검증

**검증**:
```bash
test -f apps/backend/src/modules/notifications/__tests__/notification-sort-mapper.spec.ts
test -f apps/backend/src/modules/teams/__tests__/team-sort-mapper.spec.ts
pnpm --filter backend run test -- --testPathPattern="(notification|team)-sort-mapper"
# Expected: PASS
```

### M-4: Sort Rejection Telemetry Spec

- [ ] `apps/backend/src/common/security/__tests__/sort-rejection-telemetry.spec.ts` — service 단위 테스트
  - rate limit 발동 (61번째 호출 drop)
  - dedupe (동일 key 1분 내 2번째 호출 drop)
  - 정상 호출 logger.warn 호출 검증
  - 1분 경과 후 dedupe 해제

**검증**:
```bash
test -f apps/backend/src/common/security/__tests__/sort-rejection-telemetry.spec.ts
pnpm --filter backend run test -- --testPathPattern="sort-rejection-telemetry"
# Expected: PASS, ≥ 4 cases
```

### M-5: Build + Type Safety

- [ ] `pnpm tsc --noEmit` PASS (backend + frontend)
- [ ] `pnpm --filter backend run test` PASS (전체)
- [ ] 신규 `any` 0건 (verify-zod Step 16)
- [ ] 신규 인라인 ErrorCode literal 0건

**검증**:
```bash
pnpm tsc --noEmit 2>&1 | grep -i "error" | head -5
# Expected: empty
pnpm --filter backend run test 2>&1 | tail -5
# Expected: PASS suites
```

### M-6: SSOT 준수

- [ ] 신규 enum 값 / 상수 정의 시 `@equipment-management/schemas` 또는 `@equipment-management/shared-constants` 사용
- [ ] 하드코딩된 sort field name 0건 (sort mapper 경유)
- [ ] 인라인 ErrorCode literal 0건 (ErrorCode enum 사용)

**검증**:
```bash
# CalibrationHistoryClient.tsx — 인라인 union 제거 확인
! grep -n "'pass' | 'fail' | 'conditional'" apps/frontend/components/equipment/CalibrationHistoryClient.tsx
# Sort rejection telemetry — code: '...' 인라인 literal 0건 (ErrorCode enum 사용)
! grep -nE "code: ['\"][A-Z_]{3,}['\"]" apps/backend/src/common/security/*.ts
```

## SHOULD Criteria (post-PR follow-up)

### S-1: Cluster mode (PM2 / K8s replicas)

본 sprint의 SortRejectionTelemetryService는 **단일 인스턴스 가정** in-memory rate limiter 사용.
- 클러스터 모드 배포 시 Redis 기반으로 격상 필요 (memory: "Fire-and-forget INSERT 단일 인스턴스 가정")
- system-health Redis Lua atomic counter 패턴 차용 가능

### S-2: Frontend ResultFilter UI 옵션 동기화

CalibrationResult enum 값이 추가될 시 UI Select 옵션도 함께 업데이트 필요:
- `SelectItem value="pass"` 등 하드코딩된 옵션 → CALIBRATION_RESULT_VALUES iter
- 트리거: 신규 result 값 추가 시 (예: 'partial_pass')

### S-3: Sort Rejection Metrics → Prometheus

현재는 `Logger.warn`만. SystemErrorEvent metrics와 비슷하게 Prometheus counter 추가 가능:
- `sort_rejection_total{route, http_method}` — SIEM/dashboard alert 가능

## Verification Workflow

```bash
# 1. 타입 검증
pnpm tsc --noEmit

# 2. backend 단위 테스트
pnpm --filter backend run test -- --testPathPattern="(notification-sort-mapper|team-sort-mapper|sort-rejection-telemetry)"

# 3. backend 전체 테스트
pnpm --filter backend run test

# 4. lint
pnpm lint

# 5. verify-implementation (선택)
# verify-zod Step 16, verify-ssot Step 37 등 적용
```

## Files Affected (예상)

| Path | Action | Purpose |
|------|--------|---------|
| `apps/frontend/components/equipment/CalibrationHistoryClient.tsx` | Edit | ResultFilter SSOT |
| `apps/backend/src/common/security/contract.ts` | Create | DI 토큰 + 인터페이스 |
| `apps/backend/src/common/security/sort-rejection-telemetry.service.ts` | Create | Service 구현 |
| `apps/backend/src/common/security/security.module.ts` | Create | NestJS module |
| `apps/backend/src/common/security/__tests__/sort-rejection-telemetry.spec.ts` | Create | Service spec |
| `apps/backend/src/common/filters/error.filter.ts` | Edit | ZodError 분기 + telemetry inject |
| `apps/backend/src/app.module.ts` | Edit | SecurityModule import |
| `apps/backend/src/modules/notifications/__tests__/notification-sort-mapper.spec.ts` | Create | Default sort spec |
| `apps/backend/src/modules/teams/__tests__/team-sort-mapper.spec.ts` | Create | Default sort spec |
| `.claude/exec-plans/tech-debt-tracker.md` | Edit | 3 항목 [x] mark |

**총 추정**: 10 files (4 edit + 6 create)
