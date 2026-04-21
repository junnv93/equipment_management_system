---
name: harness-docs
description: "Harness prompts lifecycle manager — two workflows in one skill. (1) Session-start curator reads example-prompts.md + tech-debt-tracker.md and generates a prioritized work list for the current session. (2) Archive manager detects completed sections in example-prompts.md (all items strikethrough ✅), moves them to example-prompts-archive.md in domain order, and updates section headers. Trigger on '이번 세션 프롬프트 작성해줘', 'harness 멘트 작성', '백로그 정리', '완료 처리해줘', '아카이브로 이동', 'example-prompts 정합화', '세션 정리'."
---

# Harness Docs

두 가지 모드: **Session Start** (세션 시작 시 작업 목록 생성) / **Archive** (완료 섹션 아카이브 이동).
포맷 상세: [references/format-conventions.md](references/format-conventions.md)

---

## Mode 1: Session Start — 세션 프롬프트 생성

트리거: "이번 세션 프롬프트", "harness 멘트", "백로그에서 이번에 할 거", "작업 목록"

### Step 1: 현재 오픈 항목 수집

두 파일을 병렬로 읽는다:
- `.claude/skills/harness/references/example-prompts.md` — `###` 헤더 중 `~~` strikethrough 없는 항목 = 미완료
- `.claude/exec-plans/tech-debt-tracker.md` — `- [ ]` 로 시작하는 줄 = 미완료

파일이 너무 크면 `offset`/`limit` 파라미터로 분할 읽기.

### Step 2: 우선순위 정렬

```
🔴 CRITICAL > 🟠 HIGH > 🟡 MEDIUM > 🟢 LOW
```

같은 우선순위 내에서는 `example-prompts.md` 순서 유지.
tech-debt `- [ ]` 항목은 SHOULD 수준으로 분류.

### Step 3: 세션 프롬프트 출력

아래 형식으로 출력:

```markdown
## 이번 세션 작업 목록 — YYYY-MM-DD

### example-prompts.md 오픈 항목

| 우선순위 | 항목 | Mode | 추정 |
|----------|------|------|------|
| 🔴 CRITICAL | [항목명] | Mode N | Xh |
| 🟠 HIGH | [항목명] | Mode N | Xh |

### tech-debt-tracker.md 오픈 항목

- [ ] [항목 설명] — [날짜/slug]

### 권장 실행 순서

1. [CRITICAL/HIGH 항목 — 이유]
2. ...
```

---

## Mode 2: Archive — 완료 섹션 이동

트리거: "완료 처리", "아카이브로 이동", "완료된 거 정리", "세션 정리", "정합화"

### Step 1: 완료 섹션 탐지

`example-prompts.md`를 읽고 섹션별로 스캔:
- 섹션 내 모든 `### ` 아이템이 `~~...~~ ✅` 형태면 → **이동 대상**
- `❓ 사용자 결정 대기` 아이템이 있으면 → 사용자 확인 요청 후 이동
- 하나라도 오픈 아이템(`~~` 없는 `### 🔴/🟠/🟡/🟢`) 있으면 → **유지**

완료 섹션 목록을 사용자에게 확인:
```
이동 대상 섹션:
- [YYYY-MM-DD 섹션명] (N건 완료)
- ...

이동하기 전 확인해 주세요.
```

### Step 2: 아카이브로 이동

1. `example-prompts-archive.md` 읽기
2. 파일 상단 헤더 바로 아래(`---` 구분선 아래)에 완료 섹션 삽입 (최신 순 유지)
3. `example-prompts.md`에서 해당 섹션 삭제
4. `example-prompts.md` 상단 메타 주석의 날짜/상태 업데이트

### Step 3: 섹션 헤더 업데이트

아카이브로 이동할 때 섹션 헤더에 완료 요약 추가 (없으면):
```markdown
## ~~YYYY-MM-DD 신규 — [작업명]~~ ✅ 전체 완료
```

### Step 4: 아카이브 파일 크기 체크

이동 완료 후 `example-prompts-archive.md` 줄 수 확인:
- 1,500줄 미만: 현행 유지
- 1,500줄 이상: 도메인별 분리 권장 안내 (분류 기준은 format-conventions.md 참조)

---

## Mode 3: Tech Debt Sync — 완료 항목 아카이브 이동

트리거: "tech-debt 정합화", "완료된 부채 처리", "완료된 거 아카이브로", "tech-debt 정리"

### Step 1: 완료 항목 탐지

`tech-debt-tracker.md`를 읽고 `- [x]` 항목 스캔:
- `- [x]` 항목이 존재하면 → **이동 대상**
- `- [ ]` 항목만 있으면 → "정합화 완료, 이동 대상 없음" 안내

### Step 2: 사용자 확인 요청

이동 전 확인:
```
이동 대상 [x] 항목: N건
이동 위치: .claude/exec-plans/tech-debt-tracker-archive.md

진행할까요?
```

### Step 3: 아카이브로 이동

1. `tech-debt-tracker-archive.md` 읽기
2. 날짜 섹션별로 `[x]` 항목을 아카이브 파일 상단(최신 순)에 삽입
3. `tech-debt-tracker.md`에서 `[x]` 항목 삭제
4. `[ ]` 항목과 섹션 헤더(내용이 있는 것만)는 유지

### Step 4: 아카이브 파일 크기 체크

이동 완료 후 `tech-debt-tracker-archive.md` 줄 수 확인:
- 500줄 미만: 현행 유지
- 500줄 이상: "날짜 기준 오래된 섹션 별도 파일 분리 권장" 안내

---

## 주의사항

- 파일 이동 전 반드시 사용자 확인 (돌이킬 수 없는 변경)
- `❓ 사용자 결정 대기` 항목은 사용자 답변 없이 완료 처리 금지
- archive 파일 섹션 순서: 최신 차수가 위 (역순)
- 포맷 불명확 시 [references/format-conventions.md](references/format-conventions.md) 참조
