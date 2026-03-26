---
name: git-commit
description: Git 변경사항을 분석하여 컨벤셔널 커밋 메시지를 생성하고, 변경 규모에 따라 main 직접 푸시 또는 브랜치+PR 워크플로우를 자동 결정합니다. "커밋해줘", "커밋하고 푸시해줘", "변경사항 정리해줘", "git commit", "코드 올려줘" 등의 요청에 사용하세요. 코드 수정 완료 후 사용자가 결과물을 저장하고 싶을 때도 이 스킬을 사용하세요.
---

# Git 커밋 + 배포 워크플로우

## 개요

변경사항을 분석하여 커밋 메시지를 생성하고, **변경 규모에 따라 워크플로우를 자동 결정**합니다:
- **작은 수정** → main에 직접 커밋+푸시
- **큰 변경** → 브랜치 생성 + 커밋+푸시 + PR 생성

사용자가 별도 지시를 하면 그에 따릅니다 ("PR로 해줘", "그냥 main에 푸시해줘" 등).

## 워크플로우

### Step 1: 변경사항 수집

```bash
git status --short
git diff --staged --stat
git diff --stat
```

staged 변경이 없으면 unstaged 변경을 기준으로 합니다.
변경사항이 없으면 사용자에게 알리고 종료합니다.

### Step 2: 워크플로우 결정

다음 기준으로 **직접 푸시 vs PR**을 결정합니다:

| 조건 | 결정 | 이유 |
|---|---|---|
| 변경 파일 1~3개 AND 로직 변경 없음 | **main 직접 푸시** | 린트/오타/설정 수정은 리뷰 불필요 |
| i18n, 주석, README, 설정 파일만 변경 | **main 직접 푸시** | 코드 동작에 영향 없음 |
| `.claude/skills/` 파일만 변경 | **main 직접 푸시** | 개발 도구 설정 변경 |
| `*.service.ts`, `*.controller.ts` 변경 | **브랜치+PR** | 비즈니스 로직 변경 |
| `Dockerfile`, `docker-compose`, CI 변경 | **브랜치+PR** | 인프라 변경 |
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

#### 메시지 형식

```
<타입>(<선택: 스코프>): <제목 — 소문자 시작, 50자 이내, 마침표 없음>

<본문 — 변경 이유와 내용, 72자 줄바꿈>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
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
# 1. 파일 스테이징 (구체적 파일명 — git add -A 사용 금지)
git add <file1> <file2> ...

# 2. 커밋 (HEREDOC으로 메시지 전달)
git commit -m "$(cat <<'EOF'
<커밋 메시지>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"

# 3. 푸시
git push origin main
```

#### B. 브랜치+PR 경로

```bash
# 1. 브랜치 생성 (타입/설명 형식)
git checkout -b <type>/<short-description>
# 예: feat/excel-export, fix/login-error, refactor/cache-strategy

# 2. 파일 스테이징 + 커밋
git add <files>
git commit -m "$(cat <<'EOF'
<커밋 메시지>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"

# 3. 푸시
git push -u origin <branch-name>

# 4. PR 생성
gh pr create --title "<PR 제목>" --body "$(cat <<'EOF'
## Summary
<변경 내용 1~3줄>

## Test plan
<검증 방법>

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

PR 생성 후 URL을 사용자에게 알려줍니다.

### Step 5: 결과 보고

```
커밋 완료:
- 방식: main 직접 푸시 / PR #XX 생성
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

### 예시 3: 사용자가 명시적 지정

```
사용자: "PR 없이 그냥 푸시해줘"
→ 사용자 지시 우선 → main 직접 푸시
```

## 주의사항

- 하나의 커밋에는 하나의 논리적 변경사항만 포함
- `git add -A`나 `git add .` 사용 금지 — 구체적 파일명 나열
- `.env`, 시크릿 파일은 커밋하지 않음 — 발견 시 경고
- pre-commit hook 실패 시 새 커밋 생성 (amend 금지)
- PR 생성 시 `GH_TOKEN` 환경변수 필요 — 없으면 사용자에게 안내
