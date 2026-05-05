# scripts/diagnostics — 운영 회귀 1차 응답 harness

ADR-0006(Same-Origin Reverse-Proxy) 정착 이후 동일 증상 재발 시 즉시 실행 가능한
**코드화된 진단 절차**. manual 5-page recipe 대신 1줄 명령 + machine-readable 결과.

| 파일                      | 용도                                                                           |
| ------------------------- | ------------------------------------------------------------------------------ |
| `csrf-invariants.json`    | invariant SSOT — smoke + trace 두 스크립트가 공유                              |
| `nextauth-csrf-trace.mjs` | 환경변수/SW/basePath/proxy 헤더/cookie domain 종합 진단                        |
| `../onprem-verify.mjs`    | onprem 배포 직후 ADR-0006 invariant 운영 스모크 (`pnpm compose:onprem:verify`) |

## 트리거 — 언제 실행하나

다음 중 하나라도 관측되면 즉시 진단 harness를 실행한다.

- `apps/backend` 콘솔에 `Cannot GET /api/auth/csrf` 또는 `/api/auth/session` 404가 5초 주기로 발생
- 사용자 사인인 페이지가 무한 로딩(`/api/auth/csrf` pending)
- `/api/auth/session` 502/503/504 또는 Cloudflare 1xx 게이트웨이 에러
- NextAuth `signIn()` 호출이 `MISSING_CSRF` / `OAUTH_CALLBACK_ERROR` 로 실패
- 새 PR 머지 후 dev/lan/onprem 중 한 환경에서만 인증이 깨짐

## 1단계 — 진단 실행

배포된 environment에서:

```bash
# ONPREM_PUBLIC_ORIGIN 또는 NEXTAUTH_URL이 환경에 있으면 자동 사용
pnpm diagnostics:csrf

# ad-hoc (사고 대응 중인 incident commander 등)
pnpm diagnostics:csrf -- --origin https://equipment.company.local
```

결과는 두 곳에 저장된다.

- stdout: 휴먼 요약 (verdict + invariantBreaches 리스트)
- `tmp/diagnostics/<ISO>-trace.json`: machine-readable artifact (PR/티켓 첨부용)

CI 또는 정적 환경에서 회귀 차단을 원하면 `--dry-run`으로 정적 검사만 수행 가능하다.

## 2단계 — invariantBreaches 매핑

trace 스크립트가 출력하는 각 breach의 `ref` 필드는 ADR-0006의 해당 단락을 가리킨다.
`severity`별 우선순위:

| severity   | 의미                                             | 응답                                                         |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `critical` | NextAuth 핸들러가 backend로 분기됨 (서비스 중단) | nginx 설정 즉시 롤백 또는 `infra/nginx/lan.conf` 라우팅 검증 |
| `high`     | SW NetworkOnly / cookie domain 위배              | frontend 배포 롤백 또는 SW unregister 강제                   |
| `medium`   | env 값 비표준 / X-Forwarded-Proto 불일치         | 인프라/배포 설정 검토                                        |

## 3단계 — 회귀 분류

artifact 파일의 `invariantBreaches[].id`로 회귀 카테고리 결정:

| breach id                      | 회귀 위치                                                                   |
| ------------------------------ | --------------------------------------------------------------------------- |
| `CSRF-HTTP-STATUS`             | nginx (lan.conf의 `^/api/auth/(csrf\|session\|providers...)` location 누락) |
| `CSRF-BODY-SHAPE`              | nginx (NextAuth 경로가 backend로 분기되고 있음)                             |
| `SW-NETWORK-ONLY`              | frontend `apps/frontend/app/sw.ts` 회귀                                     |
| `AUTHJS-BASEPATH-OVERRIDE`     | frontend `apps/frontend/lib/auth.ts` 또는 NextAuth 옵션 회귀                |
| `NEXT_PUBLIC_API_URL-NONEMPTY` | env / compose.yml — `INTERNAL_BACKEND_URL` 미설정 동반 가능                 |
| `X-FORWARDED-PROTO-MISMATCH`   | 외부 proxy(회사 표준 reverse proxy 또는 CDN) 설정                           |
| `COOKIE-DOMAIN-VIOLATION`      | NextAuth `cookies.*.options.domain` override 도입 회귀                      |

## 4단계 — 후속 조치

- 회귀 위치 식별 → 해당 commit `git log --oneline` + `git diff` 확인
- 재현 단위 테스트 또는 verify-routing-origin.sh 보강 가능 여부 검토
- 회귀 클래스가 본 harness로 잡히지 않았다면 `csrf-invariants.json` 업데이트 PR

## 관련 문서

- [ADR-0006: Same-Origin Reverse-Proxy](../../docs/adr/0006-frontend-backend-routing-model.md) — 본 harness의 invariants 출처
- [packages/shared-constants/src/api-routing.ts](../../packages/shared-constants/src/api-routing.ts) — 분기 SSOT 코드
- [docs/references/api-routing-architecture.md](../../docs/references/api-routing-architecture.md) — 운영 가이드 (존재하는 경우)
- [scripts/verify-routing-origin.sh](../verify-routing-origin.sh) — 정적 SSOT 회귀 차단 (배포 전 게이트)
