# Drizzle 마이그레이션 운영 가이드

이 문서는 이 레포의 Drizzle 마이그레이션 작업 규칙과 히스토리 정비 사유를 기록합니다.

## 상태 (2026-04-07 baseline squash / 2026-05-09 업데이트 — ADR-0010)

- `apps/backend/drizzle/0000_baseline.sql` 한 파일이 **baseline 시점의 전체 스키마**를 나타냅니다.
- 이후 2026-05-09 현재까지 0001~0057 까지 **증분 migration + `meta/_journal.json` entry** 가 누적되어 있습니다 (journal 58 entries / SQL 62 파일 / snapshot 26 파일).
- `drizzle/meta/NNNN_snapshot.json` 은 **0025까지만 존재**합니다(0026~0057 snapshot 누락 — desync intentional, [ADR-0010](../adr/0010-drizzle-manual-sql-policy.md) 참조).
  - 원인: baseline squash 이후 모든 migration 이 `drizzle-kit generate` 의 TTY interactive prompt 요구사항을 회피하기 위해 **manual SQL 파일 + journal entry append** 패턴으로 작성되었습니다. 본 레포는 이 패턴을 공식 운영 정책으로 채택했습니다 (ADR-0010 결정).
  - 영향: **현재 `drizzle-kit check` 는 "Everything's fine" 통과** (journal + SQL 정합성만 검증). `drizzle-kit generate` 는 본 레포에서 **금지** — last available snapshot(0025) 부터 diff 재계산하므로 0026~0057 의 manual 변경이 "변경사항 없음" 으로 누락되거나 column rename prompt 에 잘못 응답하여 schema 가 깨질 위험이 있습니다.
- `__drizzle_migrations` 테이블에는 baseline(0000) + 0001~0057 row가 정상 기록되어 있습니다.
- `drizzle/manual/`은 drizzle-kit이 자동으로 읽지 않는 수동 SQL 파일 저장소이며 이번 정비와 무관합니다 (운영 first-apply 사전 가드 등 §6 참조).

### snapshot 재생성 — 금지 (ADR-0010)

**`drizzle-kit generate` 호출은 본 레포에서 금지됩니다.** snapshot 재생성을 시도하면 누적된 manual SQL diff 가 last snapshot(0025) 부터 재계산되어 **이미 적용된 0026~0057 변경 ~30 건이 손실되거나 잘못 인식될 위험** 이 있습니다 (ADR-0010 §Consequences 참조).

회피 시도 3건 (모두 거부, ADR-0010 §References 참조):

- ❌ `printf '\n\n\n' | drizzle-kit generate` — drizzle-kit 이 TTY 직접 검사라 stdin pipe 무효
- ❌ `drizzle-kit generate --force` / `--yes` — 해당 flag 미존재
- ❌ 전체 snapshot 재생성 — 누적된 manual SQL diff 손실

현재 운영 중인 코드에는 desync 영향 없음 (journal-based 실행 경로로 migration 적용 — `pnpm --filter backend run db:migrate`).

## 왜 baseline squash를 했나

2026-04-07 점검 시 다음 불일치를 발견:

| 항목                      | 상태                                 |
| ------------------------- | ------------------------------------ |
| `drizzle/` SQL 파일       | 0000~0004 존재                       |
| `drizzle/meta/` 스냅샷    | 0000~0003만 존재 (0004 누락)         |
| `_journal.json` entries   | 0000~0004                            |
| DB `__drizzle_migrations` | 0000~0002만 기록됨 (0003, 0004 누락) |
| 실제 DB 스키마            | 0004까지 적용된 상태                 |

**원인**: 과거에 `drizzle-kit push` 또는 수동 SQL 실행으로 스키마를 동기화하면서 `__drizzle_migrations`와 `meta/` 스냅샷이 누락되었습니다. 이 상태에선 `drizzle-kit generate`가 오류를 내고 `drizzle-kit migrate`도 정상 동작하지 않습니다.

**해법**: 업계 표준인 **baseline squash** 적용 — 현재 스키마 상태를 단일 `0000_baseline` 마이그레이션으로 리셋하고 `__drizzle_migrations`도 재작성. 5개 마이그레이션밖에 없고 단일 환경(로컬)이라 squash의 비용이 낮았습니다.

## 앞으로의 규칙 (반드시 준수)

### 1. 스키마 변경은 manual SQL + journal append (ADR-0010)

**결정 근거 + 회피 시도 3건은 [ADR-0010](../adr/0010-drizzle-manual-sql-policy.md) 참조.**

`drizzle-kit generate` 는 본 레포에서 **금지**합니다. 새 마이그레이션은 다음 4 단계로 작성합니다:

#### 1단계 — SQL 파일 작성

`apps/backend/drizzle/{NNNN}_{tag}.sql` (다음 idx 번호, snake_case + 동작 동사). 기존 파일 패턴 (`CREATE TABLE` / `ALTER ADD CONSTRAINT` / `CREATE INDEX with --> statement-breakpoint`) 참고.

예: `0058_add_inspection_form_templates.sql`

#### 2단계 — journal entry append

`apps/backend/drizzle/meta/_journal.json` 의 `entries[]` 끝에 다음 형식으로 entry 추가:

```json
{
  "idx": <next>,
  "version": "7",
  "when": <Date.now() ms>,
  "tag": "<tag_name>",
  "breakpoints": true
}
```

#### 3단계 — DB 직접 apply

```bash
docker compose exec -T postgres psql -U postgres -d equipment_management \
  -f - < apps/backend/drizzle/{file}.sql
```

#### 4단계 — `__drizzle_migrations` tracking row sync

`db:reset` 시 충돌 방지를 위해 SHA-256 hash 를 INSERT 합니다:

```bash
HASH=$(sha256sum apps/backend/drizzle/{file}.sql | awk '{print $1}')
docker compose exec -T postgres psql -U postgres -d equipment_management \
  -c "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) \
      VALUES ('$HASH', <when>) ON CONFLICT DO NOTHING;"
```

#### PR 체크리스트

PR 에는 다음 2가지 **만** 커밋되어야 합니다:

- [ ] `drizzle/NNNN_<name>.sql` 추가 ✓
- [ ] `drizzle/meta/_journal.json` 에 entry 1건 append ✓
- [ ] **snapshot 파일 변경 0건** ✓ (`git diff drizzle/meta/*_snapshot.json` 결과 비어있음 — snapshot 재생성 시도 시 실패해야 함, ADR-0010)
- [ ] `pnpm --filter backend run db:reset` 후 새 마이그레이션이 정상 적용되는지 검증 ✓

### 2. `db:push` — ADR-0010 금지 (2026-05-13 갱신)

**`drizzle-kit push` 는 본 레포에서 완전 금지입니다** ([ADR-0010](../adr/0010-drizzle-manual-sql-policy.md) Decision).

이전 §2 는 "로컬 프로토타이핑에만 허용"이라고 안내했지만, 이것은 ADR-0010 Decision 과 모순입니다.
`drizzle-kit push` 는 `__drizzle_migrations` 히스토리를 건드리지 않고 스키마를 직접 동기화하므로
manual SQL 4단계 절차를 우회합니다 — 로컬 환경에서도 `db:reset` 이후 불일치가 생깁니다.

`package.json` 의 `db:push` / `db:push:force` 스크립트는 2026-05-13 에 제거됐습니다.
CI ADR-0010 Compliance Check step 이 `drizzle-kit push` 호출도 차단합니다.

**모든 스키마 변경은 §1 manual SQL 4단계 절차만 사용하세요.**

### 3. 백필 UPDATE 등 복잡 SQL 인라인 작성

본 레포는 모든 마이그레이션이 manual SQL (§1) 이므로, 데이터 백필 / 특수 constraint / 멀티 stage column rename 등을 1단계의 SQL 파일에 **직접 작성**합니다. snapshot(`meta/NNNN_snapshot.json`)은 절대 손으로 수정하지 않습니다 — schema 그래프 깨짐 (ADR-0010 §Consequences).

예시: `0058_add_form_name.sql` 에 NOT NULL 백필 패턴:

```sql
ALTER TABLE "form_templates" ADD COLUMN "form_name" varchar(200);
--> statement-breakpoint
UPDATE "form_templates" SET "form_name" = ... ;  -- 백필
--> statement-breakpoint
ALTER TABLE "form_templates" ALTER COLUMN "form_name" SET NOT NULL;
```

운영 first-apply 시 text→uuid 캐스트 등 추가 가드가 필요하면 §6 (uuid-cast 가드) 절차 참조.

### 4. CI 체크 (`drizzle-kit generate` 호출 차단)

본 레포는 ADR-0010 에 따라 `drizzle-kit generate` 호출이 금지됩니다. 회귀 차단을 위해 CI 에서 다음 검증을 수행하는 것이 권장됩니다 (현재 미구현 — ADR-0010 §Mitigations 후속 sprint, 트리거: 회귀 1건 발생 시):

```bash
# 1) PR diff 에 snapshot 파일 변경이 있으면 fail (ADR-0010 위반)
git diff origin/main -- 'apps/backend/drizzle/meta/*_snapshot.json' \
  | grep -q . && { echo "❌ snapshot 파일 변경 금지 (ADR-0010)"; exit 1; }

# 2) PR diff 에 drizzle-kit generate / db:generate 호출 commit 메시지가 있으면 fail
git log origin/main..HEAD --grep="drizzle-kit generate\|db:generate" \
  | grep -q . && { echo "❌ drizzle-kit generate 호출 금지 (ADR-0010)"; exit 1; }

# 3) journal entry 와 SQL 파일 정합 (drizzle-kit check 는 schema-level invariant 별도 검증 X)
pnpm --filter backend exec drizzle-kit check
```

ESLint custom rule 로 `drizzle-kit generate` 호출 자동 차단은 ADR-0010 §Mitigations 의 SHOULD 항목으로 등록되어 있습니다 (회귀 1건 발생 시 별도 sprint).

### 5. 고장났을 때 다시 squash하는 법

> **현재 정책: ADR-0010 manual SQL** — squash 는 단일 환경 한정 fallback 으로 보존합니다 (다환경 배포 시작 시 ADR-0010 Trigger Conditions 에 따라 재검토).

**단일 환경 & 5~10개 미만 마이그레이션**: squash가 빠르고 안전.  
**다환경(staging/prod) 배포 중**: squash 금지. 수동 패치(드리즐 공식 doc 참조 — `__drizzle_migrations`에 누락된 hash row INSERT + snapshot 복원).

Squash 절차:

```bash
cd apps/backend

# 1) 기존 마이그레이션 보관
mkdir -p drizzle/archive_pre_baseline/meta
mv drizzle/*.sql drizzle/archive_pre_baseline/
mv drizzle/meta/*.json drizzle/archive_pre_baseline/meta/

# 2) 빈 journal 초기화
echo '{"version":"7","dialect":"postgresql","entries":[]}' > drizzle/meta/_journal.json

# 3) 현재 스키마로 baseline 생성
npx drizzle-kit generate --name baseline

# 4) baseline의 SHA-256 계산
sha256sum drizzle/0000_baseline.sql

# 5) __drizzle_migrations 리셋 + baseline hash 삽입
#    created_at = drizzle/meta/_journal.json의 entries[0].when
docker compose exec postgres psql -U postgres -d equipment_management -c "
TRUNCATE drizzle.__drizzle_migrations RESTART IDENTITY;
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('<HASH>', <WHEN>);
"

# 6) 검증 — 둘 다 no-op여야 함
npx drizzle-kit migrate    # "applied successfully" (실제로는 재실행 안 함)
npx drizzle-kit generate   # "No schema changes, nothing to migrate"
```

## 6. 운영(prod) first-apply 사전 가드 (text→uuid USING 캐스트)

### 배경

`drizzle-kit generate` 가 만든 `ALTER COLUMN ... SET DATA TYPE uuid USING col::uuid`
는 컬럼에 비-UUID 형식 string 이 1건이라도 잔존하면 트랜잭션 abort 합니다.
generate 가 자동 추가하는 backfill UPDATE 는 일반적으로 `NOT IN (SELECT id FROM users)`
형태라 **UUID 포맷이 아닌 임의 string (레거시 사번 등)** 은 통과시킵니다.

이 함정은 dev 데이터(seed)에서는 노출되지 않고 운영 first-apply 시점에만 폭발합니다.

### 사례: 0006_gray_sersi.sql

`equipment.requested_by`, `equipment.approved_by` 두 컬럼을 text→uuid 로 변환.
dev 통과(20행, 모두 UUID), 운영 미적용 상태이므로 first-apply 전 사전 가드 필수.

### 절차 (모든 text→uuid 캐스트 마이그레이션 공통)

1. **사전 가드 스크립트 작성** (`drizzle/manual/YYYYMMDD_pre_NNNN_uuid_cast_guard.sql`)
   - 정규식으로 비-UUID 값을 NULL 로 backfill
   - `BEGIN`/`COMMIT` 트랜잭션 + `\set ON_ERROR_STOP on`
   - `RAISE NOTICE` 로 sanitize 행 수 출력 (감사 추적용)
   - 멱등(반복 실행 안전)
   - 예시: `apps/backend/drizzle/manual/20260408_pre_0006_uuid_cast_guard.sql`
2. **운영 적용 순서**

   ```bash
   # 1) 사전 가드 (수동, 1회)
   psql "$DATABASE_URL" -f apps/backend/drizzle/manual/YYYYMMDD_pre_NNNN_uuid_cast_guard.sql

   # 2) 일반 마이그레이션
   pnpm --filter backend run db:migrate
   ```

3. **검증**
   - 가드 스크립트의 `RAISE NOTICE` 출력에서 sanitized 행 수가 0 이 아닌 경우
     → 즉시 백업/롤백 검토 후 개별 분석 (어떤 레거시 데이터가 잔존했는지)

### 신규 마이그레이션 작성자 체크리스트

- [ ] `drizzle-kit generate` 결과에 `SET DATA TYPE uuid USING ... ::uuid` 가 포함되는가?
- [ ] 그렇다면 위 절차에 따라 `manual/` 사전 가드 스크립트를 함께 PR 에 포함했는가?
- [ ] PR 설명에 "운영 적용 시 사전 가드 실행 필요" 명시했는가?

### CI 자동 가드 (선택, 권장)

```bash
# scripts/check-uuid-cast-guard.sh
set -e
NEW_CASTS=$(git diff origin/main -- 'apps/backend/drizzle/*.sql' \
  | grep -E '^\+.*USING .*::uuid' || true)
if [ -n "$NEW_CASTS" ]; then
  GUARD_FILES=$(git diff --name-only origin/main \
    -- 'apps/backend/drizzle/manual/*pre_*_uuid_cast_guard.sql' || true)
  if [ -z "$GUARD_FILES" ]; then
    echo "❌ text→uuid USING 캐스트 발견했으나 manual/ 사전 가드 누락"
    exit 1
  fi
fi
```

## 업계 표준 참고 (ORM별 대응 명령)

| 도구        | 추적 테이블            | "이미 적용됨" 표시                          | Baseline 절차                                       |
| ----------- | ---------------------- | ------------------------------------------- | --------------------------------------------------- |
| Rails       | `schema_migrations`    | `rails db:migrate:up VERSION=`              | `db:schema:load` + timestamp INSERT                 |
| Django      | `django_migrations`    | `migrate --fake <app> <name>`               | `makemigrations` + `migrate --fake-initial`         |
| Prisma      | `_prisma_migrations`   | `prisma migrate resolve --applied "<name>"` | `prisma migrate diff` + baseline init               |
| TypeORM     | `migrations`           | 수동 INSERT                                 | 수동                                                |
| **Drizzle** | `__drizzle_migrations` | **공식 명령 없음** → 수동 hash INSERT       | **본 문서의 squash 절차** + **ADR-0010 manual SQL** |

Drizzle은 상대적으로 젊은 도구라 "마이그레이션 복구" 공식 워크플로가 부족하고, `drizzle-kit generate` 의 TTY interactive prompt 가 누적 schema diff 환경에서 비결정적이라 본 레포는 ADR-0010 에 따라 manual SQL + journal append 패턴을 운영 정책으로 채택합니다. 그래서 이 문서가 존재합니다.
