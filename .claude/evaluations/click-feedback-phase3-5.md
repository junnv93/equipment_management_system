# Evaluation Report: click-feedback-phase3-5

**Date**: 2026-04-29
**Verdict**: FAIL

---

## Contract Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | loading.tsx SSOT 마이그레이션 완료 | FAIL | `cables/loading.tsx`와 `software/loading.tsx` 두 파일이 Phase 3 커밋에서 누락. 여전히 `@/components/layout/RouteLoading` (deprecated 경로) 사용 + `variant="table"` 미수정 |
| M2 | 누락 loading.tsx 6종 신규 생성 | PASS | check/return/edit/repair-history/scan/settings 5개 — 모두 존재, RouteLoading SSOT 사용 확인 |
| M3 | use-optimistic-mutation i18n 토스트 | PASS | 성공 토스트 `title: tGlobal(FEEDBACK_KEYS.success)` 사용. 에러 토스트는 `getLocalizedErrorInfo(code, t)` i18n 경유 |
| M4 | 409 retry ToastAction | PASS | `use-optimistic-mutation.tsx:264` + `use-cas-guarded-mutation.tsx:80` 양쪽 `ToastAction` + `isConflictError` 패턴 확인 |
| M5 | use-debounced-search + SearchInput pending | PASS | `isPending = processedValue !== debouncedValue` 구현. `SearchInput` `pending` prop → `Loader2 motion-safe:animate-spin` 연결 |
| M6 | generate-loading.ts 스크립트 | PASS | `apps/frontend/scripts/generate-loading.ts` 존재 |
| M7 | tsc --noEmit 에러 0 | PASS | `cd apps/frontend && pnpm tsc --noEmit` 출력 없음 (에러 0) |
| M8 | SSOT 준수 (FEEDBACK_KEYS + dark: 0) | FAIL | `use-form-submission.ts:38`에 `title: '처리 완료'` + `:42` `title: '처리 실패'`, `use-mutation-with-refresh.ts:153`에 `title: '삭제 완료'` — 런타임 실행 경로에 한글 리터럴. Invariant I4 "모든 사용자向 텍스트 i18n 키" 위반. `dark:` 신규 추가는 0으로 통과 |

---

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | verify-click-feedback 스킬 10 step | PASS | `.claude/skills/verify-click-feedback/SKILL.md` 존재, Steps 1–10 확인 |
| S2 | 아키텍처 문서 2개 | FAIL | `docs/architecture/click-feedback.md`, `docs/architecture/navigation-feedback.md` 모두 없음 |
| S3 | Phase 4a Button codemod | FAIL | `scripts/codemods/button-loading.ts` 없음 (계획서에서 "별도 브랜치" 표시이므로 스킵 의도 가능, 그래도 FAIL) |

---

## MUST Verification (verify-click-feedback skill 기준)

| Step | 결과 |
|------|------|
| Step 1 (FEEDBACK_KEYS 하드코딩) | **FAIL** — `use-form-submission.ts:38,42` + `use-mutation-with-refresh.ts:153` 에 한글 토스트 title 리터럴 |
| Step 3 (loading.tsx a11y I3) | **FAIL** — 아래 "Issues Found" 참조 |
| Step 4 (409 retry ToastAction) | PASS |
| Step 7 (motion-safe:animate-spin) | **FAIL** — 6개 파일에서 bare `animate-spin` 잔존 |

---

## Issues Found

### [FAIL-M1-A] deprecated import 미수정 — loading.tsx 2개
- `apps/frontend/app/(dashboard)/cables/loading.tsx:1` — `@/components/layout/RouteLoading` (deprecated)
- `apps/frontend/app/(dashboard)/software/loading.tsx:1` — `@/components/layout/RouteLoading` (deprecated)
- 두 파일 모두 `variant="table"` 유지 (M1 매핑: `table` → `list`)
- Phase 3 커밋 (`59feb1dc`)에 포함되지 않음. M1 "전체 교체" 기준 위반.

### [FAIL-M8-A / I4] 런타임 한글 리터럴 — 기존 훅 미수정
- `apps/frontend/hooks/use-form-submission.ts:38` — `title: '처리 완료'`
- `apps/frontend/hooks/use-form-submission.ts:42` — `title: '처리 실패'`
- `apps/frontend/hooks/use-mutation-with-refresh.ts:153` — `title: '삭제 완료'`
- 이 파일들은 Phase 커밋에서 수정되지 않음. Invariant I4 "모든 사용자向 텍스트 i18n 키 (한글 리터럴 0)"는 시스템 전체 기준이므로 pre-existing 여부 불문하고 FAIL.

### [FAIL-Step7] bare `animate-spin` 6개 파일 (motion-safe: 누락)
- `apps/frontend/components/checkouts/HandoverQRDisplay.tsx:118`
- `apps/frontend/components/equipment/BulkLabelPrintButton.tsx:125`
- `apps/frontend/components/equipment/EquipmentQRButton.tsx:280`
- `apps/frontend/components/equipment/EquipmentQRCode.tsx:152`
- `apps/frontend/components/ui/inline-action-button.tsx:92`
- `apps/frontend/components/audit-logs/AuditTimelineFeed.tsx:455`
- Phase 4h는 `ExportFormButton` 1개만 수정. 나머지 6개 미처리.
- verify-click-feedback Step 7 기준: "결과 0건" — FAIL.

### [FAIL-I3] 커스텀 스켈레톤 loading.tsx a11y 누락 (pre-existing, 미수정)
- `apps/frontend/app/(dashboard)/equipment/[id]/loading.tsx` — 커스텀 스켈레톤, `role="status"` 없음
- `apps/frontend/app/(dashboard)/software/[id]/validation/loading.tsx` — 커스텀 스켈레톤, `role="status"` 없음
- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/loading.tsx` — 커스텀 스켈레톤, `role="status"` 없음
- `apps/frontend/app/(auth)/loading.tsx` — `role="main"` + `aria-busy` 사용. `role="status"` 아님. I3 위반.
- M1 "커스텀 skeleton loading.tsx → role="status" aria-busy="true" 추가" 적용 누락.
- *참고: `ListPageSkeleton`/`TablePageSkeleton`을 사용하는 loading.tsx들은 컴포넌트 내부에 `role="status"` 존재 — 통과.*

---

## Recommendation

**FAIL → 아래 4개 항목 수정 후 재평가:**

1. `cables/loading.tsx`, `software/loading.tsx` — `@/components/layout/RouteLoading` → `@/components/loading` 경로 수정 + `variant="table"` → `"list"` 변경
2. `use-form-submission.ts`, `use-mutation-with-refresh.ts` — 런타임 한글 리터럴 → `FEEDBACK_KEYS` + `useTranslations()` 경유
3. bare `animate-spin` 6개 파일 → `motion-safe:animate-spin` 교체
4. `equipment/[id]/loading.tsx`, `software/[id]/validation/loading.tsx`, `software/[id]/validation/[validationId]/loading.tsx`, `(auth)/loading.tsx` — `role="status" aria-busy="true"` 추가 (또는 RouteLoading SSOT 흡수)
