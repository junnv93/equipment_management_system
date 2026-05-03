# Evaluation Report: Quality Audit Auth Routes

## 반복 #1 (2026-05-03T10:18:00+09:00)

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter frontend exec tsc --noEmit` 에러 0 | PASS | 명령 exit 0. 출력 없음. |
| `.lighthouserc.js`는 `docs/operations/quality-audit-routes.json`의 `publicRoutes` 중 `lighthouse=true`만 수집한다 | PASS | `.lighthouserc.js:12`, `.lighthouserc.js:25-27`에서 registry `publicRoutes.filter(route => route.lighthouse)`로 URL 생성. lightweight require check 결과 `["http://localhost:3000/login"]`. |
| `.lighthouserc.js`는 인증 라우트에 `lighthouse=true`가 설정되면 fail-fast 한다 | PASS | `.lighthouserc.js:14-23`에서 `authenticatedRoutes.filter(route => route.lighthouse)`가 있으면 throw. in-memory mocked registry check 결과 `Authenticated Lighthouse routes require an explicit login flow first: dashboard`로 exit 0. |
| public a11y Playwright 설정은 `/login` 공개 라우트만 자동 대상으로 삼는다 | PASS | `playwright.a11y.config.ts:16-17`는 public a11y spec만 매칭하고, `login.a11y.spec.ts:15`, `login.a11y.spec.ts:22-39`가 registry public a11y routes로 데스크톱/모바일 테스트 생성. `--list` 결과 Login 데스크톱/모바일 2개만 나열. |
| `authenticatedRoutes`의 `/`, `/equipment`, `/software`, `/software-validations`는 registry에 남아 있지만 `lighthouse=false`, `a11y=false`이다 | PASS | `quality-audit-routes.json:13-45`에 네 인증 라우트가 모두 존재하고 각 항목의 `lighthouse`/`a11y`가 false. |
| Lighthouse 자동 로그인 플로우나 인증 storageState 기반 audit 자동 실행을 새로 구현하지 않는다 | PASS | 대상 파일 범위에서 Lighthouse 로그인 플로우, Lighthouse storageState, 인증 audit 자동 실행 구현 없음. `.lighthouserc.js`는 public route만 수집하고 인증 Lighthouse opt-in을 fail-fast 처리. |
| route 문자열은 Lighthouse/a11y config에 중복 하드코딩하지 않고 `quality-audit-routes.json`을 SSOT로 사용한다 | PASS | Lighthouse route path는 registry에서만 읽음. a11y spec도 `getPublicA11yRoutes()`를 사용하고 route path를 하드코딩하지 않음. `playwright.a11y.config.ts`의 `login.a11y.spec.ts`는 파일 매칭 문자열이지 route path가 아니며, 자동 대상 route는 registry에서 결정됨. |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| `pnpm --filter frontend exec playwright test --config playwright.a11y.config.ts --list`가 `/login` 데스크톱/모바일만 나열한다 | PASS | 출력: `Login — 데스크탑`, `Login — 모바일 (375px)`, Total 2 tests in 1 file. |
| 운영 문서는 인증 라우트가 registry-only 상태임을 명확히 설명한다 | PASS | `performance-budgets.md:40-50`가 registry SSOT와 `authenticatedRoutes` registry-only 상태, storageState/seeded backend 필요 조건을 명시. |

## 검증 명령
- `pnpm --filter frontend exec tsc --noEmit` → PASS, exit 0
- `pnpm --filter frontend exec playwright test --config playwright.a11y.config.ts --list` → PASS, Login 데스크톱/모바일 2 tests
- `node -e "const cfg=require('./.lighthouserc.js'); ..."` → PASS, `["http://localhost:3000/login"]`
- `.lighthouserc.js` mocked authenticated `lighthouse=true` fail-fast check → PASS

## 전체 판정: PASS

## 비고
- 작업 전 대상 파일들에는 기존 수정/추가 상태가 있었다. 본 평가는 코드를 수정하지 않았고, 새로 작성한 파일은 이 평가 보고서뿐이다.
