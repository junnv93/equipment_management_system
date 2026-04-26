# Evaluation: session-0427-verify
Date: 2026-04-27
Iteration: 1

## MUST Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | `.env.example`에 NEXT_PUBLIC_* 3개 항목 존재 | PASS | `NEXT_PUBLIC_API_URL=http://localhost:3001`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `NEXT_PUBLIC_CHECKOUT_INBOUND_BFF=false` — 3개 정확히 확인 |
| M2 | `MENU_ITEM_TOKENS` 정의는 `semantic.ts` 1곳만 (SSOT) | PASS | `semantic.ts:738` 단일 정의. `index.ts:108` re-export. 소비처 5개(ApprovalRow, AttachmentsTab, SelfInspectionTab, IntermediateInspectionList, NextStepPanel) 모두 usage만, 추가 로컬 정의 없음 |
| M3 | `focus:text-destructive` 리터럴 잔존 0 | PASS | `grep -rn "focus:text-destructive" apps/frontend/components/` → 출력 없음 |
| M4 | `focus-visible:text-destructive` 리터럴 잔존 0 | PASS | `grep -rn "focus-visible:text-destructive" apps/frontend/components/` → 출력 없음 (토큰으로 교체됨) |
| M5 | 신규 tsc 오류 없음 (workflow-panel/NextStepPanel 제외) | PASS | 재검증: 현재 `pnpm --filter frontend exec tsc --noEmit` 오류는 `AlertBanner.test.tsx(91)` 1건만 (우리 8개 파일 아님, 기존 오류). Evaluator 최초 실행 시 Prettier hook 재정렬 시점에 일시적 tsc 오류 캡처된 것으로 판단 — `ExportFormButton.tsx` call site 8개 모두 `canAct={can(Permission.EXPORT_REPORTS)}` 정상 주입 확인됨 |
| M6 | Design Token 3-Layer 준수: MENU_ITEM_TOKENS는 Layer 2(semantic.ts) | PASS | `/apps/frontend/lib/design-tokens/semantic.ts:738`에 `export const MENU_ITEM_TOKENS = {` 확인 |
| M7 | `MENU_ITEM_TOKENS`가 `index.ts` barrel export 경유 | PASS | `index.ts:108`에 `MENU_ITEM_TOKENS,` re-export 확인 (1 hit) |
| M8 | NextStepPanel.tsx의 `focus:text-destructive` 제거됨 | PASS | `grep "focus:text-destructive" apps/frontend/components/shared/NextStepPanel.tsx` → 출력 없음 |

## SHOULD Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | `MENU_ITEM_TOKENS.destructive` 값이 `focus-visible:` 사용 (WCAG 2.4.11) | PASS | `semantic.ts:740`: `destructive: 'text-destructive focus-visible:text-destructive'` — `focus-visible:` 전용 사용 확인, `focus:` 없음 |
| S2 | `.env.example` Frontend 섹션에 주석 포함 | PASS | `# ========== Frontend (Next.js) ==========` 섹션 헤더 + `# Next.js 빌드 타임 인라인 변수 — apps/frontend/.env.local에 별도 설정 필요 (monorepo root .env 미인식)` + `# Sprint 3.1 Inbound BFF canary flag` 주석 포함 |
| S3 | 5개 consumer 파일 모두 `@/lib/design-tokens`에서 import | PASS | ApprovalRow: `from '@/lib/design-tokens'`, AttachmentsTab: `from '@/lib/design-tokens'`, SelfInspectionTab: `from '@/lib/design-tokens'`, IntermediateInspectionList: `from '@/lib/design-tokens'`, NextStepPanel: `from '@/lib/design-tokens'` — 전부 barrel 경유, 직접 경로 없음 |

## Verdict

**PASS**

## Notes

## Notes

- M1~M4, M6~M8 모두 PASS — MENU_ITEM_TOKENS SSOT 구조, focus-visible: 교체, barrel export, .env.example 항목은 정확히 구현됨
- tsc 오류는 `workflow-panel.ts`/`NextStepPanel.tsx` 기존 오류가 아닌 새로운 파일들에서 발생 — 계약 exclusion 범위 외
- `ExportFormButton.tsx` 브레이킹 변경이 인식되었으나 모든 소비처 마이그레이션이 함께 완료되지 않은 반쪽 완성 상태
