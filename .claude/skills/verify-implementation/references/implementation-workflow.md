# 구현 검증 상세 워크플로우

## Step 1: 실행 대상 결정 — 상세

**실행 범위 결정 (우선순위 순):**

1. **인수가 제공된 경우**: 해당 스킬만 실행 (예: `/verify-implementation verify-cas verify-auth`)
2. **인수가 없는 경우**: `git diff --name-only HEAD` + `git status --short`로 변경 파일을 확인하고, 변경 영역에 맞는 스킬만 필터링

**영역 기반 자동 필터링:**

```
변경 파일 경로 → 영역 매핑:
  apps/backend/**     → backend, both
  apps/frontend/**    → frontend, both (tests/e2e/** 제외)
  apps/frontend/tests/e2e/** → e2e, both
  packages/**         → backend, frontend, both (전체)
```

변경 파일이 없으면 전체 스킬을 실행합니다.

**등록된 스킬이 0개인 경우:**

```markdown
## 구현 검증

검증 스킬이 없습니다. `/manage-skills`를 실행하여 프로젝트에 맞는 검증 스킬을 생성하세요.
```

이 경우 워크플로우를 종료합니다.

**등록된 스킬이 1개 이상인 경우:**

실행 대상 스킬 테이블의 내용을 표시합니다:

```markdown
## 구현 검증

변경 영역: backend, frontend (N개 파일)

| #  | 스킬           | 영역     | 상태           |
|----|----------------|----------|----------------|
| 1  | verify-cas     | both     | 실행 대상      |
| 2  | verify-auth    | backend  | 실행 대상      |
| 6  | verify-nextjs  | frontend | 스킵 (변경 없음) |
| 13 | verify-e2e     | e2e      | 스킵 (변경 없음) |

실행 대상: X개 / 스킵: Y개
검증 시작...
```

## Step 2: 검증 실행 — 상세

### 실행 전략

스킬 수에 따라 실행 방식을 결정합니다:

- **1~3개**: 순차 실행 (직접 검사)
- **4개 이상**: 영역별 그룹으로 나누어 **Agent 병렬 실행** (최대 3개 동시)

**병렬 실행 그룹:**

| 그룹 | 영역 | 스킬 |
|---|---|---|
| A | backend + both | verify-cas, verify-auth, verify-zod, verify-ssot, verify-hardcoding, verify-security, verify-sql-safety |
| B | frontend + both | verify-cas, verify-ssot, verify-hardcoding, verify-frontend-state, verify-nextjs, verify-filters, verify-design-tokens, verify-security, verify-i18n |
| C | e2e | verify-e2e |

`both` 영역 스킬(cas, ssot, hardcoding, security)은 A와 B 그룹에 중복 포함되지만, 각 Agent가 자기 영역의 파일만 검사하므로 중복 보고되지 않습니다. A 그룹은 `apps/backend/` 경로만, B 그룹은 `apps/frontend/` 경로만 검사합니다.

Step 1의 스마트 필터링에 의해 해당 영역에 변경이 없으면 그룹 자체가 스킵됩니다.

### 각 스킬 실행 절차

순차든 병렬이든, 각 스킬에 대해 동일한 절차를 따릅니다:

**2a. 스킬 SKILL.md 읽기**

`.claude/skills/verify-<name>/SKILL.md`를 읽고 파싱:
- **Workflow** — 실행할 검사 단계와 탐지 명령어
- **Exceptions** — 위반이 아닌 것으로 간주되는 패턴
- **Related Files** — 검사 대상 파일 목록

**2b. 검사 실행**

1. 검사에 명시된 도구(Grep, Glob, Read, Bash)를 사용하여 패턴 탐지
2. 탐지된 결과를 해당 스킬의 PASS/FAIL 기준에 대조
3. Exceptions 섹션에 해당하는 패턴은 면제 처리
4. FAIL인 경우 이슈를 기록:
   - 파일 경로 및 라인 번호
   - 문제 설명
   - 수정 권장 사항 (코드 예시 포함)

**2c. 스킬별 결과 기록**

```markdown
### verify-<name> 검증 완료

- 검사 항목: N개
- 통과: X개
- 이슈: Y개
- 면제: Z개
```

## Step 3: 통합 보고서 — 상세 출력 템플릿

**모든 검증 통과 시:**

```markdown
모든 검증을 통과했습니다!

구현이 프로젝트의 모든 규칙을 준수합니다:

- verify-<name1>: <통과 내용 요약>
- verify-<name2>: <통과 내용 요약>

코드 리뷰 준비가 완료되었습니다.

---
> **검증 범위:** 이 검증은 규칙 기반 자동 검사(import 소스, 값 하드코딩, SQL 안티패턴 등)입니다.
> 아키텍처 수준의 설계 판단(로직 SSOT, 캐시 전략 적절성, 확장성, 계층 관통 일관성)은
> `/review-architecture`를 별도 실행하세요.
```

**이슈 발견 시:**

```markdown
### 발견된 이슈

| #   | 스킬           | 파일                  | 문제      | 수정 방법      |
| --- | -------------- | --------------------- | --------- | -------------- |
| 1   | verify-<name1> | `path/to/file.ts:42`  | 문제 설명 | 수정 코드 예시 |
| 2   | verify-<name2> | `path/to/file.tsx:15` | 문제 설명 | 수정 코드 예시 |

---
> **검증 범위:** 이 검증은 규칙 기반 자동 검사입니다.
> 아키텍처 수준의 설계 판단(로직 SSOT, 캐시 전략 적절성, 확장성)은 `/review-architecture`를 별도 실행하세요.
```

## Step 4: 사용자 액션 확인

이슈가 발견된 경우 사용자에게 확인합니다:

```markdown
---

### 수정 옵션

**X개 이슈가 발견되었습니다. 어떻게 진행할까요?**

1. **전체 수정** - 모든 권장 수정사항을 자동으로 적용
2. **개별 수정** - 각 수정사항을 하나씩 검토 후 적용
3. **건너뛰기** - 변경 없이 종료
```

## Step 5: 수정 적용

**"전체 수정" 선택 시:**

```markdown
## 수정 적용 중...

- [1/X] verify-<name1>: `path/to/file.ts` 수정 완료
- [2/X] verify-<name2>: `path/to/file.tsx` 수정 완료

X개 수정 완료.
```

**"개별 수정" 선택 시:**

각 이슈마다 수정 내용을 보여주고 승인 여부를 확인합니다.

## Step 6: 수정 후 재검증

수정이 적용된 경우, 이슈가 있었던 스킬만 다시 실행하여 Before/After를 비교합니다:

```markdown
## 수정 후 재검증

| 검증 스킬      | 수정 전  | 수정 후 |
| -------------- | -------- | ------- |
| verify-<name1> | X개 이슈 | PASS    |
| verify-<name2> | Y개 이슈 | PASS    |
```

**여전히 이슈가 남은 경우:**

```markdown
### 잔여 이슈

| #   | 스킬          | 파일                 | 문제                            |
| --- | ------------- | -------------------- | ------------------------------- |
| 1   | verify-<name> | `path/to/file.ts:42` | 자동 수정 불가 — 수동 확인 필요 |

수동으로 해결한 후 `/verify-implementation`을 다시 실행하세요.
```

## Step 7: 실행 이상 감지

감지 대상:
- Related Files에 명시된 파일이 존재하지 않는 경우
- grep/glob 패턴이 결과 0건을 반환하는 경우 (파일 이동/삭제 가능성)
- `.claude/skills/` 디렉토리에 verify-* 스킬이 존재하지만 실행 대상 테이블에 없는 경우

```markdown
### 스킬 유지보수 필요

실행 중 다음 이상이 감지되었습니다:

- verify-xxx: `path/to/old-file.ts` 파일이 존재하지 않음
- verify-yyy: 새 스킬이 실행 대상에 미등록

`/manage-skills`를 실행하여 스킬을 최신 상태로 업데이트하세요.
```

이상이 없으면 이 섹션을 생략합니다.
