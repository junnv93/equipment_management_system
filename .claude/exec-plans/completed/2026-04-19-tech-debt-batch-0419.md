# Exec Plan: tech-debt-batch-0419

**Date**: 2026-04-19
**Slug**: tech-debt-batch-0419
**Mode**: 2
**Status**: active

## 사전 조사 결과 (Out of Scope)

Planner가 grep으로 확인한 결과 이미 완료된 항목:
- C1/C2 (data-migration 하드코딩 리터럴 / indexOf): 이전 세션에서 완료
- exportSoftwareValidation N+1: inArray+Map 패턴 이미 적용
- exportSoftwareRegistry teamId ForbiddenException: 이미 구현됨
- EquipmentRegistryDataService SELECT *: 16컬럼 명시적 projection 이미 적용
- wf-25/wf-35/wf-export/validation-logic/full-flow E2E: 해당 파일에 패턴 없음
- unwrapResponseData (form-templates-api.ts / self-inspection-api.ts / data-migration-api.ts): grep 0 hits, 이미 해결

---

## Phase 1: Backend Critical — DocumentsController SRP 복원 (C3)

### 변경 파일

| 파일 | 목표 |
|------|------|
| `apps/backend/src/common/file-upload/document.service.ts` | `downloadWithPresign(id, res)` 메서드 추가 — presigned URL redirect 또는 local stream 처리. `getThumbnailBuffer(id, size)` 메서드 추가 — sharp WebP 변환 포함. IStorageProvider + FileUploadService를 서비스 내부에서 처리 |
| `apps/backend/src/modules/documents/documents.controller.ts` | `@Inject(STORAGE_PROVIDER) private storage: IStorageProvider` 생성자 주입 제거. `download()` → `documentService.downloadWithPresign(id, res)` 위임. `thumbnail()` → `documentService.getThumbnailBuffer(id, size)` 위임. `sharp` import 제거 |

**달성 기준**: 컨트롤러 생성자에 `IStorageProvider` 주입 0건. 스토리지 접근 코드가 `document.service.ts`에만 위치.

---

## Phase 2: Backend High — 케이블 캐시 무효화 + 중복 검사 fallthrough (H1, H3)

### H1: 케이블 캐시 무효화

`cables.service.ts:24`가 `private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.CALIBRATION + 'cables:'` 복합 프리픽스를 사용.
**`cache-key-prefixes.ts`에 새 키 추가 불필요** — 복합 프리픽스를 직접 사용.

| 파일 | 목표 |
|------|------|
| `apps/backend/src/modules/data-migration/services/data-migration.service.ts` (H1) | `executeMultiSheet` 캐시 무효화 블록에 케이블 시트 처리 후 `this.cacheService.deleteByPrefix(\`${CACHE_KEY_PREFIXES.CALIBRATION}cables:\`)` 추가 |

### H3: markPreviewHistoryDuplicates fallthrough 제거

| 파일 | 목표 |
|------|------|
| `apps/backend/src/modules/data-migration/services/data-migration.service.ts` (H3) | `markPreviewHistoryDuplicates` else 분기: 현재 CABLE/TEST_SOFTWARE/CALIBRATION_FACTOR/NON_CONFORMANCE가 filterIncidentDuplicates로 잘못 위임됨. INCIDENT만 filterIncidentDuplicates로 분기하고, 나머지 독립 엔티티 타입은 `{ toInsert: rowPreviews, duplicates: [] }` 직접 반환. 미지원 sheetType에 exhaustive guard 추가 |

**달성 기준**: `data-migration.service.ts`에 `cables:` 프리픽스 deleteByPrefix 호출 1건. `markPreviewHistoryDuplicates`가 비-incident 타입을 filterIncidentDuplicates로 위임하지 않음.

---

## Phase 3: Backend — previewMultiSheet 에러 핸들링

`savedFile.filePath`가 line 347에서 세션 캐시에 저장되어 `executeMultiSheet`가 이를 참조함.
**try/finally 금지** — finally는 성공 시에도 파일을 삭제하여 executeMultiSheet 실패 유발.
**try/catch 사용** — 에러 발생 시에만 임시 파일 삭제.

| 파일 | 목표 |
|------|------|
| `apps/backend/src/modules/data-migration/services/data-migration.service.ts` | `previewMultiSheet`: 파일 저장 후 처리 블록을 try/catch로 감싸 catch에서만 임시 파일 삭제 (`fs.unlink` 또는 `FileUploadService` 활용) |

**달성 기준**: `previewMultiSheet` 범위 내 catch 블록에서 임시 파일 삭제 로직 존재.

---

## Phase 4: MEDIUM 단일 파일

| 파일 | 목표 |
|------|------|
| `apps/backend/src/modules/equipment/services/history-card-data.service.ts` | line 202 `'equipment_photo'` → `DocumentTypeValues.EQUIPMENT_PHOTO` (SSOT import 추가) |

**달성 기준**: `grep "'equipment_photo'" history-card-data.service.ts` → 0 hits.

---

## Phase 5: LOW — i18n + Design Token + E2E

| 파일 | 목표 |
|------|------|
| `apps/frontend/messages/en/equipment.json` | `selfInspection.form` 오브젝트에 3키 추가: `calibrationValidityPeriodPlaceholder`, `selectClassification`, `snapshotSectionLabel` (ko 대응 값 영문 번역) |
| `apps/frontend/components/equipment/SoftwareTab.tsx` | lines 324, 337 `transition-colors` className → `TRANSITION_PRESETS.fastColor` (import 추가) |
| `apps/frontend/components/non-conformances/NCDocumentsSection.tsx` | line 172 `transition-opacity` → `TRANSITION_PRESETS.fastOpacity` (import 추가) |
| `apps/frontend/tests/e2e/features/equipment/qr/phase2-scanner-ncr.spec.ts` | line 79 `waitForLoadState('networkidle')` → `waitForLoadState('load')` |
| `apps/frontend/tests/e2e/features/calibration/inspection-form/seed-view-form.spec.ts` | `waitForTimeout(N)` → 대상 element의 `waitFor({ state: 'visible' })` |

---

## Verification Commands

```bash
# tsc
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit

# unit tests
cd apps/backend && npx jest --testPathPattern="document" --silent
cd apps/backend && npx jest --testPathPattern="data-migration" --silent

# grep: C3 IStorageProvider 제거
grep -n "STORAGE_PROVIDER\|IStorageProvider" apps/backend/src/modules/documents/documents.controller.ts

# grep: H1 케이블 캐시 무효화 (복합 프리픽스)
grep -n "cables:" apps/backend/src/modules/data-migration/services/data-migration.service.ts

# grep: H3 fallthrough 제거
grep -n "filterIncidentDuplicates\|CABLE\|TEST_SOFTWARE" apps/backend/src/modules/data-migration/services/data-migration.service.ts

# grep: equipment_photo 리터럴
grep -n "'equipment_photo'" apps/backend/src/modules/equipment/services/history-card-data.service.ts

# grep: transition 하드코딩
grep -n "transition-colors\|transition-opacity" apps/frontend/components/equipment/SoftwareTab.tsx apps/frontend/components/non-conformances/NCDocumentsSection.tsx
```
