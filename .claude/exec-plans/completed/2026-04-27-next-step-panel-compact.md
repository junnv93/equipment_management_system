# Exec Plan: next-step-panel-compact
생성: 2026-04-27 | 상태: ACTIVE

## 문제 요약

`NextStepPanel` compact variant에서 `canAct=true`일 때 "현재 단계 라벨 span"과 "액션 버튼"이
동일한 i18n 키(`checkouts.fsm.action.${labelKey}`)를 참조해 동일 텍스트가 두 번 렌더링된다.
그룹 카드 행 Zone 4와 rental 그룹 헤더에서 "반입 처리 반입 처리" 형태의 시각적 노이즈 발생.

## 설계 결정

**옵션 B 채택 — compact variant 한정 렌더링 조건 분기.**

근거:
- SSOT 검증: `packages/schemas/src/fsm/checkout-fsm.ts`의 14개 TransitionRule 전수에서
  `labelKey`와 `action`이 동일한 i18n 키 부분으로 매핑됨.
  타입 확장(옵션 A)은 모든 transition에 중복 정의를 강요하므로 SSOT 비용이 효익을 초과.
- 의미 분석: compact variant span의 역할은 "현재 단계가 무엇인지 알리는 보조 정보".
  button이 표시되는 순간 그 정보는 button 자체에 내포되므로 span은 정보 가치 0.
  `canAct=false`(권한 없음/다른 역할)에서는 button이 없으므로 span이 유일한 정보 매체 → 유지 필요.
- 비교 분석: hero/inline은 stepLabel에 `— ${currentStepIndex}/${totalSteps}` 진행 정보가 부착되어
  시각 차별화. compact는 `max-w-[72px] truncate` 제약으로 진행 정보 부착 불가.
  따라서 compact 한정으로 span 조건부 렌더링이 디자인 토큰을 깨지 않는 최소 변경.

스코프 한정 (변경하지 않는 것):
- NextStepDescriptor / TransitionRule 타입 (`packages/schemas`)
- i18n 키 구조 (`messages/ko,en/checkouts.json` `fsm.action.*` 14개)
- hero / inline / floating variant 분기
- terminal 분기 (`descriptor.nextAction === null`)
- NEXT_STEP_PANEL_TOKENS / WORKFLOW_PANEL_TOKENS 토큰 값
- 백엔드 `buildNextStep` / `getNextStep` 호출 경로

## Phase 1: 컴포넌트 렌더링 분기 수정

### 수정 파일
- `apps/frontend/components/shared/NextStepPanel.tsx`
  — compact variant(약 라인 264~361 분기) 내 "현재 단계 라벨 span"과 "액션 버튼"이
    동시 렌더링될 때 동일 텍스트 노출을 제거한다.
    `canAct=true`이면 span 렌더링 생략 (button이 레이블 역할 겸함).
    `canAct=false`이면 기존과 동일하게 span만 표시 (현재 단계 정보 전달).
  — `data-variant`, `data-actor-variant`, `data-my-turn`, `aria-live`, dot indicator,
    overflow menu, isPending 스피너는 변경 금지.
  — terminal 분기 및 hero/inline/floating 분기는 변경 금지.

## Phase 2: Storybook 시나리오 보강

### 수정 파일
- `apps/frontend/components/shared/NextStepPanel.stories.tsx`
  — 기존 CompactVariant 스토리가 `canAct=true` 케이스만 노출 → `canAct=false` 시나리오 추가.
    기존 fixture(PENDING_DESCRIPTOR 등) 재사용, 신규 descriptor 생성 시 NextStepDescriptor 필수 필드 전부 채울 것.
    회귀 시 두 시나리오의 시각 차이를 즉시 확인할 수 있어야 함.

## Phase 3: 검증

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
pnpm --filter frontend run lint
```

### 수동 브라우저 검증
- `/checkouts` → 그룹 카드 행 Zone 4: `canAct=true` 행에서 액션 텍스트 1회만 렌더링 확인
- `/checkouts` → rental 그룹 헤더(compact): 동일 확인
- `canAct=false` 시점(권한 없는 역할)에서 현재 단계 라벨 여전히 표시 확인
- `/checkouts/[id]` → hero variant 시각 변경 없음 확인

## 성공 기준
- [ ] compact canAct=true: 동일 텍스트 DOM에서 1회만 렌더링
- [ ] compact canAct=false: 현재 단계 라벨 1회 표시 유지
- [ ] hero/inline/floating/terminal: 시각 변경 없음
- [ ] tsc PASS
- [ ] build PASS
- [ ] lint PASS
- [ ] NextStepDescriptor / TransitionRule 타입 변경 없음
- [ ] i18n 키 추가/삭제/변경 없음
