---
name: verify-implementation
description: Runs all verify-* skills sequentially to produce a unified verification report. Use instead of running individual verify skills one by one. Run before PR creation, after feature implementation, or during code review. Trigger on: "전체 검증", "통합 검증", "PR 준비", "full verification", "run all checks", "verify everything".
disable-model-invocation: true
argument-hint: '[선택사항: 특정 verify 스킬 이름]'
---

# 구현 검증

## 목적

프로젝트에 등록된 모든 `verify-*` 스킬을 순차적으로 실행하여 통합 검증을 수행합니다.
이 스킬은 **순수 실행기**입니다. verify-* 스킬의 생성/수정/삭제는 `/manage-skills`가 담당합니다.

## 실행 시점

- 새로운 기능을 구현한 후
- Pull Request를 생성하기 전
- 코드 리뷰 중

## 실행 대상 스킬

| #  | 스킬                    | 영역     | 설명                                                    |
|----|-------------------------|----------|---------------------------------------------------------|
| 1  | `verify-cas`            | both     | CAS 패턴 — version, VersionedBaseService, 캐시 무효화   |
| 2  | `verify-auth`           | backend  | 인증/인가 — req.user.userId, @RequirePermissions         |
| 3  | `verify-zod`            | backend  | Zod 검증 — ZodValidationPipe, Query targets              |
| 4  | `verify-ssot`           | both     | SSOT 임포트 소스 — 로컬 재정의 금지                      |
| 5  | `verify-hardcoding`     | both     | 하드코딩 탐지 — API 경로, queryKeys, 환경변수             |
| 6  | `verify-frontend-state` | frontend | 상태 관리 — TanStack Query, 동적 import                   |
| 7  | `verify-nextjs`         | frontend | Next.js 16 패턴 — await params, useActionState            |
| 8  | `verify-filters`        | frontend | URL-driven 필터 SSOT                                     |
| 9  | `verify-design-tokens`  | frontend | Design Token 3-Layer                                     |
| 10 | `verify-security`       | both     | 보안 — Helmet CSP, Security Headers                       |
| 11 | `verify-i18n`           | frontend | i18n — en/ko 키 쌍, 동적 키 커버리지                      |
| 12 | `verify-sql-safety`     | backend  | SQL 안전성 — LIKE 이스케이프, N+1                          |
| 13 | `verify-e2e`            | e2e      | E2E 테스트 패턴 + 아키텍처 커버리지                       |
| 14 | `verify-seed-integrity` | backend  | 시드 인프라 3자 SSOT 정합성 (seed-data↔seed-test-new↔verification) |

## 워크플로우

### Step 1: 실행 대상 결정

인수가 제공되면 해당 스킬만, 아니면 `git diff` + `git status`로 변경 영역에 맞는 스킬만 필터링.

상세: [references/implementation-workflow.md](references/implementation-workflow.md) Step 1

### Step 2: 검증 실행

1~3개: 순차 실행. 4개 이상: 영역별 그룹 Agent 병렬 실행 (최대 3개 동시).

상세: [references/implementation-workflow.md](references/implementation-workflow.md) Step 2

### Step 3: 통합 보고서

```markdown
## 구현 검증 보고서

| 검증 스킬      | 상태            | 이슈 수 | 상세    |
| -------------- | --------------- | ------- | ------- |
| verify-<name>  | PASS / X개 이슈 | N       | 상세... |

**발견된 총 이슈: X개**
```

### Step 4~6: 수정 적용 및 재검증

이슈 발견 시 사용자에게 전체/개별/스킵 옵션을 제시하고, 수정 후 재검증합니다.

상세: [references/implementation-workflow.md](references/implementation-workflow.md) Step 4~6

### Step 7: 실행 이상 감지

Related Files 미존재, grep 0건, 미등록 스킬 등 이상 감지 시 `/manage-skills` 실행 권장.

상세: [references/implementation-workflow.md](references/implementation-workflow.md) Step 7

## 예외사항

1. **등록된 스킬이 없는 프로젝트** — 안내 메시지 표시 후 종료
2. **스킬의 자체적 예외** — 각 verify 스킬의 Exceptions 섹션에 정의된 패턴은 이슈로 보고하지 않음
3. **verify-implementation 자체** — 실행 대상에 자기 자신을 포함하지 않음
4. **manage-skills** — `verify-`로 시작하지 않으므로 실행 대상 아님
5. **review-architecture** — `verify-`로 시작하지 않으므로 실행 대상 아님

## Related Files

| File | Purpose |
|---|---|
| `.claude/skills/manage-skills/SKILL.md` | 스킬 유지보수 (실행 대상 스킬 목록 관리) |
| `CLAUDE.md` | 프로젝트 지침 |
