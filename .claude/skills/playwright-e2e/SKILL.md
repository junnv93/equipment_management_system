---
name: playwright-e2e
description: |
  Playwright E2E test workflow orchestrator — covers planning, code generation, execution, healing, and verification. Coordinates playwright-test MCP server's planner/generator/healer agents with sequential execution strategy to prevent browser resource contention. Automatically applies project-specific patterns (auth fixtures, storageState, role-based testing). Use whenever the user requests E2E tests, Playwright tests, test plans, test generation, page tests, feature tests, role-based tests, or permission tests. Trigger on: "E2E 테스트", "Playwright 테스트", "테스트 계획", "테스트 생성", "기능 테스트", "권한 테스트".
---

# Playwright E2E 테스트 워크플로우 스킬

## 목적

Playwright E2E 테스트의 **계획 → 생성 → 실행 → 검증 → 보고** 전체 사이클을 안정적으로 수행한다.
playwright-test MCP 에이전트를 무작정 병렬 실행하면 브라우저 리소스 경합으로 사일런트 종료가 발생하므로,
이 스킬은 실행 전략과 프로젝트 고유 인증/로케이터 패턴을 자동 적용한다.

---

## 워크플로우 (6단계)

### Phase 1: 탐색 및 분석

코드 분석 + 아키텍처 분석 + 브라우저 스냅샷(보조)으로 대상 구조를 파악한다.

- **1a. 코드 분석** — page.tsx, *Client.tsx, i18n, 기존 테스트, 권한 로직 순서로 읽기
- **1b. 아키텍처 분석** — CAS 엔티티 여부, 캐시 무효화, 접근 제어, 에러 전파 체인 확인
- **1c. 브라우저 스냅샷** — 코드만으로 불확실할 때 planner 에이전트로 DOM 확인

**상세:** [references/phase-details.md](references/phase-details.md) Phase 1 참조

### Phase 2: 테스트 계획 수립

`planner_save_plan`으로 저장. suite 단위 분리, 구체적 steps/expectedResults 명시.

**PASS 기준:** 아키텍처 시나리오(CAS 충돌, 캐시 일관성, 사이트 격리, 전체 워크플로우) 중 해당 항목 포함.
**FAIL 기준:** CAS 엔티티인데 충돌 테스트 없음, 뮤테이션 있는데 캐시 일관성 테스트 없음.

**상세:** [references/phase-details.md](references/phase-details.md) Phase 2 참조

### Phase 3: 테스트 코드 생성

| 상황 | 방법 |
|------|------|
| 테스트 5개 이하 / 로케이터 명확 | 직접 작성 |
| 복잡한 UI / 6개 이상 | 에이전트 배치 (최대 2개 동시, 5분 타임아웃) |

**상세:** [references/phase-details.md](references/phase-details.md) Phase 3 참조

### Phase 4: 실행 및 검증

1. 파일 경로 검증 (`apps/frontend/tests/e2e/` 하위)
2. import 경로 검증
3. `pnpm --filter frontend exec playwright test <path> --project=chromium --no-deps`
4. 실패 분류: 앱 버그 → 보고만 (직접 수정 금지), 테스트 버그 → healer로 수정

**상세:** [references/phase-details.md](references/phase-details.md) Phase 4 참조

### Phase 5: 결과 보고서

통과/실패(테스트 코드)/실패(앱 코드) 분류 + Action Items 제시.

**상세:** [references/phase-details.md](references/phase-details.md) Phase 5 참조

### Phase 6: 자기 개선

LEARNINGS.md에 경험 기록. 3회 이상 반복 패턴 → SKILL.md 정식 규칙으로 승격.
Phase 1 시작 전 LEARNINGS.md 반드시 참조.

**상세:** [references/phase-details.md](references/phase-details.md) Phase 6 참조

---

## 프로젝트 규칙 요약

- **인증:** storageState 기반 Fixture — `loginAs()`, `/login` 직접 접근 금지
- **로케이터:** `getByRole` 우선, `exact: true` 주의, `waitForTimeout` 금지
- **테스트 데이터:** `shared-test-data.ts` SSOT, UUID 하드코딩 금지
- **파일 구조:** auth.fixture import, SSOT 상수, serial 모드 설정

**상세:** [references/project-rules.md](references/project-rules.md) 참조

---

## 에이전트 사용 가이드 요약

| 에이전트 | 동시 실행 | 핵심 |
|---------|---------|------|
| planner | 1개만 | 대화형 탐색 |
| generator | 최대 2개 | 경합 주의, 5분 타임아웃 |
| healer | 여러 파일 OK | 브라우저 경합 없음 |

대규모 테스트(10+개, 여러 기능)는 tmux 에이전트 팀 활용.

**상세:** [references/agent-guide.md](references/agent-guide.md) 참조

---

## 의사결정 트리

```
사용자가 테스트 요청
├── 대상 명확? → YES: Phase 1 코드 분석 / NO: 사용자 확인
├── 기존 테스트? → YES: 빠진 시나리오만 추가 / NO: 전체 계획
├── 5개 이하? → 직접 작성 / 10개 이하: 에이전트 배치 / 10+: tmux 팀
├── 5분 무응답? → 사일런트 종료 판단, 직접 작성 전환
└── 완료 후 → 경로/import 검증 → 실행 → 실패 분류 → 보고서 → 자기 개선
```
