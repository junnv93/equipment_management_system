---
slug: rental-2step-e2e-pr13
date: 2026-04-24
status: active
type: acceptance-contract
---

# 수락 계약 — rental 2-step E2E + PR-13 YourTurnBadge

본 계약은 `.claude/exec-plans/active/2026-04-24-rental-2step-e2e-pr13.md` 의 완료 판정 기준이다.
**MUST 1개라도 실패 시 루프 재실행**. SHOULD 실패는 tech-debt 로그 기록 후 머지 비차단.

---

## MUST (필수 — 실패 시 재실행)

### M-1: TypeScript 타입 체크 통과 (frontend 전체)
```bash
pnpm --filter frontend run tsc --noEmit
```
- exit code 0
- 신규 파일에 `: any` 존재 시 FAIL (grep 추가 검증)
```bash
grep -RnE ":\s*any\b" \
  apps/frontend/lib/design-tokens/components/checkout-your-turn.ts \
  apps/frontend/components/checkouts/YourTurnBadge.tsx \
  apps/frontend/hooks/use-checkout-group-descriptors.ts \
  apps/frontend/tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts \
  apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts \
  apps/frontend/tests/e2e/shared/helpers/api-helpers.ts \
  && echo "FAIL: any 발견" || echo "OK"
```

### M-2: E2E spec 파일 타입 정합 — 6개 테스트 인식
```bash
pnpm --filter frontend exec playwright test \
  tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts --list
```
- 6개 테스트가 목록에 표시
- 로드 단계 타입 에러/import 에러 없음

### M-3: `data-testid="your-turn-badge"` 는 YourTurnBadge 컴포넌트에만 존재
```bash
# YourTurnBadge.tsx에 존재해야 함
grep -n 'data-testid="your-turn-badge"' \
  apps/frontend/components/checkouts/YourTurnBadge.tsx \
  | wc -l
# → 1 이상

# 다른 파일에는 없어야 함 (CheckoutGroupCard의 inline span 제거 검증)
grep -Rn 'data-testid="your-turn-badge"' apps/frontend/components apps/frontend/app \
  | grep -v "apps/frontend/components/checkouts/YourTurnBadge.tsx" \
  && echo "FAIL: 다른 파일에 your-turn-badge 존재" || echo "OK"
```

### M-4: SSOT 위반 없음 — getNextStep / NextStepDescriptor 재정의 금지
```bash
grep -RnE "^(export\s+)?(function|const)\s+getNextStep\b|^(export\s+)?(type|interface)\s+NextStepDescriptor\b" \
  apps/frontend/components apps/frontend/hooks apps/frontend/lib \
  | grep -v node_modules \
  && echo "FAIL: SSOT 위반" || echo "OK"

grep -RnE "(function|const)\s+getPermissions\b" \
  apps/frontend/components apps/frontend/hooks apps/frontend/lib \
  | grep -v node_modules \
  && echo "FAIL: getPermissions 재구현" || echo "OK"
```

### M-5: hex 하드코딩 0 (신규 토큰/컴포넌트/훅 파일)
```bash
grep -RnE "#[0-9a-fA-F]{3,8}\b" \
  apps/frontend/lib/design-tokens/components/checkout-your-turn.ts \
  apps/frontend/components/checkouts/YourTurnBadge.tsx \
  apps/frontend/hooks/use-checkout-group-descriptors.ts \
  && echo "FAIL: hex literal 발견" || echo "OK"
```

### M-6: `borrowerApproveCheckout` 헬퍼가 CAS-Aware
```bash
grep -A 30 "export async function borrowerApproveCheckout" \
  apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts
```
- `page.request.get` 호출 존재 (detail 조회)
- `extractVersion` 호출 존재
- `/borrower-approve` 경로 포함 PATCH 호출 존재
- body에 `version` 포함

### M-7: `getBackendTokenByEmail` 구현 정합
```bash
grep -n "export async function getBackendTokenByEmail\|email:" \
  apps/frontend/tests/e2e/shared/helpers/api-helpers.ts | head -20
```
- `export async function getBackendTokenByEmail` 존재
- `?email=${encodeURIComponent(email)}` 또는 `?email=` 쿼리 사용
- `tokenCache` 재사용 (기존 role 캐시와 키 충돌 없도록 네임스페이스 분리)

### M-8: i18n 키 대칭 (ko + en)
```bash
node -e "
const ko = require('./apps/frontend/messages/ko/checkouts.json');
const en = require('./apps/frontend/messages/en/checkouts.json');
const keys = ['label','tooltip','summary','summaryAria'];
for (const k of keys) {
  if (!ko.yourTurn?.[k]) { console.error('ko missing', k); process.exit(10); }
  if (!en.yourTurn?.[k]) { console.error('en missing', k); process.exit(20); }
}
console.log('OK: yourTurn keys 대칭');
"
```
- exit code 0

### M-9: Server-Side User Extraction 원칙 준수 (spec body에 userId 수동 주입 금지)
```bash
grep -nE '"(approverId|requesterId|userId)"\s*:' \
  apps/frontend/tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts \
  && echo "FAIL: body userId 주입 발견" || echo "OK"
```
- 출력 비어 있어야 함

### M-10: `CheckoutGroupCard.tsx` 70%+ 교체 금지
```bash
git diff --numstat apps/frontend/components/checkouts/CheckoutGroupCard.tsx
```
- 추가(+) + 삭제(-) 라인 합 / 변경 전 전체 라인 수 ≤ 0.30
- 평가 방법: `wc -l` 로 변경 전 라인 수 확인 후 판단

---

## SHOULD (권고 — 실패 시 tech-debt 기록)

### S-1: `YourTurnBadge`에 `role="status"` + `aria-label` 존재
```bash
grep -n 'role="status"\|aria-label' \
  apps/frontend/components/checkouts/YourTurnBadge.tsx
```
- 두 속성 모두 JSX에 존재

### S-2: `use-checkout-group-descriptors` — `useMemo` 2회 사용
```bash
grep -c "useMemo" apps/frontend/hooks/use-checkout-group-descriptors.ts
```
- 결과 ≥ 2 (userPermissions 계산 + Map 계산)

### S-3: `YourTurnBadge` 가 `memo` 로 감싸짐
```bash
grep -E "export const YourTurnBadge = memo\(" \
  apps/frontend/components/checkouts/YourTurnBadge.tsx
```
- 출력 존재

### S-4: `motion-reduce:animate-none` 포함 (critical variant)
```bash
grep "motion-reduce:animate-none" \
  apps/frontend/lib/design-tokens/components/checkout-your-turn.ts
```
- 출력 존재

### S-5: spec 파일이 `CheckoutStatusValues` (SSOT) 사용
```bash
grep -E "CheckoutStatusValues|CSVal" \
  apps/frontend/tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts
```
- 출력 존재

### S-6: spec 파일 내 장비 ID가 `TEST_EQUIPMENT_IDS` 상수 사용
```bash
grep "TEST_EQUIPMENT_IDS" \
  apps/frontend/tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts
```
- 출력 존재

### S-7: 에러 코드 검증이 substring 이상 수준
- T5: `BORROWER_TEAM_ONLY` 포함 검증
- T6: `RENTAL_ONLY` 또는 `BORROWER_APPROVE_RENTAL_ONLY` 포함 검증

### S-8: en locale `yourTurn.summary` 자연스러운 영어
- "내 차례" 한국어 직역(transliteration) 아닌 영문 (`Your turn`, `Pending action` 등)

---

## 즉시 반려 조건 (Evaluator가 거부할 근거)

아래 중 하나라도 해당하면 **즉시 반려**:

- [ ] M-1 ~ M-10 중 하나라도 실패
- [ ] spec에 `waitForTimeout(N)` 을 신뢰성 목적으로 삽입 (SSE 대기 등 정당 사유 제외)
- [ ] CheckoutGroupCard.tsx 외 다른 checkout 컴포넌트 무단 수정 (CheckoutMiniProgress 등)
  - CheckoutStatusBadge.tsx는 별도 세션 진행 중 변경 — 해당 파일은 이 계약 판정에서 제외
- [ ] 테스트를 `test.skip()` 으로 통과시킴
- [ ] backend 파일 수정 (Phase A/B 모두 frontend + e2e 전용)
- [ ] 신규 auth fixture (storageState) 추가 (기존 fixture + email 토큰 조합으로 충분)
- [ ] spec body에 hardcoded UUID 포함 (TEST_EQUIPMENT_IDS 경유 필수)

---

## 관측 지표 (참고용 — 게이트 아님)

- tsc 실행 시간: 변경 전 대비 증가 < 5%
- Playwright WF-34 실행 시간: < 60초 (6 tests serial)
- `CheckoutGroupCard.tsx` 변경 라인 수: ≤ 150
- 신규 파일 4개 총 라인 수: ≤ 280
