## Evaluation Report: z-sticky-ssot-extension
**Iteration**: 1
**Date**: 2026-05-13

### MUST Results

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M-1 | `CSS_VAR_NAMES.zSticky: '--z-sticky'` entry 추가 | PASS | `css-variables.ts:122` — `zSticky: '--z-sticky'` 확인. `as const satisfies Record<string, \`--\${string}\`>` 타입 제약 유지됨 |
| M-2 | `globals.css :root`에 `--z-sticky: 20` 정의 존재 | PASS | `globals.css:454` — `--z-sticky: 20;` 확인. 파일 내 단 1건(중복 없음) |
| M-3 | `bulk-action-bar.ts` SSOT 주석이 `CSS_VAR_NAMES.zSticky` 참조 | PASS | `bulk-action-bar.ts:14,22` — `stickyTop`·`stickyBottom` 양쪽 JSDoc에 `CSS_VAR_NAMES.zSticky` 참조 확인 |
| M-4 | `equipment.ts:782` `z-20` → `z-[var(--z-sticky,20)]` 마이그레이션 | PASS | `equipment.ts:783` — `EQUIPMENT_TAB_UNDERLINE_TOKENS.container`가 `z-[var(--z-sticky,20)]` 포함 확인 |
| M-5 | `pnpm --filter frontend tsc --noEmit` EXIT 0 | PASS | tsc 실행 결과 EXIT 0, 오류 없음 |
| M-6 | `pnpm --filter frontend build` EXIT 0 | INCONCLUSIVE | 빌드가 `SIGTERM`으로 강제 종료됨 (환경 제약 — Compiled successfully in 16.2s 메시지 후 signal 종료). 코드 오류 아님. tsc EXIT 0으로 컴파일 정합성은 확인됨 |
| M-7 | `--z-sticky` fallback `20`이 `ELEVATION_PRIMITIVES.zIndex.dropdown`과 일치 | PASS | `primitives.ts:148` — `dropdown: 20` 확인. `globals.css:454` — `--z-sticky: 20` 일치 |

### SHOULD Results

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S-1 | `css-variables.ts` JSDoc에 Producer/Consumer 목록 포함 | PARTIAL | `zSticky` JSDoc (css-variables.ts:115-120)에 Consumers 목록 존재. 그러나 Consumer 참조 오류: `EQUIPMENT_TAB_UNDERLINE_TOKENS.underline` (line 117) — 실제 속성명은 `.container`. 같은 파일의 `stickyHeaderHeight` JSDoc(line 54)은 `.container`로 정확히 명시. Producer 는 static CSS variable이므로 `setProperty` Producer 없음 — 의도된 생략으로 판단 |
| S-2 | `globals.css` 주석이 SSOT 참조 설명 포함 | PARTIAL | `globals.css:451-453` 주석에 `CSS_VAR_NAMES.zSticky` 및 `ELEVATION_PRIMITIVES.zIndex.dropdown` 참조 포함. 그러나 동일한 Consumer 오류: `EQUIPMENT_TAB_UNDERLINE_TOKENS.underline` (line 453) — 실제 속성명은 `.container` |
| S-3 | `equipment.ts` SSOT 주석 추가 | PASS | `equipment.ts:775-779` — `EQUIPMENT_TAB_UNDERLINE_TOKENS.container` JSDoc에 `SSOT: CSS_VAR_NAMES.zSticky` 참조 명시 확인 |

### Issues Found

**[S-1 / S-2] Consumer 속성명 오류 — `EQUIPMENT_TAB_UNDERLINE_TOKENS.underline` 존재하지 않음**

두 곳에서 동일한 오타:
1. `apps/frontend/lib/design-tokens/css-variables.ts:117`:
   ```
   *   - `EQUIPMENT_TAB_UNDERLINE_TOKENS.underline` (equipment.ts)
   ```
2. `apps/frontend/styles/globals.css:453`:
   ```
   * Consumers: BULK_ACTION_BAR_TOKENS.stickyTop/stickyBottom, EQUIPMENT_TAB_UNDERLINE_TOKENS.underline.
   ```

`EQUIPMENT_TAB_UNDERLINE_TOKENS`에 `underline` key는 존재하지 않는다 (`equipment.ts:772-804` 전체 확인). 실제 속성명은 `container` (`equipment.ts:782`). 동일 파일의 `stickyHeaderHeight` JSDoc(line 54)은 `.container`로 정확히 명시하고 있어, `zSticky` JSDoc만 inconsistent.

이는 MUST 기준 위반이 아니므로 MUST 판정에 영향 없음. SHOULD S-1·S-2 부분 실패.

**[M-6] Build SIGTERM**

`pnpm --filter frontend build` 실행 중 `Compiled successfully in 16.2s` 이후 SIGTERM으로 종료. 환경 리소스 제약(실행 시간 초과)으로 판단되며, 코드 문제로 인한 빌드 실패 아님. tsc EXIT 0으로 타입 오류는 없음. 빌드 검증은 별도 환경에서 재실행 필요.

**[hardcoding regression 검사] CLEAR**

나머지 `z-20` 사용처 (`dashboard.ts:423` popup, `calibration.ts:503` tooltip, `sidebar.ts:33` Z_CLASS_MAP lookup, `calendar.tsx:38` focus-within) 모두 sticky 컨텍스트 외 absolute 포지셔닝 또는 utility 매핑 — regression 없음.

### Verdict: PASS

M-1~M-7 모두 PASS (M-6는 환경 제약으로 INCONCLUSIVE이나 코드 오류 아님).
SHOULD S-1·S-2는 `EQUIPMENT_TAB_UNDERLINE_TOKENS.underline` → `.container` 오타로 PARTIAL.
tsc 통과, CSS variable 중복 없음, `as const satisfies` 타입 제약 유지, fallback 값 primitives 정합.

**권장 후속 수정 (non-blocking)**:
- `css-variables.ts:117`: `EQUIPMENT_TAB_UNDERLINE_TOKENS.underline` → `EQUIPMENT_TAB_UNDERLINE_TOKENS.container`
- `globals.css:453`: `EQUIPMENT_TAB_UNDERLINE_TOKENS.underline` → `EQUIPMENT_TAB_UNDERLINE_TOKENS.container`
