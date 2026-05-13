# Evaluation: drizzle-adr0010-ci-alignment
날짜: 2026-05-13
Iteration: 1

## MUST Results

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M-1 | `.github/workflows/main.yml`에서 drizzle-kit generate를 **실행**하는 코드 0건 | **PASS** | `drizzle-kit generate` 문자열은 L133/138/147/151에 등장하나 전부 주석(`#`) 또는 `grep -rn "drizzle-kit generate"` 검색어 문자열로만 사용. 직접 실행 패턴(`exec drizzle-kit generate`, `run drizzle-kit generate`, ` drizzle-kit generate$`) grep 결과 0건. |
| M-2 | `.github/workflows/main.yml`에서 `drizzle-kit push`를 **실행**하는 코드 0건 | **PASS** | L316에 `# ADR-0010: drizzle-kit push --force 금지` 주석만 존재. `db:push` 스크립트 호출도 0건. 직접 실행 패턴 0건. |
| M-3 | CI에서 DB 마이그레이션이 `db:migrate` 또는 `drizzle-kit migrate` 사용 | **PASS** | L318: `run: pnpm --filter backend run db:migrate` (unit-test job "Run DB Migrations" step). L317 주석에 `drizzle-kit push --force 금지 → journal-based migrate 사용` 명시. `db:migrate = npx drizzle-kit migrate` 내부 구현 확인. |
| M-4 | CI에 ADR-0010 generate 차단 grep step 존재 | **PASS** | L130: `- name: Drizzle — ADR-0010 Compliance Check`. L138–150: `VIOLATIONS=$(grep -rn "drizzle-kit generate" ...)` + `[ -n "$VIOLATIONS" ] && exit 1` 패턴. step name에 "ADR-0010" 포함 및 generate 차단 grep 명령 포함. |
| M-5 | `apps/backend/package.json`에 `"db:generate"` 스크립트 없음 | **PASS** | `grep -c '"db:generate"' apps/backend/package.json` → `0`. scripts 섹션에 `db:migrate`, `db:push`, `db:push:force`, `db:studio`, `db:test:migrate`, `db:verify`, `db:seed`, `db:reset` 8개 존재, `db:generate`는 없음. |
| M-6 | `.husky/pre-push`에 snapshot 변경 차단 guard 존재 | **PASS** | L55–68: `# ── ADR-0010: snapshot 파일 변경 차단` 블록. L58–60: `git diff --name-only "origin/main..HEAD"` + `grep 'apps/backend/drizzle/meta/.*_snapshot\.json'` 패턴으로 `_snapshot.json` 변경 감지. |
| M-7 | `.husky/pre-push`의 snapshot guard 블록에 `exit 1` 포함 | **PASS** | L66: `exit 1` — snapshot 변경 감지 if 블록(L61) 내부에 위치. 블록 범위: L61 `if [ -n "$_SNAPSHOT_CHANGED" ]; then` ~ L67 `fi`. |
| M-8 | `docs/adr/0010-drizzle-manual-sql-policy.md` SHOULD 항목 완료 표시 | **PASS** | L112: `(SHOULD → ✅ 완료 2026-05-13) CI grep 으로 PR 에서 drizzle-kit generate 호출 자동 차단`. L118: `(SHOULD → ✅ 완료 2026-05-13) .github/workflows/main.yml CI ADR-0010 정합 완료`. 2건 모두 완료 표시. |

## 추가 관찰 (MUST 외)

- **`db:push` / `db:push:force` 스크립트 잔존**: `apps/backend/package.json` L29–30에 `"db:push": "npx drizzle-kit push"`, `"db:push:force": "npx drizzle-kit push --force"` 스크립트가 존재. ADR-0010에서 `drizzle-kit push`도 금지 대상이나, M-5 기준은 `db:generate` 제거만 측정. CI에서 직접 호출 0건이므로 MUST 기준 위반은 아님. 단, 실수로 로컬 실행 가능성이 남아있음. (SHOULD 수준 관찰)
- **CI grep 자기 제외 패턴**: L143–144에 `grep -v "^\.github/workflows/main\.yml"` + `grep -v "\.github/workflows/main\.yml"` 두 줄 존재. main.yml 자신이 grep 검색어로 `"drizzle-kit generate"`를 포함하므로 자기 참조 제외는 올바른 설계.

## Overall: **PASS**

8/8 MUST 항목 전원 통과. ADR-0010 CI 정합 작업이 명세한 4개 변경(CI grep step 교체, db:migrate 전환, db:generate 스크립트 제거, pre-push snapshot guard 추가) 모두 실제 파일에서 확인됨.
