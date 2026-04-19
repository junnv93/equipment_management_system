# Exec Plan: api-ssot-e2e-serial-export-batch

**Date**: 2026-04-19
**Slug**: `api-ssot-e2e-serial-export-batch`
**Mode**: 2 (surgical tech-debt batch — frontend SSOT + E2E config + backend security/batch fix)
**Status**: active

## 0. Problem & Goal

### Problem
tech-debt-tracker의 4개 MEDIUM + 1개 LOW를 단일 세션으로 배치 처리한다.
- M1: `form-templates-api.ts` 5개 함수가 `response.data?.data ?? response.data` 인라인 패턴으로 SSOT(Axios 인터셉터 `unwrapResponseData`)를 우회.
- M2: `wf-25`, `wf-35` 두 E2E spec이 `test.describe.configure({ mode: 'serial' })` 미설정 — `wf-35`는 DB NC 레코드 상태에 의존, `wf-25`는 알림 존재 상태에 의존.
- M3: `exportSoftwareValidation`에서 `filter.teamId` 스코프 체크가 DB 쿼리 **이후**에 발생 → 타이밍 기반 정보 누출 소지 + `submittedBy` 필드가 SELECT되지만 `userIdSet` 배치 조회에서 누락.
- M4: UL-QP-18-09와 UL-QP-18-07이 같은 "site 단위 리소스" 룰을 공유함에도 scope 체크 순서가 비대칭 (07은 쿼리 전, 09는 쿼리 후). M3 수정으로 동시 해소.
- L1: `form-template-export.service.ts`의 무인자 `.select()` 6개소 중 렌더러가 실제 사용하는 컬럼이 명확한 일부만 projection 수술.

### Goal
- form-templates-api.ts는 **전면 SSOT 경유** — 인라인 `?? response.data` 패턴 0건.
- wf-25, wf-35는 workflows/ 디렉토리 관례(serial)를 따른다. wf-export-ui-download는 현 상태(parallel) 유지 — 각 테스트가 독립 fixture의 개별 context를 사용.
- `exportSoftwareValidation`은 **먼저 scope 거부 → 그 다음 DB 접근**하며, 모든 서명 후보 userId가 단일 `inArray` 배치 쿼리로 조회된다.
- 변경 후 `pnpm --filter frontend run tsc --noEmit`, `pnpm --filter backend run tsc --noEmit` 모두 PASS.

**비목표 (Non-goals)**:
- self-inspection-api.ts, data-migration-api.ts 수정 (tracker 확인 결과 이미 올바름 — 이 세션 out of scope)
- renderer 유닛 테스트 작성 (LOW-2, 별도 세션)
- SELECT * 전면 정리 (렌더러 사용 컬럼 매핑 확정 전에는 일부만)
- 신규 API / 스키마 / DB 마이그레이션 변경

---

## 1. Pre-read Verification (완료)

| 항목 | 결과 |
|---|---|
| `form-templates-api.ts` L64, L73, L82, L91, L100 — 5개 동일 패턴 | 확인 |
| `transformSingleResponse` 호출부 (L137, L151) — 유지 | 확인 |
| `api-client.ts` L150-152 — 인터셉터가 `unwrapResponseData` 적용 | 확인 |
| `response-transformers.ts` — "래핑 해제는 Axios 인터셉터가 SSOT" 주석 | 확인 |
| `wf-25-alert-to-checkout.spec.ts` — `describe.configure` 0건 | 확인 |
| `wf-35-cas-ui-recovery.spec.ts` — `describe.configure` 0건 | 확인 |
| `wf-export-ui-download.spec.ts` L59 — `mode: 'parallel'` 명시 | 확인 (유지) |
| `exportSoftwareValidation` L585-620 DB 쿼리 → L631 teamId 체크 (순서 역전) | 확인 |
| `exportSoftwareValidation` L647-656 userIdSet — `submittedBy` 누락 | 확인 |
| DOCX T8 렌더링 (L756-775) — `performer`, `techApprover`, `qualityApprover`만 사용, submitter 미사용 | 확인 (SHOULD 범위) |
| `exportSoftwareRegistry` L464-471 — teamId 체크 쿼리 이전 (정상) | 확인 (레퍼런스 패턴) |
| 무인자 `.select()`: L283, L329, L818, L938, L1064, L1268 | 확인 |

---

## 2. Surgical Change Scope

### 2.1 변경 파일 (5)

| # | Path | 변경 성격 |
|---|------|-----------|
| F1 | `apps/frontend/lib/api/form-templates-api.ts` | 5개 리스트/서치 함수의 `response.data?.data ?? response.data` → `response.data` |
| F2 | `apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts` | `test.describe` 블록 시작부에 `test.describe.configure({ mode: 'serial' })` 추가 |
| F3 | `apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts` | 동일 |
| F4 | `apps/frontend/tests/e2e/workflows/wf-export-ui-download.spec.ts` | `mode: 'parallel'` → `mode: 'serial'` 변경 (resetIntermediateInspections/resetSelfInspections/clearBackendCache가 공유 시드 상태를 뮤테이션하므로 race condition 필연) |
| F5 | `apps/backend/src/modules/reports/form-template-export.service.ts` | `exportSoftwareValidation`에서 (a) `filter.teamId` 체크를 DB 쿼리 이전으로 이동, (b) `submittedBy`를 userIdSet 배치에 포함 |
| F6 | `apps/backend/src/modules/reports/services/equipment-registry-renderer.service.spec.ts` | 신규 생성 — getCellValue 라벨 매핑 + 빈 행 처리 + SSOT 라벨 경유 검증 |
| F7 | `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-renderer.service.spec.ts` | 신규 생성 — injectHeader/injectItems/injectSignOff 로직 단위 검증 (mock storage) |
| F8 | `apps/backend/src/modules/self-inspections/services/self-inspection-renderer.service.spec.ts` | 신규 생성 — injectHeader/injectItems/injectSpecialNotes 로직 단위 검증 (mock storage) |
| F9 | (선택, SHOULD) `apps/backend/src/modules/reports/form-template-export.service.ts` | 무인자 `.select()` 중 렌더러 매핑 확정 가능한 개소 projection 도입 |

**변경하지 않는 파일** (스코프 외):
- `self-inspection-api.ts`, `data-migration-api.ts` — 이미 SSOT 경유
- `equipment-registry-data.service.ts` — 이미 projection 적용 완료
- DOCX T8 렌더링 로직 — submitter 양식 위치 확정 전 건드리지 않음

---

## 3. Phased Execution

### Phase 1: Frontend SSOT fix (form-templates-api.ts)
목표: 인라인 `?? response.data` 패턴 0건.

1. 5개 함수 return 문을 `return response.data` 로 변경:
   - `listFormTemplates` (L64)
   - `listArchivedFormTemplates` (L73)
   - `listFormTemplateHistoryByName` (L82)
   - `listFormTemplateRevisionsByName` (L91)
   - `searchFormTemplateByNumber` (L100)
2. 반환 타입은 그대로 유지. TS 추론 오류 발생 시 `apiClient.get<T>(...)` 제네릭으로 해결 — `any` 금지.
3. 검증:
   ```bash
   grep -n "response\.data?\.data" apps/frontend/lib/api/form-templates-api.ts  # 0 hits
   pnpm --filter frontend run tsc --noEmit
   ```

### Phase 2: E2E serial 모드 설정 (wf-25, wf-35, wf-export-ui-download)
목표: 공유 상태 뮤테이션 spec 전체 serial 통일.

1. `wf-25-alert-to-checkout.spec.ts` — `test.describe('WF-25: ...', () => {` 블록 바로 다음 줄에 `test.describe.configure({ mode: 'serial' });` 추가.
2. `wf-35-cas-ui-recovery.spec.ts` — `test.describe('WF-35: ...', () => {` 블록 내부 최상단에 동일 추가.
3. `wf-export-ui-download.spec.ts` — 기존 L59 `{ mode: 'parallel' }` → `{ mode: 'serial' }` 변경.
   - 근거: `resetIntermediateInspections(CALIB_001)`, `resetSelfInspections(FILTER_SUW_E)`, `clearBackendCache()` — 공유 시드 DB 뮤테이션 + 전역 캐시 무효화 → parallel 실행 시 race condition 필연.
4. 검증:
   ```bash
   grep -n "mode: 'serial'" \
     apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts \
     apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts \
     apps/frontend/tests/e2e/workflows/wf-export-ui-download.spec.ts  # 각 1 hit
   grep -n "mode: 'parallel'" apps/frontend/tests/e2e/workflows/wf-export-ui-download.spec.ts  # 0 hits
   pnpm --filter frontend run tsc --noEmit
   ```

### Phase 3: Backend exportSoftwareValidation 보안 + 배치 fix
목표: 스코프 체크 순서 정상화 + userIdSet에 submittedBy 포함.

1. **순서 변경** (보안 MUST):
   - `if (filter.teamId) { throw ForbiddenException(...SCOPE_RESOURCE_MISMATCH...) }` 블록(현재 L631-637)을
   - DB `.select().from(softwareValidations).innerJoin(testSoftware,...)` 호출(현재 L585) **이전**으로 이동.
   - `validationId` 검증 → teamId ForbiddenException(쿼리 전) → DB 쿼리 → record 존재 검증 → site 경계 검증 → userIdSet 배치.
   - `filter.site` NotFoundException은 `record.softwareSite` 비교 필요 → 쿼리 후 유지 (변경 금지).

2. **submittedBy 추가** (SHOULD, 함께 처리):
   ```typescript
   const userIdSet = [
     ...new Set(
       [
         record.receivedBy,
         record.performedBy,
         record.submittedBy,           // ← 추가
         record.technicalApproverId,
         record.qualityApproverId,
       ].filter((id): id is string => id !== null)
     ),
   ];
   ```

3. 검증:
   ```bash
   grep -n "submittedBy\|filter\.teamId" apps/backend/src/modules/reports/form-template-export.service.ts
   # exportSoftwareValidation 내 teamId throw 라인 < from(softwareValidations) 라인 수동 확인
   pnpm --filter backend run tsc --noEmit
   ```

### Phase 4: renderer 유닛 테스트 3종 신규 작성
목표: tech-debt-tracker L77 항목 완결. SSOT 라벨 경유, 빈 행 처리, fallback 검증.

**테스트 전략**:
- `EquipmentRegistryRendererService`: ExcelJS in-memory XLSX → 실 실행 검증. `FormTemplateService` mock (templateBuffer 반환). DB 없음.
- `IntermediateInspectionRendererService` / `SelfInspectionRendererService`: `createTestDocxBuffer` (기존 `docx-template.util.spec.ts` 패턴 재사용) + `IStorageProvider` mock (signaturePath null → 서명 없음 케이스).

**각 spec MUST 커버 케이스**:

1. `equipment-registry-renderer.service.spec.ts` (위치: `reports/services/`):
   - `getCellValue('managementMethod', ...)` → MANAGEMENT_METHOD_LABELS SSOT 라벨 반환
   - `getCellValue('needsIntermediateCheck', true/false)` → INTERMEDIATE_CHECK_YESNO_LABELS
   - `getCellValue('availability', ...)` → EQUIPMENT_AVAILABILITY_LABELS
   - 빈 rows 배열 → clearTrailingRows 호출, 파일 생성 성공
   - 날짜 null → 'N/A' 반환

2. `intermediate-inspection-renderer.service.spec.ts` (위치: `intermediate-inspections/services/`):
   - 헤더 주입: data.equipment.name → T0 R0 셀 검증 (DocxTemplate getCellValue로 round-trip)
   - 점검 항목 0건 → appendItemPhotos 미호출, 에러 없음
   - 서명 이미지 null → insertDocxSignature null 경로 처리, 에러 없음
   - INSPECTION_JUDGMENT_LABELS SSOT 경유 라벨 검증

3. `self-inspection-renderer.service.spec.ts` (위치: `self-inspections/services/`):
   - 헤더 주입: data.equipment.name → T0 R0 셀 검증
   - 특기사항 0건 → SPECIAL_NOTES_SECTION 빈 행 처리
   - 서명 null → 에러 없음
   - SELF_INSPECTION_RESULT_LABELS SSOT 경유 라벨 검증

**의존성 mock 패턴** (inspection renderer 2종):
```typescript
const mockStorage: IStorageProvider = {
  getSignedUrl: jest.fn().mockResolvedValue(''),
  getBuffer: jest.fn().mockResolvedValue(null),  // 서명 없음
};
const service = new IntermediateInspectionRendererService(mockStorage);
```

**검증**:
```bash
pnpm --filter backend run test -- --testPathPattern="renderer"
pnpm --filter backend run tsc --noEmit
```

### Phase 5: SELECT * 부분 정리 (SHOULD, 선택)
목표: 렌더러가 사용하는 컬럼이 명백한 1~2개소만 projection 도입.

Phase 1~4 완료 후 여유 시에만 진행. 확신이 없으면 건드리지 않고 tracker에 잔존.

---

## 4. Validation Commands

```bash
# 전체 검증 순서
grep -n "response\.data?\.data" apps/frontend/lib/api/form-templates-api.ts        # 0 hits
grep -n "test\.describe\.configure" apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts  # 1 hit
grep -n "test\.describe\.configure" apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts   # 1 hit
grep -n "mode: 'parallel'" apps/frontend/tests/e2e/workflows/wf-export-ui-download.spec.ts            # 1 hit (유지)
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run tsc --noEmit
```

---

## 5. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `apiClient.get` 제네릭 미지정 → `response.data` TS 추론 오류 | `apiClient.get<ReturnType>(...)` 제네릭 명시. `any` 금지. |
| wf-25/wf-35 serial 전환으로 E2E 실행 시간 증가 | workflows/ 관례 통일이 목적. 기존 37개 파일도 serial. 영향 미미. |
| `submittedBy` 추가 시 탈퇴 사용자 → userMap.get undefined | `??` 폴백 패턴이 이미 null-safe. 렌더 코드 미추가로 회귀 없음. |
| Phase 4 projection 과잉 → 런타임 "-" 폴백 발생 | 확신 없으면 건드리지 않음. tracker 연장. |

---

## 6. Deliverables Checklist

- [ ] F1: form-templates-api.ts 5개 함수 수정 + tsc PASS
- [ ] F2: wf-25 serial 설정
- [ ] F3: wf-35 serial 설정
- [ ] F4: exportSoftwareValidation teamId 체크 쿼리 이전 이동 + submittedBy userIdSet 포함 + tsc PASS
- [ ] (SHOULD) F5: SELECT * 1개소 정리
- [ ] Contract MUST 전항목 PASS
