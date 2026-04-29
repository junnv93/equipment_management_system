# Contract: Tech-Debt Batch 0429

**작성일**: 2026-04-29
**대상 플랜**: `.claude/exec-plans/active/2026-04-29-tech-debt-batch-0429.md`
**Phase 수**: 7 (A~G)

---

## 0. 글로벌 MUST

### MUST-G-1: TypeScript 컴파일 무결성
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
```
두 명령 모두 exit 0. 신규 에러 0건.

### MUST-G-2: 단위 테스트 PASS
```bash
pnpm --filter backend run test
pnpm --filter frontend test
```
기존 테스트 회귀 0. Phase D 신규 테스트 PASS.

### MUST-G-3: Lint 통과
신규 lint 위반 0건. `eslint-disable` 신규 추가 0건.

### MUST-G-4: SSOT 위반 신규 0건
본 배치에서 신규 추가하는 모든 import는 SSOT 패키지 경유 또는 디자인 토큰 파일 경유.

---

## Phase A — checkout-selectability-physical-ssot

### MUST-A-1: SSOT 헬퍼 물리적 import
```bash
grep -nE "isPurposeCompatibleWithEquipment" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 1건 이상
```

### MUST-A-2: inline 비교 제거
```bash
sed -n '1755,1780p' apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -nE 'equip\.teamId\s*[!=]==?\s*userTeamId|userTeamId\s*[!=]==?\s*equip\.teamId'
# 0건
```

### MUST-A-3: 에러 코드 보존
- `OWN_TEAM_ONLY`, `OTHER_TEAM_ONLY` 둘 다 throw 경로 유지.
- purpose 가드 의미론 100% 동일 (RENTAL → OTHER_TEAM_ONLY, CALIBRATION/REPAIR → OWN_TEAM_ONLY).

### MUST-A-4: fail-open 케이스 보존
- `userTeamId` falsy → 호환 가드 통과.
- `equip.teamId` falsy → 호환 가드 통과.

### MUST-A-5: 백엔드 테스트 PASS
```bash
pnpm --filter backend run test
```

### SHOULD-A-1: 헬퍼 호출 1회 (루프 내 장비당)
### SHOULD-A-2: SSOT 출처 주석 1줄

---

## Phase B — dev-doctor-hint-line-mode

### MUST-B-1: `--hint-line` 플래그 처리, exit 0
```bash
node scripts/dev-doctor.mjs --hint-line; echo "exit=$?"
# exit=0
```

### MUST-B-2: level=ok 시 stdout 비어있음
```bash
out=$(node scripts/dev-doctor.mjs --hint-line); [ -z "$out" ] && echo "PASS"
```

### MUST-B-3: 1줄 hint 포맷
경고/실패 시 정확히 1줄, 정규식:
```
^\[dev-hygiene\] zombies=\d+\(pgids=\d+\) manifest=[a-z\-]+ — pnpm dev:doctor / pnpm dev:fresh$
```

### MUST-B-4: 기존 모드 비파괴
- `--json` 출력 스키마 변경 0.
- 기본 모드 exit code 시멘틱 보존 (ok=0, warn=1, fail=2).

### MUST-B-5: SessionStart hook 단순화
```bash
grep -c "node -e" .claude/settings.json       # 0
grep -c "dev-doctor.mjs --hint-line" .claude/settings.json  # >= 1
```

### SHOULD-B-1: `runDiagnosis()` 재사용 (별도 진단 로직 중복 금지)
### SHOULD-B-2: `formatHintLine(report)` 순수 함수 추출

---

## Phase C — dashboard-pending-approval-card-alert-ring-token

### MUST-C-1: 토큰 추가 (4키)
```bash
grep -nA8 "alertRing:" apps/frontend/lib/design-tokens/components/dashboard.ts
# heroFull, priority, compact, full 4개 키 존재
```

### MUST-C-2: PendingApprovalCard raw ring 0건
```bash
grep -nE "ring-(1|2)\s+ring-brand-critical/[0-9]+" \
  apps/frontend/components/dashboard/PendingApprovalCard.tsx
# 0건
```

### MUST-C-3: 토큰 경유 사용 4건
```bash
grep -cE "DASHBOARD_PENDING_APPROVAL_TOKENS\.alertRing" \
  apps/frontend/components/dashboard/PendingApprovalCard.tsx
# >= 4
```

### MUST-C-4: 토큰 값 = 기존 클래스 (시각 회귀 0)
- heroFull: `ring-2 ring-brand-critical/20`
- priority: `ring-1 ring-brand-critical/20`
- compact: `ring-1 ring-brand-critical/20`
- full: `ring-2 ring-brand-critical/30`

### MUST-C-5: `as const` 보존

### SHOULD-C-1: 토큰 키 네이밍 기존 패턴 일관
### SHOULD-C-2: alertRing 서브객체에 JSDoc 1줄

---

## Phase D — parseCheckoutCreateParams-unit-test

### MUST-D-1: 테스트 파일 존재
```bash
ls apps/frontend/lib/utils/__tests__/checkout-create-params.test.ts
```

### MUST-D-2: 7 케이스 이상
```bash
grep -cE "it\(|test\(" apps/frontend/lib/utils/__tests__/checkout-create-params.test.ts
# >= 7
```

### MUST-D-3: 7 시나리오 커버
1. 빈 입력 → 둘 다 null
2. equipmentId만 → equipmentId 설정
3. 유효 purpose만 → purpose 설정
4. equipmentId + 유효 purpose → 둘 다 설정
5. 잘못된 purpose → null
6. equipmentId 공백 → null
7. Record input → SearchParamsWithGet과 동일

### MUST-D-4: 테스트 PASS
```bash
pnpm --filter frontend test -- checkout-create-params
# 7 passing, 0 failing
```

### SHOULD-D-1: 기존 테스트 패턴 일관성
### SHOULD-D-2: enum 값 하드코딩 최소화

---

## Phase E — resolve-badge-and-action-exhaustive-kind-check

### MUST-E-1: switch 문
```bash
grep -nA3 "switch (cfg.kind)" apps/frontend/lib/navigation/nav-config.ts
# 1건
```

### MUST-E-2: assertNever 패턴
```bash
grep -nE "assertNever\(" apps/frontend/lib/navigation/nav-config.ts
# 1건 이상
```

### MUST-E-3: 컴파일 타임 exhaustive 보장 (수동 네거티브 검증)

### MUST-E-4: 런타임 동작 동일
- 'count' 분기: `{ badge: count }`
- 'count-with-action' 분기: `{ badge: count, secondaryAction: {...} }`

### SHOULD-E-1: assertNever 로컬 정의 (별도 파일 분리 금지)
### SHOULD-E-2: 에러 메시지에 `JSON.stringify(x)` 포함

---

## Phase F — heroKPI-atom-react-memo

### MUST-F-1: React.memo 래핑
```bash
grep -nE "React\.memo\(function HeroKPI" apps/frontend/components/checkouts/HeroKPI.tsx
# 1건 이상
```

### MUST-F-2: displayName 보존 (named function expression)
### MUST-F-3: Props 시그니처 보존
### MUST-F-4: tsc PASS

### SHOULD-F-1: custom 비교 함수 미사용
### SHOULD-F-2: 기존 테스트 PASS

---

## Phase G — bundle-baseline-script Done

### MUST-G2-1: measureFromBuildArtifacts 존재
```bash
grep -n "measureFromBuildArtifacts" scripts/check-bundle-size.mjs
# 1건 이상
```

### MUST-G2-2: 트래커 항목 [x]
### SHOULD-G2-1: 코드 변경 없음

---

## 종합 검증 시퀀스

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend test
pnpm lint

# Phase별 정적 검증
grep -n "isPurposeCompatibleWithEquipment" apps/backend/src/modules/checkouts/checkouts.service.ts
grep -c "node -e" .claude/settings.json
grep -c "dev-doctor.mjs --hint-line" .claude/settings.json
grep -nE "ring-(1|2)\s+ring-brand-critical/[0-9]+" apps/frontend/components/dashboard/PendingApprovalCard.tsx
grep -nE "switch \(cfg\.kind\)|assertNever\(" apps/frontend/lib/navigation/nav-config.ts
grep -n "React.memo" apps/frontend/components/checkouts/HeroKPI.tsx
```
