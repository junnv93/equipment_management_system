# Evaluation: calibration-doctype-ssot
Date: 2026-04-21
Iteration: 1

## MUST Criteria
| # | Criterion | Result | Evidence |
|---|-----------|--------|---------|
| M1 | backend tsc PASS | PASS | `pnpm --filter backend exec tsc --noEmit` exit 0, 0 errors |
| M2 | frontend tsc PASS | PASS | `pnpm --filter frontend exec tsc --noEmit` exit 0, 0 errors |
| M3 | `'calibration_certificate'` 문자열 리터럴 0건 (service + controller) | PASS | grep exit 1 (no matches) in both files |
| M4 | `DocumentTypeValues.CALIBRATION_CERTIFICATE` import + 사용 확인 | PASS | service.ts 6곳 (lines 317, 464, 1125, 1330, 1708, 1852), controller.ts 1곳 (line 659) |
| M5 | AuthProviders.tsx queryKey `['auth', 'providers']` 직접 사용 0건 | PASS | grep `'auth'` literal exit 1 (no matches); `queryKeys.auth.providers()` 사용 확인 |
| M6 | `queryKeys.auth.providers` 존재 (query-config.ts) | PASS | line 660–663: `auth: { all: ['auth'], providers: () => [...queryKeys.auth.all, 'providers'] }` |
| M7 | EXPORTABLE_STATUSES 리터럴 교체 (ValidationStatusValues 사용) | PASS | lines 57–60: `ValidationStatusValues.SUBMITTED/.APPROVED/.QUALITY_APPROVED` 사용 확인 |
| M8 | `pnpm --filter backend run test` PASS (calibration.service.spec) | PASS | 7/7 tests passed, exit 0 |

## SHOULD Criteria
| # | Criterion | Result | Note |
|---|-----------|--------|------|
| S1 | calibration.service.spec.ts 테스트 픽스처도 DocumentTypeValues 사용 | PASS | line 3: import, lines 68/207/232/258 사용 확인. `'calibration_certificate'` 리터럴 0건 |
| S2 | equipment-imports.service.ts managementNumber: '' — 의도된 설계 확인 | PASS (out of scope) | 계약 명시대로 비-이슈 |

## Verdict: PASS

Issues requiring fix: 없음

모든 MUST 기준 충족. SSOT 교체 완전히 이행됨:
- calibration.service.ts + controller.ts의 `'calibration_certificate'` 리터럴 전량 `DocumentTypeValues.CALIBRATION_CERTIFICATE`로 교체
- 테스트 픽스처도 동일하게 교체 (S1 충족)
- query-config.ts에 `auth` 네임스페이스 추가, AuthProviders.tsx가 이를 사용
- software-validation-export-data.service.ts의 `EXPORTABLE_STATUSES`가 `ValidationStatusValues` SSOT 경유로 교체
- `DocumentTypeValues`는 `packages/schemas/src/document.ts` line 27에서 export 확인
