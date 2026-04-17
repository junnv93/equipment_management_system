# Evaluation — e2e-72-fixes

**Date**: 2026-04-17 (revised)
**Evaluator**: QA Agent (claude-sonnet-4-6)
**Contract**: `.claude/contracts/e2e-72-fixes.md`

---

## Verdict: **ALL MUST PASSED**

12/12 MUST 기준 전체 통과. M-10 `/rentals` 0 hit 확인 (이전 실패 2건 수정됨).

---

## MUST Criteria 결과

| ID | 기준 | 결과 | 근거 |
|----|------|------|------|
| M-1 | `pnpm tsc --noEmit` exit 0 | **PASS** | `EXIT=0` — tsc 오류 없음 |
| M-2 | 변경된 파일 관련 lint 오류 없음 | **PASS** | `eslint` 오류 없이 정상 종료 |
| M-3 | `calibration-plans.e2e-spec.ts` 전체 PASS | **PASS** | 22 suites, 286 passed / 1 skipped, exit 0 |
| M-4 | `non-conformances.e2e-spec.ts` 전체 PASS | **PASS** | 22 suites, 286 passed / 1 skipped, exit 0 |
| M-5 | `equipment-approval.e2e-spec.ts` 전체 PASS | **PASS** | 22 suites, 286 passed / 1 skipped, exit 0 |
| M-6 | 기타 E2E 테스트 회귀 없음 | **PASS** | 22 suites, 1 skipped, 286 passed, exit 0 (41.137s) |
| M-7 | `TEAM_PLACEHOLDER_ID` 하드코딩 금지, uuid-constants만 | **PASS** | `grep '00000000-0000-0000-0000-000000000099'` → `uuid-constants.ts:404` 단 1건, test/src 내 0건 |
| M-8 | `TEST_USER_DETAILS`에 teamId 필드 존재 | **PASS** | `test-auth.ts:44,53,62` — 3개 사용자 모두 `teamId: TEAM_PLACEHOLDER_ID` 포함 |
| M-9 | `seedTestUsers`에서 teams INSERT 선행 | **PASS** | `test-fixtures.ts` — `seedTestTeam()` 정의, `seedTestUsers` 내 `await seedTestTeam(sql)` 선행 호출 |
| M-10 | `/rentals` endpoint 호출 0건 (테스트 파일 전체) | **PASS** | `grep -rn "'/rentals'" apps/backend/test/` → **No hits found**. `shared-equipment.e2e-spec.ts` 및 `site-permissions.e2e-spec.ts` 수정 완료 |
| M-11 | `DEFAULT_EQUIPMENT`에 `teamId` 포함 | **PASS** | `test-fixtures.ts:22` — `teamId: TEAM_PLACEHOLDER_ID` 포함 |
| M-12 | `close()`에서 `NC_CLOSED` 이벤트 `await emitAsync` 사용 | **PASS** | `non-conformances.service.ts:785` — `await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.NC_CLOSED, ...)` 확인 |

---

## M-10 수정 확인

이전 평가(2026-04-17 초회)에서 실패한 2건:
- `apps/backend/test/shared-equipment.e2e-spec.ts` — `.post('/rentals')` → `/checkouts`로 수정됨
- `apps/backend/test/site-permissions.e2e-spec.ts` — `.post('/rentals')` → `/checkouts`로 수정됨

재검증 결과 `grep -rn "'/rentals'" apps/backend/test/` → **No hits found**.

---

## 단위 테스트 결과

```
Test Suites: 50 passed, 50 total
Tests:       677 passed, 677 total
```

---

## SHOULD Criteria 논의

| ID | 기준 | 상태 |
|----|------|------|
| S-1 | repair-history auto-correct 플로우에서 equipment 캐시 invalidation 문서화 | 미확인 — `equipment.service.ts`가 수정된 파일 목록에 포함되어 있으나, 해당 메서드의 캐시 invalidation 주석 여부는 별도 검토 필요 |
| S-2 | E2E fixture 전반의 FK 의존성 문서 (test-fixtures.ts에 comment) | 부분 충족 — `test-fixtures.ts`와 `test-auth.ts`에 `⚠️ teamId 필수` 주석 추가됨 |

---

## 변경된 파일 (git diff --name-only HEAD 기준)

- `apps/backend/src/common/cache/cache-event-listener.ts`
- `apps/backend/src/common/cache/cache-invalidation.helper.ts`
- `apps/backend/src/modules/data-migration/services/data-migration.service.ts`
- `apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts`
- `apps/backend/src/modules/equipment/equipment.service.ts`
- `apps/backend/src/modules/non-conformances/non-conformances.service.ts`
- `apps/backend/test/audit-logs.e2e-spec.ts`
- `apps/backend/test/calibration-plans.e2e-spec.ts`
- `apps/backend/test/equipment-approval.e2e-spec.ts`
- `apps/backend/test/equipment.e2e-spec.ts`
- `apps/backend/test/helpers/test-auth.ts`
- `apps/backend/test/helpers/test-cleanup.ts`
- `apps/backend/test/helpers/test-fixtures.ts`
- `apps/backend/test/jest-e2e.json`
- `apps/backend/test/manager-role-constraint.e2e-spec.ts`
- `apps/backend/test/non-conformances.e2e-spec.ts`
- `apps/backend/test/shared-equipment.e2e-spec.ts`
- `apps/backend/test/site-permissions.e2e-spec.ts`
- `apps/backend/test/users.e2e-spec.ts`

---

## 요약

12/12 MUST 기준 전체 통과. 이전 평가 대비 M-10 수정 확인: `shared-equipment.e2e-spec.ts`와 `site-permissions.e2e-spec.ts`의 `/rentals` 호출이 모두 제거되어 0 hit. 전체 E2E 22 suites (286 passed, 1 skipped), 단위 테스트 50 suites (677 passed) 회귀 없음.
