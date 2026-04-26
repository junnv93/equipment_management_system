# Evaluation: nc-r1b-hygiene
Date: 2026-04-26
Evaluator: QA Agent (skeptical)
Verdict: **CONDITIONAL PASS** — M7 semantic concern noted, but all grep criteria technically satisfied

---

## Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| M1 | sanitizeCsvCell 헬퍼 존재 | PASS | `apps/frontend/lib/utils/csv-utils.ts:7` |
| M2 | `""` escape 포함 | PASS | `str.replace(/"/g, '""')` on line 8 |
| M3 | `=+-@` 프리픽스 처리 | PASS | `/^[=+\-@\t\r\n]/` regex on line 9 |
| M4 | NonConformancesContent에서 sanitizeCsvCell 사용 | PASS | line 63 import + line 176 usage |
| M5 | 단위 테스트 존재 | PASS | `lib/utils/__tests__/csv-utils.test.ts` — 10개 케이스 전체 통과 |
| M6 | useMemo(chip) deps에서 `t` 제거 | PASS | deps = `[nc, canCloseNC]` — `t` 없음 |
| M7 | 409 분기 존재 | PASS* | 코드 주석에만 존재 (아래 상세 참조) |
| M8 | en.json versionConflict 키 | PASS | `messages/en/non-conformances.json:43` |
| M9 | ko.json versionConflict 키 | PASS | `messages/ko/non-conformances.json:43` |
| M10 | getNCMessageKey 유틸 존재 | PASS | `apps/frontend/lib/i18n/get-nc-message-key.ts` |
| M11 | NC 컴포넌트 내 직접 cast 0개 | PASS | grep 결과 0건 |
| M12 | tsc 에러 0 | PASS | `grep -c "error"` → 0 |
| M13 | frontend unit test 통과 | PASS | 13 suites / 192 tests all passed |

---

## Issues Found

### ISSUE-1 (WARNING, Non-Blocking): M7 — VERSION_CONFLICT 처리가 주석에만 존재

**파일**: `apps/frontend/components/non-conformances/NCDetailClient.tsx:157`

```
// VERSION_CONFLICT(409)는 useCasGuardedMutation 내부에서 isConflictError로 처리됨.
// onError는 비-충돌 에러만 수신하므로 중복 처리 불필요.
```

M7의 grep 조건 (`isConflictError|VERSION_CONFLICT|409` ≥1)은 이 주석으로 인해 **기술적으로 통과**한다.

실제 409 처리는 `apps/frontend/hooks/use-cas-guarded-mutation.ts:67`의 `isConflictError` 분기에서 이루어지며, `EquipmentErrorCode.VERSION_CONFLICT` + `errors` 네임스페이스 번역을 사용한다.

**계약 도메인 규칙 준수 여부**: 계약이 명시한 대로 "useCasGuardedMutation이 자체적으로 409를 standard toast로 처리하는지 확인 후, 그렇지 않으면 onError 콜백에서 isConflictError 판정"을 올바르게 이행했다. `useCasGuardedMutation`이 내부 처리하므로 NCDetailClient의 추가 분기는 불필요하다.

**결론**: 설계 의도는 올바르나, M7의 의도(NCDetailClient에 409 인지가 있는지)는 코드가 아닌 주석으로만 표현된다. 심각한 결함은 아니다.

---

### ISSUE-2 (WARNING, Non-Blocking): versionConflict i18n 키가 실제 코드에서 미사용

**파일**: `apps/frontend/messages/en/non-conformances.json:43`, `messages/ko/non-conformances.json:43`

`toasts.versionConflict` 키가 양쪽 파일에 존재하지만(M8/M9 통과), 실제로 이 키를 참조하는 코드가 없다.

- `useCasGuardedMutation`은 `errors` 네임스페이스의 `EquipmentErrorCode.VERSION_CONFLICT` 번역을 사용함
- `NCDetailClient.tsx` 및 `NonConformancesContent.tsx` 어디에도 `toasts.versionConflict` 참조 없음

**결과**: M8/M9는 키 존재 여부만 확인하므로 PASS. 그러나 키는 사실상 Dead Code다. 향후 혼란의 원인이 될 수 있다.

---

### ISSUE-3 (INFO): NonConformancesContent의 동적 t() 호출에 getNCMessageKey 미사용

**파일**: `apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx`

```typescript
t('ncStatus.' + nc.status)  // line 167
t('ncType.' + nc.ncType)    // line 168
t('kpi.' + variant)         // line 219, 225
```

이러한 동적 키 호출들이 `getNCMessageKey()` 없이 사용된다. 명시적 `as Parameters` 캐스트가 없어 M11은 통과하고, tsc도 통과(M12)한다. next-intl이 이를 타입 안전하게 처리한다면 문제 없다. 계약 범위("20곳 이상 분산된 cast 패턴 제거")가 이 파일에 applicable한지는 실제 캐스트 패턴이 없으므로 해당 없음.

---

## Positive Findings

- `csv-utils.ts` 구현이 RFC 4180을 정확히 준수: `""` 이스케이프 + `=+-@\t\r\n` 프리픽스 방어 + `"..."` 래핑
- 테스트가 `\n`, `\r\n` 케이스를 포함 — S1 충족
- `getNCMessageKey`가 `lib/i18n/` 전용 디렉토리에 배치 — S2 충족
- `useMemo` deps에서 `t` 제거가 정확히 구현됨: `[nc, canCloseNC]`
- M12 (tsc 0 error), M13 (192/192 테스트 통과) 확인됨
- `getNCMessageKey`가 GuidanceCallout.tsx (7회) + NCDetailClient.tsx (3회)에서 실제 사용됨

---

## Final Verdict

**CONDITIONAL PASS**

MUST criteria M1-M13 모두 기술적으로 통과. 주요 우려사항:

1. M7: 실제 409 처리 코드(`isConflictError` 호출)는 NCDetailClient가 아닌 `useCasGuardedMutation` 내부에 있음. 주석만이 NCDetailClient에 존재하나, 계약 도메인 규칙상 이 설계는 올바름.

2. `versionConflict` i18n 키(M8/M9)는 존재하나 미사용 — Dead Code. 향후 정리 권고.

블로킹 FAIL 없음.
