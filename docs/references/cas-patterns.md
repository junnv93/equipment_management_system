# Concurrency Control (CAS / Optimistic Locking)

> 이 파일은 CLAUDE.md에서 분리된 상세 참조 문서입니다.

프로젝트의 핵심 아키텍처 패턴. DB → Backend → Frontend → Error 전 계층을 관통합니다.

### CAS 적용 엔티티

| Table                | Service                    | Key File                                                       |
| -------------------- | -------------------------- | -------------------------------------------------------------- |
| equipment            | EquipmentService           | `modules/equipment/equipment.service.ts`                       |
| checkouts            | CheckoutsService           | `modules/checkouts/checkouts.service.ts`                       |
| calibrations         | CalibrationService         | `modules/calibration/calibration.service.ts`                   |
| non_conformances     | NonConformancesService     | `modules/non-conformances/non-conformances.service.ts`         |
| disposal_requests    | DisposalService            | `modules/equipment/services/disposal.service.ts`               |
| equipment_imports    | EquipmentImportsService    | `modules/equipment-imports/equipment-imports.service.ts`       |
| equipment_requests   | EquipmentService           | `modules/equipment/equipment.service.ts`                       |
| software_validations | SoftwareValidationsService | `modules/software-validations/software-validations.service.ts` |

### Backend CAS Pattern

**Base Class:** `VersionedBaseService` (`common/base/versioned-base.service.ts`)

```typescript
// 핵심 메서드
protected async updateWithVersion<T>(
  table, id: string, expectedVersion: number,
  updateData: Record<string, unknown>, entityName: string
): Promise<T>
// → UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?
// → 0 rows affected? → 엔티티 없음(404) or 버전 충돌(409 + code: 'VERSION_CONFLICT')
```

**DTO Pattern:** `VersionedDto` (`common/dto/base-versioned.dto.ts`)

```typescript
// 모든 상태 변경 DTO는 version 필드 필수
export const versionedSchema = { version: z.number().int().positive() };
```

### Frontend CAS Error Chain

```
Backend 409 { code: 'VERSION_CONFLICT' }
  → mapBackendErrorCode('VERSION_CONFLICT')
    → EquipmentErrorCode.VERSION_CONFLICT
      → ERROR_MESSAGES[VERSION_CONFLICT] (한국어 메시지)
        → useOptimisticMutation.onError: invalidateQueries (서버 재검증)
```

### Cache Coherence

**CAS 실패(409) 시 반드시 detail 캐시 삭제** — 미삭제 시 stale cache로 재시도도 계속 409 발생.

```typescript
// Backend: updateCheckoutStatus의 catch 블록
catch (error) {
  if (error instanceof ConflictException) {
    this.cacheService.delete(detailCacheKey); // stale cache 방지
  }
  throw error;
}
```
