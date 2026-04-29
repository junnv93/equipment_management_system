# Tech-Debt Batch 0429 — Open 항목 7건 일괄 정리

**생성일**: 2026-04-29
**범위**: tech-debt-tracker.md 의 Open 항목 중 즉시 처리 가능한 7건
**작업 모델**: Solo trunk-based, main 직접 작업, pre-push hook이 게이트
**총 Phase**: 7 (A: SSOT 위임 / B: dev hint / C: 토큰화 / D: 단위테스트 / E: exhaustive / F: memo / G: 문서 갱신)

---

## 배경

`tech-debt-tracker.md`의 Open 항목을 스캔한 결과, 다음 7건은 **위험도 낮음 + 변경 폭 좁음 + SSOT/타입 안전성 향상 효과**가 명확해 단일 배치로 처리 가능합니다. 각 Phase는 독립적으로 검증 가능하며 Phase 순서는 파일 충돌이 없습니다.

| Phase | 항목 | 우선순위 | 핵심 변경 |
|---|---|---|---|
| A | checkout-selectability-physical-ssot | 🟡 MEDIUM | 백엔드 inline 비교 → `isPurposeCompatibleWithEquipment()` 위임 |
| B | dev-doctor-hint-line-mode | 🟡 MEDIUM | hook의 inline JS 파서 → `--hint-line` CLI mode로 흡수 |
| C | dashboard-pending-approval-card-alert-ring-token | 🟡 MEDIUM | hardcoded `ring-brand-critical/*` 4곳 → `alertRing` 토큰 |
| D | parseCheckoutCreateParams-unit-test | 🟢 LOW | 유틸 함수 7 케이스 단위테스트 신규 |
| E | resolve-badge-and-action-exhaustive-kind-check | 🟢 LOW | if-fall-through → `switch + assertNever` |
| F | heroKPI-atom-react-memo | 🟢 LOW | `React.memo` 래핑 |
| G | bundle-baseline-script Open → Done | (문서) | `measureFromBuildArtifacts()` 이미 구현됨 — 트래커 [x] 처리 |

---

## Phase A — checkout-selectability-physical-ssot

### 변경 파일
- `apps/backend/src/modules/checkouts/checkouts.service.ts` (라인 1758-1775)

### 달성 목표
- 팀 소유권 룰의 진실의 원천을 `packages/shared-constants/src/checkout-selectability.ts`의 `isPurposeCompatibleWithEquipment()`로 일원화한다.
- 백엔드에서 `userTeamId === equip.teamId` 같은 inline 비교가 사라지고, **호환성 판정**은 SSOT 헬퍼 1회 호출로 위임된다.
- 에러 코드 결정(OWN_TEAM_ONLY vs OTHER_TEAM_ONLY)은 백엔드 로컬 책임으로 유지.
- `userTeamId`가 falsy거나 `equip.teamId`가 falsy면 SSOT 헬퍼가 `true`를 반환하므로 기존 fail-open 동작이 그대로 보존되어야 한다.
- `purpose` 값이 RENTAL/CALIBRATION/REPAIR 외(예: `return_to_vendor`)일 경우 호환 분기가 발화되지 않아야 한다.

### 검증 명령
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
grep -n "isPurposeCompatibleWithEquipment" apps/backend/src/modules/checkouts/checkouts.service.ts
sed -n '1755,1780p' apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -nE 'equip\.teamId\s*[!=]==?\s*userTeamId|userTeamId\s*[!=]==?\s*equip\.teamId'
```

---

## Phase B — dev-doctor-hint-line-mode

### 변경 파일
- `scripts/dev-doctor.mjs` (CLI 진입부)
- `.claude/settings.json` (SessionStart hook command)

### 달성 목표
- `dev-doctor.mjs`에 `--hint-line` 모드 추가: 진단 결과를 1줄 hint 텍스트로 stdout에 출력한다.
- `level === 'ok'`일 때는 **stdout 출력 없음**.
- 경고/실패일 때: `[dev-hygiene] zombies=N(pgids=M) manifest=STATE — pnpm dev:doctor / pnpm dev:fresh`
- exit code는 항상 0 (hint mode는 알림용).
- SessionStart hook은 `node scripts/dev-doctor.mjs --hint-line 2>/dev/null || true`로 단순화.

### 검증 명령
```bash
out=$(node scripts/dev-doctor.mjs --hint-line); echo "len=${#out} exit=$?"
grep -c "node -e" .claude/settings.json   # 0건
grep -c "dev-doctor.mjs --hint-line" .claude/settings.json  # 1건 이상
node scripts/dev-doctor.mjs --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).level))" # ok
```

---

## Phase C — dashboard-pending-approval-card-alert-ring-token

### 변경 파일
- `apps/frontend/lib/design-tokens/components/dashboard.ts`
- `apps/frontend/components/dashboard/PendingApprovalCard.tsx` (라인 366, 463, 541, 591)

### 달성 목표
- `DASHBOARD_PENDING_APPROVAL_TOKENS.alertRing` 서브객체 추가 (heroFull / priority / compact / full).
- PendingApprovalCard에서 raw `ring-brand-critical/*` 클래스 직접 사용 0건.
- 토큰 값은 기존 클래스와 1:1 동일 → 시각 회귀 0.

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
grep -nE "ring-(1|2)\s+ring-brand-critical/[0-9]+" apps/frontend/components/dashboard/PendingApprovalCard.tsx
grep -n "alertRing:" apps/frontend/lib/design-tokens/components/dashboard.ts
```

---

## Phase D — parseCheckoutCreateParams-unit-test

### 변경 파일
- `apps/frontend/lib/utils/__tests__/checkout-create-params.test.ts` (신규)

### 달성 목표
- `parseCheckoutCreateParams()`의 7개 행동 사양을 회귀 테스트로 고정:
  1. 빈 입력 → 둘 다 null
  2. equipmentId만 → equipmentId 설정
  3. 유효 purpose만 → purpose 설정
  4. 둘 다 → 모두 설정
  5. 잘못된 purpose → null
  6. equipmentId 공백("   ") → null
  7. Record 형식 input → SearchParamsWithGet과 동일

### 검증 명령
```bash
pnpm --filter frontend test -- checkout-create-params
```

---

## Phase E — resolve-badge-and-action-exhaustive-kind-check

### 변경 파일
- `apps/frontend/lib/navigation/nav-config.ts` (라인 300-332)

### 달성 목표
- `switch (cfg.kind)` + `assertNever` 패턴으로 컴파일 타임 exhaustiveness 보장.
- 런타임 동작 100% 동일.
- `assertNever`는 파일 로컬 정의.

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
grep -nE "switch \(cfg\.kind\)|assertNever\(" apps/frontend/lib/navigation/nav-config.ts
```

---

## Phase F — heroKPI-atom-react-memo

### 변경 파일
- `apps/frontend/components/checkouts/HeroKPI.tsx`

### 달성 목표
- `export const HeroKPI = React.memo(function HeroKPI(...)` 형태로 memo 래핑.
- displayName 'HeroKPI' 보존 (named function expression).

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
grep -n "React.memo" apps/frontend/components/checkouts/HeroKPI.tsx
```

---

## Phase G — bundle-baseline-script Done 마감

### 변경 파일
- `.claude/exec-plans/tech-debt-tracker.md` 해당 항목 [x] 처리

### 달성 목표
- `measureFromBuildArtifacts()` 구현 확인 후 트래커 체크박스 [x] 변환.
- 코드 변경 없음.

### 검증 명령
```bash
grep -n "measureFromBuildArtifacts" scripts/check-bundle-size.mjs
```

---

## 최종 통합 검증

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend test
pnpm lint
```
