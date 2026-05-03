# Evaluation Report: Quality Audit SSOT

## 반복 #1 (2026-05-03T09:57:00+09:00)

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| `quality-audit-routes.json` 유효 JSON | PASS | `node -e "JSON.parse(...)"` 통과 |
| Lighthouse URL SSOT | PASS | `.lighthouserc.js`가 `docs/operations/quality-audit-routes.json` publicRoutes에서 URL 생성. require 결과 `http://localhost:3000/login` |
| public-only a11y config | PASS | `playwright.a11y.config.ts` `testMatch: 'login.a11y.spec.ts'`; list 결과 1 file / 2 tests |
| 공개 a11y spec route loader 사용 | PASS | `login.a11y.spec.ts`가 `getPublicA11yRoutes()` 사용 |
| performance budgets route SSOT 문서화 | PASS | `docs/operations/performance-budgets.md` Monitored Routes가 JSON SSOT 지목 |
| `pnpm --filter frontend run lint` | PASS | exit 0 |
| `pnpm --filter frontend run type-check` | PASS | exit 0 |
| Playwright managed server opt-in | PASS | `playwright.config.ts`는 기본 외부 서버 사용을 유지하고 `PLAYWRIGHT_MANAGED_SERVER=1`일 때만 frontend webServer를 사용 |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| public a11y Playwright spec 로컬 실행 | PASS | `PLAYWRIGHT_BASE_URL=http://localhost:3100 pnpm --filter frontend exec playwright test --config playwright.a11y.config.ts --reporter=list` → 2 passed |
| `.lighthouserc.js` require 시 route 1개 이상 | PASS | `http://localhost:3000/login` 생성 |
| 인증 라우트 Lighthouse 자동 로그인 제외 | PASS | 현재 scope에서 로그인 리다이렉트 감사 방지를 위해 제외. 별도 tech-debt 불필요 |

## 전체 판정: PASS

## 비고
- public a11y 실제 실행 전 axe가 `LoginPageContent.tsx`의 `div[aria-label]` 위반을 발견했다. `role="status"` + `aria-live="polite"`로 상태 영역을 의미화했고 재실행 PASS.
- 로컬 dev server는 sandbox 포트 바인딩 제한으로 escalated 실행이 필요했다.
- `pnpm --filter frontend exec playwright test --config playwright.a11y.config.ts --list` → 1 file / 2 tests.
