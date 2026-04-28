# Contract — Dashboard Phase E LOW 잔여 검증/cleanup (2026-04-29)

## 컨텍스트

- 베이스: `origin/main` 31 commits ahead, working tree clean
- 이전 세션(2026-04-28) 핸드오프: `.claude/evaluations/next-session-handoff-2026-04-29.md`
- 본 세션 목표: push + 잔여 LOW 검증/실측 + 최소 cleanup

## MUST 기준 (실패 시 루프 차단)

### M1 — 31 commits 원격 동기화

- `git push origin main` 성공
- `.husky/pre-push` hook의 tsc + frontend/backend test 모두 PASS
- push 후 `git rev-list origin/main...HEAD` 0 0

### M2 — frontend 단위 테스트 PASS

- `pnpm --filter frontend test` exit 0
- 실패 케이스 0건 (skip은 허용)

### M3 — backend 단위 테스트 회귀 없음

- pre-push hook이 backend test도 실행 → 실패 시 push 자체가 막힘
- 이미 핸드오프 문서에서 947/947 PASS 확인됨

### M4 — tsc 회귀 없음

- pre-push hook이 `pnpm tsc --noEmit` 실행
- exit 0

### M5 — verify-implementation 회귀 0건

- 본 세션 cleanup 변경 범위에서 신규 P0/P1 위반 미발견
- (`getSystemHealth` test 추가 / `DashboardCheckoutScope` alias 제거 / DDAY_TONE_RULE 주석 보강 범위 한정)

## SHOULD 기준 (실패해도 루프 차단 X — tech-debt-tracker 기록)

### S1 — Playwright `dashboard-screenshots.spec.ts` 30 PNG 캡처 + axe scan

- dev 서버 기동 → 5 role × 1440 light/dark = 30 PNG 산출물 생성
- axe-core scan에서 critical/serious violation 0건 확인
- 환경 의존 (storage state, dev 서버) 실패 시 SHOULD로 기록

### S2 — standalone HTML 5 항목 시각 매칭

- REVIEW_RESULT.md 미해결 5 항목 검증:
  - §3.1 EQ 마크
  - §3.7 items-stretch
  - §3.10 debug widget
  - §A.3.1 미니캘린더
  - §A.9.1 skip nav
- Playwright + storage state 의존 — 환경 미비 시 SHOULD로 기록

### S3 — `getSystemHealth` storagePct 단위 테스트 추가

- `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts`
- ConfigService mock 활용 + `storagePct = (used/capacity) × 100` 계산 검증
- `overallStatus` (`healthy` / `degraded` / `error`) 분기 검증

### S4 — `DashboardCheckoutScope` deprecated alias 제거

- `apps/frontend/lib/api/dashboard-api.ts:147-148` 의 `@deprecated` alias 정리
- 소비처 grep 0건 확인 후 export 제거

### S5 — `DDAY_TONE_RULE` 주석 정확도 보강

- `apps/frontend/eslint.config.mjs:39-44` 주석을 review-architecture 보고서 §6 권고대로 정확하게 업데이트

## 변경 범위 제한 (Generator 가드레일)

- 영향 파일 수 ≤ 10 (cleanup 한정)
- 신규 모듈 생성 금지 — 기존 파일 surgical edit만
- 인접 코드 "김에 같이" 변경 금지 (메모리 룰: 수술적 변경)
- `setQueryData` 추가 금지, `useState` 이중 관리 금지 (메모리 룰)

## 인프라 의존 (본 세션 범위 외)

- BullMQ queueSize 실측 연결
- error_logs / Sentry 통합
- DASHBOARD_STORAGE_CAPACITY_BYTES 운영 환경 capacity

## Verification Commands

```bash
# M1
git push origin main

# M2
pnpm --filter frontend test

# M4
pnpm tsc --noEmit

# S1 (dev 서버 별도 기동 필요)
pnpm --filter frontend run dev &
pnpm --filter frontend run test:e2e -- dashboard-screenshots

# S3 (단위 테스트 추가 후)
pnpm --filter backend test -- dashboard.service.spec
```

## Out of Scope

- DashboardClient 신규 컴포넌트 추가 (이전 세션 범위)
- 새 ESLint 규칙 도입 (이전 세션에서 3개 추가됨)
- DB 마이그레이션
- 인프라 환경변수 설정
