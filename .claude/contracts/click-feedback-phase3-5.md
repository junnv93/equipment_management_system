---
# Contract: Click-Feedback Phase 3 Part 2 + Phase 4 + Phase 5
slug: click-feedback-phase3-5
created: 2026-04-29
plan: /home/kmjkds/.claude/plans/dynamic-squishing-pnueli.md
---

## Scope

Phase 3 part 2: loading.tsx 마이그레이션 + 누락 생성
Phase 4d: use-optimistic-mutation i18n 토스트 sweep
Phase 4e: 409 충돌 retry 액션 버튼
Phase 4b: use-debounced-search hook + SearchInput pending
Phase 4a: Button loading codemod (50+ 호출자, 별도 branch)
Phase 5: verify-click-feedback 스킬 + 핵심 문서

## MUST Criteria

### M1 — loading.tsx SSOT 마이그레이션
- [ ] `@/components/layout/RouteLoading` 사용 loading.tsx 전체가 `@/components/loading`으로 교체
- [ ] `variant="table"` → `"list"`, `variant="cards"` → `"dashboard"/"list"` 매핑 완료
- [ ] 커스텀 skeleton loading.tsx (custom without a11y) → `role="status" aria-busy="true"` 추가

### M2 — 누락 loading.tsx
- [ ] `checkouts/[id]/check/loading.tsx` 신규 (variant="form")
- [ ] `checkouts/[id]/return/loading.tsx` 신규 (variant="form")
- [ ] `equipment/[id]/edit/loading.tsx` 신규 (variant="form")
- [ ] `equipment/[id]/repair-history/loading.tsx` 신규 (variant="list")
- [ ] `e/[managementNumber]/loading.tsx` 신규 (variant="scan")
- [ ] settings 서브 라우트 5개 신규 (variant="form")

### M3 — i18n 토스트 (Phase 4d)
- [ ] `use-optimistic-mutation.ts` 성공 toast `title: '성공'` → `t(FEEDBACK_KEYS.success)`
- [ ] `successMessage` 하드코딩 한글 → caller 책임으로 (hook은 t() 래핑 강제)

### M4 — 409 retry (Phase 4e)
- [ ] `use-optimistic-mutation.ts` 409 toast에 "다시 시도" ToastAction 추가
- [ ] `use-cas-guarded-mutation.ts` 동일 패턴 적용

### M5 — use-debounced-search (Phase 4b)
- [ ] `hooks/use-debounced-search.ts` 신규 (use-debounced-value wrapper + isPending)
- [ ] `components/ui/search-input.tsx` pending prop 추가

### M6 — generate-loading.ts 스크립트
- [ ] `scripts/generate-loading.ts` 신규 — page.tsx 형제 loading.tsx 누락 검출

### M7 — tsc 통과
- [ ] `pnpm tsc --noEmit` (frontend) 에러 0

### M8 — SSOT 준수
- [ ] `FEEDBACK_KEYS` 상수 경유 (raw 키 입력 0)
- [ ] `dark:` prefix 신규 추가 0

## SHOULD Criteria

### S1 — verify-click-feedback 스킬
- [ ] `.claude/skills/verify-click-feedback/SKILL.md` 신규 10 step

### S2 — 아키텍처 문서
- [ ] `docs/architecture/click-feedback.md` (5-Layer 요약)
- [ ] `docs/architecture/navigation-feedback.md` (router.push 래핑 룰)

### S3 — Phase 4a Button codemod
- [ ] `scripts/codemods/button-loading.ts` (ts-morph) — dry-run 출력만
- [ ] 브랜치 필요 (50+ 파일 일괄, main 직접 금지)

## Invariants (검증 기준)
- I3: 모든 loading.tsx → role="status" + aria-busy="true" + sr-only i18n
- I4: 모든 사용자向 텍스트 → i18n 키 (한글 리터럴 0)
- I12: use-optimistic-mutation / use-cas-guarded-mutation BC 100% (50+ 호출자 1줄 수정 없음)
