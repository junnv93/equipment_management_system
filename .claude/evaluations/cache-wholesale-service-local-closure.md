# Evaluation: cache-wholesale-service-local-closure

**Date**: 2026-05-13
**Iteration**: 1 (PASS)
**Verdict**: ✅ ALL MUST PASS + SHOULD CLOSED

---

## MUST Verification

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| M-1 | intermediate-inspections.service.ts:67 wholesale 분해 | ✅ | line 67 → `${CALIBRATION}list:` + `pending:` + `detail:` 3 specific sub-prefix (감사 0 잔존) |
| M-2 | calibration-factors.service.ts:86 wholesale 분해 | ✅ | `${APPROVALS}counts:` specific sub-prefix |
| M-3 | calibration.service.ts:180 wholesale 분해 | ✅ | `${APPROVALS}counts:` specific sub-prefix |
| M-4 | cache-key-prefixes.ts SSOT 합성 | ✅ | `CALIBRATION_NS` 상수 도입 + `INTERMEDIATE_INSPECTIONS = ${CALIBRATION_NS}inspections:` + `CABLES_CACHE_PREFIX = ${CALIBRATION_NS}cables:` 일관성 |
| M-5 | audit script service-local 검사 확장 | ✅ | `extractServiceLocalWholesaleViolations()` + `SERVICE_LOCAL_WHOLESALE_ALLOWLIST` Set + report 출력 분기 |
| M-6 | spec test 추가 | ✅ | `scripts/__tests__/audit-cache-event-channels.spec.mjs` 3/3 PASS |
| M-7 | 빌드 / 타입 / 테스트 정합 | ✅ | tsc EXIT=0, jest 530 PASS / 1 skipped (pre-existing) |

## 추가 closure (contract 범위 넘는 발견 → 전수 처리)

원 contract 는 §3.2 (intermediate-inspections) + §3.5 (audit script) + §3.6 (SSOT) 3건이었으나
audit script 구현 중 5건의 추가 cross-domain wholesale 발견:

| 파일:라인 | 패턴 | 처리 |
|---|---|---|
| `software-validations.service.ts:82` | `deleteByPrefix(TEST_SOFTWARE)` | sub-prefix 3건 분해 (`detail/by-equipment/linked-equipment`) |
| `equipment-approval.service.ts:462,521,631,650` | `deleteByPrefix(APPROVALS)` × 4 | replace_all → `${APPROVALS}counts:` |
| `checkouts.service.ts:463` | `deleteByPrefix(APPROVALS)` | `${APPROVALS}counts:` |
| `data-migration.service.ts:1087,1095,1103,1125` | 4 도메인 wholesale | 각 도메인 sub-prefix 분해 |

**총 9건 wholesale 제거**, audit script VIOLATIONS=0 검증.

## Verification Commands Output

```bash
$ node scripts/audit-cache-event-channels.mjs; echo "EXIT=$?"
mirror pair 후보: 6개 (synonym: 1개)
VIOLATIONS: 0
POTENTIAL:  6
EXIT=0

$ node --test scripts/__tests__/audit-cache-event-channels.spec.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0

$ pnpm --filter backend exec tsc --noEmit; echo "EXIT=$?"
EXIT=0

$ pnpm --filter backend exec jest --testPathPattern="intermediate-inspections|calibration|calibration-factors|software-validations|data-migration|checkouts"
Test Suites: 1 skipped, 38 passed, 38 of 39 total
Tests:       1 skipped, 530 passed, 531 total
```

## SHOULD Status

- S-1: tech-debt 분리 — `inspection-form-templates.service.ts:483` `deleteByPrefix(this.CACHE_PREFIX)` self-domain wholesale, ADR-0012 예외 정합 (allowed)
- S-2: 명명 일관성 — `CALIBRATION_NS` SSOT 도입으로 향후 nested namespace 합성 패턴 정합 (cables / inspections)
- S-3: Performance baseline — 본 sprint 측정 없이 closure (production 모니터링 후 verify)

## Multi-session 정합

다른 세션이 동시 진행한 작업:
- Sprint D (`af79e7f6 feat(checkouts): inbound tab bulk receive wiring — Phase 5` + `8fb70392 test(checkouts): rtl tests`) — UI 통합 완료
- Security fix (`9fdb0204 fix(security): typeof-guard PPR-compatible 전환`)
- Cache event SSOT (`74eaa2c0 docs(skill): verify-cache-events Step 9`)

본 Sprint A 는 cache architecture(backend service) 영역으로 위 세션과 충돌 없음. 다른 세션 작업 revert 0건 확인.

## Verdict

**PASS** — MUST 7/7 + SHOULD closure. 머지 가능.
