# Backend Patterns

> 이 파일은 CLAUDE.md에서 분리된 상세 참조 문서입니다.

### DB Enum Column Policy

| Pattern               | Use When                          | Tables                                                           |
| --------------------- | --------------------------------- | ---------------------------------------------------------------- |
| `pgEnum`              | 값이 거의 변경되지 않는 핵심 enum | equipment_status, attachment_type, approval_status, request_type |
| `varchar + $type<>()` | 값이 자주 변경/확장되는 enum      | checkout status/purpose, NC type, calibration status 등          |

두 패턴 모두 `@equipment-management/schemas`의 enum 값 배열을 SSOT로 참조합니다.

### Validation: Zod Pipeline (NOT class-validator)

글로벌 ValidationPipe 없음. 엔드포인트별 `ZodValidationPipe` 사용.

```typescript
// DTO 파일 구조: Zod schema → Type inference → Pipe → Swagger class
export const updateEquipmentSchema = z.object({
  name: z.string().min(1),
  ...versionedSchema, // CAS version 포함
});
export type UpdateEquipmentDto = z.infer<typeof updateEquipmentSchema>;
export const UpdateEquipmentPipe = new ZodValidationPipe(updateEquipmentSchema);

// Controller에서 사용
@UsePipes(UpdateEquipmentPipe)
update(@Body() dto: UpdateEquipmentDto) { ... }
```

**Key File:** `common/pipes/zod-validation.pipe.ts`

### Error Handling: GlobalExceptionFilter

**File:** `common/filters/error.filter.ts`

처리 순서: `AppError` → `ZodError` → `HttpException` → `unknown`

```typescript
// 응답 형식 — 커스텀 code 필드 보존 (VERSION_CONFLICT 등)
{
  code: string,          // 'VERSION_CONFLICT', 'VALIDATION_ERROR', etc.
  message: string,
  timestamp: string,
  currentVersion?: number, // CAS 실패 시 추가 필드
  expectedVersion?: number
}
```

### Response Format: ApiResponse\<T\>

**Interceptor:** `ResponseTransformInterceptor` (`common/interceptors/response-transform.interceptor.ts`)

```typescript
// 모든 성공 응답 자동 래핑
{ success: true, data: T, message: string, timestamp: string }

// 바이패스: @SkipResponseTransform()
```

### Auth & Authorization

- **Global Guard:** `JwtAuthGuard` — 모든 라우트 보호, `@Public()` 바이패스
- **Permission Guard:** `@RequirePermissions(Permission.APPROVE_CHECKOUT)` + `PermissionsGuard`
- **Token Lifecycle:** Access 15분 → Refresh 7일 → 절대만료 30일
- **Auto Refresh:** JWT 콜백에서 만료 60초 전 자동 갱신
- **E2E Test Auth:** `GET /api/auth/test-login?role=xxx` (dev/test 환경만)

### Audit Trail

```typescript
// 비동기 감사 로그 (요청 성능 미영향)
@AuditLog({
  action: 'approve',
  entityType: 'calibration',
  entityIdPath: 'params.uuid', // request/response에서 동적 추출
})
@Patch(':uuid/approve')
approve() { ... }
```

**Key Files:** `common/decorators/audit-log.decorator.ts`, `common/interceptors/audit.interceptor.ts`

### Caching

**In-Memory Cache:** `SimpleCacheService` (`common/cache/simple-cache.service.ts`)

```typescript
// Cache-Aside 패턴
const data = await cacheService.getOrSet(key, () => db.query(...), ttl);

// Smart Invalidation
cacheInvalidationHelper.invalidateAfterEquipmentUpdate(equipmentId, statusChanged);
```

**Key:** `CacheInvalidationHelper` (`common/cache/cache-invalidation.helper.ts`) — 엔티티 간 교차 무효화

#### JSON-key-order-agnostic detail 캐시 패턴 (SSOT)

`buildCacheKey(prefix, params)` 는 `JSON.stringify` + sorted keys 기반 문자열 생성. 동일 `uuid`라도 추가 파라미터 존재 여부/이름에 따라 정렬 위치가 달라짐:

```
equipment:detail:{"uuid":"abc-123"}
equipment:detail:{"includeTeam":false,"uuid":"abc-123"}
```

→ detail 캐시 무효화 시 `{"uuid":"..."}` 처럼 키 순서를 가정한 정규식을 사용하면 향후 파라미터 추가 시 silent break.

**해결 (SSOT):** `common/cache/cache-patterns.ts` 의 공용 빌더 사용.

```typescript
import { buildDetailCachePattern } from 'common/cache/cache-patterns';
import { CACHE_KEY_PREFIXES } from 'common/cache/cache-key-prefixes';

await cacheService.deleteByPattern(
  buildDetailCachePattern(CACHE_KEY_PREFIXES.EQUIPMENT, 'uuid', equipmentId)
);
```

현재 적용: equipment detail, checkouts detail. 새 엔티티의 detail 무효화가 필요하면 **반드시 이 헬퍼를 경유**한다. 단위 테스트는 `common/cache/__tests__/cache-patterns.spec.ts`.

### Transaction

```typescript
// 다중 테이블 원자성 보장
await db.transaction(async (tx) => {
  await tx.update(equipment).set({...});
  await tx.insert(auditLogs).values({...});
});

// CAS 단일 테이블 업데이트는 트랜잭션 불필요 (WHERE절 원자성)
```

### Event Emission: `emit` vs `emitAsync`

**73차 근본 수정으로 도메인 서비스는 `await eventEmitter.emitAsync(...)` 패턴이 기본.** 단, 이 규칙은 리스너가 **Promise를 반환하도록 등록된 경우에만** 의미가 있다.

| 리스너                      | 등록 형태                                                                 | emitAsync 효과                                              |
| --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `CacheEventListener`        | `async (payload) => await handler(...)` → Promise 반환                    | **실제로 await** — read-after-write cache invalidation 보장 |
| `NotificationEventListener` | `(payload) => { dispatcher.dispatch(...).catch(...) }` → `undefined` 반환 | emitAsync로 호출해도 **fire-and-forget** (Promise 없음)     |

→ 알림 전송은 현재 구조상 best-effort이며, HTTP 응답이 알림 전송 완료를 보장하지 않는다. 캐시 무효화는 보장된다.

#### Scheduler 예외 — 의도적 `emit` 유지

`apps/backend/src/modules/notifications/schedulers/*.ts` 의 6개 emit 호출은 `emit()` (fire-and-forget) 을 유지한다. 근거:

1. **cron context, HTTP response 경로 아님** — 응답자가 없으므로 await 의미가 없다.
2. **알림 실패가 배치 로직을 차단하지 않아야 함** — 일부 알림 실패로 전체 배치가 중단되면 이후 대상 처리 누락.
3. **NotificationEventListener 콜백이 sync 이므로 emitAsync로 바꿔도 동작 동일** — 혼란만 초래.

스케줄러 emit 호출 위치:

- `calibration-overdue-scheduler.ts` (1곳)
- `checkout-overdue-scheduler.ts` (1곳)
- `import-orphan-scheduler.ts` (1곳)
- `intermediate-check-scheduler.ts` (3곳)

### SSE 일관성 보장 범위

| 보장                      | 설명                                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ✅ Cache read-after-write | 도메인 서비스가 `await emitAsync(...)` → `CacheEventListener` async 콜백이 await 됨. 요청 응답 시점엔 캐시 무효화 완료.                                                                                                        |
| ❌ SSE read-after-write   | `NotificationDispatcher` 는 `NotificationEventListener` sync 콜백 안에서 fire-and-forget 실행. 요청 응답 시점에 SSE 푸시 완료 보장 없음. 클라이언트는 TanStack Query의 `refetchOnWindowFocus` / interval 을 fallback으로 의존. |

설계 이유:

- SSE 푸시는 RxJS `Subject.next()` (sync) 이지만 그 이전 단계(DB insert → dispatch)가 HTTP 응답 경로에 포함되면 모든 mutation 지연이 커짐.
- read-after-write가 반드시 필요한 도메인(승인 워크플로우 등)은 응답 자체가 상태를 반환하므로 SSE에 의존할 필요 없음.
- 진행 바 / 실시간 피드백이 필요한 경우 프론트엔드에서 optimistic update + 캐시 무효화 조합으로 해결.

### DOCX 내보내기 3-way 분리 아키텍처 (UL-QP-18-02 기준)

양식 DOCX 내보내기는 **집계 / 렌더링 / 범용 유틸**의 3-way로 분리한다. UL-QP-18-02 시험설비 이력카드가 이 패턴의 표준 구현이며, 향후 다른 양식(QP-18-06/07/09 등) 추가 시 동일 구조를 따른다.

| 레이어       | 위치                                                          | 책임                                                                       |
| ------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Orchestrator | `modules/equipment/services/history-card.service.ts` (~40줄)  | 3단계 조합만 (data → template → renderer → buffer)                         |
| Data Service | `modules/equipment/services/history-card-data.service.ts`     | DB 쿼리 + 관계 조인 + 라벨 변환 + 병합 헬퍼 (주요기능/S/W)                 |
| Renderer     | `modules/equipment/services/history-card-renderer.service.ts` | DOCX XML 주입 (layout.ts 상수 기반) + 이미지 삽입                          |
| XML Helper   | `modules/reports/docx-xml-helper.ts`                          | 양식 간 공용 XML 유틸 (inject/replace/fill/image resource/drawing builder) |
| Layout SSOT  | `modules/equipment/services/history-card.layout.ts`           | 셀 라벨 fragment, 섹션 제목, 빈 행 수, 체크박스 패턴, 이미지 치수          |
| Timeline     | `modules/equipment/services/equipment-timeline.service.ts`    | incident + repair + non_conformances 병합 (FK 역참조 중복 제거)            |

**설계 원칙:**

1. **SSOT**: 양식 매직 문자열은 전부 layout.ts에 집중 — 양식 개정 시 서비스 코드 수정 없이 상수만 교체.
2. **순수 함수 레이어**: `mergeTimeline`, `mergeAccessoriesAndFunctions`, `mergeManualAndSoftware`는 export된 순수 함수로 유닛 테스트가 가능하다. DB 접근 없이 row만 받아 결과 반환.
3. **구조화 예외**: `FormRenderError` (docx-xml-helper) — `InternalServerErrorException` 상속 + `code: FORM_TEMPLATE_RENDER_FAILED` + formLabel/context 포함. 양식 개정으로 매칭이 깨질 때 운영자가 즉시 식별 가능.
4. **Graceful fallback**: 서명/사진 다운로드 실패 시 텍스트로 fallback (PII 유출 없음, 렌더링 차단 없음).
5. **양식-DB 매핑 문서**: `docs/manual/report-export-mapping.md §3.2` 참조 — 각 양식 필드가 어느 DB 컬럼에 매핑되는지 갱신된 표 유지.
6. **양식 통합 인덱스**: `docs/manual/forms-index.md` — 모든 UL-QP 양식의 구현 상태/엔드포인트/매핑표/구현 파일을 한눈에 탐색. 새 양식 추가 시 체크리스트 제공.
