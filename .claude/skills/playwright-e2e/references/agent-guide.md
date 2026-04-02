# Playwright E2E — 에이전트 사용 가이드

## 에이전트별 리소스 특성

| 에이전트 | 리소스 | 동시 실행 | 비고 |
|---------|--------|---------|------|
| **planner** | 브라우저 1개 점유 | 1개만 | 대화형 탐색, 계획 저장 |
| **generator** | 브라우저 1개 + 파일쓰기 | 최대 2개 | 경합 주의, 경로 검증 필수 |
| **healer** | 테스트 러너 기반 | 1개에 여러 파일 OK | 브라우저 경합 없음 |

## Planner 사용법

```
1. planner_setup_page(seedFile: "apps/frontend/tests/e2e/shared/seed/<seed>.spec.ts")
2. 로그인 페이지 도착 → dev login 버튼 클릭으로 역할 선택
3. browser_navigate → 대상 페이지 이동
4. browser_snapshot → 구조 확인
5. planner_save_plan → 계획 저장
```

## Healer 사용법

```
프롬프트:
"다음 테스트들이 실패합니다. 각각 디버깅하고 수정해주세요:
1. tests/e2e/features/equipment/comprehensive/detail-basic-info.spec.ts
2. tests/e2e/features/equipment/comprehensive/role-tech-manager.spec.ts
..."
```

여러 파일을 한번에 넘겨도 healer가 순차적으로 `test_debug` → 수정 → 재실행한다.

## tmux 에이전트 팀 활용 (대규모 테스트)

tmux 환경에서 실행될 때, 여러 Claude Code 인스턴스를 팀으로 조율하여
단일 세션의 한계(MCP 브라우저 2개 제한, 컨텍스트 윈도우 소모)를 극복한다.

### 언제 에이전트 팀을 사용하는가

```
단일 세션으로 충분한 경우:
  - 테스트 10개 이하
  - 단일 기능(feature) 테스트
  - 실패 수정(healer) 작업

에이전트 팀이 필요한 경우:
  - 테스트 10개 이상 + 여러 기능에 걸쳐 있음
  - 전체 기능 회귀 테스트 (모든 feature 스위트 실행)
  - 생성 + 실행 + 수정을 파이프라인으로 처리하고 싶을 때
```

### 팀 구성 패턴

**패턴 1: 기능별 분할 (Feature Split)**

테스트 대상 기능이 여러 개일 때, 기능별로 독립 인스턴스를 배정한다.

```
tmux 레이아웃:
┌─────────────────────┬─────────────────────┐
│ Pane 1: 코디네이터   │ Pane 2: equipment   │
│ (계획 + 보고서)      │ (생성 + 실행)        │
├─────────────────────┼─────────────────────┤
│ Pane 3: checkouts   │ Pane 4: calibration │
│ (생성 + 실행)        │ (생성 + 실행)        │
└─────────────────────┴─────────────────────┘
```

**패턴 2: 파이프라인 (Pipeline)**

한 인스턴스가 생성하면, 다른 인스턴스가 실행하고, 또 다른 인스턴스가 수정한다.

```
tmux 레이아웃:
┌─────────────────────────────────────────────┐
│ Pane 1: 생성자 (Phase 1-3)                    │
├─────────────────────────────────────────────┤
│ Pane 2: 실행자 (Phase 4)                      │
├─────────────────────────────────────────────┤
│ Pane 3: 수정자 (Phase 4 healer + Phase 5-6)  │
└─────────────────────────────────────────────┘
```

**패턴 3: 역할 분리 (Role Split)**

코드 분석과 테스트 작성을 분리하여 컨텍스트 윈도우를 효율적으로 사용한다.

### 팀 간 통신 규약

에이전트 팀은 파일 시스템을 통해 통신한다.

```
통신 파일 위치: tests/e2e/.team/

구조:
tests/e2e/.team/
├── plan.json                    # 코디네이터가 작성하는 전체 계획
├── status/
│   ├── equipment.json           # { "phase": "done", "passed": 8, "failed": 2 }
│   ├── checkouts.json
│   └── calibration.json
├── analysis/
│   └── equipment-locators.md    # 분석가가 발견한 로케이터 정보
└── results/
    └── final-report.md          # 코디네이터가 작성하는 최종 보고서

.gitignore에 추가: tests/e2e/.team/
```

### 코디네이터 인스턴스 역할

```
코디네이터 책임:
1. 전체 테스트 계획 수립 (어떤 기능을 어떤 pane에 배정할지)
2. .team/plan.json 작성
3. 각 실행자 pane의 상태 파일(.team/status/*.json) 모니터링
4. 모든 pane 완료 후: 통합 보고서 + LEARNINGS.md 업데이트 + .team/ 정리

코디네이터 완료 감지 전략:
  - 각 실행자는 완료 시 상태 파일의 "phase"를 "done"으로 설정
  - 타임아웃: 실행자가 30분 이상 상태 변경 없으면 해당 pane 확인 요청
```

### 주의사항

```
파일 충돌 방지:
  - 각 실행자는 자기 기능의 spec 파일만 생성/수정한다
  - LEARNINGS.md는 코디네이터만 수정한다
  - SKILL.md 규칙 승격도 코디네이터만 판단한다

브라우저 리소스:
  - 각 pane은 독립된 MCP 세션이므로 브라우저 제한이 별도로 적용된다
  - pane당 generator 에이전트는 2개 이하로 유지한다
  - DB 상태를 변경하는 serial 테스트가 겹치지 않도록 기능을 분리한다

storageState 공유:
  - .auth/*.json 파일은 모든 pane이 공유한다
  - 첫 번째 pane이 auth.setup을 실행하면 나머지는 --no-deps로 건너뛴다
```
