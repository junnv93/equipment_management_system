---
name: verify-cache-events
description: 이벤트 기반 캐시 무효화 아키텍처 검증 — emit/emitAsync 선택 일관성, 리스너 Promise 반환, 레지스트리 커버리지, SSOT 캐시 키 패턴
---

# verify-cache-events — 이벤트 기반 캐시 무효화 검증

## Purpose

73차 해네스에서 발견된 근본 아키텍처 결함을 기반으로 한 상시 검증:

1. **이벤트 레지스트리 dead coverage** — 서비스가 `emitAsync`로 발행했으나 `CACHE_INVALIDATION_REGISTRY`에 미등록 → 캐시 무효화 no-op → stale read
2. **리스너 Promise 반환 누락** — `eventEmitter.on(name, (p) => ...)` 콜백이 undefined 반환 시 `emitAsync` 의미 없음 → fire-and-forget 회귀
3. **캐시 키 정규식 JSON sorted keys 함정** — `{"uuid":"..."}` 선두 가정 시 `includeTeam` 필드 있으면 매칭 실패 → 캐시 무효화 no-op
4. **SSOT 캐시 키 패턴 바이패스** — `cache-patterns.ts`의 `buildDetailCachePattern` 대신 인라인 정규식 사용

## When to Run

- `cache-event.registry.ts`, `cache-invalidation.helper.ts`, `cache-event-listener.ts` 편집 후
- 서비스에 새 이벤트 `emit`/`emitAsync` 추가 후
- `deleteByPattern` 인라인 정규식 작성 시
- verify-implementation 통합 실행 시

## Related Files

| File | Purpose |
|---|---|
| `apps/backend/src/common/cache/cache-event.registry.ts` | `CACHE_INVALIDATION_REGISTRY` SSOT |
| `apps/backend/src/common/cache/cache-event-listener.ts` | 이벤트 리스너 (async Promise 반환 필수) |
| `apps/backend/src/common/cache/cache-invalidation.helper.ts` | helper 메서드 |
| `apps/backend/src/common/cache/cache-patterns.ts` | `buildDetailCachePattern` 등 SSOT 빌더 |
| `apps/backend/src/common/cache/cache-events.ts` | `CACHE_EVENTS` 상수 (캐시 전용 이벤트 SSOT) |
| `apps/backend/src/modules/notifications/events/notification-events.ts` | `NOTIFICATION_EVENTS` 상수 (알림+캐시 복합 이벤트) |
| `apps/backend/src/modules/**/*.service.ts` | `emitAsync` 발행처 (SSOT 위치) |
| `apps/backend/src/modules/**/*.controller.ts` | `emitAsync` 컨트롤러 발행 탐지 대상 (Step 4a) |

## Workflow

### Step 1: 이벤트 레지스트리 커버리지 (Critical)

서비스가 `emitAsync`로 발행하는 이벤트 상수가 모두 `CACHE_INVALIDATION_REGISTRY`에 등록되어 있는지 확인한다.

```bash
# 서비스에서 emitAsync 발행하는 이벤트명 추출 (NOTIFICATION_EVENTS + CACHE_EVENTS 양쪽)
grep -rhoP 'emitAsync\((NOTIFICATION_EVENTS|CACHE_EVENTS)\.\K[A-Z_]+' \
  apps/backend/src/modules/ | sort -u > /tmp/emitted.txt

# 레지스트리에 등록된 이벤트명 추출 (NOTIFICATION_EVENTS + CACHE_EVENTS 양쪽)
grep -oP '\[(NOTIFICATION_EVENTS|CACHE_EVENTS)\.\K[A-Z_]+' \
  apps/backend/src/common/cache/cache-event.registry.ts | sort -u > /tmp/registered.txt

# 발행은 되지만 레지스트리 누락 (dead coverage)
comm -23 /tmp/emitted.txt /tmp/registered.txt
```

**기대 결과**: 빈 출력. 출력이 있으면 각 이벤트를 `cache-event.registry.ts`에 등록하거나 명시적 예외 주석 필요.

**예외**: 스케줄러(`schedulers/`)가 발행하는 이벤트는 fire-and-forget(`emit`) 유지 의도이므로 이 검사에서 제외된다.

### Step 2: 리스너 async Promise 반환 (Critical)

`CacheEventListener.onModuleInit`의 `this.eventEmitter.on(eventName, ...)` 콜백이 async 함수여야 한다. 아니면 `emitAsync`가 await할 Promise 없음.

```bash
# 반드시 async 키워드 포함
grep -A 1 "this.eventEmitter.on(eventName" \
  apps/backend/src/common/cache/cache-event-listener.ts \
  | grep -q "async (payload" && echo "PASS: async callback" || echo "FAIL: non-async callback"
```

**기대 결과**: `PASS: async callback`.

**위반 예**: `(payload) => this.handleEvent(...).catch(...)` — callback이 undefined 반환 → emitAsync fire-and-forget 회귀.

**올바른 예**:
```typescript
this.eventEmitter.on(eventName, async (payload) => {
  try { await this.handleEvent(eventName, payload); }
  catch (err) { this.logger.error(...); }  // 로그만, resolve 유지
});
```

### Step 3: SSOT 캐시 키 패턴 빌더 사용 (Warning)

`deleteByPattern`의 detail 정규식은 `buildDetailCachePattern` SSOT를 사용해야 한다. 인라인 정규식은 JSON sorted keys 함정 위험.

```bash
# helper 외부에서 인라인 detail 정규식 사용 탐지
grep -rnP 'deleteByPattern\(`[^`]*detail:\\\\\{' \
  apps/backend/src/ \
  --include="*.service.ts" --include="*.helper.ts" \
  | grep -v "cache-patterns.ts"
```

**기대 결과**: 빈 출력. 출력이 있으면 `buildDetailCachePattern(prefix, field, id)`로 교체.

**근거**: `buildCacheKey({ uuid, includeTeam })`는 JSON sorted keys로 `{"includeTeam":false,"uuid":"..."}` 생성 — `uuid` 선두 가정 정규식은 매칭 실패.

### Step 4: emitAsync vs emit 선택 일관성 (Info)

cross-entity 캐시 무효화 필요한 이벤트는 `emitAsync` 사용 필수. 대시보드 통계만 영향 있는 이벤트는 `emit` 허용(스케줄러 계열).

```bash
# 서비스 파일에서 emit (fire-and-forget) 호출 탐지 (스케줄러 제외, NOTIFICATION/CACHE 양쪽)
grep -rnP 'this\.eventEmitter\.emit\((NOTIFICATION_EVENTS|CACHE_EVENTS)' \
  apps/backend/src/modules/ \
  --include="*.service.ts" \
  | grep -v "schedulers/"
```

**기대 결과**: 빈 출력. 있으면 `await emitAsync(...)`로 전환 여부 검토.

**예외**: 리스너가 캐시 무효화 대상이 아니고 순수 알림만 발행하는 이벤트는 `emit` 허용 (주석으로 명시 권장).

### Step 4a: emitAsync 발행 위치 — 서비스 계층 전용 (Warning)

`emitAsync`는 서비스 계층에서만 호출되어야 한다. 컨트롤러가 `EventEmitter2`를 직접 주입하여 발행하면 도메인 이벤트 책임이 두 계층으로 분산된다.

```bash
# 컨트롤러에서 emitAsync 직접 호출 탐지 (NOTIFICATION_EVENTS + CACHE_EVENTS 양쪽)
grep -rnP 'this\.eventEmitter\.emitAsync\((NOTIFICATION_EVENTS|CACHE_EVENTS)' \
  apps/backend/src/modules/ \
  --include="*.controller.ts"
```

**기대 결과**: 빈 출력. 출력이 있으면 해당 로직을 서비스 메서드로 이동 권장.

**올바른 패턴**: 컨트롤러는 서비스 메서드만 호출. 서비스가 비즈니스 로직 + `emitAsync` 담당.
```typescript
// ✅ 서비스
async uploadAttachment(ncId: string, ...) {
  const doc = await this.documentService.createDocument(...);
  await this.eventEmitter.emitAsync(CACHE_EVENTS.NC_ATTACHMENT_UPLOADED, { ... });
  return doc;
}
// ✅ 컨트롤러
@Post(':uuid/attachments')
async uploadAttachment(...) {
  return this.service.uploadAttachment(uuid, ...);  // emitAsync는 서비스 내부
}
```

**재발 방지**: `.eslintrc.js` `overrides[].files = ["**/*.controller.ts"]` → `no-restricted-syntax`로 빌드 타임 차단. 예외 없음.

### Step 5a: 이벤트 페이로드 완전성 — 장비 필드 하드코딩 탐지 (Warning)

장비 관련 이벤트를 `emitAsync`할 때 `equipmentName`, `managementNumber`, `teamId` 필드를 `''` 빈 문자열로 하드코딩하면 알림/감사 로그에서 장비 정보가 누락된다. 반드시 DB에서 해당 필드를 SELECT한 뒤 이벤트에 전달해야 한다.

```bash
# 이벤트 페이로드에서 equipmentName/managementNumber/teamId 빈 문자열 하드코딩 탐지
grep -rn "emitAsync" apps/backend/src/modules/ --include="*.service.ts" -A 10 \
  | grep -E "equipmentName:\s*''|managementNumber:\s*''|teamId:\s*''" \
  | grep -v "actorName"
```

**PASS 기준:** 빈 출력. 모든 장비 이벤트 페이로드의 `equipmentName`/`managementNumber`/`teamId`가 DB 쿼리 결과에서 채워짐.

**FAIL 기준:** `equipmentName: ''` 패턴 발견 → `equip` 쿼리 select절에 `name`, `managementNumber`, `teamId` 포함 후 `equip?.name ?? ''` 형태로 전달.

```typescript
// ❌ WRONG — 빈 문자열 하드코딩
await this.eventEmitter.emitAsync(EVENT, {
  equipmentName: '',       // 알림에서 장비명 누락
  managementNumber: '',
});

// ✅ CORRECT — DB에서 조회한 값 사용
const [equip] = await tx
  .select({ id: e.id, name: e.name, managementNumber: e.managementNumber, teamId: e.teamId })
  .from(schema.equipment).where(eq(e.id, equipmentId));
await this.eventEmitter.emitAsync(EVENT, {
  equipmentName: equip?.name ?? '',
  managementNumber: equip?.managementNumber ?? '',
  teamId: equip?.teamId ?? '',
});
```

**예외:** `actorName: ''` — NotificationDispatcher가 actorId로 DB에서 actorName을 조회하므로 의도된 빈 문자열. 이 검사에서 제외.

### Step 5: CacheInvalidationAction method enum 일치 (Info)

`CACHE_INVALIDATION_REGISTRY`의 `method` 필드가 `CacheInvalidationHelper`에 실제 존재하는 메서드인지 확인.

```bash
# registry에서 사용된 method 이름 추출
grep -oP "method:\s*'[^']+'" \
  apps/backend/src/common/cache/cache-event.registry.ts \
  | grep -oP "'[^']+'" | tr -d "'" | sort -u > /tmp/methods.txt

# CacheInvalidationHelper의 public 메서드 추출
grep -oP 'async \K[a-zA-Z]+\(' \
  apps/backend/src/common/cache/cache-invalidation.helper.ts \
  | tr -d '(' | sort -u > /tmp/helper_methods.txt

# registry 메서드 중 helper에 없는 것
comm -23 /tmp/methods.txt /tmp/helper_methods.txt
```

**기대 결과**: 빈 출력. 출력이 있으면 registry 오타 또는 helper 미구현.

## Exceptions (리포트하지 않음)

1. **스케줄러의 `emit` 유지** — `schedulers/` 하위 파일은 사용자 응답 경로가 아니므로 의도적.
2. **NotificationDispatcher 리스너** — 순수 알림 발송, 캐시 무효화 대상 아님. 레지스트리 등록 불필요.
3. **테스트 spec의 `eventEmitter.emit()` 호출** — 테스트 내부에서 실제 리스너 트리거 용도. 검증 대상 아님.
4. **`NOTIFICATION_EVENTS` 상수 중 미발행 이벤트** — 단순 dead code, 본 스킬 범위 외 (verify-ssot에서 커버 가능).
5. **도메인 리스너의 직접 `deleteByPrefix` 호출** — 이벤트가 `CACHE_INVALIDATION_REGISTRY`에 등록되어 있더라도, DB 업데이트와 캐시 무효화를 같은 트랜잭션에 묶어야 하는 도메인 리스너(`@OnEvent` + `@Injectable()`)는 `cacheService.deleteByPrefix()`를 직접 호출할 수 있다. 예: `SoftwareValidationListener` — `latestValidationId` DB 갱신 + `TEST_SOFTWARE` 캐시 직접 삭제. 레지스트리 에 이미 등록된 이벤트에 추가 캐시 무효화를 하는 것이므로 Step 1 위반이 아님.

## Severity

| 검사 | 심각도 | 영향 |
|---|---|---|
| Step 1 레지스트리 누락 | **Critical** | stale cache → 사용자가 오래된 데이터 본다 |
| Step 2 리스너 sync 콜백 | **Critical** | emitAsync가 fire-and-forget 회귀 |
| Step 3 인라인 정규식 | **Warning** | 키 필드 추가 시 매칭 실패 회귀 위험 |
| Step 4 emit vs emitAsync | **Info** | 개별 케이스 판단, 주석 필요 |
| Step 5 method 불일치 | **Info** | 런타임 에러 (타입 체크로 사전 방어됨) |

## Learning Reference

- [이벤트 에미터 시맨틱](../../../.claude/skills/../memory/feedback_event_emitter_async_semantics.md)
- [캐시 키 JSON sorted keys](../../../.claude/skills/../memory/feedback_cache_key_json_sorted.md)
- 73차 해네스 결과: [project_73_harness_architecture_20260417.md](../../../.claude/skills/../memory/project_73_harness_architecture_20260417.md)
