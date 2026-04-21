# UltraReview 사용 가이드 — Equipment Management System

> **목적**: `/ultrareview`를 7-Layer 리뷰 방어선의 Layer 6(머지 관문)으로 활용하는 방법.
> 모든 판정 기준은 기존 SSOT에서 파생되며 이 문서에 하드코딩하지 않는다.

---

## 개요

`/ultrareview`는 Claude Code v2.1.86+에서 제공하는 원격 multi-agent fleet 딥 코드 리뷰 기능이다.
pre-commit / pre-push / verify-\* / review-architecture 가 놓치는 **의미론적·동시성·재발 버그**를 독립 재현 검증으로 탐지한다.

### 기존 레이어와의 역할 분담

| Layer  | 도구                                          | 책임                                                         | 비용          |
| ------ | --------------------------------------------- | ------------------------------------------------------------ | ------------- |
| L0     | IDE + PostToolUse                             | Prettier/eslint                                              | 0             |
| L1     | Pre-commit (4-stage)                          | SOPS / gitleaks / lint-staged / self-audit                   | 0             |
| L2     | Pre-push                                      | tsc + test                                                   | 0             |
| L3     | verify-\* (18개)                              | grep 기반 SSOT/권한/CAS 패턴 정적 체크                       | 0             |
| L4     | /review · review-architecture · review-design | 단일 패스 설계·패턴 리뷰                                     | plan 포함     |
| L5     | harness (Mode 0/1/2)                          | 3-agent 구현 자동화                                          | plan 포함     |
| **L6** | **ultrareview**                               | **다중 에이전트 독립 재현 검증 — 재현 가능한 버그만 리포트** | **$5~$20/회** |

**L6 전용 책임 영역** (L1~L5로 구조상 탐지 불가):

- Cross-module race condition (CAS × 이벤트 × 캐시 동시 변경)
- 트랜잭션 경계 위반의 동시성 영향 (outer tx + inner `this.db`)
- Stale closure가 실제 UI 흐름에서 재현되는지 (`review-learnings.md` CAS 4차 재발 대응)
- 대규모 리팩토링의 회귀 위험 (50+ 파일 변경)

### Anti-patterns

- `/review` 통과 직후 중복으로 `/ultrareview` 실행 (L4 already done)
- L3 verify-\* 로 커버되는 SSOT/하드코딩/lint 이슈에 L6 투입
- 스타일·문서·주석 변경에 사용
- 모든 커밋마다 자동 실행 (비용·시간 낭비)

---

## 환경 조건 (Blocking)

| 조건                          | 상태                      | 비고                   |
| ----------------------------- | ------------------------- | ---------------------- |
| Claude.ai 계정 인증           | 필수 (`/login` 으로 인증) | API key 단독 불가      |
| Amazon Bedrock                | **불가**                  | —                      |
| Google Cloud Vertex AI        | **불가**                  | —                      |
| Microsoft Azure Foundry       | **불가**                  | —                      |
| Zero Data Retention(ZDR) 조직 | **불가**                  | —                      |
| Extra usage 활성화            | 3회 무료 이후 필요        | `/extra-usage` 로 확인 |

현재 환경: 개인 Pro/Max 계정, ZDR off (2026-04-21 기준)

---

## 비용 거버넌스

| 요금         | 내용                                            |
| ------------ | ----------------------------------------------- |
| Pro/Max 3회  | One-time 무료 (계정당, 갱신 없음)               |
| 이후         | Extra usage — 변경 크기에 따라 $5~$20/회        |
| 권고 월 상한 | $30 (실제 예산에 맞춰 `/extra-usage` 에서 조정) |

**Quota 소진 시**: `UR-3` 프롬프트(`example-prompts.md`)로 로컬 fleet 대체.

---

## Trigger Derivation Algorithm

판정 기준은 이 문서에 직접 기입하지 않는다. 아래 3개 SSOT를 실시간 파싱하여 도출한다:

### 입력 SSOT

| #   | 위치                                                                | 파싱 대상                                                  |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | `CLAUDE.md:142-151`                                                 | "브랜치 필요한 예외" 4항목                                 |
| 2   | `.claude/skills/review-architecture/references/review-learnings.md` | `✅ 승격 완료` / `N차 재발` 섹션의 패턴명 + 발견 위치 경로 |
| 3   | `git diff --name-only HEAD...origin/main`                           | 실제 변경 파일 목록                                        |

### 판정 알고리즘

```
diff_files  = git diff --name-only HEAD...origin/main
high_risk   = review-learnings.md에서 승격 완료 / 2차+ 재발 섹션 파싱
exceptions  = CLAUDE.md "브랜치 필요한 예외" 파싱

exception_match = diff_files ∩ exceptions.patterns
category_match  = diff_files ∩ high_risk.file_paths (모듈명 매칭)
trivial         = 모든 파일이 docs/주석/seed 또는 LoC < 50

Go iff NOT trivial AND (exception_match OR category_match)
```

### 실행

```bash
node scripts/ultrareview-advisor.mjs        # 상세 판정
node scripts/ultrareview-advisor.mjs --hint # 1줄 요약 (pre-push 출력용)
node scripts/ultrareview-advisor.mjs --json # JSON (jq 파이프용)
```

---

## Dry-run 시나리오

### Sim-A: No-Go (트리비얼 변경)

```
변경: docs/references/frontend-patterns.md (1 파일, +12 LoC)
결과: No-Go (트리비얼 변경 감지) — /review로 충분
```

### Sim-B: Go (CAS + 서비스 동시 변경)

```
변경: apps/backend/src/modules/equipment/services/equipment-approval.service.ts (+80 LoC)
       apps/frontend/app/(dashboard)/equipment/[id]/TestSoftwareDetailContent.tsx (+40 LoC)
결과: Go (CAS_STALE — 4차 재발 패턴 매칭, $5~$10)
     → preflight 통과 후 /ultrareview <PR번호> 실행
```

### Sim-C: Go (트랜잭션 경계 + data-migration)

```
변경: apps/backend/src/modules/data-migration/services/data-migration.service.ts (+60 LoC)
결과: Go (TRANSACTION — 3차 재발 패턴 매칭, $5~$10)
     → preflight 통과 후 /ultrareview <PR번호> 실행
```

### Sim-D: Secret Gate 차단

```
preflight 실행 → .env.local 발견 → exit 1
조치: rm apps/frontend/.env.local 후 재실행
```

---

## Pre-upload Secret Gate

ultrareview는 working tree를 원격 샌드박스로 번들 업로드한다.
`.gitignore` 에 있어도 실제 파일이 존재하면 포함될 수 있다.

**항상 업로드 전 실행**:

```bash
node scripts/ultrareview-preflight.mjs
```

Gate 3단계:

1. 위험 파일 존재 여부 (`.env.local`, `*.age`, `*.sops.decrypted`, `run/secrets/`)
2. gitleaks working tree 전체 스캔 (`--no-git --source .`)
3. 최근 5 커밋 diff 재확인

설정 파일: `.gitleaks.toml` (기본 룰셋 상속 + 프로젝트별 패턴)
관련: `infra/secrets/README.md`, ADR-0005

---

## 전체 실행 흐름

```bash
# 1. Go/No-Go 판정
node scripts/ultrareview-advisor.mjs

# Go 판정 시 →

# 2. Pre-upload secret gate
node scripts/ultrareview-preflight.mjs    # exit 1이면 조치 후 재실행

# 3. 원격 리뷰 시작 (PR 모드 권장)
/ultrareview <PR번호>

# 4. 백그라운드 실행 (5~10분) — 다른 작업 계속
/tasks                                    # 결과 확인

# 5. Finding 처리
# UR-2 harness 프롬프트 (example-prompts.md) 참조
```

---

## Finding 처리 (UR-2)

ultrareview finding 처리 파이프라인:

```
finding 수신
  └─ category 분류 → verify-* 매핑 2차 검증
       ├─ CAS 관련     → verify-cas 스킬 + VersionedBaseService 패턴
       ├─ 권한 관련    → verify-auth 스킬 + Permission enum + PermissionsGuard
       ├─ 이벤트/캐시  → verify-cache-events 스킬
       ├─ Zod 관련     → verify-zod 스킬
       └─ 기타         → review-architecture 스킬
  ├─ true positive  → 수술적 fix + tsc + spec + review-learnings.md append
  └─ false positive → review-learnings.md false-positive 섹션 기록 (학습)
```

세부 단계: `.claude/skills/harness/references/example-prompts.md` — UR-2 프롬프트 참조.

---

## 피드백 루프 (Review-Learnings Self-Learning)

UR-2 완료 시 evaluator가 결과를 `review-learnings.md`에 append:

```
[YYYY-MM-DD] {pattern} — {location} ({n}차 재발)
```

**3회 재발 임계**: evaluator가 동일 패턴 3회 도달 감지 시 `manage-skills` 스킬로 신규 verify-\* 스킬 생성 제안.
→ `manage-skills` Step 4a/4b/4c: manage-skills 테이블 + verify-implementation 매트릭스 + CLAUDE.md Useful Skills 동시 업데이트.

---

## 관련 문서

| 문서                        | 위치                                                                     |
| --------------------------- | ------------------------------------------------------------------------ |
| 거버넌스·프로덕션 전환 정책 | `docs/operations/ultrareview-governance.md`                              |
| Secret 관리 (sops+age)      | `docs/operations/secret-backup.md`, `docs/operations/secret-rotation.md` |
| Pre-commit 4-stage 구성     | `.husky/pre-commit`                                                      |
| Harness 프롬프트 (UR-1/2/3) | `.claude/skills/harness/references/example-prompts.md`                   |
| Review learnings SSOT       | `.claude/skills/review-architecture/references/review-learnings.md`      |
| Verify-\* 커버리지 매트릭스 | `.claude/skills/verify-implementation/SKILL.md:23-42`                    |
| 공식 문서                   | https://code.claude.com/docs/en/ultrareview                              |
