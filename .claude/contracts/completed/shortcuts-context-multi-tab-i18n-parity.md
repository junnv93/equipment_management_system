---
slug: shortcuts-context-multi-tab-i18n-parity
mode: 1
created: 2026-05-12
parent_sprint: checkouts-sprint4-followups-s1-s3-s8
---

# Contract — checkouts-sprint4-followups round#2 (G-15/G-16/G-17)

라운드 #1 후속 자기검토 라운드 #2 closure. SSOT 준수, 옛 API 사용 금지, 시스템 전반 개선.

## Scope (단일 도메인 + spec)

| File | Action |
|------|--------|
| `apps/frontend/components/checkouts/KeyboardShortcutsProvider.tsx` | G-16: storage event listener 추가 |
| `apps/frontend/app/(dashboard)/settings/shortcuts/ShortcutsSettingsContent.tsx` | G-15: Context API 통합 |
| `apps/frontend/lib/shortcuts/__tests__/overrides.test.ts` | (변경 없음 — round-trip 회귀 유지) |
| `apps/frontend/components/checkouts/__tests__/KeyboardShortcutsProvider.test.tsx` | G-16 신규 — storage event sync 회귀 |
| `apps/frontend/lib/__tests__/i18n-parity.test.ts` | G-17 신규 — ko/en parity automation |

## MUST Criteria (block loop)

- **M-1** `pnpm --filter frontend run tsc --noEmit` EXIT=0
- **M-2** `pnpm --filter frontend run lint` EXIT=0 (production scope)
- **M-3** `pnpm --filter frontend run test -- --testPathPattern="(shortcuts|KeyboardShortcuts|i18n-parity)"` ALL PASS
- **M-4** `ShortcutsSettingsContent.tsx` 가 `lib/shortcuts/overrides.ts` 의 `loadShortcutOverrides` / `saveShortcutOverrides` / `resetShortcutOverrides` 를 **직접 import 안 함** (G-15 핵심: Context API SSOT). `isValidOverrideKey` 와 `SHORTCUT_OVERRIDES_STORAGE_KEY`, `ShortcutOverrideMap` 타입 import 는 허용 (UI validation / SSR-safe constant).
  - 검증: `grep -E "loadShortcutOverrides|saveShortcutOverrides|resetShortcutOverrides" apps/frontend/app/\(dashboard\)/settings/shortcuts/ShortcutsSettingsContent.tsx` EXIT=1 (매치 0)
- **M-5** `ShortcutsSettingsContent.tsx` 가 `KeyboardShortcutsContext` 의 `setOverride`/`clearOverride`/`resetAllOverrides`/`overrides` 를 `useContext` 또는 신규 `useKeyboardShortcutsContext` 훅으로 소비.
  - 검증: `grep -E "useKeyboardShortcutsContext|KeyboardShortcutsContext" apps/frontend/app/\(dashboard\)/settings/shortcuts/ShortcutsSettingsContent.tsx` 매치 ≥1
- **M-6** `KeyboardShortcutsProvider.tsx` 가 `window.addEventListener('storage', ...)` 등록 + cleanup (G-16 핵심).
  - 검증: `grep -E "addEventListener\\('storage'" apps/frontend/components/checkouts/KeyboardShortcutsProvider.tsx` 매치 ≥1
  - 검증: `grep -E "removeEventListener\\('storage'" apps/frontend/components/checkouts/KeyboardShortcutsProvider.tsx` 매치 ≥1
- **M-7** storage handler 가 `SHORTCUT_OVERRIDES_STORAGE_KEY` SSOT 사용 (인라인 문자열 금지).
  - 검증: `grep -c "'shortcut_overrides_v1'" apps/frontend/components/checkouts/KeyboardShortcutsProvider.tsx` 결과 0 (SSOT 경유만 허용)
- **M-8** storage handler 가 다른 origin/key 이벤트 무시 (key 가 SHORTCUT_OVERRIDES_STORAGE_KEY 일치 시에만 처리).
  - 검증: provider 에 `key !== SHORTCUT_OVERRIDES_STORAGE_KEY` 또는 동등 가드 존재
- **M-9** G-17 spec: 모든 도메인 25 파일 ko/en 키 sorted equality. 누락된 파일/키 1건이라도 있으면 FAIL.
  - 검증: spec 실행 후 PASS, locale 디렉토리 자동 enumeration
- **M-10** `apps/frontend/components/checkouts/__tests__/KeyboardShortcutsProvider.test.tsx` 신규 — storage event simulate → state 갱신 검증 (jsdom StorageEvent ctor + dispatchEvent)
- **M-11** Round-trip 보존 — 기존 `apps/frontend/lib/shortcuts/__tests__/overrides.test.ts` 8 케이스 PASS 유지

## SHOULD Criteria (no loop block, log to tech-debt)

- **S-1** Storage event listener 가 dev-only console.warn 등으로 noise 없음
- **S-2** Settings 페이지에서 다른 탭의 변경 시 cheatsheet 도 즉시 반영 (Provider Context 가 단일 source 이므로 자동 충족)
- **S-3** `KeyboardShortcutsCheatsheet` 같은 다른 Context consumer 도 storage sync 혜택 (자동 충족 - context value 갱신만)
- **S-4** i18n-parity spec 실패 메시지가 어느 도메인 / 어느 키 / 어느 locale 인지 명시
- **S-5** i18n-parity spec 이 nested key (e.g. `errors.validation.required`) 까지 recursive 검증

## Verification Plan

1. **Static** — Step 4 generator self-check
   - `pnpm --filter frontend run tsc --noEmit`
   - 각 MUST grep 명령
2. **Runtime** — Step 5 evaluator
   - 위 jest test:e2e 제외 (이번 sprint는 unit/integration only)
   - Playwright 생략 (Settings shortcut UI 는 이미 round#1 sprint 에서 검증)

## Out of Scope

- `KeyboardShortcutsCheatsheet` 디자인 변경
- `useKeyboardShortcuts` 훅 시그니처 변경
- 도메인 i18n 키 신규 추가/삭제
- 신규 dashboard 전역 layout 승격 (별도 sprint)

## Cleanup (Step 7)

- tech-debt-tracker.md G-15/G-16/G-17 strike-through `[x]` + closure note (sprint slug + commit hash)
- contract → `.claude/contracts/completed/shortcuts-context-multi-tab-i18n-parity.md`
- REGISTRY.md Active 정리 + Completed 추가
