# Evaluation: tech-debt-batch-0430

**Date**: 2026-04-30
**Evaluator**: Sonnet (independent agent)
**Iteration**: 2

## Verdict: PASS

---

## MUST Criteria

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| M1: frontend tsc --noEmit | PASS | exit 0, 에러 없음 |
| M2: backend tsc --noEmit | PASS | exit 0, 에러 없음 |
| M3: frontend build 성공 | PASS | build 완료, PPR/Static/Dynamic 라우트 모두 렌더 |
| M4: barrel 호환 — 호출처 ≥ 20 | PASS | `grep "from '@/lib/api/approvals-api'"` → **24건** |
| M5: barrel export 완비 (18개 심볼) | PASS | Python 자동화 검증 `MISSING: none` — ApprovalItem, ApprovalCategory, TAB_META, ROLE_TABS, RejectReasonSchema, REJECTION_MIN_LENGTH, REQUEST_TYPES, approvalsApi, PendingCountsByCategory, ApprovalKpiResponse, BulkActionResult, Attachment, ApprovalSummaryData, TabMeta, ApprovalSection, APPROVAL_SECTIONS, UnifiedApprovalStatus, ApprovalHistoryEntry 전체 포함 |
| M6: CROSS_CUTTING_NAMESPACES + gate exit 0 | PASS | `grep "CROSS_CUTTING_NAMESPACES" scripts/check-i18n-call-sites.mjs` → 3건 매칭. `--all` 실행 → "누락 0건" exit 0 |
| M7: flat key 위반 시 exit 1 | PASS | `errors.json` 루트에 flat string 임시 주입 → exit 1 검출. 제거 후 exit 0 복원 확인 |
| M8: backend lint:ci 통과 | PASS | `LINT_EXIT: 0`, ESLint 에러 없음 |
| M9: OverflowAction 단일 정의 | PASS | `grep -rn "interface OverflowAction"` → `lib/types/checkout-ui.ts:9` 1건만 |
| M10: identifier negative test | PASS | 13 tests passed; `Identifier error propagation (negative test — CSPRNG 장애 시 서비스 중단)` describe 블록 + `generateAttachmentId propagates crypto failure` 1건 이상 확인 |
| M11: i18n namespaces 배열 동작 변경 0건 | PASS | `git diff HEAD -- apps/frontend/i18n/request.ts` → namespaces 배열 항목 추가/삭제 없음. 변경 내용은 주석만 (Phase 0/1 문구 → 단일 요약 주석) |
| M12: tracker 중복 [ ] 항목 0건 | PASS | `grep -E "^\- \[ \].*pre-existing-dday-deprecation"` → 0건. dashboard-controller-zod-scope-validation, dashboard-controller-process-env-direct 동일 0건 |
| M13: frontend-patterns.md 모순 표현 제거 | PASS | "props으로 끌어올리는 것이 일관적이다" 표현 없음. 도메인 디렉토리 / `components/shared/` / `common.*` namespace 3가지 위치별 정책으로 분기 명확히 기재 확인 |
| M14: approvals sub-module 순환 의존 0건 | PASS | `grep "from.*actions" fetchers.ts` → 출력 없음. `grep -E "from.*(fetchers\|actions)" mappers.ts` → 출력 없음 |

---

## SHOULD Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| S1: backend test 전체 통과 | PASS | 74 suites, 979 tests, exit 0 |
| S2: approvals-api.ts barrel ≤ 80줄 | PASS | **61줄** |
| S3: sub-module 각 ≤ 500줄 | PASS | types 295 / internal-rows 87 / mappers 404 / fetchers 326 / actions 353 — 전체 500줄 이하 |
| S4: mappers.ts 외부 API 모듈 import 0건 | PASS | 4건(calibration-api, checkout-api, non-conformances-api, equipment-import-api) 모두 `import type` — 런타임 의존 없음. 나머지 값 import는 `@equipment-management/schemas`(SSOT)와 `@/lib/utils/permission-helpers`(유틸) 뿐. 순수 함수 기준 충족 |
| S5: NextStepPanel.tsx 신규 호출처 권장 import 경로 주석 | PASS | `// SSOT: OverflowAction은 lib/types/checkout-ui.ts에 정의. 신규 호출처는 그 파일을 직접 import.` 주석 존재 |
| S6: CROSS_CUTTING_NAMESPACES 상수 1곳만 정의 | PASS | `grep -c "const CROSS_CUTTING_NAMESPACES" scripts/check-i18n-call-sites.mjs` → **1** |

---

## Issues Requiring Fix

없음 — 모든 MUST 기준 통과.

## SHOULD Failures (tech-debt candidates)

없음 — 모든 SHOULD 기준도 통과.

---

## 반복 이력

| Iteration | Verdict | 실패 원인 |
|-----------|---------|----------|
| 1 | FAIL | M6: 상수명 `STRUCTURAL_NAMESPACES_NO_FLAT` — 계약 요구 `CROSS_CUTTING_NAMESPACES` 불일치; S4/S6 FAIL |
| 2 | PASS | M6 수정 확인 (`CROSS_CUTTING_NAMESPACES`로 rename); S4 재판정 (import type = 런타임 의존 없음 → PASS) |
