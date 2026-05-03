# Quality Audit SSOT 구현 계획

## 메타
- 생성: 2026-05-03T09:45:00+09:00
- 모드: Mode 2
- 예상 변경: 11개 파일

## 설계 철학
성능/접근성 감사 대상은 문서·CI·테스트에 흩어진 문자열이 아니라 하나의 레지스트리에서 관리한다. 백엔드 없이 실행 가능한 공개 감사와 인증/시드가 필요한 업무 화면 감사를 분리해 CI 실행성이 깨지지 않도록 한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| 감사 대상 SSOT | `docs/operations/quality-audit-routes.json` | Lighthouse(CJS)와 Playwright(TS)가 모두 읽을 수 있는 공용 포맷 |
| 공개 a11y CI | 공개 라우트만 실행 | `accessibility-audit.yml`은 백엔드 없이 실행되므로 인증 spec 혼입 차단 |
| 인증 a11y | 기존 E2E/nightly에서 실행 | storageState, seed, backend 의존 spec은 Playwright 기본 config의 setup 흐름을 사용 |
| Lighthouse 범위 | public lighthouse routes from SSOT | 현재 workflow는 backend/auth 쿠키 없이 실행되므로 공개 라우트만 fail-closed |

## 구현 Phase
### Phase 1: 감사 라우트 SSOT 도입
**목표:** 문서와 CI가 같은 감사 대상 정의를 참조하도록 한다.
**변경 파일:**
1. `docs/operations/quality-audit-routes.json` — 신규, public/authenticated 감사 라우트와 예산 속성 정의
2. `docs/operations/performance-budgets.md` — 수정, Monitored Routes의 원본을 JSON SSOT로 명시
**검증:** `node -e "JSON.parse(require('fs').readFileSync('docs/operations/quality-audit-routes.json','utf8'))"`

### Phase 2: Lighthouse CI를 SSOT에 연결
**목표:** `.lighthouserc.js`가 `/login` 문자열을 직접 소유하지 않게 한다.
**변경 파일:**
1. `.lighthouserc.js` — 수정, public lighthouse route 목록을 JSON에서 읽기
2. `.github/workflows/performance-audit.yml` — 수정, 문구와 path trigger 정합화
**검증:** `node -e "const c=require('./.lighthouserc.js'); console.log(c.ci.collect.url)"`

### Phase 3: 접근성 공개/인증 감사 분리
**목표:** 백엔드 없는 public a11y workflow가 인증 spec을 실행하지 않도록 하고, 공개 라우트 테스트도 SSOT를 참조하게 한다.
**변경 파일:**
1. `apps/frontend/tests/e2e/shared/utils/quality-audit-routes.ts` — 신규, Playwright용 JSON loader
2. `apps/frontend/tests/e2e/a11y/login.a11y.spec.ts` — 수정, public route matrix 기반 scan
3. `apps/frontend/playwright.a11y.config.ts` — 수정, public-only testMatch
4. `.github/workflows/accessibility-audit.yml` — 수정, 문구와 path trigger 정합화
**검증:** `pnpm --filter frontend run lint`

### Phase 4: E2E 서버 관리 opt-in
**목표:** 기존 nightly의 외부 서버 기동 방식은 유지하면서, 로컬 단일 검증에서는 Playwright가 frontend 서버를 직접 관리할 수 있게 한다.
**변경 파일:**
1. `apps/frontend/playwright.config.ts` — 수정, `PLAYWRIGHT_MANAGED_SERVER=1` opt-in webServer 추가
**검증:** `pnpm --filter frontend run type-check`

## 전체 변경 파일 요약
### 신규 생성
| 파일 | 목적 |
|------|------|
| `docs/operations/quality-audit-routes.json` | 품질 감사 대상 라우트 SSOT |
| `apps/frontend/tests/e2e/shared/utils/quality-audit-routes.ts` | Playwright에서 SSOT JSON을 타입 안전하게 읽는 loader |

### 수정
| 파일 | 변경 의도 |
|------|----------|
| `.lighthouserc.js` | Lighthouse 대상 라우트 SSOT화 |
| `.github/workflows/performance-audit.yml` | Lighthouse workflow 설명/trigger 정합화 |
| `.github/workflows/accessibility-audit.yml` | public-only a11y workflow 명확화 |
| `apps/frontend/playwright.a11y.config.ts` | 인증 spec 혼입 방지 |
| `apps/frontend/playwright.config.ts` | opt-in frontend webServer |
| `apps/frontend/tests/e2e/a11y/login.a11y.spec.ts` | 공개 라우트 매트릭스 기반 axe scan |
| `docs/operations/performance-budgets.md` | 라우트 목록 SSOT 참조 |

## 의사결정 로그
- 2026-05-03: 인증 라우트를 Lighthouse CI에 바로 포함하지 않음. 현재 Lighthouse workflow는 backend/auth 쿠키를 제공하지 않으므로 인증 라우트를 추가하면 신뢰 가능한 감사가 아니라 로그인 리다이렉트 감사가 된다.
- 2026-05-03: 인증 a11y는 기존 `playwright.config.ts` + `auth.setup.ts` 흐름에서 계속 실행되도록 유지한다.
