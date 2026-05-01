# Inspection Form Templates — Backfill 운영 가이드

> Phase 1B-C에서 신설된 `inspection_form_templates` snapshot DB의 historical 데이터 충원 절차서.

## 1. 배경

UL-QP-18-03 (중간점검) / UL-QP-18-05 (자체점검) Build-Once Workflow는 *향후 첫 승인 시점*에서 자동으로 template snapshot을 생성한다 (`autoCreateIfAbsent` hook in `apps/backend/src/modules/inspection-form-templates/inspection-form-templates.service.ts`).

**프로덕션 출시 시점에 이미 승인된 inspection들**에 대해서는 본 hook이 동작하지 않으므로 — 한 번의 backfill 작업으로 historical 데이터에 대해 첫 version의 template을 일괄 생성한다.

## 2. 절차

### 2-1. Pre-flight (사전 확인)

```bash
# 1. DB 마이그레이션 적용 확인
docker compose exec -T postgres psql -U postgres -d equipment_management \
  -c "\d inspection_form_templates" | head -3

# 2. 현재 row 카운트 (backfill 전)
docker compose exec -T postgres psql -U postgres -d equipment_management \
  -c "SELECT inspection_type, COUNT(*) FROM inspection_form_templates GROUP BY 1;"

# 3. approved inspection 카운트 (backfill 후보 규모 추정)
docker compose exec -T postgres psql -U postgres -d equipment_management -c "
  SELECT 'intermediate' AS type, COUNT(DISTINCT equipment_id)
  FROM intermediate_inspections WHERE approval_status='approved'
  UNION ALL
  SELECT 'self', COUNT(DISTINCT equipment_id)
  FROM equipment_self_inspections WHERE approval_status='approved';"
```

### 2-2. Dry-run (write 0)

```bash
pnpm --filter backend exec ts-node \
  scripts/backfill-inspection-templates.ts --dry-run --verbose
```

기대 결과:

- `would create N` — backfill될 row 카운트
- `skipped 0` (첫 실행) 또는 `skipped == 기존 row` (재실행 검증)
- `failed 0`

### 2-3. 점진 적용 (옵션 — 운영 환경 권장)

특정 장비부터 시작:

```bash
pnpm --filter backend exec ts-node \
  scripts/backfill-inspection-templates.ts \
  --equipment-id=<UUID> --verbose
```

특정 inspection type만:

```bash
pnpm --filter backend exec ts-node \
  scripts/backfill-inspection-templates.ts \
  --type=intermediate --verbose
```

### 2-4. 전체 적용

```bash
pnpm --filter backend exec ts-node \
  scripts/backfill-inspection-templates.ts --verbose
```

### 2-5. 검증

```bash
# A. 모든 (equipment, type) pair는 0 또는 1개의 *current* template (M-10.3 무결성)
docker compose exec -T postgres psql -U postgres -d equipment_management -c "
  SELECT equipment_id, inspection_type, COUNT(*) AS current_count
  FROM inspection_form_templates
  WHERE superseded_by IS NULL AND deleted_at IS NULL
  GROUP BY 1, 2
  HAVING COUNT(*) > 1;"
# 결과 0 rows = 정합

# B. 재실행 idempotency 확인
pnpm --filter backend exec ts-node \
  scripts/backfill-inspection-templates.ts --dry-run --verbose
# 모두 'template already exists' (skipped)
```

## 3. 트러블슈팅

### 3-1. `failed: N` 발생 시

```bash
# 상세 로그 재확인
pnpm --filter backend exec ts-node \
  scripts/backfill-inspection-templates.ts --verbose 2>&1 | tee backfill.log

# 실패 원인 분석:
grep '❌' backfill.log
```

일반 원인:

- **FK 위반 (equipment_id)**: 대상 inspection의 equipment가 삭제됨 → audit trail 손실, manual 검토 필요
- **structure jsonb 검증 실패**: 데이터 corruption 의심 → 해당 inspection을 직접 query하여 items + result_sections 점검

스크립트는 idempotent하므로 원인 해결 후 *재실행*만 하면 됨 (성공한 row는 skip).

### 3-2. Rollback

backfill의 부작용은 _insert만_ — `inspection_form_templates`에 row 추가. 트랜잭션 wrap이라 부분 실패는 자동 rollback.

전체 rollback이 필요한 경우 (예: backfill 실수로 이미 다른 admin이 만든 template과 충돌):

```sql
-- 시스템 생성 (created_by IS NULL) + 본 backfill 시간 범위 row만 삭제
DELETE FROM inspection_form_templates
WHERE created_by IS NULL
  AND created_at BETWEEN '<backfill-start-time>' AND '<backfill-end-time>';
```

⚠️ 절대 `inspection_form_templates` 전체 truncate 금지 — `autoCreateIfAbsent` hook으로 이미 생성된 정상 데이터까지 손실됨.

## 4. 일정 권장

1. **Staging**: 출시 1주 전 dry-run + 실제 적용 + 검증
2. **Production**: 출시 직후 (frontend 1B-D~G와 함께 배포한 _직후_)
   - 먼저 단일 장비 sanity check
   - 그 다음 type별 (`--type=intermediate` → `--type=self`)
   - 마지막 전체

## 5. 모니터링

backfill 직후 24h 동안:

- `audit_logs WHERE entity_type='inspection_form_template' AND user_id IS NULL` (시스템 backfill 로그)
- `inspection_form_templates` row 카운트 변화 (autoCreateIfAbsent hook의 신규 추가)
- 사용자 점검 작성 흐름에서 prefill banner 정상 노출 (Playwright E2E 또는 manual QA)

## 6. 참조

- 스크립트: `apps/backend/scripts/backfill-inspection-templates.ts`
- DB schema: `packages/db/src/schema/inspection-form-templates.ts`
- Service hook: `apps/backend/src/modules/inspection-form-templates/inspection-form-templates.service.ts:autoCreateIfAbsent`
- Plan: `.claude/exec-plans/active/2026-05-01-inspection-template-backend.md`
- Contract: `.claude/contracts/inspection-template-build-once.md` (M-10)
