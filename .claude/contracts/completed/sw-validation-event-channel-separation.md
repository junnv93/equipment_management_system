# Contract: sw-validation-event-channel-separation

**시작일**: 2026-05-12
**Mode**: Mode 1 (Lightweight)
**범위**: software-design-review-p0-p1-p2 후속 시니어 자기검토 #3 갭 A2 + A3 통합 closure

## 배경

`software-validations.service.ts`가 status 전이(submit / approve / qualityApprove / reject) 시 `NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_*` + `CACHE_EVENTS.SW_VALIDATION_*` 양쪽으로 emit. 그런데 `cache-event.registry.ts`가 **양 채널 모두에 동일한 캐시 무효화 규칙**(`invalidateAllDashboard` + `SOFTWARE_VALIDATIONS:*` + `TEST_SOFTWARE:*` 패턴)을 등록 → 매 status 전이마다 동일 무효화가 **중복 실행**.

**계측 결과 (cache-event.registry.ts:321-386 정독)**:
- `CACHE_EVENTS.SW_VALIDATION_SUBMITTED/APPROVED/QUALITY_APPROVED/REJECTED` 4개 entry
- `NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_SUBMITTED/APPROVED/QUALITY_APPROVED/REJECTED` 4개 entry (= 위와 동일 action+pattern)

**SSOT 기준선**: `cache-event.registry.ts:395-397` calibration 도메인 주석 — "NOTIFICATION_EVENTS.CALIBRATION_*는 알림 발송 전용으로 유지. 캐시 무효화는 이 채널(CACHE_EVENTS)에서 독립 처리." → 채널 책임 분리가 이미 확립된 아키텍처 원칙. software-validations만 회귀.

또한 `software-validations.service.spec.ts` findOne 테스트가 LEFT JOIN(`submitterName`/`technicalApproverName`/`qualityApproverName`)으로 풍부화된 응답 필드를 검증하지 않음 → 풍부화 회귀가 spec에서 silent miss.

A6 (sw-validation-stepper-storybook) — Storybook 미설치(`apps/frontend/.storybook` 부재, `storybook` package.json 미포함) → **WON'T-DO**. tech-debt-tracker에 Storybook 도입 sprint 전제 조건 명시 유지.

## 영향 범위

| 파일 | 변경 | 사유 |
|------|------|------|
| `apps/backend/src/common/cache/cache-event.registry.ts` | NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_* 4 entry 제거 + 주석 갱신 | 채널 책임 분리 SSOT 정합 (calibration 패턴) |
| `apps/backend/src/common/cache/cache-event-listener.ts` | `onModuleInit()` 부팅타임 dual-channel duplication invariant 추가 | 회귀 차단 — 동일 도메인이 CACHE_EVENTS/NOTIFICATION_EVENTS 양쪽으로 동일 action+pattern 등록 시 fail-fast |
| `apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts` | (a) NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_* registry 미등록 회귀 spec + (b) dual-channel invariant 위반 시 throw spec | 영구 회귀 차단 |
| `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` | `findOne` 테스트에 actor name LEFT JOIN 필드 assertion 추가 + MOCK_VALIDATION_WITH_ACTORS 정의 | A3 closure |
| `.claude/skills/verify-cache-events/SKILL.md` | dual-channel duplication 차단 Step 추가 | verify-* SSOT 갱신 (회귀 차단 표면 확장) |
| `.claude/exec-plans/tech-debt-tracker.md` | A2/A3 [x] 처리 + A6 WON'T-DO 사유 명시 | 추적기 closure |

**다른 세션 도메인 침범 금지** — 다음 파일은 절대 수정 금지:
- `.claude/handoff/` (다른 세션 핸드오프)
- `apps/frontend/hooks/use-non-conformance-mutations.ts` (untracked, 다른 세션 작업)
- `packages/schemas/src/audit-log.ts` (M, sprint4 잔여)
- `packages/shared-constants/src/entity-routes.ts` (M, sprint4 잔여)

## MUST 기준

### M-1: NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_* cache registry 제거

```bash
# 결과: 0건이어야 함
grep -nE "\[NOTIFICATION_EVENTS\.SOFTWARE_VALIDATION_" apps/backend/src/common/cache/cache-event.registry.ts
```

### M-2: CACHE_EVENTS.SW_VALIDATION_* 유지

```bash
# 결과: 4건 (SUBMITTED/APPROVED/QUALITY_APPROVED/REJECTED)
grep -cnE "\[CACHE_EVENTS\.SW_VALIDATION_" apps/backend/src/common/cache/cache-event.registry.ts
# >= 4
```

### M-3: dual-channel duplication invariant 추가

`cache-event-listener.ts` `onModuleInit()` (또는 별도 validator 메서드)이 다음 두 조건을 부팅타임에 검증해야 함:

(a) CACHE_EVENTS 키와 NOTIFICATION_EVENTS 키가 동일한 도메인(SOFTWARE_VALIDATION_*, CALIBRATION_* 등)에서 양쪽으로 등록되어 있고
(b) 양쪽 rule의 `actions` JSON + `patterns` JSON이 동치인 경우

→ NestJS bootstrap에서 `throw new Error(...)`로 fail-fast.

```bash
# 결과: 구현 호출 확인
grep -nE "validateDualChannelExclusivity|dual.?channel|channelExclusivity" apps/backend/src/common/cache/cache-event-listener.ts
# >= 1
```

### M-4: software-validations.service.spec.ts findOne actor assertion

```bash
# 결과: 3건 모두 검증
grep -cnE "submitterName|technicalApproverName|qualityApproverName" apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts
# >= 3
```

### M-5: 회귀 차단 spec 추가 — cache-event-listener.spec.ts

```bash
# (a) NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_*에 invalidation 미등록 확인
grep -nE "SOFTWARE_VALIDATION.*not.*registered|describe\('dual-channel" apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts
# >= 1

# (b) dual-channel invariant 위반 케이스 spec
grep -nE "validateDualChannelExclusivity|dual.?channel" apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts
# >= 1
```

### M-6: tsc / lint / test 전부 PASS

```bash
pnpm --filter backend run tsc --noEmit  # EXIT 0
pnpm --filter backend run lint           # EXIT 0
pnpm --filter backend run test -- --testPathPattern='(cache-event|software-validations)' # PASS
```

### M-7: verify-cache-events SKILL Step 갱신 (dual-channel 회귀 차단 명세)

`.claude/skills/verify-cache-events/SKILL.md`에 `Step N: Dual-Channel Duplication 차단` 추가. grep invariant 명시.

```bash
grep -nE "dual.?channel|중복.?등록|양쪽 채널" .claude/skills/verify-cache-events/SKILL.md
# >= 1
```

### M-8: tech-debt-tracker A2/A3 closure + A6 WON'T-DO 사유

```bash
grep -E "A2.*sw-validation-cache-event-redundancy|A3.*sw-validations-spec-actor-assertions" .claude/exec-plans/tech-debt-tracker.md | grep -E "^\s*-\s*\[x\]"
# A2 + A3 모두 [x]

grep -E "A6.*sw-validation-stepper-storybook" .claude/exec-plans/tech-debt-tracker.md | grep -iE "won'?t.do|차단|보류|Storybook 미설치"
# >= 1
```

### M-9: 다른 세션 도메인 무수정

```bash
git diff --name-only HEAD -- \
  '.claude/handoff/' \
  'apps/frontend/hooks/use-non-conformance-mutations.ts' \
  'packages/schemas/src/audit-log.ts' \
  'packages/shared-constants/src/entity-routes.ts'
# 빈 결과 (변경 0건)
```

## SHOULD 기준

### S-1: calibration / inspection 등 다른 도메인도 dual-channel 위반이 있는지 전수 검사 — 발견 시 별도 sprint 분리

부팅타임 invariant 추가가 회귀 차단을 자동화하므로 본 sprint에서는 SOFTWARE_VALIDATION만 fix. invariant 자체가 다른 위반을 부팅 시 fail-fast로 노출시킴.

### S-2: invalidateCache 메서드와 CACHE_EVENTS registry pattern 간 의도 일치 주석 보강

`software-validations.service.ts:56-66` 주석은 이미 책임 경계를 명시하지만, "왜 NOTIFICATION_EVENTS는 캐시를 다루지 않는지" 한 줄 추가하면 신규 개발자에게 더 친절.

## 검증 명령

```bash
# 1. 정적 검증
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run lint

# 2. 단위 테스트
pnpm --filter backend run test -- --testPathPattern='cache-event-listener'
pnpm --filter backend run test -- --testPathPattern='software-validations.service'

# 3. M 기준 grep 일괄
bash -c '
echo "M-1 (should be empty):"
grep -nE "\[NOTIFICATION_EVENTS\.SOFTWARE_VALIDATION_" apps/backend/src/common/cache/cache-event.registry.ts || echo "  PASS (0건)"
echo ""
echo "M-2 (should be >= 4):"
grep -cE "\[CACHE_EVENTS\.SW_VALIDATION_" apps/backend/src/common/cache/cache-event.registry.ts
echo ""
echo "M-3 invariant:"
grep -nE "validateDualChannelExclusivity|dual.?channel" apps/backend/src/common/cache/cache-event-listener.ts
echo ""
echo "M-4 spec actor (should be >= 3):"
grep -cE "submitterName|technicalApproverName|qualityApproverName" apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts
echo ""
echo "M-9 다른 세션 무수정 (should be empty):"
git diff --name-only HEAD -- ".claude/handoff/" "apps/frontend/hooks/use-non-conformance-mutations.ts" "packages/schemas/src/audit-log.ts" "packages/shared-constants/src/entity-routes.ts" || echo "  PASS"
'
```

## 비고 — A6 WON'T-DO

- Storybook은 본 프로젝트에 미설치 (`apps/frontend/.storybook` 부재, `apps/frontend/package.json` 의존성 부재).
- Storybook 도입은 단독 sprint 필요 (의존성 추가 + config + decorator + theme provider wiring + CI 등).
- tech-debt-tracker.md에 "A6: Storybook 도입 sprint 전제 (의존성 미설치) → WON'T-DO this sprint" 사유 기록.
