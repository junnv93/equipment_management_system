# Evaluation Report: Production env/API endpoint SSOT drift 보강

## 반복 #1 (2026-05-03T19:06:15+09:00)

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| `infra/compose/prod.override.yml`의 frontend `NEXT_PUBLIC_API_URL`은 빈 값이며 `/api`를 baseURL로 주입하지 않는다 | PASS | `infra/compose/prod.override.yml:96`에서 `NEXT_PUBLIC_API_URL=` 확인. `rg -n "NEXT_PUBLIC_API_URL=/api\|CHECKOUTS\\.COMPLETE\|CALIBRATION_PLANS\\.VERSIONS" .github infra apps packages .env.ci.example .env.example` 결과 매칭 없음(exit 1) |
| `infra/compose/prod.override.yml` frontend env에 `NEXTAUTH_SECRET`이 주입된다 | PASS | `infra/compose/prod.override.yml:97`에서 `NEXTAUTH_SECRET=${NEXTAUTH_SECRET}` 확인 |
| `infra/compose/prod.override.yml`, `infra/compose/lan.override.yml`, `.github/workflows/main.yml`, `.env.ci.example`에 `HANDOVER_TOKEN_SECRET`이 존재한다 | PASS | `rg -n "HANDOVER_TOKEN_SECRET" infra/compose/prod.override.yml infra/compose/lan.override.yml .github/workflows/main.yml .env.ci.example` 결과 4개 파일 모두 매칭 |
| `packages/shared-constants/src/api-endpoints.ts`에 실제 backend 라우트가 없는 `CHECKOUTS.COMPLETE`와 `CALIBRATION_PLANS.VERSIONS` 상수가 남아 있지 않다 | PASS | 금지 패턴 검색 결과 매칭 없음. `CHECKOUTS`에는 `COMPLETE` 제거, `CALIBRATION_PLANS`에는 `VERSIONS` 제거 확인 |
| `pnpm --filter backend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공(exit 0) |
| `pnpm --filter frontend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공(exit 0) |
| `pnpm --filter backend run test -- test-auth-forge` 통과 | PASS | `src/modules/auth/__tests__/test-auth-forge.spec.ts` 1 suite, 10 tests passed(exit 0). Jest force-exit 안내 문구는 출력됨 |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| 변경은 infra/env/API endpoint SSOT에만 국한된다 | WARN | 미등록. 현재 워크스페이스에는 계약 관련 파일 외 `apps/backend/src/modules/calibration*`, `apps/frontend/components/equipment/CalibrationFactorsClient.tsx`, `apps/frontend/lib/api/calibration-factors-api.ts`, `.claude/skills/harness/*` 등 별도 변경이 함께 존재한다. 계약 MUST와 직접 충돌하지는 않지만 변경 범위 SHOULD는 충족하지 못함 |
| 하드코딩된 secret 기본값을 추가하지 않는다 | PASS | 관련 diff는 `${...}` 주입 또는 `<random-...>` placeholder 추가이며 실제 secret 기본값 추가는 확인되지 않음. 광역 검색에서 기존 `.env.example` placeholder, 문서 예시, encrypted sops 값, 테스트용 secret 문자열은 확인됐으나 이번 계약 변경으로 추가된 하드코딩 secret 기본값은 아님 |

## 적용 verify 스킬
| 스킬 | 적용 여부 | 상세 |
|------|----------|------|
| verify-hardcoding | PASS | 계약 대상에 맞춰 금지 env/API endpoint 패턴 및 secret 기본값 추가 여부를 grep/diff로 확인 |
| verify-ssot | PASS | `packages/shared-constants/src/api-endpoints.ts`의 drift 상수 제거와 env 주입 위치를 확인 |
| review-architecture | PASS | 계약 범위 수동 검토 기준 Critical 없음. 단, 현재 워크스페이스 전체 변경 범위는 SHOULD WARN |

## 명령 결과
| 명령 | 결과 | 핵심 출력 |
|------|------|----------|
| `git status --short` | exit 0 | 계약 관련 파일 외 calibration 및 harness 문서 변경이 함께 존재 |
| `git diff --name-only` | exit 0 | `.env.ci.example`, `.github/workflows/main.yml`, `infra/compose/*.override.yml`, `packages/shared-constants/src/api-endpoints.ts` 및 별도 calibration 변경 확인 |
| `rg -n "NEXT_PUBLIC_API_URL=/api\|CHECKOUTS\\.COMPLETE\|CALIBRATION_PLANS\\.VERSIONS" .github infra apps packages .env.ci.example .env.example` | exit 1 | 매칭 없음. 요구사항상 기대 결과 |
| `rg -n "HANDOVER_TOKEN_SECRET" infra/compose/prod.override.yml infra/compose/lan.override.yml .github/workflows/main.yml .env.ci.example` | exit 0 | 네 파일 모두 매칭: prod override, lan override, GitHub Actions, `.env.ci.example` |
| `pnpm --filter backend run type-check` | exit 0 | 에러 없음 |
| `pnpm --filter frontend run type-check` | exit 0 | 에러 없음 |
| `pnpm --filter backend run test -- test-auth-forge` | exit 0 | 1 suite, 10 tests passed |

## 전체 판정: PASS (필수 전체 충족)

## 잔여 리스크
- 현재 워크스페이스에는 계약 범위 밖 calibration 관련 변경과 `.claude/skills/harness` 문서 변경이 함께 존재한다. 계약 MUST에는 영향을 주지 않지만, SHOULD "변경은 infra/env/API endpoint SSOT에만 국한"은 엄밀히 충족하지 않는다.
- `test-auth-forge`는 PASS이나 Jest가 `Force exiting Jest` 안내를 출력했다. 이번 계약의 필수 기준은 통과했지만 open handle 정리는 별도 품질 리스크로 남는다.

## 이전 반복 대비 변화 (반복 #2 이상)
| 이슈 | 이전 판정 | 현재 판정 | 동일 이슈 연속? |
|------|----------|----------|---------------|
| 해당 없음 | - | - | - |

## 수정 지시 (FAIL 시)
해당 없음.
