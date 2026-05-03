# Plan: verify-* 스킬 단계적 정리 — Phase 1 (Quick Win)

## Context

`.claude/skills/verify-*` 23개 스킬 합계 ~14,900 lines. Phase 1은 4건 통합/병합으로 **23 → 19 스킬, ~1,700 lines 감축**.

해결 문제:
- Scope 중복: CAS가 4 스킬 분산, workflows = E2E sub-checklist, QR + handover = 같은 반출 도메인
- verify-cas는 이미 `references/cas-checks.md` 위임 구조 사용 중 → 흡수 시 그 내용도 이전

전체 3-Phase 플랜: 사용자 제공 (Phase 2: mega-skill 분리, Phase 3: ts-morph 자동화). 본 exec-plan은 Phase 1만 다룬다.

---

## 현재 상태 확인 (탐색 완료)

| 스킬 | lines | 비고 |
|---|---|---|
| verify-cas | 150 | 13 step, references/cas-checks.md 위임 적용 중 |
| verify-workflows | 203 | Step 1-7 (WF-01~WF-35 커버리지) |
| verify-qr-ssot | 246 | Step 1-7+3a/3b/3c/3d |
| verify-handover-security | 152 | Step 1-7 (토큰 보안) |
| verify-zod | 890 | CAS backend step 흡수 대상 |
| verify-frontend-state | 1337 | CAS frontend step 흡수 대상 |
| verify-e2e | 1223 | workflows step 흡수 대상 |
| verify-implementation | 99 | 테이블 22행 → 19행 갱신 |

---

## Phase 1 — Overlap 제거

```
Before:                          After:
verify-cas ──────────────────┐   (삭제)
verify-zod                   ├─► verify-zod (CAS backend step 흡수)
verify-frontend-state        ┘   verify-frontend-state (CAS frontend step 흡수)

verify-workflows ────────────┐   (삭제)
verify-e2e                   └─► verify-e2e (workflows step 흡수)

verify-qr-ssot ──────────────┐   (삭제)
verify-handover-security ────┘   (삭제)
                              └─► verify-handover-qr (신규, 양쪽 병합)

verify-implementation            verify-implementation (테이블 19행으로 갱신)
```

### 1.1 verify-cas → verify-zod + verify-frontend-state 흡수

**근거**: verify-cas Step 1-4(VersionedBaseService 상속, versionedSchema DTO, updateWithVersion, onVersionConflict 훅)는 백엔드 Zod/DTO 패턴이므로 verify-zod에 속한다. Step 9(프론트엔드 version 전달), Step 12-13(useCasGuardedMutation, 2-step Dialog CAS)은 verify-frontend-state에 속한다.

**변경**:
- `verify-zod/SKILL.md`: 맨 아래 `### Step N: CAS DTO/서비스 검증` 섹션 추가 (4 step). 기존 `verify-cas/references/cas-checks.md`는 **`verify-zod/references/cas-checks.md`로 이동** 후 verify-zod SKILL.md에서 링크.
- `verify-frontend-state/SKILL.md` + `references/step-details.md`: CAS frontend step (useCasGuardedMutation, 2-step Dialog pre-confirm version 재조회) 추가.
- `.claude/skills/verify-cas/` 디렉토리 전체 삭제.

### 1.2 verify-workflows → verify-e2e 흡수

**근거**: verify-workflows Step 1-7 (WF-01~WF-16 파일 존재, 단계 완전성, 역할, 상태 전이, 부수 효과, serial 모드, DB 리셋)은 verify-e2e의 sub-domain이다.

**변경**:
- `verify-e2e/SKILL.md`: `### Step N: 워크플로우 커버리지 (verify-workflows 통합)` 추가. 상세 Step 1-7은 **신규 `verify-e2e/references/workflows-coverage.md`** 로 추출.
- `.claude/skills/verify-workflows/` 디렉토리 전체 삭제.

### 1.3 verify-qr-ssot + verify-handover-security → verify-handover-qr 통합

**근거**: 두 스킬 모두 반출 QR/토큰 도메인 (같은 `When to Run`, 관련 파일도 `checkouts/` + `qr-*.ts` 교차). 11 + 7 step = 18 step (적정 크기).

**변경**:
- `.claude/skills/verify-handover-qr/SKILL.md` 신규 생성: frontmatter + Purpose + When to Run + Related Files + 두 스킬 step 병합 (QR SSOT Section + Handover Security Section). 각 섹션에 소제목으로 분리.
- `.claude/skills/verify-qr-ssot/` 삭제.
- `.claude/skills/verify-handover-security/` 삭제.

### 1.4 verify-implementation 테이블 갱신

**파일**: `.claude/skills/verify-implementation/SKILL.md`

- 행 #1 `verify-cas` → 삭제 (CAS 검증 설명은 verify-zod, verify-frontend-state 행에 병기)
- 행 #15 `verify-workflows` → 삭제 (E2E 커버리지 설명은 verify-e2e 행에 병기)
- 행 #17 `verify-handover-security` + #18 `verify-qr-ssot` → 단일 행 `verify-handover-qr | both | QR URL/설정/액션 SSOT + Handover/OneTimeToken 보안`
- 번호 재매김: 최종 19행 (#1-19)

### 1.5 참조 파일 갱신

- `docs/references/skills-index.md`: Verify Skills 섹션 4개 항목 제거, `verify-handover-qr` 추가
- `CLAUDE.md` Useful Skills 섹션: "Verify skills (22)" → "Verify skills (19)", 삭제 스킬 이름 제거, `verify-handover-qr` 추가
- `.claude/skills/manage-skills/SKILL.md`: 커버리지 매트릭스에서 삭제 스킬 제거 + 신규 추가

---

## Phase 1 검증 (Evaluator MUST)

```bash
# 1) CAS 키워드가 새 위치에 있는지
grep -l "VERSION_CONFLICT\|casVersion\|VersionedBaseService" .claude/skills/verify-*/SKILL.md
# 기대: verify-zod, verify-frontend-state 두 곳에 모두 포함

# 2) verify-implementation 행 수
grep -c "^| [0-9]" .claude/skills/verify-implementation/SKILL.md
# 기대: 19

# 3) 삭제 스킬 참조 0건 (skills-index.md)
grep -c "verify-cas\|verify-workflows\|verify-qr-ssot\|verify-handover-security" docs/references/skills-index.md
# 기대: 0

# 4) 삭제 디렉토리 없음
ls .claude/skills/verify-cas .claude/skills/verify-workflows .claude/skills/verify-qr-ssot .claude/skills/verify-handover-security 2>&1 | grep -c "No such"
# 기대: 4

# 5) 신규 verify-handover-qr 존재
ls .claude/skills/verify-handover-qr/SKILL.md
# 기대: 파일 존재

# 6) Workflows 키워드 (WF-01~WF-35)가 verify-e2e 영역에 있는지
grep -l "WF-01\|WF-16\|WF-35" .claude/skills/verify-e2e/SKILL.md .claude/skills/verify-e2e/references/*.md
# 기대: workflows-coverage.md 또는 SKILL.md에 출현

# 7) QR/handover 키워드가 verify-handover-qr에 있는지
grep -l "jti\|QR_ACTION_VALUES\|OneTimeToken\|handover" .claude/skills/verify-handover-qr/SKILL.md
# 기대: 모두 출현
```

---

## Critical Files

| 종류 | 경로 |
|---|---|
| 삭제 | `.claude/skills/verify-cas/` |
| 삭제 | `.claude/skills/verify-workflows/` |
| 삭제 | `.claude/skills/verify-qr-ssot/` |
| 삭제 | `.claude/skills/verify-handover-security/` |
| 이동 | `verify-cas/references/cas-checks.md` → `verify-zod/references/cas-checks.md` |
| 신규 | `.claude/skills/verify-handover-qr/SKILL.md` |
| 신규 | `.claude/skills/verify-e2e/references/workflows-coverage.md` |
| 수정 | `.claude/skills/verify-zod/SKILL.md` |
| 수정 | `.claude/skills/verify-frontend-state/SKILL.md` |
| 수정 | `.claude/skills/verify-frontend-state/references/step-details.md` |
| 수정 | `.claude/skills/verify-e2e/SKILL.md` |
| 수정 | `.claude/skills/verify-implementation/SKILL.md` |
| 수정 | `.claude/skills/manage-skills/SKILL.md` |
| 수정 | `CLAUDE.md` |
| 수정 | `docs/references/skills-index.md` |

## Phase 1 게이트

1. `pnpm tsc --noEmit` 영향 없음 (스킬은 TS 컴파일 대상이 아님 — git status 확인으로 갈음)
2. verify-implementation 테이블(19행) ↔ 실제 디렉토리(19개) ↔ skills-index.md 3자 매핑 일치
3. 흡수된 키워드(VERSION_CONFLICT, casVersion, WF-XX, jti, QR_ACTION_VALUES, OneTimeToken)가 새 위치에 grep 가능
4. Phase 1 완료 후 별도 commit (verify-* 스킬 변경만)
