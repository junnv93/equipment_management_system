# Contract — tech-debt-batch-0421d (code-reviewer 지적사항 전수 수정)

## Scope

이전 harness (tech-debt-batch-0421c) 평가에서 code-reviewer가 ISSUES FOUND로 판정한 7개 항목을 전수 수정.

## MUST Criteria

### Build / Type Safety
- **M1** `pnpm --filter backend run tsc --noEmit` → 0 errors
- **M2** `pnpm --filter backend run build` → success
- **M3** `pnpm --filter frontend run tsc --noEmit` → 0 errors
- **M4** `pnpm --filter backend run test` → 0 failures

### Fix 1 — k6 setup() silent failure 수정
- **M5** `software-validation-list.k6.js setup()`: login 응답 status !== 200 또는 accessToken 없을 때 `throw new Error(...)` 로 중단
- **M6** `software-validation-export.k6.js setup()`: 동일 login 실패 처리 + `K6_VALIDATION_ID` env var 미설정 시 `throw new Error(...)` 로 중단
- **M7** 두 스크립트 모두 `__ENV.K6_USER_EMAIL`, `__ENV.K6_USER_PASSWORD` 미설정 시 명시적 오류

### Fix 2 — lineNumber varchar → integer
- **M8** `packages/db/src/schema/csp-reports.ts`: `lineNumber` 컬럼을 `integer('line_number')` 로 변경
- **M9** SQL 마이그레이션 파일 작성: `USING CASE WHEN ... THEN NULL ELSE line_number::integer END` 안전 변환
- **M10** `security.types.ts` `NormalizedCspReport.lineNumber`: `string` → `number | undefined`
- **M11** `security.controller.ts`: lineNumber 파싱이 `number | undefined` 반환 (string 변환 제거)
- **M12** `security.service.ts`: 타입 일치 확인 (integer 컬럼에 number 삽입)

### Fix 3 — NormalizedCspReport 타입 분리
- **M13** `apps/backend/src/modules/security/security.types.ts` 신규 파일 생성 + `NormalizedCspReport` interface 정의
- **M14** `security.service.ts`: `security.types.ts`에서 import
- **M15** `security.controller.ts`: `security.types.ts`에서 import (서비스 파일에서 타입 직접 가져오지 않음)

### Fix 4/5 — Dead code 제거
- **M16** `approve-equipment-request.dto.ts`: `ApproveEquipmentRequestDto` class 및 사용하지 않는 swagger import 제거
- **M17** `create-shared-equipment.dto.ts`: `CreateSharedEquipmentSwaggerDto` class 및 swagger import 제거
- **M18** 두 파일에서 제거 후 컨트롤러/서비스에서 해당 심볼 참조가 0건 유지

### Fix 6 — ValidationCreateDialog 불필요한 re-export 제거
- **M19** `ValidationCreateDialog.tsx`에서 `export type { CreateFormState }` 제거
- **M20** 모든 소비처가 `validation-create-form.types.ts`에서 직접 import하는지 확인 (grep 0건 from ValidationCreateDialog)

### Fix 7 — 공통 docx 셀 인덱스 상수 SSOT화
- **M21** `apps/backend/src/common/docx/docx-cell-indices.ts` 신규 파일: `TEXT_COL = 1`, `MERGED_TEXT_COL = 0` export
- **M22** `checkout-form.layout.ts`: 로컬 `TEXT_COL`, `MERGED_TEXT_COL` 삭제, `docx-cell-indices.ts`에서 import + re-export
- **M23** `equipment-import-form.layout.ts`: 동일 처리
- **M24** renderer 파일들이 여전히 layout.ts를 경유해 상수 접근 (직접 경로 변경 불필요)

## SHOULD Criteria

- **S1** k6 스크립트 SSOT 주석: k6 런타임 제약으로 shared-constants import 불가임을 명시 (허위 SSOT 레이블 교정)
- **S2** `pnpm --filter "@equipment-management/db" run build` 후 backend build → type 동기화 확인
