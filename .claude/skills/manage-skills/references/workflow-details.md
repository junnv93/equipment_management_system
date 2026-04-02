# 스킬 유지보수 — 워크플로우 상세

## Step 1: 세션 변경사항 분석

```bash
# 커밋되지 않은 변경사항
git diff HEAD --name-only

# 현재 브랜치의 커밋 (main에서 분기된 경우)
git log --oneline main..HEAD 2>/dev/null

# main에서 분기된 이후의 모든 변경사항
git diff main...HEAD --name-only 2>/dev/null
```

표시: 최상위 디렉토리 기준 그룹화.

## Step 2: 등록된 스킬과 변경 파일 매핑

### Sub-step 2a: 등록된 스킬 확인

**등록된 검증 스킬** 테이블에서 이름/패턴을 읽는다. 0개인 경우 Step 4로 이동.
1개 이상인 경우, 각 스킬의 SKILL.md를 읽고 Related Files + Workflow에서 파일 경로 추출.

### Sub-step 2b: 변경 파일 매칭

각 변경 파일을 스킬 패턴과 대조:
- 커버 파일 패턴과 일치
- 참조 디렉토리 내 위치
- 탐지 명령어의 regex/문자열 패턴 일치

### Sub-step 2c: 매핑 표시

```markdown
| 스킬        | 트리거 파일              | 액션      |
| ----------- | ------------------------ | --------- |
| verify-api  | `router.ts`, `handler.ts`| CHECK     |
| (스킬 없음) | `package.json`           | UNCOVERED |
```

## Step 3: 커버리지 갭 분석

영향받은 각 스킬의 SKILL.md를 읽고 점검:

1. **누락된 파일 참조** — Related Files에 없는 관련 변경 파일
2. **오래된 탐지 명령어** — grep/glob 패턴이 현재 파일 구조와 일치하는지 샘플 실행
3. **커버되지 않은 새 패턴** — 새 타입/enum/설정/파일 규칙
4. **삭제된 파일의 잔여 참조** — 코드베이스에 없는 파일
5. **변경된 값** — 식별자, 설정 키, 타입 이름 수정

## Step 4: CREATE vs UPDATE 결정

```
커버되지 않은 각 파일 그룹에 대해:
    IF 기존 스킬 도메인 관련 → UPDATE
    ELSE IF 3+ 관련 파일이 공통 규칙 공유 → CREATE
    ELSE → 면제
```

`AskUserQuestion`으로 확인.

## Step 5: 기존 스킬 업데이트

규칙:
- **추가/수정만** — 작동하는 기존 검사 제거 금지
- Related Files에 새 파일 경로 추가
- 새 탐지 명령어/워크플로우 단계 추가
- 삭제 확인된 파일 참조 제거
- 변경된 값 업데이트

## Step 6: 새 스킬 생성

1. 관련 파일을 읽어 패턴 이해
2. `AskUserQuestion`으로 스킬 이름 확인 (반드시 `verify-` 접두사, kebab-case)
3. `.claude/skills/verify-<name>/SKILL.md` 생성 (Purpose, When to Run, Related Files, Workflow, Output Format, Exceptions 필수)
4. 연관 파일 업데이트:
   - **4a:** `manage-skills/SKILL.md` 등록된 검증 스킬 테이블
   - **4b:** `verify-implementation/SKILL.md` 실행 대상 스킬 테이블
   - **4c:** `CLAUDE.md` Skills 테이블

## Step 7: 검증

1. 수정된 SKILL.md 재읽기
2. 마크다운 형식 확인
3. 깨진 파일 참조 확인: `ls <file-path> 2>/dev/null || echo "MISSING"`
4. 탐지 명령어 드라이런
5. 등록된 스킬 ↔ 실행 대상 스킬 테이블 동기화 확인

## Step 8: 요약 보고서

```markdown
## 세션 스킬 유지보수 보고서

### 분석된 변경 파일: N개
### 업데이트된 스킬: X개
### 생성된 스킬: Y개
### 업데이트된 연관 파일: [목록]
### 영향없는 스킬: Z개
### 미커버 변경사항: [면제 사유]
```

## 생성/업데이트 품질 기준

- **실제 파일 경로** (`ls`로 검증)
- **작동하는 탐지 명령어** — 현재 파일과 매칭되는 실제 패턴
- **PASS/FAIL 기준** — 각 검사에 대해 명확한 조건
- **최소 2-3개 현실적 예외** — 위반이 아닌 것 설명
- **일관된 형식** — 기존 스킬과 동일
