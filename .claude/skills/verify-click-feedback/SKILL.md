---
name: verify-click-feedback
description: Click-Feedback 5-Layer 아키텍처 준수 검증 — loading.tsx a11y, FEEDBACK_KEYS SSOT, 409 retry, useDebouncedSearch, useAutoSave 패턴. 피드백 관련 컴포넌트/훅 추가/수정 후 실행.
disable-model-invocation: true
argument-hint: '[선택사항: 검증할 특정 훅 또는 컴포넌트명]'
---

# Click-Feedback 5-Layer 아키텍처 검증

## Purpose

피드백 관련 코드가 5-Layer 아키텍처와 SSOT 원칙을 준수하는지 검증합니다:

1. **L0** — 오프라인/SW업데이트 시스템 레벨 피드백
2. **L1** — `loading.tsx` Suspense 경계 (a11y 포함)
3. **L2** — 뮤테이션 로딩 상태 (`Button loading` prop)
4. **L3** — 낙관적 업데이트 (`useOptimisticMutation`)
5. **L4** — 디바운스/자동저장 (`useDebouncedSearch`, `useAutoSave`)
6. **L4ext** — 확장 피드백 (`useExportAction`, `useLazyMount`, `useFormAction`)

## When to Run

- `loading.tsx` 파일 추가/수정 후
- `FEEDBACK_KEYS` 또는 `feedback.json` 변경 후
- `useOptimisticMutation`, `useCasGuardedMutation` 수정 후
- `useDebouncedSearch`, `useAutoSave`, `useExportAction` 추가 후
- 새로운 검색바, 다이얼로그, 탭 컴포넌트 추가 후

## SSOT References

| 파일 | 역할 |
|------|------|
| `apps/frontend/hooks/use-optimistic-mutation.tsx` | L3 낙관적 업데이트 SSOT |
| `apps/frontend/hooks/use-cas-guarded-mutation.tsx` | L3 CAS fetch-before-mutate SSOT |
| `apps/frontend/hooks/use-debounced-search.ts` | L4 디바운스 검색 SSOT |
| `apps/frontend/hooks/use-auto-save.ts` | L4 자동저장 4-State FSM SSOT |
| `apps/frontend/hooks/use-export-action.ts` | L4ext 내보내기 액션 SSOT |
| `apps/frontend/hooks/use-lazy-mount.ts` | L4ext Dialog lazy mount SSOT |
| `apps/frontend/hooks/use-form-action.ts` | L4ext Server Action 래퍼 SSOT |
| `apps/frontend/lib/i18n/feedback-keys.ts` | i18n 키 SSOT |
| `apps/frontend/messages/ko/feedback.json` | 한국어 피드백 메시지 |
| `apps/frontend/messages/en/feedback.json` | 영어 피드백 메시지 |
| `apps/frontend/components/loading/route-loading.tsx` | loading.tsx 기준 컴포넌트 |
| `apps/frontend/components/ui/search-input.tsx` | 검색바 UI SSOT |
| `apps/frontend/components/ui/auto-save-status.tsx` | 자동저장 인디케이터 SSOT |
| `apps/frontend/components/ui/dialog-skeleton.tsx` | Dialog/Sheet 로딩 스켈레톤 SSOT |

## Workflow

### Step 1: FEEDBACK_KEYS 하드코딩 검사

피드백 문자열이 FEEDBACK_KEYS 없이 직접 사용되는지 확인합니다.

```bash
# 토스트에 하드코딩된 한국어 피드백 문자열 검색
grep -rn "title: '완료\|title: '처리\|title: '저장\|title: '삭제\|title: '승인\|title: '반려" \
  apps/frontend/components/ apps/frontend/hooks/ \
  --include="*.tsx" --include="*.ts"
```

**PASS:** 결과 없음 (모든 피드백이 FEEDBACK_KEYS 또는 i18n t() 경유).
**FAIL:** 하드코딩된 피드백 문자열 발견 → FEEDBACK_KEYS로 교체.

### Step 2: ko/en feedback.json 패리티 검사

두 파일의 최상위 키가 동일한지 확인합니다.

```bash
# ko 키 목록 (autosave 중첩 펼침)
node -e "
const ko = require('./apps/frontend/messages/ko/feedback.json');
const en = require('./apps/frontend/messages/en/feedback.json');
const flatKeys = (obj, prefix='') => Object.keys(obj).flatMap(k =>
  typeof obj[k] === 'object' ? flatKeys(obj[k], prefix+k+'.') : [prefix+k]
);
const koKeys = flatKeys(ko).sort();
const enKeys = flatKeys(en).sort();
const missing = koKeys.filter(k => !enKeys.includes(k));
const extra = enKeys.filter(k => !koKeys.includes(k));
console.log('Missing in en:', missing);
console.log('Extra in en:', extra);
"
```

**PASS:** Missing [] Extra [].
**FAIL:** 미스매치 키 발견 → 양쪽 동시 추가.

### Step 3: loading.tsx a11y Invariant I3 검사

모든 `loading.tsx`가 `role="status"` + `aria-busy="true"` + `aria-live="polite"` + sr-only i18n 텍스트를 가지는지 확인합니다.

```bash
# RouteLoading 사용 여부 확인 (SSOT 준수 = 자동으로 I3 충족)
find apps/frontend/app -name "loading.tsx" | while read f; do
  if grep -q "RouteLoading" "$f"; then
    echo "✅ SSOT: $f"
  elif grep -q 'role="status"' "$f"; then
    echo "✅ CUSTOM-A11Y: $f"
  else
    echo "❌ NO-A11Y: $f"
  fi
done
```

**PASS:** 모든 파일이 ✅.
**FAIL:** ❌ NO-A11Y 파일 발견 → RouteLoading으로 교체하거나 수동 a11y 속성 추가.

### Step 4: 409 retry ToastAction 검사

`useOptimisticMutation`, `useCasGuardedMutation`에서 409 에러 시 retry ToastAction이 존재하는지 확인합니다.

```bash
# isConflictError + ToastAction 조합 확인
grep -n "isConflictError\|ToastAction" \
  apps/frontend/hooks/use-optimistic-mutation.tsx \
  apps/frontend/hooks/use-cas-guarded-mutation.tsx
```

**PASS:** 두 파일 모두 `isConflictError` + `ToastAction` 포함.
**FAIL:** 누락 → 표준 409 retry 패턴 추가.

### Step 5: useDebouncedSearch isPending 검사

검색바가 `isPending` prop을 SearchInput에 전달하는지 확인합니다.

```bash
# useDebouncedSearch 사용 현황
grep -rn "useDebouncedSearch\|SearchInput.*pending" \
  apps/frontend/components/ apps/frontend/app/ \
  --include="*.tsx" --include="*.ts"
```

**PASS:** `useDebouncedSearch` 사용 + `pending={isPending}` 전달.
**FAIL:** 직접 `lodash/debounce` 사용 or SearchInput에 pending 전달 안 함 (SSOT 마이그레이션 필요).

### Step 6: useAutoSave 4-state 검사

자동저장 구현이 `useAutoSave` + `AutoSaveStatus` SSOT를 사용하는지 확인합니다.

```bash
# 자체 자동저장 구현 탐지
grep -rn "setTimeout.*save\|debounce.*save\|autosave" \
  apps/frontend/components/ apps/frontend/hooks/ \
  --include="*.tsx" --include="*.ts" | \
  grep -v "use-auto-save\|auto-save-status\|feedback-keys"
```

**PASS:** 결과 없음 (SSOT 훅만 사용).
**FAIL:** 자체 자동저장 로직 발견 → `useAutoSave` 마이그레이션.

### Step 7: motion-safe:animate-spin 검사

`animate-spin` 없이 `motion-safe:` prefix가 없는 경우를 탐지합니다.

```bash
# motion-safe 없는 animate-spin 검색
grep -rn "animate-spin" apps/frontend/components/ apps/frontend/hooks/ \
  --include="*.tsx" --include="*.ts" | \
  grep -v "motion-safe:animate-spin"
```

**PASS:** 결과 없음.
**FAIL:** `animate-spin` 발견 → `motion-safe:animate-spin`으로 교체.

### Step 8: Dialog lazy mount 패턴 검사

무거운 Dialog/Sheet 컨텐츠가 `useLazyMount` 또는 `next/dynamic` 없이 항상 마운트되는지 확인합니다.

```bash
# Dialog + 100줄+ 컨텐츠 파일에서 useLazyMount/dynamic 사용 여부
find apps/frontend/components -name "*.tsx" | xargs grep -l "Dialog\|Sheet" 2>/dev/null | \
  while read f; do
    lines=$(wc -l < "$f")
    if [ "$lines" -gt 150 ]; then
      if grep -q "useLazyMount\|next/dynamic\|React.lazy" "$f"; then
        echo "✅ LAZY: $f ($lines lines)"
      else
        echo "⚠️  EAGER: $f ($lines lines) — consider lazy loading"
      fi
    fi
  done
```

**PASS:** 150줄 이상 Dialog 파일이 모두 ✅ LAZY.
**INFO (⚠️):** EAGER 발견은 경고만 — 실제 성능 영향이 있을 때만 마이그레이션.

### Step 9: useExportAction 표준화 검사

export/download 버튼에서 `useExportAction` SSOT 사용 여부를 확인합니다.

```bash
# 직접 setExporting/setLoading 패턴 탐지
grep -rn "setExporting\|setDownloading\|setIsDownload" \
  apps/frontend/components/ apps/frontend/app/ \
  --include="*.tsx" --include="*.ts" | \
  grep -v "use-export-action"
```

**PASS:** 결과 없음.
**INFO:** 발견 시 마이그레이션 권장 (강제 아님 — 기존 getDownloadErrorToast 호환성 유지).

### Step 10: tsc + 전체 빌드 검증

```bash
pnpm --filter frontend tsc --noEmit && echo "✅ tsc PASS"
```

**PASS:** 에러 없음.
**FAIL:** 타입 에러 발견 → 수정 필수.

## Pass/Fail Summary

| Step | 검사 항목 | 기준 |
|------|-----------|------|
| 1 | FEEDBACK_KEYS 하드코딩 | 결과 0건 |
| 2 | ko/en feedback.json 패리티 | Missing/Extra 모두 [] |
| 3 | loading.tsx a11y I3 | ❌ 없음 |
| 4 | 409 retry ToastAction | 양쪽 파일 모두 존재 |
| 5 | useDebouncedSearch isPending | pending prop 전달 확인 |
| 6 | useAutoSave 4-state | 자체 구현 없음 |
| 7 | motion-safe:animate-spin | 결과 0건 |
| 8 | Dialog lazy mount | ⚠️ INFO 수준 |
| 9 | useExportAction | INFO 수준 |
| 10 | tsc | 에러 0건 |

MUST (Steps 1-4, 7, 10): 모두 PASS 필요.
SHOULD (Steps 5-6, 8-9): 위반 시 tech-debt-tracker.md 기록.
