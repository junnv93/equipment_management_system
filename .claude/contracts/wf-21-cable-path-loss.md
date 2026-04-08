# Contract: WF-21 Cable Path Loss E2E spec

**Slug**: `wf-21-cable-path-loss`
**Mode**: 1 (Lightweight)
**Date**: 2026-04-08

## Scope

새 Playwright spec 1개 추가:
`apps/frontend/tests/e2e/workflows/wf-21-cable-path-loss.spec.ts`

WF-19b/WF-20b export spec 패턴 답습. 케이블 등록 → 측정 추가 → QP-18-08 export까지 단일 시리얼 시나리오로 검증.

## MUST Criteria

1. **파일 존재**: `apps/frontend/tests/e2e/workflows/wf-21-cable-path-loss.spec.ts` 생성됨
2. **find 검증**: `find apps/frontend/tests/e2e -iname '*cable*'` → 1+ hit
3. **타입체크**: `pnpm --filter frontend run tsc --noEmit` 통과
4. **Playwright 실행**: `pnpm --filter frontend exec playwright test wf-21-cable-path-loss` exit 0
5. **시나리오 커버리지** — 하나의 spec 안에서 다음 단계가 모두 실행되고 어서션됨:
   - (a) test_engineer 로그인 상태로 케이블 등록 API 호출 (관리번호 `ELLLX-NNN` 형식, 예: `ELLLX-021`, 시드 의존 X)
   - (b) `POST /api/cables/:id/measurements` 로 측정 1건 추가 (≥2 dataPoints, freq/loss 더미값)
   - (c) `GET /api/cables/:id` 로 latestDataPoints/측정 데이터가 반영되었는지 확인
   - (d) `GET /api/reports/export/form/UL-QP-18-08` → 200, content-type에 `spreadsheetml.sheet` 포함, body length > 1000
6. **fixture 사용**: `../shared/fixtures/auth.fixture` 의 `testOperatorPage` 또는 동등 fixture 사용 (storageState 인증)
7. **셀렉터 규칙**: CSS 셀렉터 사용 금지 (사용자 메모리 규칙). 단, **본 spec은 API 기반이므로 UI 셀렉터 자체가 0개여도 통과** — UI 단계가 추가될 경우 `getByRole`/`getByText`/`browser_verify_*`만 사용
8. **도메인 데이터 fabricate 금지**: 관리번호는 `ELLLX-NNN` 패턴만 사용, 실측 dB는 더미 `'0.5'`/`'1.0'`/`'1.5'` 등 명시적 더미 허용
9. **격리**: spec 종료 시 cables 행이 다음 실행을 깨지 않도록 unique 관리번호 사용 (`ELLLX-${Date.now() % 1000}` 또는 UUID 일부)
10. **CAS 충돌 단계 생략**: WF-35와 중복이며 프롬프트가 "(선택)"이므로 본 spec에서는 다루지 않음

## SHOULD Criteria

- WF-19b/WF-20b의 `test.describe.configure({ mode: 'serial' })` 패턴 준수
- `clearBackendCache()` 호출로 export 직전 캐시 정리 (있다면)
- 백엔드 토큰은 `getBackendToken(page, 'test_engineer')` 사용

## Out of Scope

- UI 클릭 시나리오 (브라우저 렌더링) — 본 spec은 API 기반 검증에 집중
- WF-35 CAS UI 복구 (별도 spec)
- Cable seed 추가 (spec 내부 생성으로 충분)

## Verification Commands

```bash
# 1. 타입체크
pnpm --filter frontend run tsc --noEmit

# 2. find 회귀
find apps/frontend/tests/e2e -iname '*cable*'

# 3. 실행
pnpm --filter frontend exec playwright test wf-21-cable-path-loss
```
