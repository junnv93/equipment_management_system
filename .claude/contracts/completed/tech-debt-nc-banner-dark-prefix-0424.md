# Contract: tech-debt-nc-banner-dark-prefix-0424

## Scope

NC 디자인 리뷰 Phase 1 감사 중 탐지된 기존 빈틈. 이번 플랜 범위 외이므로 별도 세션에서 처리.

| # | 항목 | 위반 원칙 | 위치 |
|---|------|----------|------|
| ① | `NC_BANNER_TOKENS.statusAlert`에 `dark:` prefix 사용 | `dark:bg-brand-*` 금지 (memory `Brand Color Migration`) | `apps/frontend/lib/design-tokens/components/non-conformance.ts` L93 |

## 위반 상세

```ts
// 현재 (2026-04-24 기준)
statusAlert:
  'border-brand-critical/20 bg-brand-critical/5 dark:border-brand-critical/30 dark:bg-brand-critical/10',
```

**문제**: `var(--brand-critical)` CSS 변수가 `:root`와 `.dark` 양쪽에 이미 정의돼 있어 `dark:` prefix가 불필요. prefix는 CSS 변수 자동 전환 체계를 우회하며, 라이트/다크 두 값을 수동 관리하게 만들어 유지보수성 저하.

## 예상 수정

```ts
// 개선안 (opacity 분화 제거 — :root/.dark CSS 변수에 맡김)
statusAlert: 'border-brand-critical/20 bg-brand-critical/5',
// 또는 dark에서 더 강한 색이 필요한 UX 의도가 있다면:
statusAlert: 'border-brand-critical/25 bg-brand-critical/8',  // 중간값 single source
```

## 전체 스캔 필요

이 위반이 statusAlert에만 있는지 전체 grep으로 확인:
```bash
grep -rn "dark:\(bg\|border\|text\)-brand-" apps/frontend/lib/design-tokens/
grep -rn "dark:\(bg\|border\|text\)-brand-" apps/frontend/components/
```

## MUST Criteria (미래 세션)

| # | Criterion | Verify Command |
|---|-----------|----------------|
| M1 | NC_BANNER_TOKENS.statusAlert에 `dark:` prefix 없음 | `grep -n "dark:" apps/frontend/lib/design-tokens/components/non-conformance.ts` → statusAlert 관련 0건 |
| M2 | lib/design-tokens 전체에 `dark:.*-brand-` 0건 | `grep -rn "dark:[a-z]\+-brand-" apps/frontend/lib/design-tokens/` → 0건 |
| M3 | tsc --noEmit PASS | `pnpm --filter frontend run tsc --noEmit` |
| M4 | NC 리스트/장비 상세 페이지 라이트/다크 시각 회귀 없음 | 수동 브라우저 확인 또는 visual regression 테스트 |

## 배경

2026-04-24 세션 95차 - NC 디자인 리뷰 rev-2 Phase 1 자체 감사 중 발견.
Phase 1 Foundation Tokens는 이미 commit `7a851f78` + follow-up(Phase 1.1)로 main에 반영됨.
이 tech-debt는 Phase 1 범위(토큰 확장)와 무관한 **기존 코드 빈틈**이며, NC 디자인 리뷰 Phase 2~4 진입 전/후 어느 시점이든 독립 처리 가능.

## Deferred 사유

Phase 1은 "UI 무영향 토큰 선언만"이 범위. 기존 `statusAlert` 수정은 rendering behavior 변경 가능성 있어 별도 검증 필요. Scope creep 방지.

## 관련 memory

- `brand-color-migration.md` — `dark:` prefix 불필요 원칙
- `feedback_plan_precommit_architectural_audit.md` — 플랜 감사 중 발견된 외부 이슈는 tech-debt로 기록
