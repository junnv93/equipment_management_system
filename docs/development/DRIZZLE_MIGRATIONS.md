# Drizzle 마이그레이션 운영 가이드

이 문서는 이 레포의 Drizzle 마이그레이션 작업 규칙과 히스토리 정비 사유를 기록합니다.

## 상태 (2026-04-07 baseline squash / 2026-04-18 업데이트)

- `apps/backend/drizzle/0000_baseline.sql` 한 파일이 **baseline 시점의 전체 스키마**를 나타냅니다.
- 이후 2026-04-18 현재까지 0001~0031 까지 **증분 migration + `meta/_journal.json` entry** 가 누적되어 있습니다.
- `drizzle/meta/NNNN_snapshot.json` 은 **0024까지만 존재**합니다(0025~0031 snapshot 누락).
  - 원인: baseline squash 이후 일부 migration이 drizzle-kit generate의 TTY 요구사항으로 인해 **수동 SQL 파일 + journal entry** 로 추가되었습니다. snapshot 생성은 TTY 환경에서 `db:generate`를 재실행해야 가능합니다.
  - 영향: **현재 `drizzle-kit check` 는 "Everything's fine" 통과** (journal + SQL 정합성만 검증). 다만 향후 `db:generate` 실행 시 diff가 last available snapshot(0024)부터 계산되어 **이미 적용된 0025~0031 변경이 "변경사항 없음"으로 누락될 위험**이 있습니다.
- `__drizzle_migrations` 테이블에는 baseline(0000) + 0001~0031 row가 정상 기록되어 있습니다.
- `drizzle/manual/`은 drizzle-kit이 자동으로 읽지 않는 수동 SQL 파일 저장소이며 이번 정비와 무관합니다.

### 재정비(snapshot 복원) 절차 — TTY 환경 필수

**실행 조건**: 로컬 WSL2/Terminal (interactive TTY). Claude Code bash 세션 등 non-interactive 환경에서는 불가.

```bash
# 1) 현재 스키마로 스냅샷 재구성 (drizzle-kit이 existing migrations를 인식해 diff 재계산)
cd apps/backend
pnpm db:generate    # TTY 환경에서 실행 — "rename? [y/n]" 프롬프트 대응

# 2) 생성된 결과가 "No changes"여야 함 (정상).
#    새 migration이 생성됐다면 schema 변경이 있다는 뜻 — 검토 후 commit.

# 3) 누락된 snapshot 파일들이 drizzle/meta/에 채워졌는지 확인
ls apps/backend/drizzle/meta/*.json | tail -5
```

현재 운영 중인 코드에는 영향 없음 (journal-based 실행 경로로 migration 적용). 다만 **snapshot 복원은 다음 schema 변경 전 수행 권장** — 변경 diff 정확도 확보.

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

### 1. 스키마 변경은 반드시 `drizzle-kit generate`

```bash
pnpm --filter backend run db:generate   # 스키마 수정 후
pnpm --filter backend run db:migrate    # 로컬 DB에 적용
```

PR에는 다음 3가지가 **모두** 커밋되어야 합니다:

- `drizzle/NNNN_<name>.sql`
- `drizzle/meta/NNNN_snapshot.json`
- `drizzle/meta/_journal.json`의 새 entry

### 2. `db:push`는 로컬 개인 프로토타이핑에만

`drizzle-kit push`는 마이그레이션 히스토리를 건드리지 않고 스키마를 직접 동기화합니다. 편리하지만 팀 공유 DB(스테이징/프로덕션)나 커밋되는 브랜치에서 쓰면 이번 같은 불일치가 다시 생깁니다.

**허용**: 개인 로컬 실험, 삭제할 feature branch  
**금지**: main/develop 병합 전 최종 스키마, 공유 DB

### 3. 수동 SQL이 필요할 때

데이터 백필, 특수 constraint 등은 drizzle-kit이 생성한 SQL 파일을 **직접 편집**합니다. snapshot(`meta/NNNN_snapshot.json`)은 절대 손으로 수정하지 않습니다 — drizzle-kit이 관리하는 스키마 그래프가 깨집니다.

예시: drizzle-kit이 생성한 `0001_add_form_name.sql`에 백필 UPDATE 추가:

```sql
ALTER TABLE "form_templates" ADD COLUMN "form_name" varchar(200);
--> statement-breakpoint
UPDATE "form_templates" SET "form_name" = ... ;  -- 수동 추가 OK
--> statement-breakpoint
ALTER TABLE "form_templates" ALTER COLUMN "form_name" SET NOT NULL;
```

### 4. CI 체크 (추가 권장)

`drizzle-kit generate` 결과가 **"No schema changes"**여야 PR 통과로 gate. 누군가 `schema.ts`만 수정하고 마이그레이션 생성을 깜빡했다면 CI가 잡아냅니다.

```yaml
# 예시 (.github/workflows/ci.yml)
- run: pnpm --filter backend exec drizzle-kit generate
- run: git diff --exit-code drizzle/ # 변경 있으면 실패
```

### 5. 고장났을 때 다시 squash하는 법

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

| 도구        | 추적 테이블            | "이미 적용됨" 표시                          | Baseline 절차                               |
| ----------- | ---------------------- | ------------------------------------------- | ------------------------------------------- |
| Rails       | `schema_migrations`    | `rails db:migrate:up VERSION=`              | `db:schema:load` + timestamp INSERT         |
| Django      | `django_migrations`    | `migrate --fake <app> <name>`               | `makemigrations` + `migrate --fake-initial` |
| Prisma      | `_prisma_migrations`   | `prisma migrate resolve --applied "<name>"` | `prisma migrate diff` + baseline init       |
| TypeORM     | `migrations`           | 수동 INSERT                                 | 수동                                        |
| **Drizzle** | `__drizzle_migrations` | **공식 명령 없음** → 수동 hash INSERT       | **본 문서의 squash 절차**                   |

Drizzle은 상대적으로 젊은 도구라 "마이그레이션 복구" 공식 워크플로가 부족합니다. 그래서 이 문서가 존재합니다.
