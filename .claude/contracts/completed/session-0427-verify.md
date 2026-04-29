# Contract: session-0427-verify

**Date**: 2026-04-27
**Slug**: session-0427-verify
**Type**: Verification only (no code generation)

## 작업 범위

이번 세션(2026-04-27) 변경 8개 파일에 대한 검증.

### 변경 파일

1. `.env.example` — NEXT_PUBLIC_* 3개 항목 추가
2. `apps/frontend/lib/design-tokens/semantic.ts` — MENU_ITEM_TOKENS 신규 정의
3. `apps/frontend/lib/design-tokens/index.ts` — MENU_ITEM_TOKENS public export
4. `apps/frontend/components/approvals/ApprovalRow.tsx` — MENU_ITEM_TOKENS.destructive 사용
5. `apps/frontend/components/equipment/AttachmentsTab.tsx` — MENU_ITEM_TOKENS.destructive 사용
6. `apps/frontend/components/equipment/SelfInspectionTab.tsx` — MENU_ITEM_TOKENS.destructive 사용
7. `apps/frontend/components/equipment/IntermediateInspectionList.tsx` — MENU_ITEM_TOKENS.destructive 사용
8. `apps/frontend/components/shared/NextStepPanel.tsx` — MENU_ITEM_TOKENS.destructive + focus: → focus-visible: 수정

---

## MUST Criteria

| # | 기준 | 검증 방법 |
|---|------|-----------|
| M1 | `.env.example`에 `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CHECKOUT_INBOUND_BFF` 3개 존재 | `grep "NEXT_PUBLIC_" .env.example` → 3 hit 이상 |
| M2 | `MENU_ITEM_TOKENS` 정의는 `semantic.ts` 1곳만 존재 (SSOT) | `grep -rn "MENU_ITEM_TOKENS" apps/frontend/` → semantic.ts + index.ts + 5 consumer만 |
| M3 | `focus:text-destructive` 리터럴 잔존 0 (DropdownMenuItem 컨텍스트) | `grep -rn "focus:text-destructive" apps/frontend/components/` → 0 hit |
| M4 | `focus-visible:text-destructive` 리터럴 잔존 0 (토큰으로 교체됨) | `grep -rn "focus-visible:text-destructive" apps/frontend/components/` → 0 hit |
| M5 | 신규 tsc 오류 없음 (기존 workflow-panel.ts/NextStepPanel.tsx 오류 제외) | `pnpm --filter frontend exec tsc --noEmit 2>&1 \| grep "error TS" \| grep -v "workflow-panel\|NextStepPanel" \| wc -l` → 0 |
| M6 | Design Token 3-Layer 준수: MENU_ITEM_TOKENS는 Layer 2(semantic.ts)에 위치 | 파일 경로 확인 |
| M7 | `MENU_ITEM_TOKENS`가 `index.ts`를 통해 export됨 (barrel export 패턴) | `grep "MENU_ITEM_TOKENS" apps/frontend/lib/design-tokens/index.ts` → 1 hit |
| M8 | NextStepPanel.tsx의 `focus:text-destructive` (구버전) 제거됨 | `grep "focus:text-destructive" apps/frontend/components/shared/NextStepPanel.tsx` → 0 hit |

## SHOULD Criteria

| # | 기준 | 검증 방법 |
|---|------|-----------|
| S1 | `MENU_ITEM_TOKENS.destructive` 값이 `focus-visible:` 사용 (WCAG 2.4.11) | semantic.ts 내용 확인 |
| S2 | `.env.example` Frontend 섹션에 주석 포함 (신규 개발자 온보딩 안내) | 파일 내용 확인 |
| S3 | 5개 consumer 파일 모두 `@/lib/design-tokens`에서 import (직접 경로 없음) | grep import 패턴 확인 |

## Out of Scope

- `workflow-panel.ts`, `NextStepPanel.tsx`의 기존 tsc 오류 (세션 시작 전부터 존재)
- `toast.tsx`의 `group-[.destructive]:focus:ring-destructive` — Tailwind group modifier 패턴, 별도 맥락
- 이번 세션 외 파일의 `text-destructive` 단독 사용 (오류 메시지, 필수 표시 `*` 등)
