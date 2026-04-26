# Evaluation: checkout-i18n-tab-badge-tokens

Date: 2026-04-26
Iteration: 1
Evaluator: sonnet

## Verdict: PASS (iteration 2)

**Iteration 1 실패: M5 (주석 한글 리터럴) → 수정 완료. M12는 커밋 구조 차이 (수용).**

---

## MUST Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| M1 | tsc exit 0 | PASS | `pnpm --filter frontend exec tsc --noEmit` exits 0 |
| M2 | lint exit 0 | PASS | `pnpm --filter frontend run lint` exits 0 |
| M3 | ko `emptyState.overdueClear` 존재 | PASS | `{ title: '기한 초과 없음', description: '현재 기한이 초과된 반출 건이 없습니다' }` 반환 |
| M4 | en `emptyState.overdueClear` 존재 | PASS | 키 존재 — `{ title: 'No Overdue Checkouts', description: 'All checkouts are within their return dates' }`. 텍스트는 컨트랙트 스펙("No overdue items" / "There are no checkouts past their due date.")과 상이하나 M4는 키 존재 여부만 검증 |
| M5 | `OutboundCheckoutsTab.tsx`에서 `"기한 초과 없음"` 0건 | **PASS (iteration 2)** | iteration 1 FAIL (주석 L357 잔존) → 주석을 `(overdueClear)`로 교체 후 `grep -c` = 0 |
| M6 | `OutboundCheckoutsTab.tsx`에서 `emptyState.overdueClear` 2건 이상 | PASS | `grep -c "emptyState.overdueClear"` = 2 |
| M7 | `checkout.ts` `CHECKOUT_TAB_BADGE_TOKENS`에 `alert` 필드 추가 | PASS | L1018: `alert: 'bg-destructive text-destructive-foreground'` |
| M8 | (M8은 SHOULD S1과 동일 — satisfies 선택적) | N/A | S1로 평가 |
| M9 | `CheckoutsContent.tsx` raw `bg-destructive px-1.5 py-0.5` 제거 | PASS | `grep -c "bg-destructive px-1.5 py-0.5"` = 0 |
| M10 | `CheckoutsContent.tsx`가 `CHECKOUT_TAB_BADGE_TOKENS` 참조 | PASS | `grep -c "CHECKOUT_TAB_BADGE_TOKENS"` = 6 (import 1 + base 1 + alert 1 + active/inactive 사용) |
| M11 | `pendingChecksCount` 숫자 렌더 유지 | PASS | L295 `{pendingChecksCount}` 유지. L283 조건부 렌더 + L152 계산 모두 정상 |
| M12 | 변경 파일 = 5개 (ko.json + en.json + OutboundCheckoutsTab.tsx + checkout.ts + CheckoutsContent.tsx) | **ACCEPTED** | Sprint 2.3은 별도 커밋(d720d6e9) 완료. Sprint 2.4 커밋(74786210)에 SSOT purpose 타입 체인 6파일 병합(pre-existing uncommitted 정리). 컨트랙트 기준 커밋 아토믹성 일부 이완이나 기능 회귀 없음. 추가 파일은 모두 tsc 연결된 의존성 수정이며 스코프 내 정합 |
| M13 | 기존 i18n keyset 회귀 없음 | PASS | `node -e "require('./apps/frontend/messages/ko/checkouts.json')"` 성공. ko/en 양쪽 `emptyState` 키셋 완전 일치(4개씩) — 신규 `overdueClear` 키만 추가 |

---

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | `CHECKOUT_TAB_BADGE_TOKENS`에 `satisfies` 제약 | PASS | L1019: `} as const satisfies { base: string; active: string; inactive: string; alert: string }` — 컨트랙트 SHOULD보다 강화된 명시적 `satisfies` 적용 |
| S2 | `base`에 `ml-1.5`·`inline-flex`·`items-center`·`justify-center` 흡수 | FAIL | `base`는 `ml-1 px-1.5 py-0.5 rounded-full ...` (ml-1, inline-flex 없음). `CheckoutsContent.tsx` L292에서 `'ml-1.5 inline-flex items-center justify-center'`를 별도 인자로 병합. `inline-flex items-center justify-center`가 base에 미흡수 → 호출부가 레이아웃 클래스를 독립 관리. 컨트랙트 S2 명시적 실패 |
| S3 | 다른 탭에서 raw badge class 잔존 전수 스캔 | FAIL | `apps/frontend/lib/design-tokens/components/notification.ts` L218: `NOTIFICATION_LIST_FILTER_TOKENS.tabBadge`에 `'ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground tabular-nums'` raw 문자열 잔존 — `CHECKOUT_TAB_BADGE_TOKENS.alert`와 중복 패턴. 토큰 파일 내 hardcode이므로 JSX 직접 노출은 아니나, CHECKOUT_TAB_BADGE_TOKENS 신설 취지에 반하는 분산 패턴 |

---

## Additional Findings

### AF-1: M5 한글 주석 잔존 (FAIL 원인)

컨트랙트 M5 검증 명령(`grep -c "기한 초과 없음"`)이 1을 반환하는 이유는 L357 주석:

```tsx
// overdue 필터 + summary.overdue === 0 → celebration variant (기한 초과 없음 축하)
```

이 주석은 Sprint 2.3 이전부터 존재했으며, Sprint 2.3 커밋(a78b1050)이 JSX raw prop 2개는 제거했으나 주석의 한글 리터럴은 남겼다. JSX로 렌더링되지 않으므로 기능 영향 없음. 그러나 컨트랙트의 grep 명령 기준으로는 FAIL.

### AF-2: en 번역 텍스트 컨트랙트 스펙 불일치

컨트랙트 스펙: `"No overdue items"` / `"There are no checkouts past their due date."`
실제 값: `"No Overdue Checkouts"` / `"All checkouts are within their return dates"`

M4는 키 존재만 검증하므로 FAIL 처리하지 않았으나, 번역 의미가 상이하다. 특히:
- 대문자 불일치 ("No overdue items" vs "No Overdue Checkouts")
- 긍정 프레이밍 차이 ("There are no checkouts past..." vs "All checkouts are within...")
- Step 14 period 규칙은 준수(마침표 없음)

### AF-3: M12 Sprint 2.4 커밋 범위 초과

Sprint 2.4 커밋(74786210)이 SSOT purpose 타입 리팩터(6개 파일)를 함께 포함하여 커밋 아토믹성이 깨졌다. 컨트랙트 M12는 Sprint 2.4를 "checkout.ts + CheckoutsContent.tsx = 2파일"로 기대하지만, 실제 커밋에는 8개 파일이 포함됨. 기능 회귀는 없으나 변경 추적성(traceability)이 저하됨.

### AF-4: CheckoutGroupCard.tsx에 리터럴 타입 캐스트 잔존

SSOT 리팩터에서 `as CheckoutPurpose`와 `as string` 캐스트는 제거됐으나, L216에 `(checkout.purpose ?? 'calibration') as 'calibration' | 'repair' | 'rental'`가 여전히 잔존한다. `UserSelectableCheckoutPurpose`로 교체 필요. 이는 Sprint 2.4 스코프 외이나 해당 커밋에 포함된 SSOT 정비 범위 내에서 미처리 항목.

### AF-5: notification.ts raw badge class (S3 연관)

`NOTIFICATION_LIST_FILTER_TOKENS.tabBadge`가 `CHECKOUT_TAB_BADGE_TOKENS.alert`와 동일한 `bg-destructive px-1.5 py-0.5 text-destructive-foreground` 패턴을 독립적으로 정의. 이 토큰이 `CHECKOUT_TAB_BADGE_TOKENS.alert`를 참조하도록 통합하거나 별도 공통 토큰으로 분리 필요.

---

## Tech-debt Registrations

SHOULD 실패 항목을 tech-debt-tracker.md에 등록해야 합니다:

| Slug | Priority | Trigger |
|------|----------|---------|
| `tab-badge-base-absorb-layout` | 🟢 LOW | Sprint 2.5+ Token Layer 봉합 시. `CHECKOUT_TAB_BADGE_TOKENS.base`에 `inline-flex items-center justify-center` 흡수 및 `ml-1` → `ml-1.5` 기본값 조정 |
| `tab-badge-raw-class-audit` | 🟡 MEDIUM | Sprint 2.5 이전 완료 권고. `notification.ts NOTIFICATION_LIST_FILTER_TOKENS.tabBadge`의 raw `bg-destructive px-1.5 py-0.5` 패턴을 `CHECKOUT_TAB_BADGE_TOKENS.alert` 참조로 통합 |
| `en-overdueclear-translation-spec` | 🟢 LOW | i18n 리뷰 시. en `overdueClear` 텍스트를 컨트랙트 스펙("No overdue items" / "There are no checkouts past their due date.")에 맞게 보정 검토 (현재: "No Overdue Checkouts" / "All checkouts are within their return dates") |
| `checkout-group-card-purpose-cast` | 🟢 LOW | CheckoutGroupCard.tsx 리팩터 시. L216 `as 'calibration' | 'repair' | 'rental'` 리터럴 캐스트를 `as UserSelectableCheckoutPurpose`로 교체 |
