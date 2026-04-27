# AP-04 Evaluation — ApprovalDetailPanel Removal + Modal Enhancement
## Iteration 2 | 2026-04-27

---

## MUST Criteria Verdict

| # | Criterion | Result |
|---|---|---|
| 1 | File deleted + 0 import references | PASS |
| 2 | `elapsedDays` + urgency signal in modal meta grid (token 경유) | PASS |
| 3 | `bg-muted/50` hardcoding → APPROVAL_DETAIL_SECTION_TOKENS | PASS |
| 4 | 사이드바/모바일바 ARIA 일관화 — single `role="tablist"` + `role="tab"` + `aria-selected` | PASS |
| 5 | `pnpm tsc --noEmit` PASS | PASS |
| 6 | AR-12: userId removed from ApprovalsClient | PASS |

---

## Evidence

### MUST 1 — File Deletion + 0 Import References: PASS

```
$ ls apps/frontend/components/approvals/ApprovalDetailPanel.tsx
ls: cannot access '...': No such file or directory

$ grep -rn "ApprovalDetailPanel" apps/frontend/ --include="*.tsx" --include="*.ts"
(no output)
```

파일 삭제 확인, 소스 파일 내 import 잔존 0건.

---

### MUST 2 — elapsedDays + urgency signal (token 경유): PASS

`ApprovalDetailModal.tsx` 25행, 64–107행:
- `import { getElapsedDaysClasses } from '@/lib/design-tokens'` 경유
- `elapsedDays` 계산: `Math.floor((Date.now() - new Date(item.requestedAt).getTime()) / 86_400_000)`
- `getElapsedDaysClasses(elapsedDays)` 호출로 urgency 색상 적용 (token 경유)
- `t('detail.elapsedDaysValue', { days: elapsedDays })` 렌더

하드코딩 없음, 토큰 SSOT 경유 확인됨.

---

### MUST 3 — bg-muted/50 hardcoding → APPROVAL_DETAIL_SECTION_TOKENS: PASS

```
$ grep -n "bg-muted/50" apps/frontend/components/approvals/ApprovalDetailModal.tsx
(no output)

$ grep -n "bg-muted/50" apps/frontend/components/approvals/ApprovalHistoryCard.tsx
(no output)
```

컴포넌트 사용처에서 `bg-muted/50` 직접 사용 0건.

`APPROVAL_DETAIL_SECTION_TOKENS` 경유:
- `ApprovalDetailModal.tsx:131` — `APPROVAL_DETAIL_SECTION_TOKENS.sectionBody`
- `ApprovalDetailModal.tsx:145` — `APPROVAL_DETAIL_SECTION_TOKENS.sectionBody`
- `ApprovalHistoryCard.tsx:74` — `APPROVAL_DETAIL_SECTION_TOKENS.cardRow`

토큰 정의에서 `bg-muted/50` 값을 관리하는 것은 SSOT 패턴상 정상.

---

### MUST 4 — 사이드바/모바일바 ARIA 일관화: PASS

**Fix 적용 확인:** Iter 1에서 `sortedSections.map()` 내부에 `role="tablist"`가 섹션당 1개씩 생성되던 문제가 수정됨.

**ApprovalCategorySidebar.tsx 구조 (Iter 2):**

```
$ grep -c 'role="tablist"' apps/frontend/components/approvals/ApprovalCategorySidebar.tsx
1

$ grep -n 'role="tab"|aria-selected' apps/frontend/components/approvals/ApprovalCategorySidebar.tsx
78:                  role="tab"
79:                  aria-selected={isActive}
```

**실제 구조 (60–111행):**
```tsx
<nav className={cn(tokens.container, className)} aria-label={t('sidebar.ariaLabel')}>
  {/* 단일 tablist — ApprovalMobileCategoryBar와 ARIA 패턴 통일 (AP-04) */}
  <div role="tablist" aria-orientation="vertical">
    {sortedSections.map((section, sectionIndex) => (
      <div key={section} className="contents">   {/* className="contents" — 렌더 트리 투명 */}
        {sectionIndex > 0 && <div className={tokens.divider} role="presentation" />}
        <div className={tokens.sectionLabel} role="presentation">...</div>
        {sectionGroups[section].map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            ...
          />
        ))}
      </div>
    ))}
  </div>
</nav>
```

**핵심 구조 검증:**
- `role="tablist"`: `sortedSections.map()` 바깥에 단 1개 — PASS
- 섹션 래퍼 `<div className="contents">`: `role` 없음 (CSS `display:contents`로 렌더 트리에서 투명 처리) — PASS
- divider / sectionLabel: `role="presentation"` 적용 — PASS
- 모든 버튼: `role="tab"` + `aria-selected={isActive}` — PASS
- `aria-orientation="vertical"` 유지 — PASS

**모바일바 비교:**
```
$ grep -c 'role="tablist"' apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx
1
```

양쪽 모두 단일 tablist, WAI-ARIA Tabs Pattern 일치 확인.

---

### MUST 5 — pnpm tsc --noEmit PASS: PASS

```
$ pnpm --filter frontend exec tsc --noEmit
(출력 없음, exit 0)
```

타입 오류 0건.

---

### MUST 6 — AR-12: userId prop removed from ApprovalsClient: PASS

```
$ grep -n "userId" apps/frontend/components/approvals/ApprovalsClient.tsx
(no output)
```

`userId` prop 없음. `ApprovalsClient` interface에서 제거 확인됨.

---

## Final Verdict

**PASS** — MUST 기준 6개 전원 통과.

### Summary

Iter 1 FAIL 원인(MUST-4: 섹션당 `role="tablist"` N개 생성)이 정확히 수정됨:
- `role="tablist"`를 `sortedSections.map()` 바깥으로 이동 → 단일 tablist
- 섹션 래퍼에 `className="contents"` 적용 → ARIA 트리에서 투명하게 처리
- divider/label에 `role="presentation"` → 스크린리더 노이즈 제거

나머지 5개 항목(패널 삭제, elapsedDays, bg-muted/50 토큰화, tsc, userId 제거)은 Iter 1과 동일하게 유지.
