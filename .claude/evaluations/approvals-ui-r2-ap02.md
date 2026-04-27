# Evaluation Report: approvals-ui-r2 — AP-02
**Iteration**: 1
**Date**: 2026-04-27
**Verdict**: PASS

## MUST Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `position: fixed; bottom: var(--bulk-bar-offset)` (token 기반) | PASS | `APPROVAL_BULK_BAR_TOKENS.fixedBottom` = `'fixed bottom-[var(--bulk-bar-offset,0px)] left-0 right-0 ...'` (approval.ts:213). `--bulk-bar-offset` 는 globals.css:404 `:root`에 `var(--safe-area-inset-bottom, 0px)`로 정의됨. |
| 2 | 0건 시 disabled 버튼 노출 금지 (bar 자체 숨김) | PASS | `isVisible = selectedCount > 0` (line 55). `!isVisible` 시 `APPROVAL_BULK_BAR_TOKENS.hidden` → `opacity-0 pointer-events-none translate-y-1` 적용 + `aria-hidden={!isVisible}`. 버튼은 모두 `tabIndex={isVisible ? 0 : -1}` 처리. disabled 버튼 노출 없음. |
| 3 | `× 선택 해제` 텍스트 버튼 (`selectedCount > 0`일 때만) | PASS | line 125-135: `<Button ... tabIndex={isVisible ? 0 : -1} onClick={onClearSelection}><X />{t('bulkBar.dismiss')}</Button>`. hidden 상태일 때 `tabIndex=-1`로 키보드 접근 차단. |
| 4 | 라벨 상태별 변형: 0개(숨김), N개(N개 선택됨), 전체(전체 선택됨 N/N) | PASS | `selectionLabel = isAllSelected ? t('bulkBar.allSelected', { count, total }) : t('bulkBar.selectionCount', { count })` (lines 58-60). ko: `"{count}개 선택됨"` / `"전체 선택됨 ({count}/{total})"`, en: `"{count} selected"` / `"All selected ({count}/{total})"`. 0건 시 chip 내용 `''` + bar hidden. |
| 5 | count chip: `role="status" aria-live="polite"` | PASS | lines 116-117: `role="status"` + `aria-live="polite"` on `countChip` div. |
| 6 | `sr-only aria-live="polite"` 카운트 공지 | PASS | line 98: `<div className="sr-only" aria-live="polite" aria-atomic="true">` — chip과 별도 SR 전용 라이브 영역. 내용은 선택 시 `selectionLabel`, 해제 시 `t('bulkBar.selectionCleared')`. |
| 7 | Keyboard: Esc → 선택 해제 | PASS | lines 63-71: `useEffect` → `handleKeyDown`: `e.key === 'Escape' && isVisible && !isApproveDialogOpen && !isRejectDialogOpen` 조건 만족 시 `onClearSelection()` 호출. |
| 8 | `verify-design-tokens` PASS | PASS | `grep "bg-red-\|text-red-\|bg-blue-\|border-red-\|bg-green-\|text-green-\|text-blue-\|bg-yellow-"` → 출력 없음 (0건). 모든 색상은 `text-muted-foreground`, `text-foreground`, `text-destructive` 등 semantic token 사용. |

## SHOULD Criteria (non-blocking)

| # | Criterion | Verdict | Note |
|---|-----------|---------|------|
| S1 | TypeScript 0 errors | PASS | `pnpm tsc --noEmit` 에러 없음 |
| S2 | `onClearSelection={() => setSelectedItems([])}` ApprovalsClient 전달 | PASS | ApprovalsClient.tsx:504에서 정확히 전달 확인 |
| S3 | i18n 5개 키 (ariaLabel / selectionCount / allSelected / dismiss / selectionCleared) | PASS | ko, en 양쪽 모두 5개 키 존재 확인 |
| S4 | DOM 유지 (return null 패턴 미사용) | PASS | 컴포넌트가 항상 렌더링, opacity/pointer-events로만 토글 |

## Action Required

PASS → Proceed to git commit and AP-03
