---
slug: rental-2step-e2e-pr13
date: 2026-04-24
status: active
owner: generator-agent
related:
  - .claude/contracts/rental-2step-e2e-pr13.md
  - .claude/plans/reactive-hopping-wolf.md (Phase 10)
---

# rental 2-step E2E + YourTurnBadge / 그룹 카드 (PR-13)

Phase 0~9 완료된 rental 2-step 승인 플로우의 **Phase 10 (E2E)** 과 동시에,
PR-13 (YourTurnBadge + 그룹 카드 redesign) 을 한 번의 변경 세트로 전달한다.

두 Phase는 파일 집합이 전혀 겹치지 않는다. 순서 의존성 없음 — 병렬 작성 가능.

---

## Phase A — E2E 통합 검증 (rental 2-step)

### A-1 핵심 설계 결정

#### 결정 1: borrower/lender TM 분리 — **옵션 B**

| 역할 | 신원 | 접근 방식 |
|---|---|---|
| 신청자 (TE) | Uiwang General RF TE | email: `user1@example.com` → `getBackendTokenByEmail` |
| 차용팀 TM (borrower) | Uiwang General RF TM | email: `manager2@example.com` → `getBackendTokenByEmail` |
| 대여팀 TM (lender) | Suwon FCC EMC/RF TM | 기존 fixture `techManagerPage` 그대로 |
| 장비 소유팀 | Suwon FCC EMC/RF | `TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E` |

선택 이유:
- 기존 `techManagerPage` storageState 재사용 가능 (수정/재생성 불필요)
- Uiwang 쪽은 **API-only 검증**이면 충분 — 신규 storageState 불요 (토큰만 취득)
- 시드 CHECKOUT_005는 requester=Suwon E TE, lenderTeam=Suwon E → 동일 팀이므로 권한 분리 불가 → 동적 생성 필요

#### 결정 2: 신규 auth fixture **불필요**
Uiwang TE / TM 모두 `getBackendTokenByEmail(page, email)` → `page.request`에 `Authorization: Bearer <token>` 직접 주입.

#### 결정 3: 체크아웃 동적 생성 (시드 불사용)
매 테스트 runtime에 새 checkout을 생성한다.

#### 결정 4: T4의 403 검증 시점
`borrower_approved` 상태에서 **차용팀 TM** 이 `/approve` 를 시도 → lender 권한/팀 검증 실패 → 403.
그 **직후** 동일 state에서 **대여팀 TM** 이 `/approve` → 200. 동일 체크아웃 serial reuse.

### A-2 신규 파일

| 파일 | 역할 |
|---|---|
| `apps/frontend/tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts` | WF-34 E2E 스위트 (6 tests, serial) |

### A-3 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `apps/frontend/tests/e2e/shared/helpers/api-helpers.ts` | `getBackendTokenByEmail(page, email)` export 추가. 동일 `tokenCache` 재사용, 키는 `email:${email}` 네임스페이스로 분리. |
| `apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts` | `borrowerApproveCheckout(page, checkoutId, token)` 및 `borrowerRejectCheckout(page, checkoutId, reason, token)` 추가. 반환값 정책: `expect(resp.ok())`를 헬퍼 내부에서 강제하지 않는다 (negative test 대응). |

### A-4 사전 확인 체크리스트

Generator는 구현 전 아래 파일을 반드시 읽을 것:

- [ ] `apps/backend/src/modules/checkouts/checkouts.controller.ts` L474-523 — `borrower-approve` / `borrower-reject` 라우트 서명과 응답 shape
- [ ] `apps/backend/src/modules/checkouts/checkouts.service.ts` — `borrowerApprove` 내부 scope → FSM → domain 순서, `BORROWER_TEAM_ONLY` / `BORROWER_APPROVE_RENTAL_ONLY` 에러 코드 정확한 값
- [ ] `packages/schemas/src/enums.ts` — `CheckoutStatusValues.BORROWER_APPROVED`, `CheckoutPurposeValues.RENTAL` 값 확인
- [ ] `packages/shared-constants/src/test-users.ts` — `ALL_TEST_EMAILS` 에 `user1@example.com`, `manager2@example.com` 포함 여부 (확인 완료: Uiwang General RF 팀 users 배열에 존재)
- [ ] `apps/backend/src/modules/auth/test-auth.controller.ts` L52-81 — `?email=` 파라미터 동작
- [ ] `apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts` L117-124 — `approveCheckout` 의 CAS-Aware 패턴 (신규 헬퍼에 동일 적용)
- [ ] `apps/frontend/tests/e2e/workflows/wf-33-approval-count-realtime.spec.ts` — spec 구조/import 규칙

### A-5 헬퍼 함수 시그니처 (확정)

```typescript
// api-helpers.ts에 추가
export async function getBackendTokenByEmail(page: Page, email: string): Promise<string> {
  const cacheKey = `email:${email}`;
  const cached = tokenCache[cacheKey];
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  const response = await page.request.get(
    `${BACKEND_URL}${TEST_LOGIN_PATH}?email=${encodeURIComponent(email)}`
  );
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const token = extractToken(data);
  if (!token) throw new Error(`No token for email ${email}: ${JSON.stringify(data)}`);
  tokenCache[cacheKey] = { token, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS };
  return token;
}

// workflow-helpers.ts에 추가
/** rental 차용팀 TM 1차 승인 — CAS-Aware. token 직접 주입 */
export async function borrowerApproveCheckout(
  page: Page,
  checkoutId: string,
  token: string
) {
  const detailResp = await page.request.get(
    `${BACKEND_URL}/api/checkouts/${checkoutId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  return page.request.patch(
    `${BACKEND_URL}/api/checkouts/${checkoutId}/borrower-approve`,
    {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { version },
    }
  );
  // 반환: APIResponse — 호출자가 status 검증 (negative test 대응)
}

/** rental 차용팀 TM 1차 반려 — CAS-Aware */
export async function borrowerRejectCheckout(
  page: Page,
  checkoutId: string,
  reason: string,
  token: string
) {
  const detailResp = await page.request.get(
    `${BACKEND_URL}/api/checkouts/${checkoutId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  return page.request.patch(
    `${BACKEND_URL}/api/checkouts/${checkoutId}/borrower-reject`,
    {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { version, reason },
    }
  );
}
```

### A-6 6개 테스트 시나리오 구조

```
wf-34-rental-2step-approval.spec.ts

test.describe('WF-34: rental 2-step 승인 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  let rentalCheckoutId: string;  // T1→T2→T4→T3 공유

  test.beforeAll: clearBackendCache()

  T1: 차용팀 TE(Uiwang) → rental 신청(Suwon 장비) → status PENDING
      - getBackendTokenByEmail(page, BORROWER_TE_EMAIL) 로 토큰 취득
      - POST /api/checkouts (equipmentIds: [SPECTRUM_ANALYZER_SUW_E], purpose: 'rental')
      - status 201 + data.status === CSVal.PENDING
      - data.purpose === 'rental'

  T2: 차용팀 TM(Uiwang) → borrower-approve → BORROWER_APPROVED
      - getBackendTokenByEmail(page, BORROWER_TM_EMAIL)
      - borrowerApproveCheckout(page, rentalCheckoutId, borrowerTmToken)
      - expect status 200
      - data.status === CSVal.BORROWER_APPROVED

  T4(serial 순서 앞당김): 차용팀 TM이 lender-only /approve → 403
      - BORROWER_APPROVED 상태에서 Uiwang TM이 /approve 시도
      - expect status 403

  T3: 대여팀 TM(Suwon, techManagerPage) → approve → APPROVED
      - apiPatch(techManagerPage, /checkouts/:id/approve, {version}, 'technical_manager')
      - expect status 200, data.status === CSVal.APPROVED

  T5: 대여팀 TM(Suwon)이 PENDING rental에 /borrower-approve → 403 BORROWER_TEAM_ONLY
      - 새 PENDING rental checkout 동적 생성 (Uiwang TE가 Suwon 장비 SIGNAL_GEN_SUW_E 신청)
      - techManagerPage (Suwon TM)가 borrowerApproveCheckout 시도
      - expect status 403
      - body code contains 'BORROWER_TEAM_ONLY'

  T6: 비-rental checkout에 /borrower-approve → 400 BORROWER_APPROVE_RENTAL_ONLY
      - Suwon FCC TE가 calibration checkout 생성 (NETWORK_ANALYZER_SUW_E)
      - Suwon FCC TM (scope 통과 가능) 이 borrowerApproveCheckout 시도
      - expect status 400
      - body code contains 'RENTAL_ONLY'
})
```

**T4 배치 이유**: serial mode에서 동일 `rentalCheckoutId` 의 상태가 `borrower_approved` → `approved` 순이므로, T4는 T2 직후, T3 직전에 배치.

### A-7 구현 제약

- [ ] SSOT: `CheckoutStatusValues` 는 `@equipment-management/schemas` 에서만 import. 문자열 리터럴 `'pending'`, `'borrower_approved'`, `'approved'` 직접 비교 금지.
- [ ] SSOT: 이메일은 spec 상단 `as const` 상수로 고정 (`BORROWER_TE_EMAIL`, `BORROWER_TM_EMAIL`). 임의 이메일 생성 금지.
- [ ] SSOT: 장비 ID는 `TEST_EQUIPMENT_IDS` 에서만 import. UUID 하드코딩 금지.
- [ ] Rule 2: spec body에 `approverId`, `requesterId`, `userId` 수동 주입 금지. 서버가 JWT에서 추출.
- [ ] CAS-Aware: 모든 PATCH 전에 GET → `extractVersion` 필수.
- [ ] serial mode: `test.describe.configure({ mode: 'serial' })`.
- [ ] T5, T6 부수 checkout은 afterAll 삭제 불필요 — `db:reset` 전제 (e2e-patterns.md 정책).
- [ ] 에러 코드 검증: Generator가 실제 backend 에러 코드 상수 위치 확인 후 정확한 비교 사용 (불명확 시 `String(code).toUpperCase().includes(...)` 우회 허용).
- [ ] negative test: `borrowerApproveCheckout` 헬퍼 내부에서 `expect(resp.ok())` 강제하지 않음.

### A-8 검증 명령어

```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend exec playwright test tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts --list
pnpm --filter backend run db:reset
pnpm --filter frontend exec playwright test tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts --project=chromium
```

---

## Phase B — YourTurnBadge + 그룹 카드 Redesign (PR-13)

### B-1 파일 매트릭스

| # | 파일 | 동작 |
|---|---|---|
| 1 | `apps/frontend/lib/design-tokens/components/checkout-your-turn.ts` | 신규 — 토큰 SSOT |
| 2 | `apps/frontend/lib/design-tokens/index.ts` | 수정 — re-export 추가 |
| 3 | `apps/frontend/components/checkouts/YourTurnBadge.tsx` | 신규 — presentational |
| 4 | `apps/frontend/hooks/use-checkout-group-descriptors.ts` | 신규 — 배치 descriptor 훅 |
| 5 | `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` | 증분 수정 (4개 변경 지점) |
| 6 | `apps/frontend/messages/ko/checkouts.json` | `yourTurn.summary` / `yourTurn.summaryAria` 추가 |
| 7 | `apps/frontend/messages/en/checkouts.json` | en 대응 키 추가 |

### B-2 사전 확인 체크리스트

Generator는 구현 전 아래 파일을 반드시 읽을 것:

- [ ] `apps/frontend/lib/design-tokens/components/checkout-icons.ts` — `CHECKOUT_ICON_MAP.urgency` 에서 normal/warning/critical 아이콘 컴포넌트 확인
- [ ] `packages/schemas/src/fsm/checkout-fsm.ts` — `NextStepDescriptor` 인터페이스: `urgency` 필드 타입, `availableToCurrentUser` 필드, `ctaLabel`/`ctaKind` 필드 이름 확인
- [ ] `packages/schemas` — `getNextStep(checkout, permissions)` 시그니처 확인
- [ ] `packages/shared-constants` — `getPermissions(role)` 반환 타입 확인
- [ ] `apps/frontend/lib/features/checkout-flags.ts` — `isNextStepPanelEnabled()` 플래그 동작
- [ ] `apps/frontend/messages/ko/checkouts.json` L640~660 — `yourTurn.label`, `yourTurn.tooltip` 이미 존재, `yourTurn.summary`/`yourTurn.summaryAria` 추가 필요
- [ ] `apps/frontend/messages/en/checkouts.json` — `yourTurn` 섹션 en 키 존재 여부 (누락 시 추가)
- [ ] `apps/frontend/lib/design-tokens/components/checkout-empty-state.ts` — 기존 토큰 파일 패턴 참조
- [ ] `apps/frontend/lib/design-tokens/index.ts` L430-477 — Checkout 블록 위치 확인 후 re-export 삽입 위치 결정
- [ ] `apps/frontend/lib/api/checkout-api.ts` — `Checkout` 타입 (훅 입력 타입)
- [ ] `apps/frontend/lib/utils/checkout-group-utils.ts` — `CheckoutGroup` 타입
- [ ] `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — L526-534 (기존 inline YourTurn span) + L190-223 (equipmentRows useMemo) + L184 (role 계산) + L397-411 (헤더 영역)

### B-3 구현 스펙

#### B-3-1: `checkout-your-turn.ts` (신규)

```typescript
export const CHECKOUT_YOUR_TURN_BADGE_TOKENS = {
  base: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  variant: {
    normal:   'bg-brand-info/10 text-brand-info',
    warning:  'bg-brand-warning/10 text-brand-warning',
    critical: 'bg-brand-critical/10 text-brand-critical animate-pulse motion-reduce:animate-none',
  },
  icon: 'h-3 w-3',
} as const;

export type CheckoutYourTurnUrgency = keyof typeof CHECKOUT_YOUR_TURN_BADGE_TOKENS.variant;
```

hex 리터럴 절대 금지. `bg-brand-info/10` 은 CSS 변수 기반 — globals.css 자동 전환.

#### B-3-2: `index.ts` re-export 추가

기존 Checkout 컴포넌트 토큰 블록 직후:
```typescript
export {
  CHECKOUT_YOUR_TURN_BADGE_TOKENS,
  type CheckoutYourTurnUrgency,
} from './components/checkout-your-turn';
```

#### B-3-3: `YourTurnBadge.tsx` (신규)

- Props: `{ urgency: CheckoutYourTurnUrgency; label?: string; action?: string }`
- `data-testid="your-turn-badge"` + `data-urgency={urgency}`
- `role="status"` + `aria-label` (action 있으면 tooltip text, 없으면 label)
- 아이콘: `CHECKOUT_ICON_MAP.urgency[urgency]` (urgency 매핑이 없으면 Generator가 schemas urgency 타입과 icon 매핑 확인 후 적절히 선택)
- `aria-hidden="true"` 아이콘
- `React.memo` 감싸기, `displayName = 'YourTurnBadge'`

#### B-3-4: `use-checkout-group-descriptors.ts` (신규)

```typescript
export function useCheckoutGroupDescriptors(
  checkouts: readonly Checkout[],
  userRole: UserRole | undefined
): Map<string, NextStepDescriptor>
```

- `getPermissions(effectiveRole)` → `useMemo` (1차)
- `getNextStep(...)` 루프 → Map → `useMemo` (2차)
- `currentUserId` 파라미터 불필요 (NextStepDescriptor.availableToCurrentUser는 permissions에서 도출)
- `getNextStep` / `getPermissions` 재정의 절대 금지

#### B-3-5: `CheckoutGroupCard.tsx` 증분 수정 (4개 변경 지점만)

**변경 지점 1** — import 블록:
```typescript
import { useCheckoutGroupDescriptors } from '@/hooks/use-checkout-group-descriptors';
import { YourTurnBadge } from '@/components/checkouts/YourTurnBadge';
```

**변경 지점 2** — role 계산 직후:
```typescript
const descriptorsMap = useCheckoutGroupDescriptors(group.checkouts, role);
```
기존 `equipmentRows` useMemo 내부의 `getNextStep` 개별 호출을 `descriptorsMap.get(checkout.id)` 로 교체.

**변경 지점 3** — L526-534 (inline YourTurn span) → `<YourTurnBadge>` 교체:
```tsx
{isNextStepPanelEnabled() &&
  row.descriptor?.availableToCurrentUser === true && (
    <YourTurnBadge
      urgency={row.descriptor.urgency ?? 'normal'}
      action={row.descriptor.ctaLabel}  // 실제 필드명은 schemas 확인 후 수정
    />
)}
```

**변경 지점 4** — 그룹 헤더 우측 "내 차례 N건" 요약:
```typescript
const yourTurnCount = useMemo(() => {
  if (!isNextStepPanelEnabled()) return 0;
  let count = 0;
  for (const co of group.checkouts) {
    if (descriptorsMap.get(co.id)?.availableToCurrentUser === true) count++;
  }
  return count;
}, [group.checkouts, descriptorsMap]);
```
JSX 헤더 영역에 `yourTurnCount > 0 && <span data-testid="your-turn-summary">...</span>` 추가.

**rentalDescriptor 정리**: 기존 개별 `getNextStep` 호출을 `descriptorsMap.get(rentalCheckout.id)` 로 교체.

#### B-3-6: i18n 키 추가

`ko/checkouts.json` + `en/checkouts.json` 의 `yourTurn` 섹션:
```json
{
  "yourTurn": {
    "tooltip": "{action} 필요",
    "label": "내 차례",
    "summary": "내 차례 {count}건",
    "summaryAria": "내 차례 대기 {count}건"
  }
}
```
en 대응:
```json
{
  "yourTurn": {
    "tooltip": "{action} required",
    "label": "Your turn",
    "summary": "Your turn: {count}",
    "summaryAria": "Your turn pending: {count} items"
  }
}
```

### B-4 구현 제약

- [ ] SSOT: `getNextStep`, `NextStepDescriptor` → `@equipment-management/schemas` 에서만
- [ ] SSOT: `getPermissions`, `Permission` → `@equipment-management/shared-constants` 에서만
- [ ] hex 색상 문자열 금지 — `bg-brand-*` / `text-brand-*` 클래스만 사용
- [ ] `any` 금지 — Rule 3
- [ ] dark mode: 추가 CSS 불필요 (CSS 변수 자동 전환)
- [ ] `React.memo`: `YourTurnBadge` 필수
- [ ] `setQueryData` 사용 금지
- [ ] `CheckoutRow` 타입 재정의 금지
- [ ] 기존 `CheckoutGroupCard.tsx` 70%+ 전면 교체 금지 — 4개 변경 지점 외 무손상
- [ ] `motion-reduce:animate-none` 동반 필수 (critical variant animate-pulse)
- [ ] feature flag: `isNextStepPanelEnabled()` off 시 YourTurnBadge/요약 미렌더

### B-5 검증 명령어

```bash
pnpm --filter frontend run tsc --noEmit

grep -R "CHECKOUT_YOUR_TURN_BADGE_TOKENS" apps/frontend/lib/design-tokens/index.ts
grep -n 'data-testid="your-turn-badge"' apps/frontend/components/checkouts/YourTurnBadge.tsx
grep -n "useCheckoutGroupDescriptors" apps/frontend/components/checkouts/CheckoutGroupCard.tsx

# SSOT 위반 탐지
grep -RnE "(function|const)\s+getNextStep\b" apps/frontend/components apps/frontend/hooks apps/frontend/lib \
  | grep -v node_modules || echo "OK"

# hex 리터럴 탐지
grep -RnE "#[0-9a-fA-F]{3,8}\b" \
  apps/frontend/lib/design-tokens/components/checkout-your-turn.ts \
  apps/frontend/components/checkouts/YourTurnBadge.tsx \
  apps/frontend/hooks/use-checkout-group-descriptors.ts \
  && echo "FAIL: hex literal" || echo "OK"

# i18n 대칭
node -e "
const ko = require('./apps/frontend/messages/ko/checkouts.json');
const en = require('./apps/frontend/messages/en/checkouts.json');
for (const k of ['label','tooltip','summary','summaryAria']) {
  if (!ko.yourTurn?.[k]) { console.error('ko missing', k); process.exit(1); }
  if (!en.yourTurn?.[k]) { console.error('en missing', k); process.exit(1); }
}
console.log('OK: yourTurn keys 대칭');
"
```

---

## 통합 검증

```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter backend run db:reset
pnpm --filter frontend exec playwright test tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts --project=chromium
```

---

## Build Sequence

**Phase A (E2E)**:
1. [ ] `api-helpers.ts` — `getBackendTokenByEmail` 추가 (tokenCache 키 네임스페이스 `email:` 분리)
2. [ ] `workflow-helpers.ts` — `borrowerApproveCheckout`, `borrowerRejectCheckout` 추가
3. [ ] `wf-34-rental-2step-approval.spec.ts` — 6개 테스트 작성
4. [ ] tsc 통과
5. [ ] playwright --list 로 6개 인식 확인

**Phase B (PR-13)**:
1. [ ] `checkout-your-turn.ts` 토큰 파일 생성
2. [ ] `design-tokens/index.ts` re-export 추가
3. [ ] `YourTurnBadge.tsx` 생성
4. [ ] `use-checkout-group-descriptors.ts` 훅 생성
5. [ ] `CheckoutGroupCard.tsx` 4개 변경 지점 증분 수정
6. [ ] `messages/ko/checkouts.json` + `messages/en/checkouts.json` 키 추가
7. [ ] tsc 통과
8. [ ] 검증 grep 전부 OK
