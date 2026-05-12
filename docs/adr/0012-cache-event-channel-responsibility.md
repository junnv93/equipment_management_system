# ADR-0012: Cache Event Channel Responsibility Separation

- **상태**: Accepted
- **일시**: 2026-05-12
- **결정자**: myeongjun kwon
- **맥락 범위**: backend (cache invalidation 아키텍처)

## Context

이벤트 기반 캐시 무효화는 두 채널로 발행된다:

| 채널                  | 위치                                                                   | 본래 목적                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `NOTIFICATION_EVENTS` | `apps/backend/src/modules/notifications/events/notification-events.ts` | 사용자 알림 발송 (DB `notifications` insert + 인앱/이메일 fan-out) + SSE 푸시 + downstream 도메인 side-effect (예: test-software 자격 부여) |
| `CACHE_EVENTS`        | `apps/backend/src/common/cache/cache-events.ts`                        | 캐시 무효화 전용 (알림 없음, 에러 허용 UX)                                                                                                  |

각 채널은 서비스에서 `eventEmitter.emitAsync(...)` 로 발행되며, `CacheEventListener`(cache-event-listener.ts)가 `CACHE_INVALIDATION_REGISTRY`(cache-event.registry.ts)에 정의된 무효화 규칙으로 양 채널 모두를 처리해 왔다.

### 회귀: software-validations dual-channel duplication (2026-05-11 발견)

`software-validations.service.ts`의 status 전이(`submit` / `approve` / `qualityApprove` / `reject`)는 NOTIFICATION + CACHE 양 채널 모두로 emit하고, 두 채널의 registry rule이 **동일한 actions + 동일한 patterns**(`invalidateAllDashboard` + `SOFTWARE_VALIDATIONS:*` + `TEST_SOFTWARE:*`)이었다. 결과:

1. status 전이 1회당 동일 `invalidateAllDashboard` 2회 + 동일 패턴 삭제 2회
2. dashboard 캐시 churn 증가 → p99 latency 영향
3. 신규 도메인 추가 시 자연스러운 추론("알림도 발송 + 캐시도 갱신해야지")으로 양 채널에 동일 규칙을 등록하는 회귀가 반복될 가능성

### `calibration` 도메인이 이미 채택한 패턴 (선재)

calibration은 NOTIFICATION*EVENTS.CALIBRATION\*\*를 알림 전용으로, CACHE*EVENTS.CALIBRATION\*\*를 캐시 무효화 전용으로 분리해 사용했다. 그러나 정책 자체는 ADR로 영구 기록되지 않았다.

### 추가 발견: service-local vs registry 책임 모호성

`software-validations.service.ts`의 `invalidateCache()`는 도메인 로컬 prefix(`list:` + `pending:` + detail key)를 동기 무효화하고, registry는 wholesale `SOFTWARE_VALIDATIONS:*` 를 비동기 무효화한다. registry pattern이 service-local 무효화를 완전히 포함하므로 redundancy가 존재한다.

비교: calibration registry는 `list:*` / `pending:*` / `summary:*` specific sub-prefix만 무효화하고 `detail:*` 는 무효화하지 않는다. 책임이 명확히 분리되어 있다.

## Decision

**우리는 다음 세 가지를 정책으로 채택한다:**

### 1. 채널 책임 분리 (Channel Exclusivity)

- **NOTIFICATION_EVENTS** 는 알림 발송 / SSE 푸시 / downstream 도메인 side-effect 전용으로 사용한다. **캐시 무효화 규칙을 NOTIFICATION_EVENTS 키로 `CACHE_INVALIDATION_REGISTRY`에 등록하는 것을 금지한다.** (예외 없음 — 라운드 #3 갭 F closure로 모든 historical 예외 제거됨.)
- **CACHE_EVENTS** 는 캐시 무효화 전용으로 사용한다. 같은 status 전이를 두 채널로 발행해야 하는 경우(예: `TEST_SOFTWARE_REVALIDATION_REQUIRED`), 양 채널에 **각각 동일 명명** (`<domain>.<verb>` ↔ `cache.<domain>.<verb>`) 키를 신설하고 서비스에서 **양 채널 동시 emit**, registry rule은 CACHE_EVENTS 키에만 작성한다.

회귀 차단 — 3-layer defense:

1. **invariant (runtime, fail-fast)**: `cache-event-listener.ts validateDualChannelExclusivity()` — 양방향(`deriveNotificationMirror` + `deriveCacheMirror`) mirror 검사 (라운드 #3 갭 D closure)
2. **proactive audit (build/PR)**: `scripts/audit-cache-event-channels.mjs` — pre-push에 `pnpm audit:cache-events`로 통합 (라운드 #3 갭 K closure)
3. **naming spec (unit)**: `cache-events-naming.spec.ts` — 명명 규약 + dead synonym/legacy + wholesale 차단 + jest-level dual-channel 검증 (라운드 #3 갭 C/O closure)

### 2. service-local vs registry 책임 경계

- **service-local `invalidateCache()`** (`*.service.ts` 내부): 트랜잭션 직후 동기 무효화. **`detail:<id>` 단독 책임**(라운드 #3 갭 A — calibration 패턴 완전 정합) + `list:` + `pending:` broader sub-prefix(registry와 idempotent 중복, 안전망). 쓰기 직후 같은 트랜잭션 endpoint가 stale read하지 않도록 보장하는 read-after-write 일관성 책임.
- **CACHE_EVENTS registry rule**: 비동기 cross-domain 무효화. 다른 도메인의 derived cache (예: `dashboard:*`, `approvals:*`)와 본 도메인의 broader sub-prefix(`list:*` + `pending:*`만 — `detail:*` 제외, service-local 단독 책임). **wholesale `<domain>:*` 패턴은 금지** — `scripts/audit-cache-event-channels.mjs` 의 `extractWholesalePatterns()` 가 빌드/PR 단계에서 violation으로 자동 fail (라운드 #3 갭 O closure).

### 3. 명명 규약 (Naming Convention)

- 신규 CACHE_EVENTS entry: `cache.<domainCamel>.<verbCamel>` (e.g. `cache.calibration.created`)
- 신규 NOTIFICATION_EVENTS entry: `<domainCamel>.<verbCamel>` (e.g. `calibration.created`)
- 이 규약을 따르면 mirror 검출이 자동 작동 (synonym 적용 후 prefix 매칭)
- LEGACY 키 (NC*ATTACHMENT*_, REPAIR*HISTORY*_): `CACHE_EVENT_LEGACY_NAMING_ALLOWLIST`에 명시. 신규 추가 시 `cache-events-naming.spec.ts`가 차단.

## Consequences

### 긍정

- 회귀 차단의 코드화 (invariant + audit + naming spec 3-layer)
- 명명 규약으로 자동 보호 — mirror 검출이 자동 적용
- 신규 도메인의 학습 비용 감소 — ADR + 주석이 정책의 발견 가능성 보장
- redundancy 최소화 — registry pattern을 specific sub-prefix로 한정

### 부정

- 명명 규약 강제로 일부 historical 키 LEGACY allowlist 유지 필요 (점진 마이그레이션)
- synonym map 유지비 — `swValidation ↔ softwareValidation` 1건

### Trigger Conditions for Reconsideration

| 트리거                        | 임계값                              |
| ----------------------------- | ----------------------------------- |
| dual-channel 회귀 발생 빈도   | 3회 이상/분기 → invariant 보강      |
| LEGACY 키 마이그레이션 필요성 | 신규 sub-action 추가 시 일괄 rename |
| synonym 비대칭 추가           | 2건 이상 → 도메인 이름 정합 sprint  |

## References

- 관련 ADR: ADR-0010 (Drizzle Manual SQL Policy)
- 코드 SSOT: `cache-events.ts` / `cache-event.registry.ts` / `cache-event-listener.ts` / `scripts/audit-cache-event-channels.mjs` / `cache-events-naming.spec.ts`
- 선재 sprint: `sw-validation-event-channel-separation` (commit `06fc71d4`)
- 시니어 자기검토 라운드 #2 후속: `cache-event-channel-architecture-r2` (2026-05-12, commit `11bd5e07` + `b67b98f7`)
- 시니어 자기검토 라운드 #3 후속: `cache-event-arch-r3` (2026-05-13) — 6갭 통합 closure: K(pre-push 통합) / A(detail:\* 책임 분리) / O(wholesale audit 강제) / F(예외 제거) / D(양방향 mirror) / C(jest fragility 보강)
