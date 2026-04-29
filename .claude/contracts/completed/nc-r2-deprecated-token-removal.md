---
slug: nc-r2-deprecated-token-removal
created: 2026-04-26
mode: 1
follows: [nc-p4-guidance, nc-detail-design-fix]
round: 2
---

# Contract: NC-R2 Deprecated 토큰 제거 + Raw Tailwind 토큰 흡수

## Context

NC 코드 리뷰 Round-2 항목 #6, #9 대응.

- `nc-p4-guidance` contract 실행 후 NC_ELEVATION, NC_INFO_NOTICE_TOKENS, NC_URGENT_BADGE_TOKENS, NC_FOCUS, NC_SPACING_TOKENS.detail.calloutAfterTimeline 는 **사용처 0건**으로 확인. 정의부만 남은 dead code 제거.
- NCDocumentsSection.tsx의 view 토글·list row·delete 버튼 3건 raw Tailwind가 NC_DOCUMENTS_SECTION_TOKENS 바깥에 존재. 같은 파일 상단 JSDoc에서 "raw Tailwind 금지" 선언과 모순.
- NCDetailClient.tsx의 RepairCard/CalibrationCard 링크 패턴 3건(`text-sm text-brand-info hover:underline inline-flex items-center gap-1`)이 NC_INFO_CARD_TOKENS 밖에서 반복.

**사전 검증된 사실**
- deprecated 4종 + calloutAfterTimeline 잔존 호출: 0건 (`grep -rn` → no output)
- NCDocumentsSection.tsx 현재 NC_DOCUMENTS_SECTION_TOKENS 참조: 8건
- NCDetailClient.tsx 현재 NC_INFO_CARD_TOKENS 참조: 이미 import·사용 중 (registerLink 키만 신규 추가)

## Scope

- MOD: `apps/frontend/lib/design-tokens/components/non-conformance.ts`
  - 제거 대상: `NC_ELEVATION`(~L80), `NC_INFO_NOTICE_TOKENS`(~L875), `NC_URGENT_BADGE_TOKENS`(~L1093), `NC_FOCUS`(~L851), `NC_SPACING_TOKENS.detail.calloutAfterTimeline`
  - 신규 키 추가: `NC_DOCUMENTS_SECTION_TOKENS.toggleGroup`, `.listRow`, `.deleteButton`
  - 신규 키 추가: `NC_INFO_CARD_TOKENS.registerLink`
- MOD: `apps/frontend/components/non-conformances/NCDocumentsSection.tsx`
  - L149 raw Tailwind (view 토글) → `NC_DOCUMENTS_SECTION_TOKENS.toggleGroup`
  - L222 raw Tailwind (list row `grid grid-cols-[40px_1fr_90px_110px_32px] ...`) → `NC_DOCUMENTS_SECTION_TOKENS.listRow`
  - L268 raw Tailwind (delete button) → `NC_DOCUMENTS_SECTION_TOKENS.deleteButton`
- MOD: `apps/frontend/components/non-conformances/NCDetailClient.tsx`
  - L583/651/673 `"text-sm text-brand-info hover:underline inline-flex items-center gap-1"` → `NC_INFO_CARD_TOKENS.registerLink`

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | NC_ELEVATION 정의부 제거 | `! grep -n "^export const NC_ELEVATION" apps/frontend/lib/design-tokens/components/non-conformance.ts` |
| M2 | NC_INFO_NOTICE_TOKENS 정의부 제거 | `! grep -n "^export const NC_INFO_NOTICE_TOKENS" apps/frontend/lib/design-tokens/components/non-conformance.ts` |
| M3 | NC_URGENT_BADGE_TOKENS 정의부 제거 | `! grep -n "^export const NC_URGENT_BADGE_TOKENS" apps/frontend/lib/design-tokens/components/non-conformance.ts` |
| M4 | NC_FOCUS 정의부 제거 | `! grep -n "^export const NC_FOCUS" apps/frontend/lib/design-tokens/components/non-conformance.ts` |
| M5 | calloutAfterTimeline 정의·참조 모두 제거 | `! grep -rn "calloutAfterTimeline" apps/frontend/` |
| M6 | deprecated 토큰 잔존 사용 0건 | `! grep -rn "NC_ELEVATION\b\|NC_INFO_NOTICE_TOKENS\|NC_URGENT_BADGE_TOKENS\|NC_FOCUS\b" apps/frontend/components/ apps/frontend/app/` |
| M7 | NCDocumentsSection 신규 토큰 키 사용 | `grep -c "NC_DOCUMENTS_SECTION_TOKENS\." apps/frontend/components/non-conformances/NCDocumentsSection.tsx` → 11 이상 |
| M8 | NCDocumentsSection raw toggleGroup 제거 | `! grep -n '"inline-flex border rounded-md overflow-hidden text-xs"' apps/frontend/components/non-conformances/NCDocumentsSection.tsx` |
| M9 | NCDocumentsSection raw listRow 제거 | `! grep -n "grid-cols-\[40px_1fr_90px_110px_32px\]" apps/frontend/components/non-conformances/NCDocumentsSection.tsx` |
| M10 | NC_INFO_CARD_TOKENS.registerLink 신규 키 정의 | `grep -n "registerLink" apps/frontend/lib/design-tokens/components/non-conformance.ts` → ≥ 1 |
| M11 | NCDetailClient registerLink 패턴 토큰화 | `grep -c "NC_INFO_CARD_TOKENS.registerLink" apps/frontend/components/non-conformances/NCDetailClient.tsx` → 3 |
| M12 | NCDetailClient raw registerLink 클래스 직접 사용 제거 | `! grep -n '"text-sm text-brand-info hover:underline inline-flex' apps/frontend/components/non-conformances/NCDetailClient.tsx` |
| M13 | 신규 추가 키 값에 `dark:` prefix 없음 | `grep -A3 '"toggleGroup":\|"listRow":\|"deleteButton":\|"registerLink":' apps/frontend/lib/design-tokens/components/non-conformance.ts \| grep -c "dark:"` → 0 |
| M14 | tsc 통과 | `pnpm tsc --noEmit -p apps/frontend/tsconfig.json --skipLibCheck 2>&1 \| grep -v ".next/" \| grep -c "error" → 0` |
| M15 | lint 통과 | `pnpm --filter frontend lint 2>&1 \| tail -5` → 0 errors |
| M16 | verify-design-tokens PASS | `/verify-design-tokens` 스킬 실행 — PASS |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | NCDocumentsSection.tsx deleteButton raw Tailwind 나머지 잔존 패턴도 추가 토큰화 (L255, L260 등) |
| S2 | non-conformance.ts JSDoc 상단의 deprecated 안내 문구 정리 (제거된 토큰 언급 삭제) |
| S3 | NCDocumentsSection.tsx `eslint-disable-line no-restricted-syntax` 주석 제거 — `Promise.allSettled` result status 체크를 허용하도록 프로젝트 ESLint 규칙(`no-restricted-syntax`) 예외 추가 (`allow` 패턴 또는 overrides). 컴포넌트마다 주석 반복 금지. |

## Domain Rules

- 신규 토큰 값은 기존 raw Tailwind 문자열 그대로 복사. 리팩터링 목적이므로 시각적 변경 없음.
- `dark:` prefix 금지 — CSS 변수 자동 전환 체계 위반 (메모리 규칙)
- `transition: all` 대신 구체적 property 명시 (`transition-colors` 등)
- non-conformance.ts에서 제거만 하고 semantic.ts / shared 토큰은 건드리지 않음

## Non-Goals

- deprecated 토큰을 `ELEVATION_TOKENS` 등으로 **대체 import**하는 작업 불필요 — 사용처 0건이므로 삭제만
- NCDocumentsSection의 나머지 raw Tailwind 전수 토큰화 (이번 스코프는 3건만)
- NCDetailClient의 R4 대상 영역(gridRepairLinked, EmptyState 등) 수정 금지 — 이후 contract 분리
