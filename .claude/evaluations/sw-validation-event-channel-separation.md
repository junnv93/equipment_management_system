# Evaluation: sw-validation-event-channel-separation

**Timestamp**: 2026-05-12T21:36 KST  
**Iteration**: 1  
**Evaluator**: QA Agent (Skeptical Mode)  
**Verdict**: **PASS**

---

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M-1 | NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_* 4 entry 제거 | **PASS** | `grep -nE "\[NOTIFICATION_EVENTS\.SOFTWARE_VALIDATION_" cache-event.registry.ts` → 빈 출력 (0건) |
| M-2 | CACHE_EVENTS.SW_VALIDATION_* 4건 유지 | **PASS** | `grep -cE "\[CACHE_EVENTS\.SW_VALIDATION_" cache-event.registry.ts` → `4` |
| M-3 | dual-channel invariant 추가 + exported + onModuleInit 호출 | **PASS** | `export function validateDualChannelExclusivity` (line 55) + `validateDualChannelExclusivity()` in onModuleInit (line 138) |
| M-4 | findOne actor assertion 3건 이상 | **PASS** | `grep -cE "submitterName\|technicalApproverName\|qualityApproverName" software-validations.service.spec.ts` → `13` |
| M-5 | 회귀 차단 spec 추가 (a) 미등록 확인 + (b) throw 확인 | **PASS** | (a) `describe('dual-channel exclusivity ...')` line 285 + `registryKeys.has(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_SUBMITTED)` assertion (b) `validateDualChannelExclusivity` imported + 4 test cases (lines 307–362) |
| M-6 | tsc EXIT 0 + lint EXIT 0 + jest PASS | **PASS** | tsc: EXIT=0. lint: EXIT=0. jest: 67 tests passed (3 suites: cache-event-listener + software-validations.service + software-validation-renderer.service) |
| M-7 | verify-cache-events SKILL Step 7 추가 | **PASS** | `Step 7: dual-channel duplication 차단 (Critical)` 신설 + severity table에 Critical 등록 (lines 270–305) |
| M-8 | tech-debt-tracker A2/A3 [x] + A6 WON'T-DO 사유 | **PASS** | A2 `[x]` 확인 + A3 `[x]` 확인. A6: `⏸ WON'T-DO (현 sprint)` + Storybook 미설치 사유 명시 |
| M-9 | 다른 세션 도메인 파일 무수정 | **PASS** | `git diff --name-only HEAD -- '.claude/handoff/' ...` → 빈 출력 |

---

## SHOULD 기준

### S-1: calibration / inspection 등 타 도메인 dual-channel 위반 전수 검사

**상태**: 아키텍처 심층 검토 완료 — 부팅타임 invariant가 자동 차단하므로 별도 수동 검사 불필요.

**심층 분석 결과** (시니어 아키텍처 관점):
- `NOTIFICATION_EVENTS.CALIBRATION_CREATED` (`calibration.created`) 과 `CACHE_EVENTS.CALIBRATION_CREATED` (`cache.calibration.created`) 양쪽이 registry에 등록되어 있으나, **signatures가 다름**: CACHE_EVENTS 측에만 `CALIBRATION}summary:*` 패턴 추가 → invariant가 동치 판정 안 함 → violation 아님.
- `현재 registry 전체에 dual-channel 위반이 없다` 부팅타임 invariant baseline 테스트 **PASS** (spec line 307-309).
- `TEST_SOFTWARE_REVALIDATION_REQUIRED` false positive 검증: CACHE_EVENTS에 `cache.testSoftware.*` 형태 값이 없으므로 mirror 탐지 대상 아님 → 정당하게 NOTIFICATION 채널로 registry 등록 유지.

**판정**: invariant가 올바르게 동작하며 다른 도메인에서 현재 위반 0건 자동 검증됨. SHOULD 의도 충족.

### S-2: software-validations.service.ts 주석 보강

계약 S-2는 "한 줄 추가하면 더 친절"이라는 soft 권고. cache-event.registry.ts의 Software Validation 섹션 주석(lines 321-333)이 이미 채널 분리 이유와 회귀 차단 메커니즘을 상세 설명하고 있어 실질적으로 충족됨. service.ts 본체 주석 보강은 SHOULD에 그침.

---

## 아키텍처 심층 검토

### dual-channel invariant 정확성 (false positive / false negative 분석)

**false positive 회피 검증**:
- `NOTIFICATION_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED = 'testSoftware.revalidationRequired'` 는 `cache.` prefix로 시작하는 CACHE_EVENTS 짝이 없으므로 mirror 탐지 대상에서 자동 제외됨. 동일 패턴(SOFTWARE_VALIDATIONS/TEST_SOFTWARE prefix 무효화)을 공유하더라도 이름 기반 mirror가 아니므로 invariant가 차단하지 않음 → **올바른 동작**.
- Calibration 도메인: 양쪽 등록되어 있으나 signature 불일치(CACHE 측 `summary:*` 추가) → invariant 미검출 → 정당한 dual-channel 사용(서로 다른 패턴 범위) → **false positive 없음**.

**false negative 회피 검증**:
- `actions` 배열 순서 정규화(sorted JSON) 테스트 케이스 존재 (spec line 329-345) → 배열 순서 차이로 인한 miss 차단 확인됨.

**채널 책임 분리 완성도**:
- 이제 SW Validation status 전이당 invalidation flow:
  1. `service.invalidateCache()` → 도메인 로컬 캐시 동기 무효화 (list/detail/pending)
  2. `emitAsync(CACHE_EVENTS.SW_VALIDATION_*)` → cross-domain (dashboard + SW_VALIDATIONS:* + TEST_SOFTWARE:*) 비동기 무효화
  - `emitAsync(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_*)` → 알림/SSE/side-effect 전용 (캐시 무효화 0)
- 이전 상태 대비 중복 `invalidateAllDashboard` 1회 제거됨.

---

## 최종 판정

**PASS** — 모든 MUST 기준(M-1 ~ M-9) 충족. SHOULD S-1 invariant 자동 커버, S-2 주석 사실상 충족.

수정 사항 없음.
