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

### Transaction

```typescript
// 다중 테이블 원자성 보장
await db.transaction(async (tx) => {
  await tx.update(equipment).set({...});
  await tx.insert(auditLogs).values({...});
});

// CAS 단일 테이블 업데이트는 트랜잭션 불필요 (WHERE절 원자성)
```
