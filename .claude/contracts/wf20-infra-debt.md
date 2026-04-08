# Contract: wf20-infra-debt

**Mode**: 1 (Lightweight)
**Created**: 2026-04-08
**Origin**: example-prompts.md 34차 신규 인프라 부채 4건 (재범위 후)

## Background

WF-20 spec 작성 중 발견된 인프라/디자인 부채. Explore 결과 4건 중 1건은 이미 해결(false positive), 1건은 라이브러리 의도 동작이라 fix 방향이 변경됨. 임시방편 대신 SSOT/하드코딩 제거 관점에서 근본 처리.

## Scope (4 items)

### Item 1 — sticky header click 가로채기 (test infra root cause)
- **현재 상태**: WF-20 spec의 `safeClick(force: true)` + `window.scrollBy(0, -80)` 하드코딩 우회
- **인프라는 이미 존재**: `EquipmentStickyHeader.tsx`, `--sticky-header-height` CSS 변수, ResizeObserver
- **근본 원인**: e2e helper가 CSS 변수를 읽지 않고 매직 넘버 -80 사용
- **Fix**: `apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts` 신규 — `clickBelowStickyHeader(page, locator)`. CSS 변수를 `evaluate`로 동적 조회 후 element top이 sticky 영역 아래로 가도록 scroll. `force` 옵션 미사용. WF-20 spec의 `safeClick` 제거.

### Item 2 — "수정" accessible name 다중 발생 (i18n SSOT 보강)
- **현재 상태**: SelfInspectionTab의 행 액션 버튼 3종(edit/confirm/delete)이 컨텍스트 없는 일반 라벨만 노출. `getByRole('button', { name: '수정' })` 가 페이지 내 4+요소 매칭.
- **Fix**: `selfInspection.actions.editAriaLabel`/`confirmAriaLabel`/`deleteAriaLabel` 키를 `messages/ko/equipment.json` + `messages/en/equipment.json`에 추가 (ICU `{date}` 인자). `SelfInspectionTab.tsx`가 각 행 버튼에 `aria-label={t(..., { date: fmtDate(inspection.inspectionDate) })}` 부착. WF-20 spec은 `name`을 정확한 aria-label 패턴으로 교체 → `selfInspectionCard()` 헬퍼의 parent narrowing 우회 코드는 안전 net으로 유지.
- **Out of scope (tech debt)**: 중간점검/케이블/SW/교정 행 액션의 동등 적용은 후속.

### Item 3 — toast 이중 발화 (test helper 표준화)
- **현재 상태**: WF-20 spec이 `page.getByText(L.createSuccess).first()` 우회. Radix Toast의 시각 div + visually-hidden status span 두 곳에 동일 텍스트 발화는 **라이브러리의 의도된 a11y 패턴** — 컴포넌트 수정 시 SR 회귀 위험.
- **Fix**: `apps/frontend/tests/e2e/shared/helpers/toast-helpers.ts` 신규 — `expectToastVisible(page, text)` 헬퍼가 `li[role="status"]` (Radix viewport 내 시각 토스트 컨테이너)만 매칭. WF-20 spec의 `.first()` 우회 모두 helper 호출로 교체. Radix Toaster 컴포넌트는 **건드리지 않음**.

### Item 4 — audit_logs seed drift (false positive — archive)
- **확인 결과**: `apps/backend/src/database/utils/verification.ts:268-272`에 이미 `minOnly: true` 적용, `seed-test-new.ts:103`에 audit_logs truncate 포함.
- **Fix**: 코드 변경 없음. example-prompts.md 항목을 ✅ 완료(33차 이미 해결)로 마킹.

## MUST Criteria (PASS gate)

1. `pnpm tsc --noEmit` — 0 error (전 패키지)
2. `pnpm --filter frontend run lint` — 0 error/warning on touched files
3. `pnpm --filter frontend run test` — 0 fail (유닛)
4. `pnpm --filter backend run test` — 0 fail (유닛)
5. WF-20 spec(`wf-20-self-inspection-ui.spec.ts`) 내 `force: true` 사용 0건 + `window.scrollBy` 매직 넘버 0건
6. WF-20 spec 내 `.first()` 사용 — toast helper 호출로 일원화 (행 수정 버튼처럼 구조적 first()는 허용)
7. `messages/ko/equipment.json` 와 `messages/en/equipment.json` 에 `selfInspection.actions.editAriaLabel`/`confirmAriaLabel`/`deleteAriaLabel` 추가 + ICU `{date}` 인자 일치
8. `SelfInspectionTab.tsx` 의 3개 행 버튼이 모두 동적 `aria-label` 보유
9. 신규 helper 2종이 `apps/frontend/tests/e2e/shared/helpers/`에 위치 + JSDoc 보유
10. example-prompts.md 의 #4 항목 ✅ 마킹 + 짧은 검증 노트
11. **하드코딩 금지 검증**: 신규 helper는 매직 넘버 사용 금지 (sticky offset은 CSS 변수 read, 버퍼만 const)
12. **SSOT 검증**: aria-label 키는 i18n에서만 정의, 컴포넌트에 인라인 한국어 금지

## SHOULD Criteria (record but do not block)

- WF-20 spec 5 step 모두 새 helper 경유 후 1회 실제 e2e 재실행 통과 — *환경 의존이라 best-effort*
- 중간점검/케이블/SW/교정 행 액션에도 동일 aria-label SSOT 패턴 적용 — *후속 PR*
- `verify-i18n` 룰: 동일 i18n value 다중 사용 감지 — *후속 스킬 작업*
- `verify-e2e` 룰: `force: true` + `window.scrollBy` 매직 넘버 금지 — *후속 스킬 작업*

## Files Touched (Estimate)

| File | Action |
|---|---|
| `apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts` | NEW |
| `apps/frontend/tests/e2e/shared/helpers/toast-helpers.ts` | NEW |
| `apps/frontend/tests/e2e/workflows/wf-20-self-inspection-ui.spec.ts` | EDIT (safeClick 제거, helper 도입) |
| `apps/frontend/components/equipment/SelfInspectionTab.tsx` | EDIT (aria-label 부착) |
| `apps/frontend/messages/ko/equipment.json` | EDIT (3 키 추가) |
| `apps/frontend/messages/en/equipment.json` | EDIT (3 키 추가) |
| `.claude/skills/harness/references/example-prompts.md` | EDIT (#4 archive) |

총 7 파일 (Mode 1 범위 내).

## Risk Notes

- Radix Toaster를 건드리지 않으므로 기존 토스트 a11y 회귀 0
- aria-label 추가는 sighted UI에 영향 없음 (시각 라벨은 그대로 "수정")
- sticky helper는 spec 한 곳만 적용 — 다른 spec에 회귀 영향 0
- ICU `{date}` placeholder는 next-intl이 누락 시 throw → 호출부 누락 즉시 발견
