---
slug: wf-21-cable-ui
mode: 1
scope: frontend E2E spec (new file only)
created: 2026-04-08
---

# Contract — WF-21 Cable Path Loss UI 동선 검증 spec

## Goal

31차 신규 프롬프트 "WF-21 UI 동선 검증 spec" 이행. 기존 `wf-21-cable-path-loss.spec.ts` (API 전용)가 cover하지 못하는 사용자 UI 동선(목록→등록 페이지→상세→측정 다이얼로그→내보내기)을 `wf-21-cable-ui.spec.ts`로 보완한다.

## Files (expected)

- **신규**: `apps/frontend/tests/e2e/workflows/wf-21-cable-ui.spec.ts`
- **불변**: `wf-21-cable-path-loss.spec.ts` (API 회귀), 모든 `.tsx` 프로덕션 파일, 다른 세션의 untracked 파일 (wf-25/wf-35, drizzle 0004, notifications seed)

## MUST Criteria

| # | 기준 | 검증 방법 |
|---|------|----------|
| M1 | `wf-21-cable-ui.spec.ts` 신규 파일 존재, 다른 파일 변경 없음 | `git status` → staged/unstaged 변경은 신규 1개만 |
| M2 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | shell |
| M3 | `pnpm --filter frontend exec playwright test wf-21-cable-ui --project=chromium` exit 0 | shell |
| M4 | 기존 `wf-21-cable-path-loss` API spec 회귀 없음 (동시 실행 시 관리번호 충돌 없음) | 관리번호 슬롯 분리 — API는 `Date.now()%1000`, UI는 `(Date.now()+333)%1000` |
| M5 | 로케이터 규칙 준수: `getByRole` / `getByText` / `getByLabel` / `getByPlaceholder` 만 사용, `page.locator('.class')` · CSS 셀렉터 0건 | `grep -E "page\.locator\(['\"][.#]" wf-21-cable-ui.spec.ts` → 0 hits |
| M6 | i18n 라벨 하드코딩이 `messages/ko/cables.json`의 실제 값과 일치 | 수동 diff (key → value) |
| M7 | 도메인 데이터 fabricate 없음: 관리번호 `ELLLX-NNN` 형식, dB는 더미 `0.5`/`1.0`/`1.5` | 파일 read |
| M8 | 8-step 시나리오 모두 구현 (list 렌더 → create 이동 → 빈 제출 no-op → 정상 저장 → 검색→상세 → 헤더 → 측정 다이얼로그 → export download) | 테스트 이름 8개 |
| M9 | `test.afterAll`에 `cleanupSharedPool` 호출 | 파일 read |

## SHOULD Criteria (non-blocking)

- S1: 각 step별 `test(...)` 분리 (serial mode) — wf-19/wf-20 패턴 답습
- S2: 빈 제출 Step은 "성공 토스트가 보이지 않는다" + "URL이 `/cables/create`에 머무른다"로 현재 동작 정확히 검증 (클라이언트 검증 UI 부재 사실을 테스트가 가정하지 않도록)
- S3: Export Step에서 `download.suggestedFilename()` 이 `UL-QP-18-08` 패턴 포함 검증

## Known constraints / pitfalls (사전 확인 완료)

- Dev server 수동 기동 필요 — 이미 기동됨 (localhost:3000 → 307 OK)
- Create 폼에 Zod/validation message UI 없음 — `handleSubmit` early-return이 전부. **현재 동작 그대로 회귀 보호** (프로덕션 코드 변경 금지)
- Label이 htmlFor로 연결 안 됨 → `getByPlaceholder` 사용 (CSS 셀렉터 아님)
- shadcn Select 트리거는 accessible name 없음 → `getByText(placeholder).click()` → `getByRole('option', { name })` 패턴
- i18n 파일은 `messages/ko/cables.json` (namespace split)

## Non-goals

- 권한 매트릭스 (별도 spec `cable-permissions.spec.ts` 프롬프트)
- 다른 양식 export UI (별도 프롬프트 `wf-export-ui`)
- Create 폼에 validation message 추가 (프로덕션 변경 금지)
- site scope bypass 보안 이슈 (별도 CRITICAL 프롬프트)
