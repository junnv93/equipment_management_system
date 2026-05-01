---
slug: tech-debt-batch-0501
mode: 1
created: 2026-04-30
goal: SSOT/컴포넌트 통합 + Sidebar Analytics + verify-bulk-action-bar SKILL Step 8/9
scope:
  - S7 Sidebar pendingCount analytics (NavRowWithSecondaryAction → analytics.track)
  - CharsCounter SSOT 컴포넌트 신설 (ratio+warning 패턴)
  - NCEditDialog 인라인 하드코딩 제거 + CharsCounter 적용
  - RejectModal CharsCounter 적용 (인라인 className 분기 제거)
  - Disposal i18n 네임스페이스 정리: disposal.common.charCount → disposal.charCountMin (3개 dialog)
  - verify-bulk-action-bar SKILL.md Step 8(group header indeterminate) + Step 9(격리 fixture page) 추가
exclusions:
  - BulkActionBar 두 파일 dedup (트리거 미발화 — approvals 외 도메인 wrapper 첫 등장 시 처리)
  - sprint-3.3-e2e-profiler-verification (M12=React DevTools 수동 QA / M13=E2E suite 실행 — dev 서버 의존)
  - Disposal CharsCounter 적용 (semantic 불일치 — "min-hint" vs "ratio-max")
---

# tech-debt-batch-0501 contract

## Background

tech-debt-tracker.md Open 섹션의 SSOT/컴포넌트 통합 후속 항목 정리.
2026-04-30 setqueryd-purge-and-bulk-ux 세션에서 SHOULD로 이연된 4개 항목 + sprint45-should-residual S7 미수행 항목 통합.

## Files

### 신규 (1)

- `apps/frontend/components/common/CharsCounter.tsx` — `count + max + warning` 패턴 SSOT

### 수정 (11)

- `apps/frontend/components/non-conformances/NCEditDialog.tsx` — 인라인 `{cause.length} / 500` 제거, `<CharsCounter>` 적용
- `apps/frontend/components/approvals/RejectModal.tsx` — 인라인 className 분기 제거, `<CharsCounter>` 적용
- `apps/frontend/components/equipment/disposal/DisposalRequestDialog.tsx` — `t('common.charCount')` → `t('charCountMin')`
- `apps/frontend/components/equipment/disposal/DisposalApprovalDialog.tsx` — `t('common.charCount')` → `t('charCountMin')`
- `apps/frontend/components/equipment/disposal/DisposalReviewDialog.tsx` — `t('common.charCount')` → `t('charCountMin')`
- `apps/frontend/messages/ko/disposal.json` — `common.charCount` 키 제거 + 최상위 `charCountMin` 키 신설
- `apps/frontend/messages/en/disposal.json` — 동일
- `apps/frontend/messages/ko/non-conformances.json` — `editDialog.charCount` 키 추가 ("{count} / {max}")
- `apps/frontend/messages/en/non-conformances.json` — 동일
- `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` — checkouts nav 클릭 시 `analytics.track('sidebar.checkouts.click', { pendingCount })`
- `.claude/skills/verify-bulk-action-bar/SKILL.md` — Step 8(group header indeterminate SSOT 패턴), Step 9(격리 fixture page 검증 패턴)

### 추적 (1)

- `.claude/exec-plans/tech-debt-tracker.md` — 처리 항목 마킹 + 미처리 항목 SHOULD 후속 등록
- `.claude/exec-plans/tech-debt-tracker-archive.md` — batch 이력 1행 추가

## MUST 기준

- [ ] **M1** `pnpm tsc --noEmit` PASS (frontend + backend)
- [ ] **M2** `pnpm --filter frontend run lint` PASS
- [ ] **M3** `<CharsCounter>` 컴포넌트가 다음을 만족:
  - props: `count: number`, `max: number`, `ariaLive?: 'polite' | 'off'`, `warningRatio?: number`(default 0.8), `className?: string`
  - 0~80%: `text-muted-foreground`, 80%~100%: `text-warning`, ≥100%: `text-destructive`
  - 클래스 베이스: `REQUIRED_FIELD_TOKENS.charCount` SSOT 사용
  - 출력: `t('common.charCountRatio', { count, max })` (글로벌 `common.json` 신규 키)
  - SR alt: `aria-live` prop 따라 `<span aria-live="polite">` 래핑
- [ ] **M4** `t('common.charCount'...)` 호출 0건 (DisposalRequestDialog/DisposalApprovalDialog/DisposalReviewDialog 모두 `t('charCountMin')`로 교체)
  - `grep -rn "t('common.charCount'" apps/frontend/components/ --include="*.tsx"` → 0건
- [ ] **M5** NCEditDialog의 `{cause.length} / 500` 인라인 제거
  - `grep -n "cause.length.*/ 500\|{.*\.length.*/ 500" apps/frontend/components/non-conformances/NCEditDialog.tsx` → 0건
- [ ] **M6** RejectModal에서 `text-destructive`/`text-warning` 인라인 분기 제거 (CharsCounter로 위임)
  - `grep -n "text-destructive\|text-warning" apps/frontend/components/approvals/RejectModal.tsx` → 0건 (또는 charCount 외 용도만 존재)
- [ ] **M7** `apps/frontend/messages/ko/disposal.json` + `en/disposal.json`에서 `common.charCount` 키 제거, `charCountMin` 키 신설
  - `grep -n '"common"' apps/frontend/messages/ko/disposal.json` → `common.charCount` 라인 0건
- [ ] **M8** NavRowWithSecondaryAction이 checkouts nav 클릭 시 `analytics.track('sidebar.checkouts.click', { pendingCount })` 발행
  - `grep -n "analytics.track\|track(" apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` → ≥1건
  - import: `import { track } from '@/lib/analytics/track';` 또는 분명한 경로
  - track 호출은 ONLY checkouts route(`/checkouts` prefix)에 한정 — 모든 nav 클릭마다 발행 금지
- [ ] **M9** `.claude/skills/verify-bulk-action-bar/SKILL.md` Step 8 + Step 9 추가
  - `grep -c "^### Step 8" .claude/skills/verify-bulk-action-bar/SKILL.md` ≥1
  - `grep -c "^### Step 9" .claude/skills/verify-bulk-action-bar/SKILL.md` ≥1
  - Step 8 키워드: `getGroupRowIds`, `data-state="indeterminate"`, `aria-checked="mixed"`
  - Step 9 키워드: `__visual__/group-indeterminate` 또는 `격리 fixture`

## SHOULD 기준 (실패해도 루프 차단 안 함)

- [ ] **S1** `<CharsCounter>` 컴포넌트가 `React.memo`로 래핑되어 부모 리렌더 시 props 안정 시 미렌더
- [ ] **S2** Disposal 3개 dialog의 i18n 변경이 e2e snapshot/copy 회귀 없음 (수동 검증)
- [ ] **S3** `analytics.track` 호출이 PII deny-list 위반 없음 (`pendingCount` 숫자만 전달)
- [ ] **S4** `verify-bulk-action-bar` Step 8/9 의 grep 명령이 실제 코드베이스에서 양성 매칭 (Step 8은 `lib/checkouts/group-selection.ts`, Step 9는 `apps/frontend/app/(dashboard)/__visual__/group-indeterminate/`)

## 검증 명령

```bash
cd /home/kmjkds/equipment_management_system

# M1 — tsc
pnpm tsc --noEmit

# M2 — lint
pnpm --filter frontend run lint

# M3 — CharsCounter 컴포넌트 존재 + props 시그니처
ls apps/frontend/components/common/CharsCounter.tsx
grep -E "count: number|max: number|warningRatio|ariaLive" apps/frontend/components/common/CharsCounter.tsx
grep "REQUIRED_FIELD_TOKENS.charCount" apps/frontend/components/common/CharsCounter.tsx

# M4 — disposal common.charCount 호출 잔존 검사
grep -rn "t('common.charCount'" apps/frontend/components/ --include="*.tsx"

# M5 — NCEditDialog 하드코딩 제거
grep -n "/ 500" apps/frontend/components/non-conformances/NCEditDialog.tsx

# M6 — RejectModal 인라인 분기 제거
grep -nE "text-(destructive|warning)" apps/frontend/components/approvals/RejectModal.tsx

# M7 — disposal i18n 키 정리
grep -A 2 '"common":' apps/frontend/messages/ko/disposal.json | head -5
grep '"charCountMin"' apps/frontend/messages/ko/disposal.json apps/frontend/messages/en/disposal.json

# M8 — analytics.track in NavRowWithSecondaryAction
grep -nE "track\(|analytics" apps/frontend/components/layout/NavRowWithSecondaryAction.tsx

# M9 — verify-bulk-action-bar SKILL.md Step 8/9
grep -c "^### Step 8" .claude/skills/verify-bulk-action-bar/SKILL.md
grep -c "^### Step 9" .claude/skills/verify-bulk-action-bar/SKILL.md
```

## 작업 순서

1. **CharsCounter 신설** + 글로벌 `common.charCountRatio` i18n 키 추가
2. **RejectModal 마이그레이션** (CharsCounter 적용 — 신규 컴포넌트 첫 호출처로 검증)
3. **NCEditDialog 마이그레이션** (하드코딩 제거 + i18n 추가)
4. **Disposal i18n 정리** (common.charCount → charCountMin, 3개 dialog 호출자 동시 변경)
5. **NavRowWithSecondaryAction analytics.track** 추가
6. **verify-bulk-action-bar SKILL.md** Step 8/9 작성
7. **tsc + lint** 검증
8. **tech-debt-tracker.md** 업데이트
