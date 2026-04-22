# Evaluation: checkout-lender-guard

**Date**: 2026-04-22
**Verdict**: PASS

## MUST Criteria

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| M1: approve — lenderTeam identity-rule 강제 | PASS | `checkouts.service.ts` L1449–1456: `if (!approverTeamId \|\| approverTeamId !== checkout.lenderTeamId)` → `ForbiddenException(LENDER_TEAM_ONLY)`. null/undefined 경로 차단 확인. |
| M2: rejectReturn — lenderTeam identity-rule 강제 | PASS | L2032–2042: `!rejectReturnDto.approverTeamId \|\| ...` → 동일 패턴. |
| M3: approve — NO_EQUIPMENT 가드 | PASS | L1423–1428: `if (!firstEquip) throw BadRequestException(NO_EQUIPMENT)` — `enforceScopeFromData` 호출 전 배치. |
| M4: rejectReturn — NO_EQUIPMENT 가드 | PASS | L2009–2015: 동일 패턴. |
| M5: tsc 통과 | PASS | tsc 출력 없음 (오류 없음). |
| M6: backend unit test 통과 | PASS | 928 passed, 72 suites — 회귀 없음. |

## SHOULD Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| S1: approve LENDER_TEAM_ONLY 테스트 | PASS | `describe('approve')` 내 팀 미소속 사용자 RENTAL approve → ForbiddenException 테스트 존재. |
| S1: rejectReturn LENDER_TEAM_ONLY 테스트 | FAIL | `describe('rejectReturn')` 블록에 해당 케이스 없음. 구현(M2)은 정상. |

## Issues Found

**[SHOULD 위반] rejectReturn LENDER_TEAM_ONLY 테스트 누락**
- 파일: `checkouts.service.spec.ts` describe('rejectReturn')
- 내용: M2 구현은 정상이나 회귀 테스트 커버리지 부재.
- 참고: `reject_return` FSM은 CAL_REPAIR 전용이므로 RENTAL 경로는 assertFsmAction에서 먼저 차단됨. 그러나 향후 FSM 변경 시 silent regression 가능.
- 권고: `purpose: 'rental'` + `lenderTeamId` + `teamId: undefined` 사용자 → `rejects.toThrow(ForbiddenException)` 테스트 추가.
