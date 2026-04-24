---
name: git-commit
description: Analyzes git changes to generate conventional commit messages and auto-selects workflow (direct push to main vs branch+PR) based on change size. Use when the user wants to commit, push, save changes, or prepare a PR. Trigger on: "커밋해줘", "커밋하고 푸시해줘", "변경사항 정리해줘", "git commit", "코드 올려줘", "commit", "push", "save changes", "create PR", "세션 마무리해줘".
---

# Git 커밋 + 배포 워크플로우

## 개요

변경사항을 분석하여 커밋 메시지를 생성하고, **변경 규모에 따라 워크플로우를 자동 결정**합니다:
- **작은 수정** → main에 직접 커밋+푸시
- **큰 변경** → 브랜치 생성 + 커밋+푸시 + PR 생성

사용자가 별도 지시를 하면 그에 따릅니다 ("PR로 해줘", "그냥 main에 푸시해줘" 등).

## 워크플로우

### Step 1: 세션 변경 파일 파악 (필수 선행 단계)

**먼저 이번 대화 컨텍스트에서 Edit/Write 도구로 실제 작업한 파일 목록을 추출합니다.**

대화 이력에서 Edit·Write 도구 호출 내역을 검토하여 이번 세션에서 수정·생성한 파일 경로를 목록화합니다. 이 목록이 커밋 대상의 기준입니다.

그 다음 git 상태를 확인합니다:

```bash
git status --short
git branch --show-current
git diff --staged --stat
```

**중요 원칙**:
- **세션에서 작업한 파일만 스테이징합니다** — `git status`에 보이더라도 이번 세션에서 건드리지 않은 파일은 절대 포함하지 않음
- 사용자가 "전체 변경사항 다 커밋해줘"라고 명시하면 그에 따름
- staged 변경이 없으면 세션 파일 중 unstaged 변경을 기준으로 함
- 세션에서 작업한 파일이 없거나 이미 모두 커밋된 경우 사용자에게 알리고 종료
- **현재 브랜치가 main이 아니면** → 해당 브랜치에서 커밋+푸시 (새 브랜치 생성 불필요)

### Step 2: 워크플로우 결정

현재 브랜치가 main일 때만 적용합니다. feature 브랜치에 이미 있으면 그 브랜치에서 커밋+푸시합니다.

| 조건 | 결정 | 이유 |
|---|---|---|
| 변경 파일 1~3개 AND 로직 변경 없음 | **main 직접 푸시** | 린트/오타/설정 수정은 리뷰 불필요 |
| i18n, 주석, README, 설정 파일만 변경 | **main 직접 푸시** | 코드 동작에 영향 없음 |
| `.claude/`, `.github/dependabot.yml` 변경 | **main 직접 푸시** | 개발 도구/봇 설정 변경 |
| `*.service.ts`, `*.controller.ts` 변경 | **브랜치+PR** | 비즈니스 로직 변경 |
| `Dockerfile`, `docker-compose` 변경 | **브랜치+PR** | 인프라 변경 |
| `.github/workflows/` CI 파이프라인 변경 | **브랜치+PR** | CI 변경은 검증 필요 |
| DB 스키마 (`packages/db/`) 변경 | **브랜치+PR** | 데이터 구조 변경 |
| 파일 4개 이상 변경 | **브랜치+PR** | 규모가 큰 변경 |
| 사용자가 명시적으로 지정 | **지정대로** | 사용자 의도 우선 |

**애매한 경우**: 사용자에게 한 문장으로 물어봅니다:
> "파일 5개 변경 (컴포넌트 3개 + i18n 2개). PR로 진행할까요, main에 바로 푸시할까요?"

### Step 3: 변경사항 분석 + 커밋 메시지 생성

```bash
git diff --staged  # 또는 git diff
git log --oneline -5  # 커밋 메시지 스타일 참고
```

#### 커밋 타입

| 타입 | 사용 시점 |
|---|---|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 포맷팅 (기능 변경 없음) |
| `refactor` | 코드 리팩토링 |
| `test` | 테스트 코드 추가/수정 |
| `chore` | 빌드, 의존성, 설정 등 |
| `perf` | 성능 개선 |
| `ci` | CI/CD 파이프라인 변경 |

#### 메시지 형식

```
<타입>(<선택: 스코프>): <제목 — 소문자 시작, 50자 이내, 마침표 없음>

<본문 — 변경 이유와 내용, 72자 줄바꿈>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**commitlint 규칙**:
- subject는 소문자로 시작 (sentence-case 금지)
- 스코프가 있으면 괄호 사용: `feat(frontend): ...`
- HEREDOC으로 커밋 메시지 전달 (줄바꿈 보존)

#### 논리적 커밋 분리

여러 종류의 변경이 섞여있으면 논리적 단위로 분리하여 커밋합니다:
- 기능 추가 + 린트 수정 → 2개 커밋
- 백엔드 변경 + 프론트엔드 변경 → 관련 있으면 1개, 독립적이면 2개

### Step 4: 실행

#### A. main 직접 푸시 경로

```bash
# 1. 세션에서 작업한 파일만 스테이징 (구체적 파일명 — git add -A 사용 금지)
git add <session-file1> <session-file2> ...

# 2. 커밋 (HEREDOC으로 메시지 전달)
git commit -m "$(cat <<'EOF'
<커밋 메시지>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 3. 푸시
git push origin main
```

#### B. 브랜치+PR 경로

```bash
# 1. 브랜치 생성 (타입/설명 형식) — 이미 feature 브랜치면 스킵
git checkout -b <type>/<short-description>
# 예: feat/excel-export, fix/login-error, refactor/cache-strategy

# 2. 세션에서 작업한 파일만 스테이징 + 커밋
git add <session-files>
git commit -m "$(cat <<'EOF'
<커밋 메시지>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 3. 푸시
git push -u origin <branch-name>

# 4. PR 생성 (open PR이 없을 때만)
gh pr create --title "<PR 제목>" --body "$(cat <<'EOF'
## Summary
<변경 내용 1~3줄>

## Test plan
<검증 방법>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

PR 생성 후 URL을 사용자에게 알려줍니다.

### Step 5: pre-commit hook 대응

이 프로젝트는 Prettier가 PostToolUse hook으로 자동 실행됩니다.

- 커밋 후 "file was modified by a linter" 메시지가 나오면 → `git diff`로 확인
- 실제 내용이 변경된 게 아니라 포맷만 바뀐 경우 → 무시 (커밋은 이미 성공)
- pre-commit hook이 커밋을 거부한 경우 → 문제 수정 후 **새 커밋 생성** (amend 금지)

### Step 6: 결과 보고

```
커밋 완료:
- 방식: main 직접 푸시 / PR #XX 생성
- 브랜치: main / feat/xxx
- 커밋: <hash> <메시지 제목>
- 변경: N개 파일, +XX/-YY lines
```

## 예시

### 예시 1: 작은 수정 → main 직접 푸시

```
변경: messages/ko/equipment.json (번역 오타 수정)
→ 판단: i18n 파일 1개, 동작 영향 없음 → main 직접 푸시
→ 커밋: fix: 장비 번역 오타 수정
```

### 예시 2: 기능 추가 → 브랜치+PR

```
변경: equipment.service.ts, equipment.controller.ts,
      EquipmentExport.tsx, equipment-api.ts (4개 파일)
→ 판단: 서비스/컨트롤러 변경 + 4개 파일 → 브랜치+PR
→ 브랜치: feat/equipment-excel-export
→ PR #35: "feat: 장비 엑셀 내보내기 기능 추가"
```

### 예시 3: feature 브랜치에서 추가 커밋

```
현재 브랜치: feat/qp18-export (이미 PR #135 열려있음)
변경: self-inspections.service.spec.ts, package.json
→ 판단: 이미 feature 브랜치 → 해당 브랜치에 커밋+푸시
→ 커밋: test: add unit tests for self-inspections
→ 푸시: feat/qp18-export (기존 PR #135에 반영)
```

### 예시 4: 사용자가 명시적 지정

```
사용자: "PR 없이 그냥 푸시해줘"
→ 사용자 지시 우선 → main 직접 푸시
```

## 주의사항

- **이번 세션에서 작업한 파일만 커밋** — git status에 보이는 다른 파일(이전 세션·다른 프로세스 수정)은 건드리지 않음
- 사용자가 명시적으로 "전체 다 커밋해줘"라고 하면 세션 제한 없이 git status 기준으로 처리
- 하나의 커밋에는 하나의 논리적 변경사항만 포함
- `git add -A`나 `git add .` 사용 금지 — 구체적 파일명 나열
- `.env`, 시크릿 파일은 커밋하지 않음 — 발견 시 경고
- 이미 open PR이 있는 브랜치에서는 PR 중복 생성하지 않음
- `--no-verify`로 hook 우회 금지 — hook 실패 시 원인 파악 후 수정
