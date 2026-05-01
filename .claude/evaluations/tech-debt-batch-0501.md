---
slug: tech-debt-batch-0501
iteration: 2
verdict: PASS
date: 2026-04-30
---

# Evaluation Report — tech-debt-batch-0501 (Iteration 2)

## Iteration 1 → 2 변화

- **M3 (이전 FAIL): FAIL → PASS**
  - 이슈 1 수정: `useTranslations('common')` 추가 + `{children ?? t('charCountRatio', { count, max })}` fallback — 계약 준수
  - 이슈 2 수정: `<p>` → `<span aria-live={ariaLive} role="status">` 교체 — 계약 준수
  - `'block'` 클래스 추가 (`cn(REQUIRED_FIELD_TOKENS.charCount, 'block', stateClass, className)`) — inline → block 레이아웃 보존
- **NCEditDialog cleanup 확인**: `useTranslations('non-conformances')` 만 사용, `common` namespace 없음. `<CharsCounter count={cause.length} max={CAUSE_MAX_LENGTH} />` — children 없이 컴포넌트 내부 i18n 자동 사용. 올바른 정리.

---

## MUST Results

### M1 — pnpm tsc --noEmit

**Verdict: PASS**

```
pnpm tsc --noEmit → TSC_EXIT: 0 (출력 없음)
```

Frontend + backend 모두 컴파일 에러 없음.

---

### M2 — pnpm --filter frontend run lint

**Verdict: PASS**

```
pnpm --filter frontend run lint → LINT_EXIT: 0
```

ESLint 에러 없음.

---

### M3 — CharsCounter 컴포넌트 요건

**Verdict: PASS**

**증거:**

1. **Props 시그니처 (PASS):**
   ```ts
   count: number;
   max: number;
   warningRatio?: number;
   className?: string;
   ariaLive?: 'polite' | 'off';
   children?: ReactNode;
   ```
   모두 존재하고 계약과 일치.

2. **색상 정책 (PASS):**
   ```ts
   const isOverLimit = count >= max;
   const isWarning = !isOverLimit && count >= Math.floor(max * warningRatio);
   const stateClass = isOverLimit ? 'text-destructive' : isWarning ? 'text-warning' : undefined;
   ```
   0~80%: muted-foreground, 80~99%: warning, ≥100%: destructive — 계약 충족.

3. **REQUIRED_FIELD_TOKENS.charCount SSOT (PASS):**
   ```ts
   className={cn(REQUIRED_FIELD_TOKENS.charCount, 'block', stateClass, className)}
   ```
   올바르게 적용됨.

4. **출력: t('charCountRatio') i18n 내장 (PASS — iter1 FAIL 수정):**
   ```ts
   const t = useTranslations('common');
   // ...
   {children ?? t('charCountRatio', { count, max })}
   ```
   컴포넌트 내부에서 `useTranslations('common')` 직접 호출, fallback으로 `t('charCountRatio', { count, max })` 사용. 계약 명시 "출력: `t('common.charCountRatio', { count, max })`" 준수.

5. **SR alt: `<span>` 래핑 (PASS — iter1 FAIL 수정):**
   ```tsx
   <span
     className={cn(REQUIRED_FIELD_TOKENS.charCount, 'block', stateClass, className)}
     aria-live={ariaLive}
     role="status"
   >
     {children ?? t('charCountRatio', { count, max })}
   </span>
   ```
   `<span>` 사용, `<p>` 완전 제거 확인. `'block'` 유틸리티 클래스로 원래 block 레이아웃 보존.

**NCEditDialog cleanup 추가 검증 (PASS):**
- `useTranslations('non-conformances')` 만 사용 — `common` namespace 불필요, 제거됨.
- `<CharsCounter count={cause.length} max={CAUSE_MAX_LENGTH} />` — children 없이 호출, 컴포넌트 내부 i18n 자동 사용.

---

### M4 — t('common.charCount'...) 호출 0건

**Verdict: PASS**

```bash
grep -rn "t('common.charCount'" apps/frontend/components/ --include="*.tsx"
# 결과: 0건
```

DisposalRequestDialog / DisposalApprovalDialog / DisposalReviewDialog 모두 `t('charCountMin', ...)` 사용으로 교체 완료. 회귀 없음.

---

### M5 — NCEditDialog {cause.length} / 500 인라인 제거

**Verdict: PASS**

```bash
grep -n "/ 500" apps/frontend/components/non-conformances/NCEditDialog.tsx
# 결과: 0건
```

`CAUSE_MAX_LENGTH = 500` 상수 사용 (line 29, import 블록 완료 후 위치). `<CharsCounter count={cause.length} max={CAUSE_MAX_LENGTH} />` (line 113) 적용 완료. 회귀 없음.

---

### M6 — RejectModal 인라인 className 분기 제거

**Verdict: PASS**

```bash
grep -nE "text-(destructive|warning)" apps/frontend/components/approvals/RejectModal.tsx
# 결과:
# 192: className="text-sm text-destructive"
```

192라인은 에러 배너 (`id="reject-error"`, `role="alert"`, `aria-live="assertive"`) 전용 — charCount 색상 분기가 아님. 계약 조건 "또는 charCount 외 용도만 존재" 충족. 회귀 없음.

---

### M7 — disposal.json common.charCount 제거 + charCountMin 신설

**Verdict: PASS**

```bash
# common 객체 내부 확인 (Python3)
common keys: ['cancel', 'reject', 'equipmentName', 'requester', 'disposalReason', 'reasonDetail', 'rejectNotice', 'error', 'attachments', 'downloadAriaLabel']
charCount in common: False
charCountMin at root: True

# charCountMin 키 확인
apps/frontend/messages/ko/disposal.json:  "charCountMin": "{count}/10자 이상 (현재: {count}자)"
apps/frontend/messages/en/disposal.json:  "charCountMin": "{count}/10 chars min (current: {count})"
```

ko + en 양쪽 모두 최상위 `charCountMin` 신설, `common.charCount` 완전 제거 확인. 회귀 없음.

---

### M8 — NavRowWithSecondaryAction analytics.track

**Verdict: PASS**

```bash
grep -nE "track\(|analytics" apps/frontend/components/layout/NavRowWithSecondaryAction.tsx
# 결과:
# 17: import { track } from '@/lib/analytics/track';
# 19: /** href prefix → analytics event 매핑. checkouts 도메인만 우선 등록. */
# 72: // checkouts nav 클릭 시 analytics 발행 — pendingCount(=badge) 동반.
# 75:    ? () => track('sidebar.checkouts.click', { pendingCount: badge ?? 0 })
```

import 경로, checkouts 전용 조건, pendingCount 전달 모두 이전 반복과 동일 — 회귀 없음.

---

### M9 — verify-bulk-action-bar SKILL.md Step 8/9 추가

**Verdict: PASS**

```bash
grep -c "^### Step 8" .claude/skills/verify-bulk-action-bar/SKILL.md → 1
grep -c "^### Step 9" .claude/skills/verify-bulk-action-bar/SKILL.md → 1
```

Step 8/9 모두 존재, 이전 반복과 동일 — 회귀 없음.

---

## SHOULD Results

### S1 — CharsCounter React.memo 래핑

**Verdict: PASS**

```ts
export const CharsCounter = memo(function CharsCounter({...}: CharsCounterProps) {
```

`memo` 래핑 확인. 회귀 없음.

---

### S2 — Disposal 3개 dialog i18n 변경 회귀 없음

**Verdict: PARTIAL**

수동 검증(e2e snapshot) 미수행 — dev 서버 의존. 정적 분석:
- 세 dialog 모두 `t('charCountMin', { count: ... })` 사용 확인.
- ko/en 메시지 파일 키 확인 완료.

이전 반복과 동일 판정.

---

### S3 — analytics.track PII deny-list 위반 없음

**Verdict: PASS**

```ts
track('sidebar.checkouts.click', { pendingCount: badge ?? 0 })
```

`pendingCount`는 숫자형 카운터. `PII_DENY_KEYS` 항목 미포함. 회귀 없음.

---

### S4 — verify-bulk-action-bar Step 8/9 grep이 실제 코드베이스에서 양성 매칭

**Verdict: PASS**

```bash
# Step 8
apps/frontend/components/checkouts/CheckoutGroupCard.tsx:20:  getGroupRowIds,
apps/frontend/components/checkouts/CheckoutGroupCard.tsx:21:  deriveGroupSelectionState,

# Step 9
apps/frontend/app/(dashboard)/__visual__/group-indeterminate/page.tsx  # 파일 존재
```

---

## Final Verdict

**PASS**

- MUST: 9/9 통과
- SHOULD: 3/4 통과 (S2 수동 검증 미수행 — 계약 명시 수동 검증)
- 이전 FAIL 항목(M3): `useTranslations('common')` 내장 + `<span>` 래핑 + `'block'` 클래스 3가지 모두 수정 확인.
- NCEditDialog cleanup 정상: `common` namespace 제거, children 없이 CharsCounter 호출 — 컴포넌트 i18n 자동 사용.
- tsc/lint PASS, 기존 PASS 항목 모두 회귀 없음.
