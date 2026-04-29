# 다음 세션 핸드오프 — 2026-04-29 (rental-approval-workflow + 후속)

## 이번 세션 결과

### 핵심 산출물 — rental 차용 승인 워크플로우 아키텍처 정합화

UL-QP-18 rental 2-step 승인(`pending → borrower_approved → approved`)에서 평택랩 TM(lender)이 차용자 측 `borrower_approve` 버튼을 잘못 누르거나 `pending`에서 직접 `approve` 호출하던 4가지 dev-log 증상을 **아키텍처 수준 SSOT 통합**으로 해결.

**3-Agent harness Mode 2 (Planner → Generator → Evaluator) 2회 iteration 후 14/14 MUST PASS + SHOULD 4건 후속 처리까지 완료**.

#### Phase A — FSM SSOT actor identity 합류
- `packages/schemas/src/fsm/checkout-fsm.ts`
  - `CheckoutActorContext` 옵셔널 타입 (userTeamId + lenderTeamId + requesterTeamId)
  - `TRANSITION_ACTOR_SIDE: Record<CheckoutAction, 'lender'|'borrower'|'requester'|'any'>` SSOT
  - `canPerformAction(checkout, action, perms, actorCtx?)`, `getNextStep(..., actorCtx?)` 옵셔널 4번째 인자
  - `blockingReason` union에 `'actor_team'` 추가 (Zod schema 동기)
  - 280-row table test 호환성 유지 (옵셔널 → undefined 시 기존 동작)

#### Phase B — Backend server-driven UI
- `checkouts.service.ts`
  - `assertFsmAction`/`buildNextStep`/`calculateAvailableActions`에 `actorCtx` 합류
  - `findAll` post-cache meta injection — cache는 raw items(user-agnostic), user-specific meta는 매 요청 fresh → cross-user leak 0
  - `getPendingChecks(Count)` borrower team EXISTS 서브쿼리 — `users.team_id = userTeamId AND status = pending` (G9: nav 배지 1차 승인 대기 누락 회귀 차단)
  - `buildActorCtx(userTeamId, lenderTeamId, requesterTeamId)` 3-explicit args 헬퍼
  - `CheckoutAvailableActions`에 `canBorrowerApprove`/`canBorrowerReject` 추가
- `checkouts.controller.ts:findAll` — `req.user.permissions`/`req.user.teamId` forward
- `non-conformances.controller.ts:findOpenByEquipment` — `EQUIPMENT_DATA_SCOPE`로 변경 (cross-site equipment 상세 read-only 허용)

#### Phase C — Frontend server-driven dispatch
- `lib/api/checkout-api.ts` — 타입 동기 (`canBorrowerApprove`, `requesterTeamId` 추가)
- `lib/api/approvals-api.ts` — `meta.availableActions.canBorrowerApprove` 기반 분기 (rental 1차 승인은 borrower endpoint, 그 외는 일반 approve)
- `components/checkouts/CheckoutGroupCard.tsx` — `borrowerApproveMutation` 분리 + `handleRowAction` action별 dispatch + `useCheckoutGroupDescriptors`에 userTeamId 전달
- `components/shared/NextStepPanel.tsx` — disabled 버튼에 `aria-describedby` + 사유 `<p role="status">` (WCAG 2.4.6 + SR 사용자 즉시 인식)
- `hooks/use-checkout-group-descriptors.ts` — `userTeamId?` 인자 추가, client-side fallback도 actorCtx 합류 (defense in depth 일관성)

#### Phase D — i18n + 라벨 표준화
- `messages/{ko,en}/checkouts.json`
  - `purposeRental`: 외부 대여 → **타팀 장비 대여**
  - `lenderTeam`: 대여받을 팀 → **관리 부서**
  - `lenderSite`: 대여받을 사이트 → **관리 부서 사이트**
  - `fsm.blocked.actor_team` 신규 (lender/borrower team mismatch 사유)
  - `fsm.hint.pendingBorrowerWait` 신규 (lender pov "사용 부서 1차 승인 대기")
  - `toast.borrowerApprove`/`borrowerReject.success` 신규
- `messages/{ko,en}/errors.json` — `UNKNOWN_ERROR.actionLabel` ko/en parity (MISSING_MESSAGE 회귀 차단)
- `lib/errors/equipment-errors.ts:ERROR_MESSAGES[UNKNOWN_ERROR]` — actionLabel 동기

#### Phase E — Verify skills + 테스트
- `.claude/skills/verify-checkout-fsm/SKILL.md`
  - **Step 42**: CheckoutActorContext SSOT + TRANSITION_ACTOR_SIDE 매핑 검증
  - **Step 43**: findAll server-driven meta 항상 주입 (post-cache user-specific) 검증
  - **Step 44**: getPendingChecks borrower team EXISTS subquery 패턴 검증
- `checkouts.service.spec.ts` — 회귀 테스트 3건 추가 (rental+pending → 400, findAll meta 주입, fallback compat)
- `CLAUDE.md` — Verify skills 20→22 업데이트 (verify-checkout-fsm + verify-click-feedback 추가)

#### Phase F — 시니어 자기검토로 발견한 누락 4건 처리
- F-1 G9 nav 배지 (위 Phase B에 흡수)
- F-2 client-side fallback actorCtx (위 Phase C에 흡수)
- F-3 WCAG aria-describedby (위 Phase C에 흡수)
- F-4 buildActorCtx 시그니처 정리 (3-explicit args)

#### 부수 작업 — UI/UX 미세 조정
- `app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx` — 타팀 장비 deeplink 시 purpose=rental 자동 선택 + site/team 자동 채움 + 자팀 vs 타팀 컨텍스트별 SelectItem disabled + 사유
- `packages/shared-constants/src/checkout-selectability.ts` — `getAvailablePurposes`/`isPurposeCompatibleWithEquipment` SSOT (백엔드 OWN_TEAM_ONLY/OTHER_TEAM_ONLY 가드와 동일 룰)
- `components/ui/calendar.tsx` — react-day-picker v9 className 마이그레이션 (head_row→weekdays, head_cell→weekday, etc.)
- `lib/checkouts/toast-templates.ts` — `borrower_approve`/`borrower_reject` action key 매핑 추가

### 검증 결과 (최종)
- BE tsc + FE tsc + BE lint + FE lint 모두 통과
- BE checkouts 75/75 + approvals tests 통과 (회귀 0)
- schemas FSM 695/695 (280-row table 호환성)
- i18n parity: 845개 파일 / 20개 ns 누락 0건
- verify-checkout-fsm Step 42/43/44 PASS

### 커밋 상태
- 본 세션 코드 변경 대부분은 이전 자동 커밋(d08846dc, 6c70a6ff 등)에 흡수됨
- 마지막 docs commit `cae55a50`: `docs(skills): verify-checkout-fsm step 42-44 + claude.md skill index`
- **push 미실행** — 다른 세션 dirty 파일과 충돌 우려, 사용자가 직접 결정

---

## 다음 세션 P1-P3 핸드오프 (즉시 가시 작업)

### P1 (필수) — 사용자 직접 검증 + 잔존 dirty 정리

**Why**: 본 harness 산출물이 main에 적용되었지만 사용자 환경에서 평택랩 TM/수원랩 TM 양쪽 시나리오의 **실제 UI 동작 검증 미완료**. 또한 git status에 23 dirty 파일 잔존 (대부분 다른 세션 작업) — 의도 분류 후 commit 또는 stash 필요.

**Steps**:
1. `pnpm dev` 재기동 후 Ctrl+Shift+R 하드 리프레시
2. **수원랩 TE 시나리오** (`test.engineer@example.com`):
   - 평택랩 PYT-A0001 상세 → `반출 신청` 클릭
   - 폼: `타팀 장비 대여` 자동 선택 + 평택랩 사이트/팀 자동 채움 + 장비 자동 선택 검증
   - calibration/repair는 disabled + 사유 표시
3. **수원랩 TM 시나리오** (`technical.manager.suwon@example.com`):
   - 사이드바 nav 배지에 "내 차례" pending rental 카운트 표시 (G9)
   - 승인 페이지에서 borrower_approve 버튼 활성 → 클릭 → 200 OK → status=borrower_approved
4. **평택랩 TM 시나리오** (`technical.manager.pyeongtaek@example.com`):
   - OUTGOING 탭에 같은 rental 행 노출 + (borrower 승인 전) approve disabled + "사용 부서 1차 승인 대기" 사유 표시
   - borrower 1차 승인 후 approve 활성 → 200 OK → status=approved
5. dirty 파일 분류: 본 세션 외 작업 식별 후 별도 commit 또는 reset

**Risk**: 만약 시나리오 1에서 placeholder가 여전히 보이면 → useEffect ref 잠금 추적 (이전 세션 메모 참조)

### P2 (HIGH) — Frontend 캘린더 v9 시각 검증

**Why**: react-day-picker v9 className 마이그레이션은 정적으로 검증되었으나 (tsc PASS) — 실제 DatePicker 모달의 weekday 헤더 정렬 + 날짜 선택 동작은 사용자 보고 후에야 확인됨. 다음 세션에서 다시 발견되지 않도록 e2e 또는 visual test 도입 검토.

**Steps**:
1. `apps/frontend/components/ui/calendar.tsx` 사용 모든 routes 점검 (반출 신청 폼, 교정 계획 등)
2. 일/월/화/수/목/금/토 7개 헤더가 그리드 컬럼에 정확히 정렬되는지 확인
3. (선택) `tests/e2e/features/checkouts/rental-flow.spec.ts` — DatePicker open + 헤더 텍스트 검증 추가

### P3 (MEDIUM) — 잔존 SHOULD 단일 항목 + Hook timing 정리

**Why**: tech-debt-tracker에 1건 남음 — `findAll-meta-fallback-path`. 현재는 의도된 옵셔널 패턴이지만 `getInboundOverview`에 meta가 필요해지면 처리 트리거.

**Steps**:
1. `getInboundOverview` 호출처에서 BE meta가 필요한 케이스 발견 시:
   - controller에서 user info forward
   - `findAll`의 옵셔널 분기 제거 → 항상 meta 주입
2. Hook timing 회귀 가드: `useCheckoutGroupDescriptors`의 client-side fallback이 실제로 발동되는 조건을 dev-log로 측정 (BE meta 누락 빈도)

---

## 시드/환경 컨텍스트

- 64 → 23 dirty 파일 (다른 세션의 click-feedback Phase 3+, software-validation, equipment-imports 등 작업이 잔존)
- main 브랜치, behind/ahead 0 (커밋 전 기준)
- Docker: postgres + redis + rustfs (healthy)
- Test users: USER_TEST_ENGINEER_SUWON_ID(00000001), USER_TECHNICAL_MANAGER_SUWON_ID(?), USER_TECHNICAL_MANAGER_PYEONGTAEK_ID(00000014)
- Test equipment: PYT-A0001 (eeee6001-0001-4001-8001-000000000001, 평택랩 b2c3d4e5)

## 변경 영향 — 회귀 위험 영역

| 영역 | 회귀 위험 | 완화 |
|---|---|---|
| FSM `canPerformAction` 시그니처 확장 | LOW — 옵셔널 actorCtx, 기존 호출 영향 0 | 280-row table test PASS, 35+ 호출처 정적 검증 |
| `findAll` 응답 페이로드 ↑ | LOW — 50 row당 ~5KB 증가 | cache TTL 동일 |
| `getPendingChecks` EXISTS subquery | MEDIUM — 신규 SQL 패턴, mock에서는 getOrSet bypass로 미실행 | 실 DB 통합 테스트 필요 (BLOCKED-ENV) |
| `useCheckoutGroupDescriptors` userTeamId 인자 | LOW — 옵셔널, 기존 호출 1곳(CheckoutGroupCard) 동시 업데이트 | tsc PASS |
| react-day-picker v9 className 변경 | LOW — Calendar.tsx 단일 파일 | tsc PASS, 사용자 시각 검증 필요 (P2) |

## 시그너처 외 메모리 갱신 권고
- 메모리 [Disabled + 사유 표시 우선] 패턴이 NextStepPanel `aria-describedby + role="status"`로 SR 사용자까지 확장됨 — 향후 disabled UI 시 동일 패턴 강제
- 메모리 [defense in depth] 원칙이 client-side fallback hook에도 적용되어야 한다는 사례 추가 (`useCheckoutGroupDescriptors`)
- Server-driven UI 표준 패턴 — `meta.availableActions` boolean을 BE가 매 응답에 주입, FE는 그 boolean만 신뢰. role/status 분기 0
