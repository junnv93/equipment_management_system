---
slug: wf-35-cas-ui-recovery
mode: 1
created: 2026-04-08
---

# Contract — WF-35 CAS 충돌 UI 복구 E2E

## Goal
프론트엔드 사용자 동선으로 CAS 409 → 한국어 토스트 → 자동 refetch → 재시도 성공 플로우를 검증한다.
백엔드 CAS spec(s35-cas-cache, approvals/10-cas-version-conflict)과 중복되지 않도록
**브라우저 UI 레벨** 동작만 검증한다.

## Deliverables
- **신규**: `apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts`
- **변경 없음**: 프로덕션 코드 변경 금지 (테스트 전용 작업)

## MUST (loop-blocking)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` 통과 | tsc 종료코드 0 |
| M2 | 신규 spec 실행 통과 | `pnpm --filter frontend exec playwright test wf-35-cas-ui-recovery` exit 0 |
| M3 | 다탭(두 BrowserContext) 시뮬레이션 포함 | spec 내 `browser.newContext` 2회 호출 |
| M4 | 페이지 A 성공 → 페이지 B 409 → VERSION_CONFLICT 한국어 토스트 검증 | `getByText(/데이터 충돌|다른 사용자가/)` 또는 `getByRole('status')` 매칭 |
| M5 | 409 이후 페이지 B 의 refetch 확인 후 재시도 성공 | 두 번째 save 후 성공 토스트 또는 networkidle 후 최신 version 로 PATCH 성공 |
| M6 | 회귀: `features/non-conformances/comprehensive/s35-cas-cache.spec.ts` 통과 유지 | 해당 spec 병행 실행 시 PASS |
| M7 | 셀렉터는 `getByRole` / `getByText` 만 사용 (CSS 셀렉터 금지 — 사용자 메모리 규칙) | spec 내 `page.locator('.xxx')` 등 CSS 셀렉터 grep 0건 |
| M8 | 도메인 데이터 fabricate 금지 | NC ID 는 `TEST_NC_IDS` 에서 import |

## SHOULD (non-blocking, tech-debt)

- 두 번째 spec(자체점검 폼, 교정 승인 등) 으로 다른 useOptimisticMutation 경로 cover
- auth.fixture 에 `secondTechManagerPage` 같은 보조 픽스처 추가로 boilerplate 감소

## Non-Goals

- 백엔드 409 응답 구조 검증 (이미 s35-cas-cache 가 cover)
- 3개 이상 동시 탭 시나리오
- 다른 역할(LM/QM) 조합의 충돌

## Test Target

**타겟 페이지**: `/non-conformances/{NC_001_MALFUNCTION_OPEN}` (open 상태, TM 조치 편집 가능)
**타겟 mutation**: `saveMutation` (`NCDetailClient.tsx:169`) — `correctionContent` 저장 (version bump, 상태 변경 없음 → 재시도 가능)
**역할**: 둘 다 `technical_manager` (동일 storageState)

## Rollback
테스트 실패 시 spec 파일만 삭제하면 됨. 프로덕션 코드 변경 없음.
