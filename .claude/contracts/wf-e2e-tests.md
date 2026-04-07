# Contract: WF-17~WF-20 E2E 워크플로우 테스트

> **Slug:** wf-e2e-tests
> **Mode:** 2

## MUST Criteria (FAIL = loop 재진입)

### M1: TypeScript 컴파일
`pnpm --filter frontend run tsc --noEmit` → exit 0

### M2: WF-17 spec 존재 + 구조
- `wf-17-checkout-overdue-return.spec.ts` 존재
- `test.describe.configure({ mode: 'serial' })`
- auth.fixture.ts import (testOperatorPage, techManagerPage)
- beforeAll/afterAll 리셋
- 최소 4 steps (반출→overdue→반입→장비 복원)

### M3: WF-18 spec 존재 + 구조
- `wf-18-nc-correction-rejection.spec.ts` 존재
- serial mode + auth fixture
- 최소 4 steps (조치→반려→재조치→종결)
- rejectCorrection 헬퍼 사용

### M4: WF-19 spec 존재 + 구조
- `wf-19-intermediate-inspection-3step-approval.spec.ts` 존재
- serial mode + auth fixture
- 정상 흐름: draft→submitted→reviewed→approved (최소 4 steps)
- 반려 흐름: submitted→rejected (최소 2 steps)
- 3가지 역할 사용 (TE, TM, LM)

### M5: WF-20 spec 존재 + 구조
- `wf-20-self-inspection-confirmation.spec.ts` 존재
- serial mode + auth fixture
- completed→confirmed 전이 (최소 3 steps)
- confirmed 후 수정/삭제 불가 검증 (최소 2 steps)

### M6: CAS 패턴 준수
- 모든 상태 전이 PATCH에서 version 추출 후 포함
- extractVersion() 또는 apiGet→version 패턴 사용

### M7: workflow-helpers.ts 헬퍼
- WF-19 헬퍼 최소 5개 (create, submit, review, approve, reject)
- WF-20 헬퍼 최소 3개 (create, confirm, delete/update)
- WF-18 rejectCorrection 헬퍼 1개
- 모든 헬퍼가 apiGet/apiPost/apiPatch 기반

### M8: clearBackendCache 패턴
- 상태 변경 후 검증 전 clearBackendCache() 호출

## SHOULD Criteria (FAIL = tech-debt-tracker 기록)

### S1: Playwright 실행
`npx playwright test wf-17 wf-18 wf-19 wf-20 --reporter=list` 전체 PASS
(서버 미실행 시 구조 검증으로 대체)

### S2: 장비 충돌 방지
WF-17 전용 장비가 WF-03/04/10/11과 겹치지 않아야 함

### S3: 일관된 네이밍
- JSDoc 주석에 `@see docs/workflows/critical-workflows.md WF-{NN}` 포함
- 테스트명에 한글 단계 설명 포함 (기존 WF-01~16 패턴 일치)

### S4: NC 반려 후 장비 상태
WF-18에서 NC close 후 장비 상태 available 복원 검증 포함
