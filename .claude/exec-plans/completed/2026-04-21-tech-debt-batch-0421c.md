---
slug: tech-debt-batch-0421c
date: 2026-04-21
mode: 2
status: active
source: tech-debt-tracker.md open items (2026-04-21)
---

# Tech Debt Batch 0421c — Exec Plan

## Scope Summary

tech-debt-tracker.md 의 actionable open 항목 5종을 단일 배치로 처리:

1. **Phase 1 (HIGHEST)** — class-DTO 마이그레이션 14개 (`z.infer` → `createZodDto`)
2. **Phase 2 (HIGH)** — CSP report DB 영속화 (`csp_reports` 테이블 + SecurityService 분리)
3. **Phase 3 (MEDIUM)** — `CreateFormState` 타입 추출 (계층 역의존 해소)
4. **Phase 4 (MEDIUM)** — k6 부하 테스트 스크립트 2종 신규 작성 (실행은 수동)
5. **Phase 5 (LOW)** — DOCX renderer 매직 넘버 → named constant

## Blocked / Deferred (처리 불가)

| 항목 | 이유 |
|------|------|
| Phase K 백업·DR | 프로덕션 사용자 발생 조건 미충족 |
| Drizzle snapshot 재생성 | TTY interactive prompt 필요 (non-TTY harness 불가) |
| 커밋 7a6255d1 귀속 복구 | **결정: A (status quo)** — 히스토리 재작성 없이 현 커밋을 공식 기록으로 인정. 완료 처리. |
| ZodSerializerInterceptor 글로벌 승격 | 2주 무회귀 조건 미충족 (현재 4일, 2026-05-01 재평가) |
| UL-QP-18-11 E2E | 백엔드 exporter 미구현 — exporter 구현 시 추가 |
| 브라우저 동선 수동 검증 | services 구동 상태 의존, k6 + CSP 이후 별도 세션 |

## Out of Scope

- k6 실제 실행 (스크립트 파일 작성만, 실행은 수동)
- CSP 리포트 Grafana/Loki 대시보드
- `_OPENAPI_METADATA_FACTORY` OpenAPI diff 수동 비교 (tsc + test 회귀로 대체)
- Phase 5 확산 (equipment-registry 등 다른 renderer는 별도 배치)

---

## Phase 5 — Renderer 매직 넘버 → named constant (먼저 시작, 가장 작음)

### 목표

`checkout-form-renderer.service.ts` / `equipment-import-form-renderer.service.ts` 에서
`setCellValue(0, ROWS.*ConfirmText, 0, text)` 패턴의 세 번째 인자 리터럴 `0`
(병합된 전체 너비 셀 인덱스) 을 named constant로 치환.

### 실측 보정

사용자 명세: `setCellValue(..., 1)` → 실제 코드: `setCellValue(0, ROWS.*ConfirmText, 0, ...)` 의 **세 번째 인자 `0`**.
기존 layout에 `TEXT_COL = 1` (단일 데이터 셀) 이 이미 존재하므로 명명 충돌 회피:
→ **`MERGED_TEXT_COL = 0 as const`** (병합된 전체 너비 셀)

### 수정 파일

1. `apps/backend/src/modules/checkouts/services/checkout-form.layout.ts` — `MERGED_TEXT_COL = 0 as const` 추가
2. `apps/backend/src/modules/equipment-imports/services/equipment-import-form.layout.ts` — 동일
3. `apps/backend/src/modules/checkouts/services/checkout-form-renderer.service.ts` — L56-59, L104-107 교체 (4곳 → 2파일)
4. `apps/backend/src/modules/equipment-imports/services/equipment-import-form-renderer.service.ts` — L83-88, L182-187 교체

### Pattern

```ts
// checkout-form.layout.ts 에 추가
/**
 * 병합된 전체 너비 셀의 셀 인덱스.
 * 확인 문장 행은 원본 docx에서 모든 컬럼이 병합되어 단일 셀로 존재.
 */
export const MERGED_TEXT_COL = 0 as const;
```

```ts
// renderer 에서 교체
// BEFORE: setCellValue(0, ROWS.checkoutConfirmText, 0, text)
// AFTER:  setCellValue(0, ROWS.checkoutConfirmText, MERGED_TEXT_COL, text)
```

### Verification

```bash
grep -q "MERGED_TEXT_COL" apps/backend/src/modules/checkouts/services/checkout-form.layout.ts
grep -q "MERGED_TEXT_COL" apps/backend/src/modules/equipment-imports/services/equipment-import-form.layout.ts
! grep -nE "setCellValue\(0,\s*ROWS\.(checkoutConfirmText|returnConfirmText|usageConfirmText),\s*0," \
  apps/backend/src/modules/checkouts/services/checkout-form-renderer.service.ts \
  apps/backend/src/modules/equipment-imports/services/equipment-import-form-renderer.service.ts
```

---

## Phase 3 — `CreateFormState` 타입 추출

### 목표

`ValidationCreateDialog.tsx` 내 정의된 `CreateFormState` 타입을 전용 `.types.ts` 파일로 분리.
부모/형제가 컴포넌트 파일 import → 구현체가 타입 SSOT가 되는 계층 역전 해소.

### 실측 경로

**실제**: `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationCreateDialog.tsx` L31
(CLAUDE.md 명세의 `apps/frontend/components/software-validations/` 와 다름)

### 수정 파일

1. **신규** `apps/frontend/app/(dashboard)/software/[id]/validation/_components/validation-create-form.types.ts`
2. **수정** `ValidationCreateDialog.tsx` — 인라인 정의 제거 + `import type { CreateFormState }` from types
3. **수정** `VendorValidationFields.tsx` — import 경로 교체
4. **수정** `SelfValidationFields.tsx` — import 경로 교체
5. 기타 소비자: `grep -rn "CreateFormState" apps/frontend` 전수 확인 후 교체

### Types 파일 구조

```ts
// validation-create-form.types.ts
export interface CreateFormState {
  // 기존 ValidationCreateDialog.tsx L31 정의를 그대로 이전
  // 타입 복제 금지 — 이동만
}
```

### Verification

```bash
test -f "apps/frontend/app/(dashboard)/software/[id]/validation/_components/validation-create-form.types.ts"
! grep -q "^export interface CreateFormState" \
  "apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationCreateDialog.tsx"
test $(grep -rn "CreateFormState" apps/frontend | grep "import" | grep -v "validation-create-form.types" | wc -l) -eq 0
pnpm --filter frontend run tsc --noEmit
```

---

## Phase 4 — k6 부하 테스트 스크립트 2종

### 목표

Software validation 도메인 hot path 2종 k6 스크립트 신규 작성.
`scripts/load/` 디렉토리가 존재하지 않으므로 신규 생성.

### 생성 파일

1. `scripts/load/software-validation-list.k6.js` — p95 < 500ms
2. `scripts/load/software-validation-export.k6.js` — p95 < 2000ms
3. `scripts/load/README.md` — 실행 방법 + 환경변수 + 결과 해석

### 공통 패턴

- `setup()`: `POST /api/auth/login` → accessToken (환경변수: `K6_USER_EMAIL`, `K6_USER_PASSWORD`)
- URL: `__ENV.API_BASE` fallback `http://localhost:3001` (하드코딩 금지)
- SSOT 주석: SSOT 경로를 `// SSOT: packages/shared-constants/src/api-endpoints.ts` 로 명시
- list stages: `0→10→20→10→0`, 총 3분
- export stages: `0→3→5→3→0` (export 무거우므로 낮춤), 총 3분

### Export 엔드포인트

실제 컨트롤러 시그니처 확인 후 조정. SSOT: `API_ENDPOINTS.REPORTS.EXPORT` 또는 form-template 엔드포인트.

### Verification

```bash
test -d scripts/load
test -f scripts/load/software-validation-list.k6.js
test -f scripts/load/software-validation-export.k6.js
test -f scripts/load/README.md
grep -q "p(95)<500" scripts/load/software-validation-list.k6.js
grep -q "p(95)<2000" scripts/load/software-validation-export.k6.js
grep -q "API_BASE" scripts/load/software-validation-list.k6.js
grep -q "API_BASE" scripts/load/software-validation-export.k6.js
grep -q "setup()" scripts/load/software-validation-list.k6.js
```

---

## Phase 1 — class-DTO 마이그레이션 14개

### 목표

`export type XxxDto = z.infer<typeof Schema>` 방식 14개를 `createZodDto` 방식으로 전환.
- 2건은 수동 Swagger class 중복 트리거 해당 → 수동 class 제거
- 12건은 tech-debt 세션이 트리거 조건 충족 ("해당 모듈 작업 시 점진 마이그레이션")

### 참조 구현

`apps/backend/src/modules/checkouts/dto/handover-token.dto.ts` (createZodDto 적용 예시)

### 전환 패턴

```ts
// BEFORE
import { z } from 'zod';
export const xyzSchema = z.object({ ... });
export type XyzDto = z.infer<typeof xyzSchema>;

// AFTER
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
export const xyzSchema = z.object({ ... });
export class XyzDto extends createZodDto(xyzSchema) {}
```

### 대상 14개 파일

| # | File | 추가 조치 |
|---|------|-----------|
| 1 | `modules/data-migration/dto/execute-migration.dto.ts` | `ExecuteEquipmentMigrationSwagger` **제거** |
| 2 | `modules/data-migration/dto/preview-migration.dto.ts` | 단순 전환 |
| 3 | `modules/calibration/dto/update-calibration-status.dto.ts` | 단순 전환 |
| 4 | `modules/calibration/dto/complete-intermediate-check.dto.ts` | 단순 전환 |
| 5 | `modules/monitoring/dto/client-error.dto.ts` | 단순 전환 |
| 6 | `modules/settings/dto/calibration-settings.dto.ts` | 단순 전환 |
| 7 | `modules/settings/dto/system-settings.dto.ts` | 단순 전환 |
| 8 | `modules/equipment/dto/create-shared-equipment.dto.ts` | 단순 전환 |
| 9 | `modules/notifications/dto/update-notification-settings.dto.ts` | 단순 전환 |
| 10 | `modules/teams/dto/update-team.dto.ts` | `UpdateTeamSwaggerDto` **제거**, controller `@ApiBody` 교체 |
| 11 | `modules/equipment/dto/approve-request-body.dto.ts` | 단순 전환 |
| 12 | `modules/notifications/dto/create-system-notification.dto.ts` | 단순 전환 |
| 13 | `modules/equipment/dto/reject-request.dto.ts` | 단순 전환 |
| 14 | `modules/equipment/dto/approve-equipment-request.dto.ts` | 단순 전환 |

### 소비자 import 조정 규칙

- `import type { XxxDto }` → `import { XxxDto }` (class는 값)
- `@Body() dto: XxxDto` 파라미터 — 그대로 동작
- `z.infer<typeof xyzSchema>` 를 다른 파일에서 직접 쓰는 경우 — 그대로 유지 (schema는 여전히 export)

### Verification

```bash
# type-only DTO 0건
test $(grep -rnE "^export type [A-Z][A-Za-z0-9]*Dto\s*=\s*z\.infer" apps/backend/src/modules \
  --include="*.dto.ts" | wc -l) -eq 0

# createZodDto ≥ 15
test $(grep -rlE "extends createZodDto\(" apps/backend/src/modules --include="*.dto.ts" | wc -l) -ge 15

# 수동 Swagger class 제거
! grep -rn "UpdateTeamSwaggerDto\|ExecuteEquipmentMigrationSwagger" apps/backend/src
```

---

## Phase 2 — CSP report DB 영속화

### 목표

`SecurityController.handleReport` → `logger.warn` 만 있는 것을 DB `csp_reports` 테이블에 영속화.
SecurityService 분리로 SRP 준수 (Controller = HTTP, Service = DB).
logger.warn 유지 (Loki 파이프라인 호환).

### DB 타입 정보

- inject token: `'DRIZZLE_INSTANCE'`
- DB 타입: `AppDatabase` (= `NodePgDatabase<typeof schema>`) from `@equipment-management/db`
- migration 번호: `0041` (기존 최대: `0040_nc_previous_equipment_status.sql`)

### 생성/수정 파일

1. **신규** `packages/db/src/schema/csp-reports.ts` — Drizzle 스키마
2. **수정** `packages/db/src/schema/index.ts` — re-export 추가
3. **신규** `apps/backend/drizzle/0041_csp_reports.sql` — raw SQL migration (TTY 우회)
4. **신규** `apps/backend/src/modules/security/security.service.ts`
5. **수정** `apps/backend/src/modules/security/security.module.ts` — SecurityService 등록
6. **수정** `apps/backend/src/modules/security/security.controller.ts` — service 주입 + saveReport 호출

### Schema 설계

```ts
// packages/db/src/schema/csp-reports.ts
import { pgTable, uuid, timestamp, varchar, json, index } from 'drizzle-orm/pg-core';

export const cspReports = pgTable(
  'csp_reports',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    receivedAt: timestamp('received_at').defaultNow().notNull(),
    reportShape: varchar('report_shape', { length: 20 }).notNull(), // 'legacy' | 'reporting-api' | 'unknown'
    blockedUri: varchar('blocked_uri', { length: 2000 }),
    violatedDirective: varchar('violated_directive', { length: 200 }),
    documentUri: varchar('document_uri', { length: 2000 }),
    sourceFile: varchar('source_file', { length: 2000 }),
    lineNumber: varchar('line_number', { length: 20 }),
    rawPayload: json('raw_payload').notNull(),
    userAgent: varchar('user_agent', { length: 500 }),
    ipAddress: varchar('ip_address', { length: 50 }),
  },
  (table) => ({
    receivedAtIdx: index('csp_reports_received_at_idx').on(table.receivedAt.desc()),
    directiveIdx: index('csp_reports_violated_directive_idx').on(table.violatedDirective),
    directiveReceivedAtIdx: index('csp_reports_directive_received_at_idx').on(
      table.violatedDirective,
      table.receivedAt
    ),
  })
);

export type CspReport = typeof cspReports.$inferSelect;
export type NewCspReport = typeof cspReports.$inferInsert;
```

### SecurityService 핵심 패턴

```ts
// fire-and-forget — CSP 엔드포인트 실패가 브라우저로 전파되면 안 됨
async saveReport(report: NormalizedCspReport): Promise<void> {
  try {
    await this.db.insert(cspReports).values({ ... });
  } catch (err) {
    this.logger.error('CSP report persistence failed', err);
    // throw 금지
  }
}
```

### Controller 수정 핵심

```ts
// handleReport는 void 유지, saveReport는 floating promise (await 없음)
handleReport(@Body() body: unknown, @Req() req: Request): void {
  // ... 기존 logger.warn 로직 유지 ...
  void this.service.saveReport(normalized); // fire-and-forget
}
```

### Raw SQL Migration

```sql
-- 0041_csp_reports.sql
CREATE TABLE IF NOT EXISTS "csp_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "received_at" timestamp DEFAULT now() NOT NULL,
  "report_shape" varchar(20) NOT NULL,
  "blocked_uri" varchar(2000),
  "violated_directive" varchar(200),
  "document_uri" varchar(2000),
  "source_file" varchar(2000),
  "line_number" varchar(20),
  "raw_payload" json NOT NULL,
  "user_agent" varchar(500),
  "ip_address" varchar(50)
);

CREATE INDEX IF NOT EXISTS "csp_reports_received_at_idx" ON "csp_reports" ("received_at" DESC);
CREATE INDEX IF NOT EXISTS "csp_reports_violated_directive_idx" ON "csp_reports" ("violated_directive");
CREATE INDEX IF NOT EXISTS "csp_reports_directive_received_at_idx" ON "csp_reports" ("violated_directive", "received_at");
```

### Verification

```bash
test -f packages/db/src/schema/csp-reports.ts
grep -q "csp-reports" packages/db/src/schema/index.ts
test -f apps/backend/drizzle/0041_csp_reports.sql
test -f apps/backend/src/modules/security/security.service.ts
grep -q "SecurityService" apps/backend/src/modules/security/security.module.ts
grep -q "saveReport" apps/backend/src/modules/security/security.controller.ts
grep -c "this\.logger\.warn" apps/backend/src/modules/security/security.controller.ts  # ≥ 3
```

---

## Phase-Independent Gates (전체 완료 후)

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run build
pnpm --filter backend run test
pnpm --filter backend run test:e2e
pnpm --filter frontend run test

# 품질 게이트
! git diff HEAD -- apps/backend/src apps/frontend/app packages | grep -E "^\+.*: any\b"
! git diff HEAD -- apps/backend/src apps/frontend/app packages | grep -E "^\+.*eslint-disable"
```

## Build Sequence (체크리스트)

- [ ] Phase 5 — 4곳 리터럴 교체 + 상수 2개 추가 (가장 작음)
- [ ] Phase 3 — 타입 파일 1개 + import 경로 조정
- [ ] Phase 4 — k6 스크립트 3개 신규 작성 (코드 변경 0)
- [ ] Phase 1 — DTO 14개 + controller import 조정
- [ ] Phase 2 — 스키마 + migration + Service + Controller 연결
- [ ] 전체 tsc/build/test 통과
