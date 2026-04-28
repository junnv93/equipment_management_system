# manage-skills Report — tech-debt-residual session

생성일: 2026-04-28

## A. 신규 스킬 필요성

**결론: 불필요**

| 패턴 | 담당 스킬 | 커버 여부 |
|------|-----------|-----------|
| `getRentalPhase()` JSDoc invariant 패턴 (rental-phase.ts:62 변경) | verify-checkout-fsm Step 33 | ✅ 이미 커버 (rental-phase.ts SSOT exhaustiveness guard) |
| NextStepPanel `currentUserRole` prop parity (CheckoutGroupCard) | verify-design-tokens Step 42 | ✅ 세션 중 추가됨 |
| role 리터럴 → UserRoleValues SSOT 교체 (self-inspections.controller.ts) | verify-auth Step 16 | ✅ 2026-04-27 추가됨 |
| 하드코딩 '5 minutes' → 동적 계산 (checkouts.service.ts) | verify-hardcoding Step 29 | ✅ 2026-04-27 추가됨 |

모든 이번 세션 패턴이 직전 세션(2026-04-27)에서 이미 추가된 Step들로 완전히 커버된다.
신규 스킬 파일 생성 불필요.

## B. 기존 스킬 Step 추가 검토

### verify-hardcoding

**Step 29** (2026-04-27 추가, 현재 최신): 백엔드 시간 윈도우 상수 `shared-constants` SSOT 승격 요구

- 이번 세션에서 `checkouts.service.ts:3209`가 `APPROVAL_REVOCATION_WINDOW_MS / 60_000` 동적 계산으로 교체되었음.
- Step 29의 "현재 알려진 tech-debt 항목" 섹션이 `REVOCATION_WINDOW_MS = 300_000` 로컬 상수를 위반 예시로 명시하고 있으나, **이 항목이 이번 세션에서 수정 완료**됨.
- **권장 갱신**: Step 29의 "현재 알려진 tech-debt 항목" 텍스트를 "수정 완료 (2026-04-28)" 로 표기하거나 삭제. 이후 새 위반 발견 시 재등재.

**추가 Step 필요 없음** — 시간 값 하드코딩(`'5 minutes'` 문자열 등) grep은 Step 29 bash 패턴으로 이미 탐지 가능. 문자열 메시지 내 하드코딩(`message: \`... ${X / 60_000} minutes\``) 패턴은 WARN 수준 — 현재 Step 5(토큰 TTL 하드코딩)와 Step 29(서비스 윈도우 상수)가 중첩 커버.

### verify-auth

**Step 16** (2026-04-27 추가, 현재 최신): 백엔드 컨트롤러 role 문자열 리터럴 직접 비교 탐지

- 이번 세션에서 `self-inspections.controller.ts:286`의 `r === 'system_admin' || r === 'technical_manager'` → `UserRoleValues` SSOT 교체 완료.
- Step 16의 배경(background) 섹션이 `self-inspections.controller.ts:284`를 발견 출처로 명시하고 있음 — **수정 완료 사실 반영 권장**.
- 추가 Step 불필요.

### verify-checkout-fsm

**현재 최신: Step 40** (2026-04-27 추가). Step 41+ 미존재.

이번 세션 `CheckoutGroupCard.tsx:327`의 `currentUserRole` prop 추가는:
- verify-design-tokens Step 42 (NEXT_STEP_PANEL_TOKENS 토큰 체인)에서 이미 소비처로 명시됨.
- verify-checkout-fsm에서 별도 Step으로 등록 필요 여부 검토:
  - **현재 Step 35**: `roleToActorVariant` + `ActorVariant` SSOT + `isMyTurn UserRoleValues.SYSTEM_ADMIN` — `currentUserRole` prop 존재 여부는 암묵적으로 커버.
  - **갭**: `CheckoutGroupCard`의 group-header zone과 row zone 4 양쪽이 동일 `currentUserRole={role}` prop을 전달하는지(multi-instance parity) **명시적으로 탐지하는 grep 패턴이 없음**.

| 스킬 | 추가 권장 Step | 패턴 | 우선순위 |
|------|---------------|------|----------|
| verify-checkout-fsm | Step 41: CheckoutGroupCard multi-instance `currentUserRole` prop parity | `grep -c "currentUserRole={role}" CheckoutGroupCard.tsx` 기대 ≥ 2 | LOW |
| verify-hardcoding | Step 29 텍스트 갱신 (tech-debt 수정 완료 반영) | 설명 텍스트 갱신, bash 명령 유지 | LOW |
| verify-auth | Step 16 배경 텍스트 갱신 (수정 완료 반영) | 설명 텍스트 갱신, bash 명령 유지 | LOW |

## C. 즉시 적용 vs 보류

**즉시 적용 권장 (낮은 비용, 높은 정확도)**:
- `verify-hardcoding` Step 29 "현재 알려진 tech-debt 항목" → "수정 완료 (2026-04-28)" 표기
- `verify-auth` Step 16 배경 텍스트 → 발견 출처 수정 완료 명시

**보류 (낮은 우선순위)**:
- `verify-checkout-fsm` Step 41 (CheckoutGroupCard multi-instance parity): 탐지 가치는 있으나 grep 1줄로 충분하고 Step 35·verify-design-tokens Step 42로 간접 커버됨. CheckoutGroupCard 재수정 이슈 발생 시 그때 추가.

## D. 권장 액션

1. **verify-hardcoding Step 29** — `checkouts.service.ts:3177`의 `REVOCATION_WINDOW_MS = 300_000` 항목을 "수정 완료 (2026-04-28, APPROVAL_REVOCATION_WINDOW_MS 동적 계산으로 교체)" 로 표기. grep 명령 유지 (향후 동일 패턴 탐지용).

2. **verify-auth Step 16** — 배경 섹션의 `self-inspections.controller.ts:284` 발견 예시에 "수정 완료 (2026-04-28)" 주석 추가. grep 명령 유지.

3. **신규 스킬 생성 없음** — 기존 19개 verify-* 스킬이 이번 세션 패턴을 완전히 커버.

4. **CLAUDE.md / skills-index.md 갱신 없음** — 스킬 파일 수 변동 없음.
