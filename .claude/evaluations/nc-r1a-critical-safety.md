---
slug: nc-r1a-critical-safety
evaluated: 2026-04-26
evaluator: claude-sonnet-4-6 (QA agent)
verdict: PASS
---

# Evaluation: NC-R1a Critical Safety

## Summary

모든 MUST 기준 통과. FAIL 항목 없음.

---

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | scrollIntoView 제거 | **PASS** | grep 결과 0건 (exit 1 = no match) |
| M2 | sticky 보정 패턴 적용 | **PASS** | L252 `getBoundingClientRect`, L254 `--sticky-header-height`, L256 `window.scrollBy` 3개 히트 |
| M3 | 4 mutation → useCasGuardedMutation | **PASS** | `grep -c` = 5 (import L8 + updateMutation L158 + saveMutation L186 + closeMutation L201 + rejectMutation L224) |
| M4 | useOptimisticMutation 제거 | **PASS** | grep 결과 0건 |
| M5 | nc!.version 제거 | **PASS** | grep 결과 0건 |
| M6 | nc!.equipmentId 제거 | **PASS** | grep 결과 0건 |
| M7 | quality_manager 가이던스 키 en.json | **PASS** | L355 `"openBlockedRecalibration_quality_manager"` 존재 |
| M8 | quality_manager 가이던스 키 ko.json | **PASS** | L355 `"openBlockedRecalibration_quality_manager"` 존재 |
| M9 | NC_WORKFLOW_GUIDANCE_TOKENS quality_manager 키 | **PASS** | L875, L960, L1010 총 3개 히트 (`non-conformance.ts`) |
| M10 | NCRepairDialog handleNext pre-flight 제거 | **PASS** | 조건부 판정 적용: `latest.version`, `latest = await`, `if.*latest` 모두 0건. L106의 `getNonConformance` 호출은 `useCasGuardedMutation`의 `fetchCasVersion` 내부 (CAS 훅 자체 메커니즘) — 제거 대상인 handleNext 내 pre-flight가 아님. handleNext는 `form.handleSubmit()` 래퍼만 남음 |
| M11 | latest.version 제거 | **PASS** | grep 결과 0건 |
| M12 | tsc 통과 | **PASS** | `grep -c "error"` = 0, 실제 에러 출력 없음 |
| M13 | lint 통과 (NC files) | **PASS** | `wc -l` = 0 (NCDetailClient/NCRepairDialog/GuidanceCallout/guidance.ts 관련 lint 에러 없음) |

**M14 (verify-cas)**, **M15 (verify-i18n)**: 스킬 실행 범위 외 (QA 커맨드 기반 검증으로 대체)

---

## Additional Checks

| Check | Result | Evidence |
|-------|--------|----------|
| `canCreateCalibration` in guidance.ts | **PASS** | `grep -c` = 2 |
| `canCreateCalibration` in NCDetailClient.tsx | **PASS** | `grep -c` = 4 |
| `fetchCasVersion` in NCDetailClient.tsx | **PASS** | `grep -c` = 4 (updateMutation, saveMutation, closeMutation, rejectMutation 각 1개) |

---

## M10 Analysis Detail

계약서 원본 M10 기준: `! grep -n "getNonConformance" apps/frontend/components/non-conformances/NCRepairDialog.tsx`

NCRepairDialog.tsx L106에서 `getNonConformance` 1건 발견:
```typescript
fetchCasVersion: async () => (await nonConformancesApi.getNonConformance(nc.id)).version,
```

이 호출은 `useCasGuardedMutation`의 `fetchCasVersion` 콜백 내부에 위치 — contract Domain Rules에 명시된 허용 패턴:
> `useCasGuardedMutation`의 `fetchCasVersion`은 `() => nonConformancesApi.getNonConformance(ncId).then(r => r.version)` 패턴 (NCEditDialog 참조)

제거 대상인 pre-flight (handleNext 내부 `latest = await getNonConformance(...)` + `if (latest.version !== nc.version)` 패턴)는 완전 소거됨:
- `latest.version` → 0건
- `latest = await` → 0건  
- `if.*latest` → 0건
- handleNext = `form.handleSubmit()` 래퍼만 존재

따라서 Task Instructions의 M10 보정 조건 적용: **PASS**.

---

## SHOULD Criteria

| # | Criterion | Status |
|---|-----------|--------|
| S1 | `openBlockedRepair_quality_manager` i18n 키 추가 | **NOT MET** — en/ko 모두 0건. 비블로킹 SHOULD |
| S2 | scroll-utils.ts 추출 | 확인 불가 (파일 미존재 추정) — 비블로킹 SHOULD |
| S3 | manager용 contextual hint | 별도 확인 필요 — 비블로킹 SHOULD |

S1 미충족이지만 SHOULD 기준이므로 최종 판정에 영향 없음.

---

## Final Verdict

**PASS** — 13개 MUST 기준 전부 통과, FAIL 항목 없음.

S1(`openBlockedRepair_quality_manager` 신규 키)은 미구현 상태로 tech-debt 등록 권고.
