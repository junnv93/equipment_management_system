# Contract: calibration-doctype-ssot

## Scope

SSOT 리터럴 교체 4건:
1. calibration.service.ts — SQL 템플릿 5곳 + find 비교 1곳 (총 6)
2. calibration.controller.ts — includes 비교 1곳
3. calibration.service.spec.ts — 테스트 픽스처 3곳
4. query-config.ts + AuthProviders.tsx — auth 네임스페이스 추가
5. software-validation-export-data.service.ts — EXPORTABLE_STATUSES 상수 교체

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter backend run tsc --noEmit` PASS | 빌드 오류 0 |
| M2 | `pnpm --filter frontend run tsc --noEmit` PASS | 빌드 오류 0 |
| M3 | `'calibration_certificate'` 문자열 리터럴 0건 (service + controller) | `grep -r "calibration_certificate" apps/backend/src/modules/calibration/calibration.service.ts apps/backend/src/modules/calibration/calibration.controller.ts` |
| M4 | `DocumentTypeValues.CALIBRATION_CERTIFICATE` import + 사용 확인 | grep |
| M5 | AuthProviders.tsx queryKey `['auth', 'providers']` 직접 사용 0건 | grep |
| M6 | `queryKeys.auth.providers` 존재 (query-config.ts) | grep |
| M7 | EXPORTABLE_STATUSES 리터럴 교체 (ValidationStatusValues 사용) | grep |
| M8 | `pnpm --filter backend run test` PASS | 테스트 실패 0 |

## SHOULD Criteria

| # | Criterion | Note |
|---|-----------|------|
| S1 | calibration.service.spec.ts 테스트 픽스처도 DocumentTypeValues 사용 | 비중요하지만 일관성 |
| S2 | equipment-imports.service.ts managementNumber: '' — 의도된 설계 (반입→장비 전환 전 미정), 비-이슈로 확인 | |

## Out of Scope

- equipment-imports.service.ts managementNumber 변경 — 의도된 빈 문자열 (반입 당시 장비 미생성)
- 기타 파일의 기능 변경
