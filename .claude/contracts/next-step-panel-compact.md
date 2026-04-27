# Contract: next-step-panel-compact
생성: 2026-04-27

## 컨텍스트
NextStepPanel compact variant에서 `canAct=true` 시 동일 텍스트 두 번 렌더링 문제를
"옵션 B — 컴포넌트 렌더링 조건 분기"로 해결한다.
SSOT(NextStepDescriptor/TransitionRule), i18n 키, 다른 variant는 변경하지 않는다.

## MUST (루프 차단 기준 — 바이너리 PASS/FAIL)

- [ ] M1: compact + canAct=true — DOM 트리에서 `action.${labelKey}` 번역 텍스트가 정확히 1회 렌더링
- [ ] M2: compact + canAct=false — 현재 단계 라벨이 시각 영역에 1회 표시 (button 없는 상태에서 단계 식별 가능)
- [ ] M3: hero variant — stepLabel(`— X/N`) + button 동시 렌더링 동작 기존 대비 변경 없음
- [ ] M4: inline / floating variant — 기존 출력 변경 없음
- [ ] M5: terminal 분기 (`descriptor.nextAction === null`) — 전 variant 기존 출력 유지
- [ ] M6: `pnpm --filter frontend run tsc --noEmit` PASS
- [ ] M7: `pnpm --filter frontend run build` PASS
- [ ] M8: `pnpm --filter frontend run lint` PASS
- [ ] M9: SSOT — `packages/schemas/src/fsm/checkout-fsm.ts`의 NextStepDescriptor / TransitionRule / CheckoutAction 변경 없음
- [ ] M10: i18n — `messages/{ko,en}/checkouts.json` `fsm.action.*` 14개 키 추가/삭제/이름변경 없음
- [ ] M11: 백엔드 무변경 — `checkouts.service.ts`의 getNextStep 호출 경로 변경 없음
- [ ] M12: 토큰 보존 — `workflow-panel.ts`의 WORKFLOW_PANEL_TOKENS.variant.compact 및 NEXT_STEP_PANEL_TOKENS.container.compact 구조/값 변경 없음
- [ ] M13: 접근성 — compact 외부 컨테이너 `role="status"` / `aria-live="polite"` / `aria-atomic="true"` / `data-variant="compact"` / `data-actor-variant` / `data-my-turn` 모두 유지
- [ ] M14: overflow menu / MoreHorizontal 트리거 / isPending 스피너 동작 회귀 없음

## SHOULD (후속 PR 처리 가능)

- [ ] S1: Storybook compact canAct=true / canAct=false 두 시나리오 명시적 노출
- [ ] S2: compact variant 단위 테스트 (`screen.queryAllByText` 카운트 = 1 검증)
- [ ] S3: Playwright 시각 회귀 스냅샷 (그룹 카드 Zone 4 + rental 헤더)
- [ ] S4: 미래 `actionKey ≠ labelKey` 분기 필요 시 옵션 A로 마이그레이션 (별도 PR)
- [ ] S5: hero variant UX 검토 (stepLabel + button 동일 단어 가능성, 현재 단계 정보로 시각 차별화됨)

## 검증 절차
1. `pnpm --filter frontend run tsc --noEmit` (M6)
2. `pnpm --filter frontend run build` (M7)
3. `pnpm --filter frontend run lint` (M8)
4. `git diff` 로 변경 범위 확인 (M9~M12)
5. 브라우저 /checkouts 그룹 카드 Zone 4 + rental 헤더 시각 확인 (M1, M2)
6. 브라우저 /checkouts/[id] hero variant 회귀 확인 (M3)
7. DevTools 접근성 트리 role/aria 속성 확인 (M13)

## 트레이드오프 기록
- 옵션 A(타입 확장) 미채택: 14개 transition 전수가 labelKey===action으로 SSOT 중복 정의 발생
- 옵션 C(전체 재설계) 미채택: max-w-[72px] truncate + Zone 4 grid auto 폭 정책 보존 필요
