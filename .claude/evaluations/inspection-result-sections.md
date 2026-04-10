# Evaluation: 점검 결과 섹션 동적 콘텐츠

**Date**: 2026-04-10
**Contract**: `.claude/contracts/inspection-result-sections.md`
**Evaluator**: QA Agent (skeptical mode)

---

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `pnpm tsc --noEmit` 에러 0 | **PASS** | 출력 없음 (에러 0) |
| 2 | `pnpm --filter backend run build` 성공 | **PASS** | `nest build` 정상 완료 |
| 3 | `pnpm --filter backend run test` 기존 테스트 통과 | **PASS** | 44 suites, 559 tests passed |
| 4 | verify-implementation 전체 PASS | **SKIPPED** | 스킬 실행 불가 (평가 전용 에이전트) |
| 5 | DB 스키마 inspectionResultSections 정상 정의 | **PASS** | `packages/db/src/schema/inspection-result-sections.ts` — pgTable 정의, index, FK, 타입 export 모두 정상. `packages/db/src/schema/index.ts`에서 re-export 확인. |
| 6 | SSOT: InspectionResultSectionType enum export | **PASS** | `packages/schemas/src/enums/inspection-result-section.ts`에서 정의, `enums/index.ts` line 19에서 re-export, `schemas/src/index.ts`에서 `export * from './enums'`로 체인 완성. |
| 7 | DocxTemplate에 appendParagraph/appendTable/appendImage | **PASS** | `docx-template.util.ts` lines 323, 341, 365에서 세 메서드 모두 존재. |
| 8 | 중간점검/자체점검 컨트롤러에 result-sections CRUD | **PASS** | 양쪽 컨트롤러에 GET/POST/PATCH/DELETE + upload-csv 총 5개 엔드포인트 확인. |
| 9 | Export 파이프라인에서 동적 섹션 렌더링 호출 | **PASS** | `form-template-export.service.ts`에서 intermediate (line 574), self (line 851) 양쪽 모두 `renderResultSections` 호출. |

**MUST 결과: 8/8 PASS, 1 SKIPPED (verify-implementation 스킬 미실행)**

---

## SHOULD Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | review-architecture Critical 0개 | **SKIPPED** | 스킬 실행 불가 |
| 2 | CSV 파싱 엣지 케이스 방어 | **PASS (marginal)** | RFC 4180 호환 파서 구현 (quoted fields, escaped quotes). 최소 2줄 검증. 다만 BOM 처리 미구현 — Excel 한국어 CSV 출력 시 UTF-8 BOM 포함 가능. |
| 3 | 보안: userId 서버 추출 (Rule 2) | **PASS** | 양쪽 컨트롤러 모두 `extractUserId(req)` 사용. body에서 userId 수신 없음. |

---

## Bugs & Issues Found

### BUG-1: appendTable — 잘못된 OOXML 테두리 XML 생성 (Severity: HIGH)

**File**: `apps/backend/src/modules/reports/docx-template.util.ts` line 342-343

```typescript
const borderXml = '<w:val w:val="single" w:sz="4" w:space="0" w:color="000000"/>';
const tblPr = `...<w:top ${borderXml.slice(1)}...`;
```

`borderXml.slice(1)` 결과: `w:val w:val="single" w:sz="4" w:space="0" w:color="000000"/>`

생성되는 XML: `<w:top w:val w:val="single" w:sz="4" w:space="0" w:color="000000"/>`

`w:val`이 bare attribute name으로 나타나고, 뒤에 또 `w:val="single"`이 옴. 이는 유효하지 않은 XML이며 Word에서 테두리가 누락되거나 파일 열기 실패 가능.

**수정 방향**: `borderXml`을 `'w:val="single" w:sz="4" w:space="0" w:color="000000"/>'`로 변경하거나, 각 border element를 완전한 문자열로 정의.

### BUG-2: CSV upload — file null 체크 누락 (Severity: MEDIUM)

**Files**:
- `intermediate-inspections.controller.ts` line 373-380
- `self-inspections.controller.ts` line 298-305

`@UploadedFile() file: MulterFile` — 파일 없이 요청 시 `file`이 `undefined`가 되어 `file.buffer`에서 `TypeError: Cannot read properties of undefined` 발생. 같은 코드베이스의 `documents.controller.ts` line 310에서는 `if (!file)` 가드가 있음.

### ISSUE-3: update 메서드 — Record<string, unknown> 타입 손실 (Severity: LOW)

**File**: `result-sections.service.ts` line 65

`const updateData: Record<string, unknown>` — Drizzle의 `.set()` 메서드에 전달할 때 타입 안전성이 떨어짐. 컬럼명 오타 시 런타임까지 발견 불가. 그러나 tsc가 통과하므로 현재 동작에 문제는 없음.

### ISSUE-4: BOM 미처리 (Severity: LOW)

**File**: `result-sections.service.ts` line 127-130

Excel에서 "UTF-8 CSV"로 저장 시 BOM (`\xEF\xBB\xBF`)이 포함됨. `csvContent.split('\n')` 후 첫 번째 헤더에 BOM이 포함되어 헤더 비교/매칭 시 문제 발생 가능.

---

## Code Quality (CLAUDE.md Rules)

| Rule | Result | Notes |
|------|--------|-------|
| Rule 0: SSOT | **PASS** | 모든 enum/type이 `@equipment-management/schemas`에서 import |
| Rule 2: Server-side userId | **PASS** | `extractUserId(req)` 사용 |
| Rule 3: No `any` | **PASS** | `any` 사용 없음 |
| Zod validation | **PASS** | `CreateResultSectionPipe`, `UpdateResultSectionPipe` 적용 |
| Permissions | **PASS** | `@RequirePermissions` 데코레이터 적용, 중간점검은 `UPDATE_CALIBRATION`, 자체점검은 `CREATE_SELF_INSPECTION` |
| Site access | **PASS** | `enforceSiteAccess()` 모든 엔드포인트에 적용 |
| Audit logging | **PASS** | `@AuditLog` 데코레이터 CUD에 적용 |

---

## Verdict

**MUST criteria: PASS** (8/8 verified, 1 skipped)

**발견된 버그**:
- **BUG-1 (HIGH)**: appendTable의 XML 생성 버그 — Export된 docx 파일의 테이블 테두리가 깨질 수 있음. 수정 필요.
- **BUG-2 (MEDIUM)**: CSV upload 시 file null 체크 누락 — 500 에러 노출 가능. 수정 필요.

**tech-debt 기록 대상**: ISSUE-3 (Record<string, unknown>), ISSUE-4 (BOM 미처리)
