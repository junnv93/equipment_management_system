# Branch Split Plan — chore/remove-recharts-and-stale-e2e

현재 브랜치 `chore/remove-recharts-and-stale-e2e`에 브랜치명과 무관한 작업이 누적되어 있습니다. 이 문서는 안전하게 작업을 분리하는 절차입니다.

**생성일:** 2026-04-07
**적용 대상 브랜치:** `chore/remove-recharts-and-stale-e2e`

## 현재 상태

- **커밋됨 (1개, 올바른 스코프):** `c9e36e35 chore: remove unused recharts dependency and stale chart e2e`
- **uncommitted (40+ 파일, 브랜치명과 무관):** 아래 그룹 참조

## 논리적 그룹 분류

### Group A — Drizzle 마이그레이션 베이스라인 재설정

목적: 여러 개의 점진 마이그레이션을 하나의 baseline으로 통합.

| 파일                                                         |
| ------------------------------------------------------------ |
| `apps/backend/drizzle/0000_loving_phalanx.sql` (D)           |
| `apps/backend/drizzle/0001_neat_union_jack.sql` (D)          |
| `apps/backend/drizzle/0002_friendly_thor_girl.sql` (D)       |
| `apps/backend/drizzle/0003_late_prodigy.sql` (D)             |
| `apps/backend/drizzle/0004_inspection_export_deputy.sql` (D) |
| `apps/backend/drizzle/meta/0000_snapshot.json` (M)           |
| `apps/backend/drizzle/meta/0001_snapshot.json` (D)           |
| `apps/backend/drizzle/meta/0002_snapshot.json` (D)           |
| `apps/backend/drizzle/meta/0003_snapshot.json` (D)           |
| `apps/backend/drizzle/meta/_journal.json` (M)                |
| `apps/backend/drizzle/0000_baseline.sql` (?? new)            |
| `apps/backend/drizzle/archive_pre_baseline/` (?? new)        |
| `docs/development/DRIZZLE_MIGRATIONS.md` (?? new)            |

**브랜치명:** `chore/drizzle-baseline-reset`
**Prefix 근거:** 기능 추가 아님, DB 마이그레이션 정리.

### Group B — Form Template 기능 확장 (검색/히스토리/업로드)

목적: form-templates 모듈에 search bar, history dialog, upload dialog 추가.

| 파일                                                                         |
| ---------------------------------------------------------------------------- |
| `apps/backend/src/modules/reports/form-template.controller.ts` (M)           |
| `apps/backend/src/modules/reports/form-template.service.ts` (M)              |
| `apps/backend/src/modules/reports/dto/form-template.dto.ts` (?? new)         |
| `apps/frontend/components/form-templates/FormTemplateHistoryDialog.tsx` (M)  |
| `apps/frontend/components/form-templates/FormTemplateUploadDialog.tsx` (M)   |
| `apps/frontend/components/form-templates/FormTemplatesContent.tsx` (M)       |
| `apps/frontend/components/form-templates/FormTemplatesTable.tsx` (M)         |
| `apps/frontend/components/form-templates/FormTemplateSearchBar.tsx` (?? new) |
| `apps/frontend/lib/api/form-templates-api.ts` (M)                            |
| `apps/frontend/lib/api/reports-api.ts` (M)                                   |
| `apps/frontend/lib/api/query-config.ts` (M)                                  |
| `apps/frontend/lib/api/error.ts` (M)                                         |
| `apps/frontend/lib/api/utils/download-file.ts` (M)                           |
| `apps/frontend/lib/design-tokens/components/form-templates.ts` (M)           |
| `apps/frontend/lib/design-tokens/index.ts` (M)                               |
| `apps/frontend/messages/en/form-templates.json` (M)                          |
| `apps/frontend/messages/ko/form-templates.json` (M)                          |
| `packages/db/src/schema/form-templates.ts` (M)                               |
| `packages/schemas/src/form-template.ts` (?? new)                             |
| `packages/schemas/src/errors.ts` (M)                                         |
| `packages/schemas/src/index.ts` (M)                                          |
| `packages/shared-constants/src/api-endpoints.ts` (M)                         |
| `packages/shared-constants/src/file-types.ts` (M)                            |
| `packages/shared-constants/src/form-catalog.ts` (M)                          |
| `packages/shared-constants/src/index.ts` (M)                                 |
| `packages/shared-constants/src/permissions.ts` (M)                           |
| `packages/shared-constants/src/role-permissions.ts` (M)                      |
| `apps/backend/src/main.ts` (M) ← multipart/upload 설정이면 여기, 아니면 별도 |

**브랜치명:** `feat/form-template-search-history-upload`

### Group C — UL-QP-03 문서관리 절차서 추가

목적: 새 절차서 PDF + 마크다운 추가.

| 파일                                                                   |
| ---------------------------------------------------------------------- |
| `docs/procedure/UL-QP-03(17) 문서 관리 절차서 - 20260114.pdf` (?? new) |
| `docs/procedure/절차서/UL-QP-03 문서관리절차서.md` (?? new)            |

**브랜치명:** `docs/add-qp03-document-procedure`

### Group D — Workflow 강화 (이번 세션)

목적: Git workflow 규칙 문서화 및 SessionStart hook 강화.

| 파일                                                      |
| --------------------------------------------------------- |
| `CLAUDE.md` (M) — Git Workflow Rules 섹션                 |
| `.claude/settings.json` (M) — dirty/diverged 감지 추가    |
| `docs/development/BRANCH_SPLIT_PLAN.md` (?? new, 이 파일) |

**브랜치명:** `chore/git-workflow-hardening`

### Group E — 확인 필요 (의도 불명)

다음은 어느 그룹에도 명확히 속하지 않아 사용자 확인 필요:

| 파일                              | 의심                                                             |
| --------------------------------- | ---------------------------------------------------------------- |
| `.github/workflows/main.yml` (M)  | CI 변경 — 어떤 작업과 연결되는지?                                |
| `apps/frontend/next-env.d.ts` (M) | Next.js 자동 생성 파일 — `git checkout --` 로 되돌려도 될 가능성 |
| `uploads/` (?? new)               | 런타임 업로드 디렉토리? `.gitignore`에 추가할 대상일 가능성      |

## 안전 분리 절차

### 0단계: 안전 백업 (필수)

모든 작업 전에 전체 상태를 스냅샷 브랜치로 보존.

```bash
# 현재 브랜치에서 uncommitted 포함 전체를 wip 브랜치에 저장
git checkout -b wip/drifted-backup-20260407
git add -A
git commit -m "wip: safety backup before branch split"
git checkout chore/remove-recharts-and-stale-e2e
# 원래 브랜치는 이제 clean 상태 (recharts 커밋만 존재)
```

이제 `wip/drifted-backup-20260407`에 모든 변경이 보존되어 있습니다. 각 그룹은 이 브랜치에서 파일을 꺼내 새 브랜치로 이동시킵니다.

### 1단계: 각 그룹을 새 브랜치에 복제

각 그룹마다 반복:

```bash
# 예: Group A (Drizzle baseline)
git checkout main
git pull --ff-only
git checkout -b chore/drizzle-baseline-reset

# wip 브랜치에서 필요한 파일만 checkout
git checkout wip/drifted-backup-20260407 -- \
  apps/backend/drizzle/ \
  docs/development/DRIZZLE_MIGRATIONS.md

# 검증
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --grep "migration"

# 커밋 후 PR (사용자 확인 후)
git add -A
git commit -m "chore(db): consolidate migrations into 0000_baseline"
git push -u origin chore/drizzle-baseline-reset
gh pr create --fill
```

### 2단계: Group B, C, D 반복

동일한 패턴으로 각 그룹별 브랜치 생성 → 파일 checkout → 검증 → 커밋 → PR.

**주의:** Group B(form-template)는 packages/ 변경이 많아서 `pnpm tsc --noEmit` 전체 + `pnpm test` 통과 확인 필수.

### 3단계: 확인 필요 파일(Group E) 처리

사용자와 상의 후:

- `next-env.d.ts`: 자동 생성이면 `git checkout -- apps/frontend/next-env.d.ts`
- `uploads/`: `.gitignore` 추가 PR 또는 삭제
- `main.yml`: 어떤 변경인지 diff 확인 후 관련 그룹으로 이동

### 4단계: wip 브랜치 정리

모든 그룹이 머지되고 나면:

```bash
git branch -D wip/drifted-backup-20260407
```

## 분리 원칙

- **절대 `git reset --hard` 사용 금지** — wip 브랜치가 백업이지만 습관적으로 금지
- **각 그룹은 독립적으로 빌드/테스트 통과해야 함** — 의존성 있으면 순서 조정 (A → B 순서일 가능성)
- **PR은 한 번에 하나씩 머지** — 충돌 최소화
- **Group B의 packages/ 변경이 Group A(drizzle)에 의존**한다면 A 먼저 머지 후 B 작업
