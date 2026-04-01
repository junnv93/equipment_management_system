---
name: harness
description: 3-Agent harness orchestrator (Planner → Generator → Evaluator loop). Auto-selects execution mode based on task complexity. Use for feature development, refactoring, or any multi-file change. Trigger on "하네스", "/harness", "harness mode", or when starting non-trivial implementation.
argument-hint: '[요청 내용] 또는 [mode0|mode1|mode2]'
---

# Harness — Generator-Evaluator Orchestrator

Anthropic의 "Harness Design for Long-Running Apps" 패턴을 프로젝트에 적용한 orchestrator 스킬입니다.
기존 verify-*, review-* 스킬을 Evaluator로 활용하며, 자동 반복 루프로 품질을 보장합니다.

## 핵심 원칙

1. **생성과 평가의 분리**: Generator(구현)와 Evaluator(검증)는 반드시 독립 실행
2. **계약 기반 평가**: 주관적 판단이 아닌 contract.md의 명시적 기준으로 PASS/FAIL
3. **자동 반복**: 실패 시 수정 지시 → 재구현 → 재검증 (최대 3회)
4. **기존 인프라 재사용**: 새 검증 로직 없음 — verify-*, review-* 스킬을 orchestration

---

## Step 1: 모드 판별

사용자가 모드를 명시하면(`mode0`, `mode1`, `mode2`) 그대로 사용합니다.
명시하지 않으면 요청 내용을 분석하여 자동 판별합니다.

### 판별 기준

| 모드 | 조건 | 실행 방식 |
|------|------|-----------|
| **Mode 0** (Direct) | 파일 3개 이하, 로직 변경 없음 (i18n, 설정, 오타, 문서) | 하네스 우회 — 직접 구현 |
| **Mode 1** (Lightweight) | 파일 4~15개, 기존 패턴 내 구현, 단일 도메인 | Generator → Evaluator 자동 루프 |
| **Mode 2** (Full) | 파일 15+, DB 변경, 새 모듈, 다중 도메인 연동 | Planner → Generator → Evaluator 전체 루프 |

### 판별 결과 보고

```
모드 판별: [요청 요약] → Mode N ([모드명]) 권장
이유: [판별 근거 1줄]
진행할까요?
```

사용자 확인 후 다음 Step으로 진행합니다.

### Mode 0일 때

```
이 작업은 하네스가 필요하지 않습니다. 직접 구현을 진행합니다.
```

→ 일반 구현 흐름으로 전환. 이 스킬 종료.

---

## Step 2: Planner 실행 (Mode 2만)

Mode 1은 이 단계를 건너뛰고 Step 3으로 이동합니다.

### Planner 워크플로우

Agent tool로 Planner 에이전트를 실행합니다:

```
프롬프트:
  사용자 요청: {요청 내용}

  다음을 수행하세요:
  1. CLAUDE.md를 읽어 프로젝트 규칙과 아키텍처를 파악
  2. 요청과 관련된 기존 코드를 탐색 (유사 모듈, 기존 패턴)
  3. 기존 모듈과 동일한 패턴으로 설계 (일관성 우선)
  4. .claude/plan.md를 작성 (Phase별 변경 파일, 검증 명령 포함)
  5. .claude/contract.md를 작성 (성공 기준 MUST/SHOULD 분류)

  plan.md 포맷:
  - 설계 철학 (1~2문장)
  - 아키텍처 결정 (표)
  - 구현 Phase (Phase별: 목표, 변경 파일, 검증 명령)
  - 전체 변경 파일 요약

  contract.md 포맷:
  - 필수(MUST): tsc 에러 0, lint 에러 0, verify-implementation 전체 PASS, [도메인 특화 기준]
  - 권장(SHOULD): review-architecture Critical 0, [도메인 특화 권장]
  - 적용 verify 스킬: [변경 영역 기반 자동 선택]
```

Planner 완료 후 plan.md와 contract.md를 사용자에게 제시하고 승인을 받습니다.

---

## Step 3: contract.md 준비

### Mode 2

Step 2에서 Planner가 이미 생성. 이 단계 건너뜀.

### Mode 1

변경 예정 파일을 분석하여 간소화된 contract.md를 자동 생성합니다.

```markdown
# 스프린트 계약: {작업 제목}

## 생성 시점
{ISO 8601 timestamp}

## 성공 기준

### 필수 (MUST)
- [ ] `pnpm tsc --noEmit` (backend) 에러 0
- [ ] `pnpm tsc --noEmit` (frontend) 에러 0 (프론트엔드 변경 시)
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공 (프론트엔드 변경 시)
- [ ] verify-implementation 전체 PASS (변경 영역 기반 스킬 자동 선택)
- [ ] `pnpm --filter backend run test` 기존 테스트 통과 (백엔드 변경 시)

### 권장 (SHOULD)
- [ ] review-architecture Critical 이슈 0개

### 적용 verify 스킬
{변경 파일 경로 기반 자동 선택 — verify-implementation의 영역 필터링 로직 활용}

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
```

contract.md를 `.claude/contract.md`에 저장합니다.

---

## Step 4: Generator 실행

### Mode 2
plan.md의 Phase를 순서대로 구현합니다.

### Mode 1
사용자 요청에 따라 직접 구현합니다. (plan.md 없이)

### Generator 제약사항

- CLAUDE.md의 Behavioral Guidelines 준수 (최소 코드 원칙, 수술적 변경)
- Mode 2에서는 plan.md에 없는 파일을 변경하지 않음
- 자체 판단으로 "개선"하지 않음

### Generator 완료 후

구현이 완료되면 Step 5로 이동합니다. 중간에 사용자에게 진행 상황을 간결하게 보고합니다.

---

## Step 5: Evaluator 실행

Evaluator는 **독립적으로** Generator의 출력물을 평가합니다. 자기 평가 편향을 방지하기 위해 반드시 별도 Agent로 실행합니다.

### Evaluator 워크플로우

Agent tool로 Evaluator 에이전트를 실행합니다:

```
프롬프트:
  .claude/contract.md를 읽고, 다음 검증을 수행하세요.
  코드를 수정하지 말고 검증 결과만 보고하세요.

  1. 빌드 검증:
     - pnpm --filter backend run tsc --noEmit
     - pnpm --filter frontend run build (프론트엔드 변경 시)
     - pnpm --filter backend run test (백엔드 변경 시)

  2. 규칙 기반 검증:
     verify-implementation 스킬의 워크플로우를 따라 실행
     (변경 파일 기반 영역 필터링 → 해당 verify-* 스킬 실행)

  3. 아키텍처 검증 (Mode 2만):
     review-architecture 스킬의 워크플로우를 따라 실행

  4. contract.md 기준 대조:
     각 필수(MUST) 기준에 대해 PASS/FAIL 판정

  5. evaluation-report.md 작성:
     .claude/evaluation-report.md에 결과 저장

  evaluation-report.md 포맷:
  ---
  # Evaluation Report: {작업 제목}
  ## 반복 #{N} ({timestamp})
  ## 계약 기준 대조
  | 기준 | 판정 | 상세 |
  ## 전체 판정: PASS 또는 FAIL (필수 N개 미달)
  ## 수정 지시 (FAIL 시)
  ### 이슈 N: {제목}
  - 파일: {path:line}
  - 문제: {구체적 설명}
  - 수정: {구체적 코드 변경 지시}
  ---
```

### 판정 결과에 따른 분기

**PASS (필수 기준 전체 통과)**:
→ Step 7 (최종 보고)로 이동

**FAIL + 반복 < 3**:
→ evaluation-report.md의 수정 지시를 입력으로 Step 6 (수정 루프)으로 이동

**FAIL + 동일 이슈 2회 연속**:
→ "설계 수준 문제로 자동 수정 불가. 수동 개입이 필요합니다." 보고 → Step 7로 이동

**FAIL + 반복 >= 3**:
→ "3회 반복 후에도 필수 기준 미달. 수동 개입이 필요합니다." 보고 → Step 7로 이동

---

## Step 6: 수정 루프

evaluation-report.md의 수정 지시를 기반으로 Generator를 재실행합니다.

### 수정 루프 프로세스

```
1. evaluation-report.md에서 FAIL 이슈 목록 추출
2. 각 이슈의 수정 지시에 따라 코드 수정
3. 수정 완료 후 Step 5 (Evaluator 실행)로 복귀
```

### 반복 카운터 관리

- 반복 횟수를 추적하여 evaluation-report.md에 `반복 #N`으로 기록
- 이전 반복의 FAIL 이슈와 현재 반복의 FAIL 이슈를 비교하여 "동일 이슈 연속" 감지

---

## Step 7: 최종 보고

```markdown
## 하네스 실행 결과

| 항목 | 결과 |
|------|------|
| 모드 | Mode {N} ({모드명}) |
| 반복 횟수 | {N}회 |
| 최종 판정 | PASS / FAIL (수동 개입 필요) |
| 변경 파일 | {N}개 파일, +{X}/-{Y} lines |

### 계약 기준 최종 상태
| 기준 | 판정 |
|------|------|
| tsc 에러 0 | PASS |
| verify-implementation | PASS |
| ... | ... |

### 다음 단계
- PASS: `/git-commit`으로 커밋하세요.
- FAIL: evaluation-report.md를 확인하고 수동으로 수정하세요.
```

---

## 기존 스킬과의 관계

이 스킬은 기존 인프라를 orchestration하는 상위 레이어입니다. **기존 스킬을 수정하지 않습니다.**

```
harness (이 스킬)
  ├── verify-implementation (Evaluator 규칙 검증)
  │     └── 13개 verify-* 스킬 (자동 선택)
  ├── review-architecture (Evaluator 아키텍처 검증, Mode 2)
  ├── review-design (Evaluator 디자인 검증, 프론트엔드 변경 시)
  ├── equipment-management (Planner 도메인 지식)
  ├── nextjs-16 (Generator 프레임워크 가이드)
  └── git-commit (최종 커밋)
```

---

## Exceptions

1. **Mode 0 작업에 하네스 강제 적용 금지** — 오타, i18n, 설정 변경에 3-Agent 루프는 과잉
2. **Evaluator가 코드를 수정하지 않음** — 검증 결과만 보고, 수정은 Generator의 역할
3. **contract.md의 권장(SHOULD) 기준 미달은 FAIL이 아님** — 필수(MUST)만 루프 조건
4. **테스트 파일의 패턴 차이는 이슈로 보고하지 않음** — verify-* 스킬의 기존 예외 계승

---

## 역 로드 베어링 분석

하네스 구성요소의 필요성을 정기적으로 검증합니다.

### 실행 방법

`/harness load-bearing` 커맨드로 실행합니다.

### 분석 절차

1. 최근 5회 하네스 실행에서 각 구성요소별 이슈 발견율 집계
2. 발견율 0%인 구성요소 → "제거 후보"로 보고
3. 각 구성요소가 인코딩하는 가정(assumption) 명시
4. 가정이 여전히 유효한지 근거 제시

### 보고서 포맷

```markdown
## 로드 베어링 분석 (YYYY-MM-DD)

| 구성요소 | 이슈 발견율 | 인코딩된 가정 | 가정 유효? | 판정 |
|----------|------------|-------------|-----------|------|
| Planner | 해당 없음 | 사용자 요청이 불완전 | 유효 | 유지 |
| contract.md | 100% | 명시적 기준 없이 PASS/FAIL 불가 | 유효 | 유지 |
| verify-cas | 40% | CAS 패턴 누락 빈발 | 유효 | 유지 |
| verify-i18n | 0% | i18n 키 불일치 빈발 | 재검증 필요 | 제거 후보 |
```

분기 1회 실행을 권장합니다.
