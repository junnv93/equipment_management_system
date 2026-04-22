# Evaluation: checkout-lender-guard
Date: 2026-04-22
Iteration: 1

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | approve() lenderTeam identity-rule | PASS | `checkouts.service.ts` L1449–1456: `if (checkout.purpose === CPVal.RENTAL && checkout.lenderTeamId)` 성립 시 `if (!approverTeamId || approverTeamId !== checkout.lenderTeamId)` → `ForbiddenException(LENDER_TEAM_ONLY)`. null/undefined 경로 포함 차단 확인. |
| M2 | rejectReturn() lenderTeam identity-rule | PASS | L2032–2042: 동일 패턴. `if (!rejectReturnDto.approverTeamId || rejectReturnDto.approverTeamId !== checkout.lenderTeamId)` → `ForbiddenException(LENDER_TEAM_ONLY)`. 컨트롤러(L677)에서 `approverTeamId = req.user?.teamId` 서버 주입 확인. |
| M3 | approve() NO_EQUIPMENT guard | PASS | L1423–1429: `const firstEquip = equipmentMap.values().next().value; if (!firstEquip) throw new BadRequestException({ code: CheckoutErrorCode.NO_EQUIPMENT })` — `enforceScopeFromData` 호출 전 배치. |
| M4 | rejectReturn() NO_EQUIPMENT guard | PASS | L2009–2015: 동일 패턴. `firstEquip` 미존재 시 `BadRequestException(NO_EQUIPMENT)`. |
| M5 | tsc --noEmit clean | PASS | tsc 출력 없음 (오류 0건). |
| M6 | backend test 0 regression | PASS | 928 passed, 72 suites — 기존 테스트 회귀 없음. |

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | 신규 테스트 케이스 — approve LENDER_TEAM_ONLY | PASS | `describe('approve')` 내 L363–406: 팀 미소속 사용자(`teamId: undefined`) RENTAL 반출 approve → `ForbiddenException` 테스트 존재. |
| S1 | 신규 테스트 케이스 — rejectReturn LENDER_TEAM_ONLY | FAIL | `describe('rejectReturn')` 블록(L606–632)에 NO_EQUIPMENT 테스트만 존재. LENDER_TEAM_ONLY 케이스 없음. M2 구현은 정상이나 회귀 커버리지 부재. |

## Overall: PASS

모든 MUST 기준(M1–M6) 충족.

## Issues (if any FAIL)

없음. 모든 MUST 기준 통과.

## SHOULD failures for tech-debt

**[S1-rejectReturn] rejectReturn LENDER_TEAM_ONLY 테스트 누락**
- 파일: `apps/backend/src/modules/checkouts/__tests__/checkouts.service.spec.ts`, `describe('rejectReturn')` 블록
- 현황: M2 구현(`!rejectReturnDto.approverTeamId || ... !== checkout.lenderTeamId`)은 정상이나, 해당 경로를 커버하는 테스트 케이스가 없음.
- 비고: 현재 FSM에서 `reject_return` 액션은 calibration/repair 목적에서만 발동되므로 RENTAL 경로는 `assertFsmAction`에서 먼저 차단됨. 그러나 FSM 변경 시 silent regression 가능.
- 권고: `purpose: 'rental'` + `lenderTeamId` 설정 + `approverTeamId: undefined` 사용자 → `rejects.toThrow(ForbiddenException)` 테스트 추가.
