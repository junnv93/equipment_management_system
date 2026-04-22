# Contract: Checkout Architecture PR-3~PR-11

**날짜**: 2026-04-22
**참조 Exec Plan**: `.claude/exec-plans/active/2026-04-22-checkout-arch-pr3-11.md`

---

## MUST 기준 (40개 — 모두 PASS해야 머지 가능)

### 전체 빌드/타입
- [ ] **M-01**: `pnpm --filter frontend run tsc --noEmit` 에러 0건
- [ ] **M-02**: `pnpm --filter backend run tsc --noEmit` 에러 0건 (schemas 의존 영향 회귀 0)
- [ ] **M-03**: `pnpm --filter frontend run build` 성공

### PR-3 Token Layer 2 확장
- [ ] **M-04**: `ELEVATION_TOKENS.surface.flush`, `.raised`, `.floating` 3개 키 모두 semantic.ts에서 export
- [ ] **M-05**: `TYPOGRAPHY_TOKENS` export — `heading.h1~h4` (4개) + `body.base|large|small` (3개) + `label.base|compact` (2개) + `caption.base|meta` (2개) = 11개 키 이상
- [ ] **M-06**: `SPACING_RHYTHM_TOKENS` export — `tight|comfortable|relaxed|spacious` 각각 `padding`, `gap`, `stack` 3필드 제공
- [ ] **M-07**: `ElevationSurface` / `SpacingRhythm` 타입 export
- [ ] **M-08**: `apps/frontend/lib/design-tokens/components/workflow-panel.ts` 파일 존재 — WORKFLOW_PANEL_TOKENS + WorkflowPanelUrgency 타입 export
- [ ] **M-09**: `apps/frontend/lib/design-tokens/index.ts` 에서 workflow-panel.ts re-export 존재
- [ ] **M-10**: WORKFLOW_PANEL_TOKENS가 `ELEVATION_TOKENS.surface.floating`와 `SPACING_RHYTHM_TOKENS.comfortable.padding`을 내부적으로 참조 (하드코딩 shadow-md/p-4 없음)

### PR-4 NextStepPanel + Hook
- [ ] **M-11**: `apps/frontend/hooks/use-checkout-next-step.ts` 파일 존재, `useCheckoutNextStep` named export
- [ ] **M-12**: 훅이 `getNextStep(input, userPermissions)` 를 `@equipment-management/schemas`에서 호출 — FSM 로직 재구현 0
- [ ] **M-13**: 훅이 `getPermissions(role)`을 `@equipment-management/shared-constants`에서 호출 — 권한 리터럴 하드코딩 0
- [ ] **M-14**: `apps/frontend/components/checkouts/NextStepPanel.tsx` 파일 존재
- [ ] **M-15**: NextStepPanel이 `NextStepDescriptor` 타입의 `descriptor` prop 수신
- [ ] **M-16**: NextStepPanel에서 CheckoutStatus 문자열 리터럴 직접 비교 0건 (`descriptor.nextAction === null` 만 허용)
- [ ] **M-17**: 액션 버튼에 `data-testid="next-step-action"` 부착
- [ ] **M-18**: Panel 컨테이너에 `data-checkout-id`, `data-urgency`, `data-next-action` attribute 부착

### PR-5 통합 + Feature Flag
- [ ] **M-19**: `isNextStepPanelEnabled()` 헬퍼가 `process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL === 'true'` 비교로 구현됨
- [ ] **M-20**: CheckoutDetailClient에서 `isNextStepPanelEnabled()` 조건부 렌더 사용
- [ ] **M-21**: flag off 상태에서 NextStepPanel DOM 미렌더 (E2E 회귀 방지)
- [ ] **M-22**: CheckoutStatusStepper에 `nextStepIndex` prop 전달 경로 존재

### PR-6 Stepper/MiniProgress
- [ ] **M-23**: `CheckoutStatusStepper` Props 에 `nextStepIndex?: number` optional 추가
- [ ] **M-24**: next 노드 렌더 시 `data-step-state="next"` attribute 부착
- [ ] **M-25**: `CheckoutMiniProgress` Props 에 `descriptor?: NextStepDescriptor` optional 추가, descriptor 미전달 시 기존 fallback 유지 (회귀 0)
- [ ] **M-26**: `CHECKOUT_STEPPER_TOKENS.status.next` 서브트리 추가 (node/icon/label 3키)

### PR-7 Stat Card 토큰화
- [ ] **M-27**: 반출/대시보드 통계 카드에서 shadow 하드코딩(`shadow-sm`/`shadow-md`) 0 — `ELEVATION_TOKENS.surface.*` 경유
- [ ] **M-28**: 통계 카드 value/label이 `TYPOGRAPHY_TOKENS.*` 참조
- [ ] **M-29**: 통계 카드 padding/gap이 `SPACING_RHYTHM_TOKENS.*` 참조
- [ ] **M-30**: `transition-all` 사용 0 (TRANSITION_PRESETS 만 사용)

### PR-8 i18n + check-i18n-keys
- [ ] **M-31**: `apps/frontend/messages/ko/checkouts.json` 에 `fsm.action`, `fsm.hint`, `fsm.actor`, `fsm.blocked`, `fsm.urgency`, `fsm.panelTitle` 6개 서브트리 존재
- [ ] **M-32**: `apps/frontend/messages/en/checkouts.json` 에 동일 6개 서브트리 존재 (영문 번역)
- [ ] **M-33**: `CHECKOUT_TRANSITIONS`의 모든 유니크 `labelKey` / `hintKey`가 양 로케일에 존재 (누락 0)
- [ ] **M-34**: `scripts/check-i18n-keys.mjs` 파일 존재, `node scripts/check-i18n-keys.mjs` 실행 시 종료코드 0

### PR-9 E2E 8 시나리오
- [ ] **M-35**: `apps/frontend/tests/e2e/features/checkouts/suite-next-step/s-next-step.spec.ts` 파일 존재
- [ ] **M-36**: 8개 test case (S1~S8) 정의, 각각 `data-next-action` 또는 `data-urgency` 검증 포함

### PR-10 NC_ELEVATION 승격
- [ ] **M-37**: `NC_ELEVATION`이 `ELEVATION_TOKENS.surface` 재export로 축소됨 (자체 리터럴 정의 제거)
- [ ] **M-38**: non-conformance.ts 내 `NC_ELEVATION.raised|floating` 5개 사용처가 `ELEVATION_TOKENS.surface.raised|floating` 직접 참조로 전환

### PR-11 self-audit + bundle baseline
- [ ] **M-39**: self-audit.mjs 체크 ⑧ (FSM 리터럴 감지) 추가 — `status === 'pending'` 등 감지 후 위반 보고
- [ ] **M-40**: `scripts/bundle-baseline.json` 파일 존재, `check-bundle-size.mjs` `--baseline` / `--compare` 플래그 지원

---

## SHOULD 기준 (16개 — 실패 시 tech-debt 기록)

### 디자인 원칙 (AP-01~09)
- [ ] **S-01**: AP-01 (색상) — 변경 컴포넌트에서 brand semantic 경유, 직접 hex 0건
- [ ] **S-02**: AP-02 (타이포) — `text-[<size>]` arbitrary 사용 0건
- [ ] **S-03**: AP-03 (간격) — `p-[<n>px]`, `gap-[<n>px]` arbitrary 사용 0건 (3/5/7/9 홀수 리듬 허용 예외 제외)
- [ ] **S-04**: AP-04 (깊이) — ELEVATION_TOKENS.surface로 shadow 일관화
- [ ] **S-05**: AP-05 (유도) — NextStepPanel이 현재 상태에서 "다음 할 일"을 명확히 표시
- [ ] **S-06**: AP-06 (모션) — `transition-all` 0, `duration-[ms]` arbitrary 0
- [ ] **S-07**: AP-09 (접근성) — Panel에 role/aria-label/aria-live 속성 모두 존재, 키보드 포커스 링 (FOCUS_TOKENS.classes.default) 적용

### 테스트/품질
- [ ] **S-08**: E2E 8 시나리오 전부 PASS (flag on)
- [ ] **S-09**: flag off 상태에서 기존 checkout E2E (suite 4, 8, 10, 15, 16, 21, 23) 전부 PASS
- [ ] **S-10**: check-i18n-keys.mjs가 일부러 한 키 삭제 시 종료코드 1 + 누락 키를 stderr에 출력

### 번들/성능
- [ ] **S-11**: 번들 크기 baseline 대비 변경된 라우트 < 5% 증가 (`/checkouts`, `/checkouts/[id]`, `/dashboard`)
- [ ] **S-12**: FSM 상태 리터럴 직접 사용 0건 (`--all` 모드에서 checkFsmLiterals 위반 0)

### Feature Flag Lifecycle
- [ ] **S-13**: `.env.example` 또는 `apps/frontend/.env.local.example`에 `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false` 기본값 기록
- [ ] **S-14**: tech-debt-tracker에 "Feature Flag `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 상시화 (2026-Q2)" 항목 등록

### SSOT/패턴 상속
- [ ] **S-15**: `workflow-panel.ts`가 기존 `checkout.ts` 구조(import 순서, section header comment, `as const`, 타입 export)를 동일 스타일로 유지
- [ ] **S-16**: NextStepPanel onAction 콜백은 기존 action 버튼 핸들러(예: approve/reject dialog)를 재사용 — 신규 mutation 훅 중복 생성 0

---

## 금지 사항 (하드 제약 — 위반 시 즉시 NACK)

1. `packages/schemas/src/fsm/checkout-fsm.ts` **수정 금지** — FSM SSOT. `CHECKOUT_TRANSITIONS` 테이블, `getNextStep`, `computeStepIndex`, `computeUrgency` 전부 읽기 전용.
2. `packages/schemas/src/enums/checkout.ts` 수정 금지 — CheckoutStatus/CheckoutPurpose enum SSOT.
3. `CheckoutStatus` 로컬 type alias 재정의 **금지** (`type CheckoutStatus = 'pending' | ...`) — packages/schemas import만 허용.
4. `NextStepDescriptor` 로컬 재정의 금지 — schemas/fsm/checkout-fsm.ts에서 import.
5. `setQueryData` onSuccess 내 사용 금지 (메모리 섹션 feedback — TData/TCachedData 불일치).
6. `transition-all` 사용 금지 (Web Interface Guidelines + 기존 CHECKOUT_MOTION 패턴).
7. 새 env 변수 추가 금지 — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 한 개만 허용.
8. `shadow-sm` / `shadow-md` / `shadow-lg` 하드코딩 금지 (변경 범위 내) — `ELEVATION_TOKENS.surface.*` 경유.

---

## 검증 스크립트

```bash
# M-01, M-02: 타입 체크
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend  run tsc --noEmit

# M-03: 빌드
pnpm --filter frontend run build

# M-04~M-07: 토큰 export 확인
grep -nE "surface:\s*\{" apps/frontend/lib/design-tokens/semantic.ts
grep -nE "export const (TYPOGRAPHY_TOKENS|SPACING_RHYTHM_TOKENS)" apps/frontend/lib/design-tokens/semantic.ts
grep -nE "type (ElevationSurface|SpacingRhythm)" apps/frontend/lib/design-tokens/semantic.ts

# M-08: workflow-panel.ts 존재
ls apps/frontend/lib/design-tokens/components/workflow-panel.ts

# M-09: index.ts re-export
grep -nE "workflow-panel" apps/frontend/lib/design-tokens/index.ts

# M-11, M-14: 신규 파일 존재
ls apps/frontend/hooks/use-checkout-next-step.ts
ls apps/frontend/components/checkouts/NextStepPanel.tsx

# M-12: FSM getNextStep 사용
grep -n "getNextStep" apps/frontend/hooks/use-checkout-next-step.ts

# M-16: NextStepPanel 내 status 리터럴 비교 0
grep -nE "status\s*[!=]==\s*['\"](pending|approved|checked_out)['\"]" apps/frontend/components/checkouts/NextStepPanel.tsx \
  && echo "FAIL" || echo "PASS"

# M-17, M-18: data attribute
grep -n "data-testid=\"next-step-action\"\|data-next-action\|data-urgency" apps/frontend/components/checkouts/NextStepPanel.tsx

# M-19: Feature flag helper
grep -rn "NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL" apps/frontend/lib/features/ apps/frontend/app/(dashboard)/checkouts/ 2>&1

# M-31, M-32: i18n fsm.* 섹션
node -e "const m=require('./apps/frontend/messages/ko/checkouts.json'); \
  console.log(Object.keys(m.fsm ?? {}).sort().join(','))"
# 기대: action,actor,blocked,hint,panelTitle,urgency

# M-33: i18n 키 누락 없음
node scripts/check-i18n-keys.mjs

# M-35: E2E spec 존재
ls apps/frontend/tests/e2e/features/checkouts/suite-next-step/s-next-step.spec.ts

# M-37: NC_ELEVATION 재export
grep -nE "NC_ELEVATION\s*=" apps/frontend/lib/design-tokens/components/non-conformance.ts

# M-39: self-audit 체크 ⑧
grep -n "FSM 리터럴\|checkFsmLiterals" scripts/self-audit.mjs

# M-40: bundle baseline
ls scripts/bundle-baseline.json
grep -n "baseline\|--compare" scripts/check-bundle-size.mjs

# S-02: arbitrary text size
grep -rnE "text-\[[0-9]+" apps/frontend/components/checkouts/NextStepPanel.tsx apps/frontend/lib/design-tokens/components/workflow-panel.ts \
  && echo "FAIL" || echo "PASS"

# S-06: transition-all
grep -rn "transition-all" apps/frontend/components/checkouts/NextStepPanel.tsx apps/frontend/lib/design-tokens/components/workflow-panel.ts \
  && echo "FAIL" || echo "PASS"

# S-08: E2E next-step (flag on)
NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true \
  pnpm --filter frontend run test:e2e -- --grep "next-step"

# S-11: 번들 크기
pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs --compare

# S-12: self-audit --all 체크 ⑧ 위반 0
node scripts/self-audit.mjs --all
```

---

## Phase별 머지 순서 (의존성 준수)

1. **Phase 1 & 2 병렬**: PR-3 + PR-8 독립 머지 가능
2. **Phase 3**: PR-4 (PR-3 선행 필수)
3. **Phase 4 병렬**: PR-6 + PR-7 (둘 다 PR-3 선행 필수)
4. **Phase 5**: PR-5 (PR-4 선행 필수)
5. **Phase 6**: PR-9 (PR-5 + PR-8 선행 필수)
6. **Phase 7**: PR-10 (PR-3 선행 필수, NC e2e PASS 후)
7. **Phase 8**: PR-11 (독립 — 아무 때나 머지 가능, but PR-3~5 이후가 bundle baseline 측정에 유리)

---

## 롤아웃 Phase (Feature Flag Lifecycle)

| 단계 | 시점 | `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` | 비고 |
|------|------|----------------------------------------|------|
| Alpha | PR-5 머지 직후 | `false` (기본) | 내부 QA만 true로 수동 토글 |
| Beta | E2E 8 시나리오 2 세션 안정화 후 | `true` (개발 환경) | 프로덕션은 여전히 false |
| GA | 프로덕션 2 세션 A/B 관찰 후 | `true` (전역) | flag 코드 제거 (S-14 후속 PR) |
