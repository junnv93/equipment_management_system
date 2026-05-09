# Contract: zod-hub-r4-final

**Slug**: `zod-hub-r4-final`
**날짜**: 2026-05-09
**Mode**: Mode 1 (4~6파일, 기존 패턴 확장)
**선행 sprint**: `zod-hub-should-s4-followups` (rounds #2/#3 partial closure)

## 목표

3개 후속 tech-debt 완전 closure:
1. **[MEDIUM]** `zod-fail-toast.spec.ts` 실제 Playwright 4 cases 실행
2. **[LOW]** `nc-rejection-flow.spec.ts` → `resetNcsToCorrected()` 마이그레이션 (`preserveCorrectionFields` 옵션 포함)
3. **[LOW]** alert threshold baseline 운영 문서화 (prometheus-alert-rules.md + ADR-0008)

---

## MUST Criteria

| ID | 기준 | 검증 방법 |
|----|------|-----------|
| M-1 | `tsc --noEmit` frontend PASS | `pnpm --filter frontend tsc --noEmit` |
| M-2 | `nc-seed-helpers.ts`에 `preserveCorrectionFields?: boolean` 옵션 추가 | `grep -n "preserveCorrectionFields" apps/frontend/tests/e2e/shared/helpers/nc-seed-helpers.ts` |
| M-3 | `preserveCorrectionFields: true` 시 SQL에 corrected_by/correction_date/correction_content 미포함 | `grep -A30 "preserveCorrectionFields" apps/frontend/tests/e2e/shared/helpers/nc-seed-helpers.ts` |
| M-4 | `nc-rejection-flow.spec.ts`에서 `resetNcForRejectionTest()` 인라인 함수 제거 + `resetNcsToCorrected` import | `grep -c "resetNcForRejectionTest" apps/frontend/tests/e2e/features/non-conformances/nc-rejection-flow.spec.ts` — 결과 0 |
| M-5 | nc-rejection-flow.spec.ts 첫 describe에 beforeAll 존재 (NC_006 reset) | `grep -n "beforeAll\|resetNcsToCorrected" apps/frontend/tests/e2e/features/non-conformances/nc-rejection-flow.spec.ts` |
| M-6 | nc-rejection-flow.spec.ts 두 번째 describe에 beforeAll 존재 (NC_007 reset, preserveCorrectionFields:true) | 위 동일 grep |
| M-7 | `prometheus-alert-rules.md`에 `§Baseline Measurement` 섹션 추가 — 임계값 도출 근거 + 측정 절차 명시 | `grep -n "Baseline Measurement" docs/operations/prometheus-alert-rules.md` |
| M-8 | ADR-0008에 `§Threshold Rationale` 또는 관련 섹션 — 0.1 req/s / 1 req/s 근거 명시 | `grep -n "Threshold Rationale\|0.1 req\|baseline" docs/adr/0008-backend-zod-error-i18n.md` |
| M-9 | zod-fail-toast Playwright 4 cases 실행 PASS (ko too_small + invalid_format + 다중 issue + en too_small) | `pnpm exec playwright test zod-fail-toast --project=chromium --workers=1` |
| M-10 | `Pool` 직접 import nc-rejection-flow.spec.ts에서 제거 (nc-seed-helpers.ts로 이전됨) | `grep -c "from 'pg'" apps/frontend/tests/e2e/features/non-conformances/nc-rejection-flow.spec.ts` — 결과 0 |

## SHOULD Criteria

| ID | 기준 |
|----|------|
| S-1 | nc-seed-helpers.ts JSDoc 호출지 목록에 nc-rejection-flow.spec.ts 추가 |
| S-2 | prometheus-alert-rules.md baseline 섹션에 promQL query 예시 포함 |
| S-3 | ADR-0008 §4 Trigger Condition 4에 baseline 수집 명령어 링크 |

---

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `apps/frontend/tests/e2e/shared/helpers/nc-seed-helpers.ts` | 수정 (옵션 추가) |
| `apps/frontend/tests/e2e/features/non-conformances/nc-rejection-flow.spec.ts` | 수정 (마이그레이션) |
| `docs/operations/prometheus-alert-rules.md` | 수정 (섹션 추가) |
| `docs/adr/0008-backend-zod-error-i18n.md` | 수정 (threshold 근거) |

---

## 성공 기준

- M-1 ~ M-10 모두 PASS
- Playwright 4 cases green
- tech-debt-tracker.md 3건 체크 완료
