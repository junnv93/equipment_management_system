# ADR-0010: Drizzle Manual SQL Policy (No `drizzle-kit generate`)

- **상태**: Accepted
- **일시**: 2026-05-09
- **결정자**: maintainer (1인 개발)
- **맥락 범위**: backend, ops, db-migrations

## Context

본 레포는 ADR-0002 에 따라 Drizzle ORM 을 채택했고, 표준 워크플로는 `drizzle-kit generate` 로
schema diff 를 SQL 파일 + `meta/{NNNN}_snapshot.json` + `meta/_journal.json` entry 3 종을
한 번에 생성하는 방식이다.

그러나 2026-04-07 baseline squash 이후 다음과 같은 운영 현실이 누적됐다:

- baseline squash 시점 `0000_baseline.sql` 단일 파일 + snapshot `0000_snapshot.json` 만 보존
- 이후 schema 변경 ~30 건이 누적되어 현재 journal 58 entries (idx 0~0057) / snapshot 26
  파일 (0000~0025) / SQL 62 파일 (rollback 4 포함) 상태
- `drizzle-kit generate` 실행 시 **누적된 schema diff 를 한 번에 분석 → column rename
  모호성 → TTY interactive prompt 발생** (drizzle-kit 이 stdin pipe / `--force` / `--yes`
  지원 안 함, TTY 직접 검사)
- 결과적으로 CI / Claude Code / non-TTY shell 환경에서 `drizzle-kit generate` 실행 불가

이 갭을 우회하기 위해 메인테이너는 다음 패턴을 채택해 운영해 왔다:

1. SQL 파일 직접 작성 (`apps/backend/drizzle/{NNNN}_{tag}.sql`)
2. `_journal.json` entry 수동 append
3. 신규 마이그레이션 DB 직접 apply (`docker compose exec -T postgres psql ... < file.sql`)
4. `__drizzle_migrations` tracking row 수동 sync (SHA256 + INSERT ON CONFLICT DO NOTHING)

이 정책은 2026-04-07 ~ 현재까지 약 30 건 무회귀로 운영됐으나, **결정 SSOT 가 private
memory feedback 파일 (`feedback_drizzle_kit_interactive_prompt.md`) 에만 존재**한다는
구조적 갭이 남았다. 그동안 `docs/development/DRIZZLE_MIGRATIONS.md` §1 은 "스키마 변경은
반드시 `drizzle-kit generate`" 라는 모순 지시를 표시하고 있어, 새 인원 / 다른 세션이
doc 만 보고 generate 를 호출하면 누적된 manual SQL diff 가 last available snapshot (0025)
부터 재계산되어 0026~0057 변경이 "변경사항 없음" 으로 누락되거나, 잘못된 column rename
prompt 에 응답하여 schema 가 깨질 위험이 있다.

이 문제를 해결하지 않으면:

1. 새 인원이 doc 따라가다 누적 manual SQL 손실 — 운영 회귀 (high blast radius)
2. private memory 기반 정책 SSOT — 발견 가능성 0, 다중 세션 정합성 보장 불가
3. `drizzle-kit generate` 호출이 무심코 commit 되어 PR review 단계에서야 발견 — 늦은 차단

## Decision

**Drizzle 마이그레이션 작성은 manual SQL + `_journal.json` append + DB 직접 apply +
`__drizzle_migrations` tracking row sync 4 단계로 통일한다. `drizzle-kit generate` 와
`drizzle-kit push` 는 본 레포에서 금지한다. snapshot 재생성도 금지한다 (누적된 manual
SQL 손실 위험).**

### 4 단계 절차 (운영 SSOT)

상세 명령은 [`docs/development/DRIZZLE_MIGRATIONS.md`](../development/DRIZZLE_MIGRATIONS.md)
§1 참조. 요약:

1. **SQL 파일 작성** — `apps/backend/drizzle/{NNNN}_{tag}.sql` (다음 idx, snake_case + 동작 동사)
2. **journal entry append** — `apps/backend/drizzle/meta/_journal.json` 의 `entries[]` 끝에
   `{ "idx": <next>, "version": "7", "when": <Date.now() ms>, "tag": "<tag>", "breakpoints": true }`
3. **DB 직접 apply** — `docker compose exec -T postgres psql -U postgres -d equipment_management -f - < apps/backend/drizzle/{file}.sql`
4. **tracking row sync** — `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (<sha256>, <when>) ON CONFLICT DO NOTHING`

### 검토한 대안 (Options)

1. **Option A — 매 schema 변경마다 baseline squash 재실행**
   - 장점: snapshot/journal/SQL 정합 회복
   - 단점: 단일 환경 + 소수 마이그레이션 가정에서만 유효. 현재 58 entries 누적 + 향후
     다환경(staging/prod) 배포 가능성 → squash 의 비용 (모든 환경 reset, hash 재발급, 다른
     기여자 충돌) 비현실적. **거부**.

2. **Option B — TTY interactive prompt 자동 응답 우회 (`expect`/`pty` 등)**
   - 장점: drizzle-kit 표준 워크플로 유지
   - 단점: drizzle-kit 이 TTY 직접 검사 (process.stdin.isTTY) → stdin pipe / `--force` / `--yes`
     모두 무효 (memory 검증 완료, 2026-04-07 시도 후 거부). pty 우회는 column rename 모호성에
     "Y/N" 정확 응답 필요 — 자동화 정확도 보장 불가, manual SQL 잘못 적용 시 블라스트 큼.
     **거부**.

3. **Option C — Manual SQL + journal append + tracking sync (채택)**
   - 장점: TTY 의존 0 / CI 자동화 가능 / 백필 SQL 인라인 작성 자유 / 운영 검증 완료
     (2026-04-07 ~ 현재 ~30 건 무회귀)
   - 단점: snapshot~journal desync 영구화 / `drizzle-kit check` 외 schema-level invariant
     별도 검증 부재
   - **채택**: 운영 검증 완료 + 회피 시도 3건 (TTY 우회 / `--force` flag / snapshot 재생성)
     모두 무효 / 본 결정으로 모순 doc 해소

## Consequences

### 긍정

- TTY 의존 0 — CI / Claude Code / non-TTY 환경 모두 마이그레이션 작성/적용 가능
- 백필 UPDATE 등 복잡 SQL 인라인 작성 자유 (drizzle-kit 자동 생성 제약 없음)
- 정책 SSOT 발견 가능 — ADR + doc 양 진입점에 명시, private memory 의존 0
- doc-vs-memory 모순 영구 차단 — DRIZZLE_MIGRATIONS.md §1 갱신으로 새 인원도 정확한
  절차 따라감
- baseline squash 절차는 §5 fallback 으로 보존 (단일 환경 한정 회복 path)

### 부정

- snapshot~journal desync 영구화 — `drizzle-kit generate` 호출 시 last snapshot (0025)
  부터 diff 재계산 → 0026~0057 변경이 "변경사항 없음" 으로 누락 위험
- `drizzle-kit check` 는 journal+SQL 정합성만 검증 → schema-level invariant (column type
  consistency 등) 별도 검증 없음
- manual SQL 작성 시 hash 입력 오류 시 `db:reset` 실패 가능 — 운영 cost
- drizzle-kit 표준 워크플로에서 의도적 이탈 — 신규 기여자 onboarding 시 별도 설명 필요

### 완화 (Mitigations)

- **DRIZZLE_MIGRATIONS.md §1 갱신** — 본 ADR 결정과 4 단계 절차를 doc SSOT 로 결빙 (본 sprint
  Phase 2 에서 수행)
- **PR 체크리스트 명시** — DRIZZLE_MIGRATIONS.md §1 PR 체크리스트에 "snapshot 파일 변경 0건
  (`git diff drizzle/meta/*_snapshot.json`)" 항목 추가
- **(SHOULD → ✅ 완료 2026-05-13)** CI grep 으로 PR 에서 `drizzle-kit generate` 호출 자동 차단 —
  `.github/workflows/main.yml` ADR-0010 Compliance Check step 으로 구현.
  `drizzle-kit push` 는 `package.json` 스크립트(`db:push`, `db:push:force`) 로만 남아있어
  CI 직접 호출 0건 달성. ESLint custom rule 은 over-engineering 으로 계속 보류.
- **테스트 인프라** — `pnpm --filter backend run db:reset` 로 baseline + 누적 manual SQL
  반복 적용 검증 가능 (PC 이동/꼬임 복구도 동일 명령)
- **(SHOULD → ✅ 완료 2026-05-13)** `.github/workflows/main.yml` CI ADR-0010 정합 완료:
  (a) L130-141 "Drizzle Schema Drift Check" → "ADR-0010 Compliance Check" 로 교체
  (`drizzle-kit generate --name __drift_check__` → generate 차단 grep + `drizzle-kit check`),
  (b) L303-304 `drizzle-kit push --force` → `pnpm --filter backend run db:migrate` (journal-based),
  (c) `apps/backend/package.json` `db:generate` 스크립트 제거,
  (d) `.husky/pre-push` snapshot 파일 변경 차단 guard 추가.
  tech-debt-tracker 항목 `drizzle-policy-ci-workflow-followup` + `drizzle-pre-push-snapshot-guard` closure.

### Trigger Conditions for Reconsideration

이 결정을 재검토해야 할 조건. 임계 충족 시 새 ADR 로 supersede 처리한다.

| 트리거                                                                                  | 임계값                                          |
| --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| drizzle-kit 이 manual SQL 인식 가능한 새 명령 추가 (예: `drizzle-kit baseline-from-db`) | 출시 후 안정성 검증                             |
| 다환경 (staging/prod) 배포 시작                                                         | 배포 결정 시점 — squash/manual 전략 모두 재평가 |
| manual SQL 회귀 (잘못된 hash 로 `db:reset` 실패, journal entry 빠짐 등)                 | 분기당 ≥ 2 건                                   |
| 새 기여자 onboarding 시 정책 학습 cost 가 높다고 판단                                   | 분기당 onboarding 회귀 ≥ 2 건                   |

## References

- 관련 ADR:
  - [ADR-0002: Drizzle ORM over TypeORM](./0002-drizzle-orm-over-typeorm.md) — 본 ADR 이 _보완_
    함 (대체 아님). ADR-0002 결정 자체는 유효, 단 본 레포의 _운영_ 패턴이 업계 표준에서
    의도적으로 이탈한 부분을 결빙.
  - [ADR-0007: Multi-Session Working Tree Safety](./0007-multi-session-working-tree-safety.md) — Trigger Conditions 정량화 패턴 참조
- 운영 doc: [`docs/development/DRIZZLE_MIGRATIONS.md`](../development/DRIZZLE_MIGRATIONS.md)
  §1 (manual SQL 4 단계 절차), §5 (squash fallback), §6 (uuid-cast 가드)
- private memory: `feedback_drizzle_kit_interactive_prompt.md` — 본 ADR 채택 전 운영
  정책의 historical SSOT (현재는 ADR + doc 으로 승격됨, memory 는 학습 기록으로 보존)
- 회피 시도 3건 (memory 에서 검증 완료, 모두 거부):
  - `printf '\n\n\n' | drizzle-kit generate` — drizzle-kit TTY 직접 검사로 stdin pipe 무효
  - `drizzle-kit generate --force` / `--yes` — 해당 flag 미존재
  - 전체 snapshot 재생성 — 누적된 manual SQL diff 손실 (last snapshot 부터 재계산하므로
    0026~0057 의 manual 변경이 "변경사항 없음" 으로 누락)
