# QR Visual Redesign Followups Batch 1 — 구현 계획

> **▶ RESUMED (2026-05-12 T+15m)** — g4-g12 closure 확인. 도메인 충돌 재실측: S-3 StatusBadge 3 case 신규 (우리 7 추가) / S-6 19 production 잔존 (full scope) / S-1 AutoProgressCountdown G-8 완료 / S-4·S-7 충돌 0.

## 메타
- 생성: 2026-05-12
- 모드: Mode 2 (Full Planner→Generator→Evaluator)
- slug: `qr-visual-redesign-followups-batch-1`
- 상태: **진행 중** (Phase 1 S-6)
- 모 sprint: `qr-visual-redesign` (2026-05-11, MUST 22/25 PASS, completed)
- 예상 변경: 18~22개 파일 (실행 5건 + 차단 3건 closure 문서 포함)
- contract: `.claude/contracts/qr-visual-redesign-followups-batch-1.md`

## 설계 철학

`qr-visual-redesign` sprint SHOULD 후속 8건을 통합 closure 한다. 실행 가능 5건 (S-1 / S-3 / S-4 / S-6 / S-7) 은 시스템 전반 일관성 (SSOT / 하드코딩 0 / a11y / cron 2중 안전망 / deprecated API 제거) 으로 처리하고, 차단 3건 (S-2 / S-5 / S-8) 은 트리거 조건 명시한 WON'T-DO. 단편 fix 가 아닌 — backward-compat 제거 (S-6) 가 e2e (S-1) 의존 표면을 먼저 정리하고, backend 2중 안전망 (S-4) 가 frontend best-effort 의 회귀를 차단하며, RTL spec (S-3) 이 컴포넌트 회귀를 영구 봉인.

## 다중 세션 격리 정책 (반드시 준수)

**진행 중 다른 세션 active contract 2건 (절대 도메인 침범 금지):**

| slug | 도메인 (수정 금지) |
|---|---|
| `sw-validation-event-channel-separation` (Mode 1) | `apps/backend/src/common/cache/cache-event.registry.ts` · `apps/backend/src/common/cache/cache-event-listener.ts` · `apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts` · `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` · `.claude/skills/verify-cache-events/SKILL.md` |
| `ultrareview-shield-followups` (Mode 1) | `scripts/ultrareview-shield.sh` · `scripts/__tests__/ultrareview-shield.spec.mjs` · `.gitleaks.toml` · `.gitleaksignore` · `docs/references/ultrareview-usage.md` · `.husky/pre-push` |

**다른 세션 명시 보호 파일 (현재 dirty M — 본 sprint 절대 수정 금지):**
- `packages/schemas/src/audit-log.ts`
- `packages/shared-constants/src/entity-routes.ts`

**공유 위험 파일 (race condition — atomic 재읽기 후 merge):**
- `.claude/exec-plans/tech-debt-tracker.md` (3 세션 동시 [x] 가능)
- `.claude/contracts/REGISTRY.md` (3 세션 동시 active 등록 가능)

→ Phase 6 closure 단계에서 `git pull --rebase` 또는 atomic re-read 후 변경 merge.

## 사전 점검 (pre-flight 실측)

| 항목 | 실측 | 영향 |
|---|---|---|
| 옛날 QR handover 토큰 API (`issueHandoverToken` / `handover_tokens`) | production 코드 0건 (`.claude/`, `docs/` 의 옛 sprint 기록만 잔존) | 회귀 방지 grep contract 만 추가 (M-15) |
| `handoverCheckoutId` 잔존 위치 | production 코드 9 호출자 — backend interface 4 (`equipment.controller.ts`, `equipment.controller.types.ts`, `services/qr-access.service.ts`, `services/qr-access.service.spec.ts`) + frontend 5 (`EquipmentLandingClient.tsx`, `EquipmentActionSheet.tsx`, `hooks/use-equipment-by-management-number.ts`, `lib/api/equipment-api.ts`) + `packages/schemas/src/qr-handover.ts` (deprecated JSDoc 만) | S-6 완전 제거 가능. `handovers[].id` 로 단일 진입점. |
| `documents` 테이블 classification 컬럼 | **없음**. `document_type` (`varchar(50)`) 가 분류. `condition_check_photo` 는 `DocumentType` enum 값 (`packages/shared-constants/src/file-types.ts:151`). | S-4 cron SQL 은 `document_type = 'condition_check_photo'` + 다형성 FK 9개 (`equipment_id`, `condition_check_id`, `checkout_id`, `non_conformance_id`, `request_id`, `software_validation_id`, `intermediate_inspection_id`, `self_inspection_id`, `calibration_id`) 전부 NULL + `status != 'deleted'` + `uploaded_at < now() - INTERVAL '24 hours'`. |
| `@nestjs/schedule` 통합 | `app.module.ts` import 완료, 기존 cron 9건 운영 (`DocumentRetentionScheduler` 외 8건). 패턴: `@Cron(CronExpression.EVERY_DAY_AT_2AM)`. | S-4 신규 `OrphanPhotoCleanupScheduler` 기존 패턴 정합 추가. 별도 모듈 신설 불필요 — `apps/backend/src/modules/documents/schedulers/` 디렉토리에 추가 + `DocumentsModule` providers 등록. |
| Prometheus Counter SSOT | `apps/backend/src/common/metrics/metrics.service.ts:86-98` (`sortRejectionCounter` / `sortRejectionDropsCounter` 패턴) | `orphan_photo_sweep_total{result}` Counter 신설 (labels: result = 'deleted' \| 'errors' \| 'skipped'). |
| AuditLog SSOT (`@AuditLog` decorator) | `apps/backend/src/modules/documents/documents.controller.ts:341` (`action='delete', entityType='document', entityIdPath='params.id'`). cron은 decorator 불가 (HTTP 컨텍스트 외부) → AuditLog service 직접 호출 패턴 필요. | S-4 cron 은 `AuditLogService.record({...})` 직접 호출 (batch 단위 1건, deletedIds 배열 포함). |
| `--touch-target-min` 정의 위치 | `apps/frontend/styles/globals.css` + `apps/frontend/styles/accessibility.css` (44px → 48px 상향됨, 2026-05-11). `CSS_VAR_NAMES.touchTargetMin` SSOT 등록 완료. | S-7 audit 은 **read-only** — production 코드 변경 0. 산출물은 audit 문서 단건. |
| `--touch-target-min` 사용처 | grep 결과 9 파일 (`EquipmentConditionForm.tsx` / `AutoProgressCountdown.tsx` / `EquipmentActionSheet.tsx` / `HandoverPickerSheet.tsx` / `ManualEntryFallback.tsx` / `MobileScanTrigger.tsx` / `app/(dashboard)/e/[managementNumber]/not-found.tsx` 등). | 모든 사용처는 모바일 QR/스캔 경로 — 의도된 상향 적용 범위. desktop sticky bar/list filter 등 비모바일 0건 확인됨 (audit 결론). |
| e2e fixture | `apps/frontend/tests/e2e/shared/fixtures/auth.fixture.ts` — storageState 기반 5 role (test_engineer / technical_manager / quality_manager / lab_manager / system_admin). S-1 시나리오는 도메인 role (`testOperatorPage` `lab_manager` 등) 사용 — `systemAdminPage` 사용 금지 (verify-e2e Step 25). | S-1 신규 spec 은 `testOperatorPage` (시험실무자 = borrower 시나리오) + `siteAdminPage` (lab_manager) 위주 사용. |
| RTL spec 기존 패턴 | `apps/frontend/components/calibration/__tests__/CalibrationDueBadge.test.tsx` (10 cases, M-25 통과). `jest.mock('next-intl', ...)` + `NOW` 시간 고정 + `describe`별 시나리오 분리. | S-3 신규 2 spec (StatusBadge / HandoverPickerSheet) 동일 패턴. MessagesProvider mock 단순화. |

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|---|---|---|
| S-6 deprecation 제거 시기 | 본 sprint 내 즉시 제거 | `qr-visual-redesign` (2026-05-11) 이후 1 release 경과. `handovers[].id` 로 모든 호출자 이미 마이그레이션 완료 (실측). CLAUDE.md "No backwards-compatibility hacks" 정합. |
| S-6 deprecation 제거 vs S-1 e2e 선후 | S-6 먼저, S-1 나중 | S-1 spec 은 신 API (`handovers[].id` 만) 사용 — backward-compat 우회 경로 검증 금지. S-6 가 표면 줄이고 S-1 spec 이 깨끗한 신 API 만 fixture 화. |
| S-4 cron 모듈 위치 | 기존 `DocumentsModule` providers 추가 (신규 모듈 0) | `DocumentRetentionScheduler` 와 동일 도메인. `apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts` 신설. |
| S-4 orphan 판정 조건 | `document_type = 'condition_check_photo'` AND **9 다형성 FK 전부 NULL** AND `status != 'deleted'` AND `uploaded_at < now() - INTERVAL '24 hours'` | classification 컬럼 부재. document_type 이 분류. 다형성 FK 전부 NULL 만 진짜 orphan (조기 cron 이 in-flight 업로드 삭제 위험 차단 — 24h 마진). |
| S-4 삭제 정책 | `purgeDeletedDocuments` 패턴 차용 — 파일 best-effort 삭제 우선 → DB 하드 삭제 (soft-delete 경유 X — orphan 은 user-visible 0) | retention 기간 의미 없음. 파일 + DB 양쪽 즉시 정리. |
| S-4 실행 주기 | `@Cron(CronExpression.EVERY_HOUR)` — 1시간마다 | 24h 마진 보유 + 1시간 주기로 누적 0건 유지. `DocumentRetentionScheduler` 의 일 1회 (2AM) 대비 더 짧은 주기 — orphan 누적 빠른 정리. |
| S-4 audit 기록 | `AuditLogService.record({action: 'orphan_sweep', entityType: 'document', entityId: 'batch:{timestamp}', metadata: {deletedIds, errors}})` 1 batch = 1 audit row | row N건 audit 폭주 회피. metadata.deletedIds = uuid 배열. |
| S-4 Prometheus | `orphan_photo_sweep_total{result}` (result = 'deleted' / 'errors' / 'skipped') Counter | `metrics.service.ts` 패턴 정합. cardinality = 3 (안전). |
| S-3 spec 위치 | `apps/frontend/components/ui/__tests__/StatusBadge.test.tsx` + `apps/frontend/components/mobile/__tests__/HandoverPickerSheet.test.tsx` | `CalibrationDueBadge.test.tsx` 패턴 정합 (도메인별 `__tests__` 하위). |
| S-1 spec 위치 | `apps/frontend/tests/e2e/features/equipment/qr/regression-scenarios.spec.ts` 단일 파일 (6 시나리오 1 spec — 공통 fixture seed 1회) | 기존 `features/equipment/comprehensive/*.spec.ts` 패턴 정합. seed-spec 분리 패턴이 비싸므로 단일 spec 내부 `test.beforeAll` 로 시드. |
| S-1 actor | `testOperatorPage` (1~4 시나리오 borrower/owner) + `siteAdminPage` (5 non_conforming view) — `systemAdminPage` 사용 금지 | verify-e2e Step 25 (도메인 role 사용 필수, scope 검증 dead code 방지). |
| S-7 산출물 | `docs/exec-plans/audits/2026-05-12-touch-target-44-to-48-audit.md` 단건 + tech-debt-tracker S-7 [x] closure | 결론 1: 의도된 상향 — desktop 0 사용처 확인 (production code 검색 + 모바일 경로 한정). |
| 차단 3건 (S-2 / S-5 / S-8) | WON'T-DO + 트리거 명시 (Storybook 도입 / visual regression CI / UX 팀 design review) | 기존 sprint 패턴 (sw-validation A6 / saved-views S-9) 정합. |

---

## 구현 Phase

### Phase 1 — S-6 `handoverCheckoutId` deprecation 완전 제거

**목표:** 9 호출자에서 `handoverCheckoutId` 잔존 제거, `handovers[].id` 단일 진입점 확정. S-1 e2e 가 깨끗한 신 API 만 검증하도록 표면 정리.

**선행 검증 (실행 전):**
```bash
grep -rn "handoverCheckoutId" apps/backend apps/frontend packages \
  --include="*.ts" --include="*.tsx" \
  | grep -v "@deprecated\|deprecated"
# Expected: 9 production lines + JSDoc 잔존만
```

**변경 파일:**
1. `apps/backend/src/modules/equipment/services/qr-access.service.ts` — 수정
   - `QRAccessResult.handoverCheckoutId?: string` 필드 제거
   - `result.handoverCheckoutId = handovers[0].id;` 제거
   - `deprecatedHandoverCheckoutIdLogged` ref + `logger.debug(...)` 호출 제거
   - JSDoc 정리 — `handovers` 단일 SSOT 명시
2. `apps/backend/src/modules/equipment/equipment.controller.types.ts` — 수정
   - `handoverCheckoutId?: string;` 필드 제거
3. `apps/backend/src/modules/equipment/equipment.controller.ts` — 수정
   - `...(qrResult.handoverCheckoutId && { handoverCheckoutId: qrResult.handoverCheckoutId })` 제거
4. `apps/backend/src/modules/equipment/services/qr-access.service.spec.ts` — 수정
   - backward-compat assertion (`handoverCheckoutId === handovers[0].id`) 제거
   - `expect(result.handoverCheckoutId).toBeUndefined()` 제거
   - 기존 PASS spec 가 `handovers` 만 검증하는 형태로 유지
5. `apps/frontend/lib/api/equipment-api.ts` — 수정
   - `handoverCheckoutId?: string;` 타입 필드 2 곳 제거 + JSDoc deprecated 줄 제거
6. `apps/frontend/hooks/use-equipment-by-management-number.ts` — 수정
   - `handoverCheckoutId?: string;` 제거
7. `apps/frontend/components/mobile/EquipmentLandingClient.tsx` — 수정
   - `if (data.handoverCheckoutId) { ... }` 분기 제거
   - `useCallback` deps array 에서 `data.handoverCheckoutId` 제거
   - `<EquipmentActionSheet handoverCheckoutId={...} />` prop 제거
8. `apps/frontend/components/mobile/EquipmentActionSheet.tsx` — 수정
   - prop 타입 `handoverCheckoutId?: string;` 제거
   - destructure 제거
   - fallback 분기 (`if (list.length === 0 && handoverCheckoutId)`) 제거
   - useCallback deps `handoverCheckoutId` 제거
9. `packages/schemas/src/qr-handover.ts` — 수정
   - deprecated 주석 갱신 — "`handoverCheckoutId` 는 2026-05-12 sprint `qr-visual-redesign-followups-batch-1` 에서 제거"

**검증:**
```bash
grep -rn "handoverCheckoutId" apps/backend/src apps/frontend packages/schemas \
  --include="*.ts" --include="*.tsx" \
  | grep -vE "^\s*(\*|//)"
# Expected: 0

pnpm tsc --noEmit
# Expected: EXIT=0

pnpm --filter backend run test -- qr-access.service
# Expected: PASS
```

---

### Phase 2 — S-4 orphan condition_check_photo 백엔드 cron 2중 안전망

**목표:** frontend `documentApi.deleteOrphan` (best-effort) 의 silent fail 회귀를 backend cron (1h 주기) 으로 2중 안전망 구축. 24h 마진 + AuditLog + Prometheus 관측성.

**변경 파일:**
1. `apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts` — 신규
   - `@Injectable` + `@Cron(CronExpression.EVERY_HOUR)` 패턴
   - SQL: `document_type = 'condition_check_photo'` AND 9 다형성 FK 전부 NULL AND `status != 'deleted'` AND `uploaded_at < now() - INTERVAL '24 hours'`
   - 배치 크기 100, `purgeDeletedDocuments` 패턴 차용
   - 무한루프 가드: 연속 2 batch 전체 실패 시 abort
   - AuditLogService 호출 (batch 단위, 1 audit row, metadata = deletedIds 배열 + errors)
   - MetricsService `incrementOrphanPhotoSweep('deleted'|'errors'|'skipped')` 호출
2. `apps/backend/src/common/metrics/metrics.service.ts` — 수정
   - `orphanPhotoSweepCounter = new Counter({ name: 'orphan_photo_sweep_total', ..., labelNames: ['result'] })` 추가
   - `incrementOrphanPhotoSweep(result: 'deleted' | 'errors' | 'skipped'): void` 메소드 추가
3. `apps/backend/src/modules/documents/documents.module.ts` — 수정
   - `providers: [..., OrphanPhotoCleanupScheduler]` 추가
4. `apps/backend/src/common/file-upload/document.service.ts` — 수정
   - `sweepOrphanConditionCheckPhotos(olderThanHours: number, batchSize: number): Promise<{ deleted: number; errors: number; deletedIds: string[] }>` 메소드 추가
5. `apps/backend/src/common/file-upload/__tests__/document.service.spec.ts` — 신규 또는 확장
   - `sweepOrphanConditionCheckPhotos` 3 unit case
6. `apps/backend/src/modules/documents/schedulers/__tests__/orphan-photo-cleanup.scheduler.spec.ts` — 신규
7. `apps/frontend/lib/api/document-api.ts` — 수정 (주석만)

**검증:**
```bash
test -f apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts && echo OK

grep -n "@Cron(CronExpression\.\|@Injectable()" apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts
# Expected: ≥2 matches

grep -cE "isNull\(.*equipmentId\)|isNull\(.*conditionCheckId\)|isNull\(.*checkoutId\)|isNull\(.*nonConformanceId\)|isNull\(.*requestId\)|isNull\(.*softwareValidationId\)|isNull\(.*intermediateInspectionId\)|isNull\(.*selfInspectionId\)|isNull\(.*calibrationId\)" \
  apps/backend/src/common/file-upload/document.service.ts apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts
# Expected: ≥9

grep -n "orphan_photo_sweep_total\|orphanPhotoSweepCounter" apps/backend/src/common/metrics/metrics.service.ts
# Expected: ≥2

pnpm --filter backend run test -- --testPathPattern='(orphan-photo|document\.service|orphan-photo-cleanup)'
# Expected: PASS
```

---

### Phase 3 — S-3 StatusBadge + HandoverPickerSheet RTL spec

**목표:** `CalibrationDueBadge.test.tsx` 10/10 패턴 차용. 컴포넌트 회귀 영구 봉인.

**변경 파일:**
1. `apps/frontend/components/ui/__tests__/StatusBadge.test.tsx` — 신규
   - 8 EquipmentStatus values × tone 매핑 verify
   - a11y: `role` / `aria-label`
   - 최소 10 case
2. `apps/frontend/components/mobile/__tests__/HandoverPickerSheet.test.tsx` — 신규
   - 다중 차용자 렌더, 클릭 → onSelect, 빈 배열, 키보드 nav, Esc/focus trap, a11y
   - 최소 6 case

**검증:**
```bash
test -f apps/frontend/components/ui/__tests__/StatusBadge.test.tsx
test -f apps/frontend/components/mobile/__tests__/HandoverPickerSheet.test.tsx

grep -c "^\s*it(\|^\s*test(" apps/frontend/components/ui/__tests__/StatusBadge.test.tsx
# Expected: ≥10

grep -c "^\s*it(\|^\s*test(" apps/frontend/components/mobile/__tests__/HandoverPickerSheet.test.tsx
# Expected: ≥6

pnpm --filter frontend run test -- StatusBadge HandoverPickerSheet CalibrationDueBadge
# Expected: PASS
```

---

### Phase 4 — S-1 QR landing 6 회귀 시나리오 Playwright e2e

**목표:** sprint `qr-visual-redesign` 회귀 6 시나리오 자동화. S-6 closure 후 신 API (`handovers[].id`) 만 사용.

**선행 의존:** Phase 1 (S-6) 완료 — spec 이 `handoverCheckoutId` 참조 0건.

**변경 파일:**
1. `apps/frontend/tests/e2e/features/equipment/qr/regression-scenarios.spec.ts` — 신규
   - 시나리오 1~6
   - actor: 1~4 = `testOperatorPage` / 5~6 = `siteAdminPage`
2. `apps/frontend/tests/e2e/features/equipment/qr/seed-helpers.ts` — 신규 (옵션)

**검증:**
```bash
test -f apps/frontend/tests/e2e/features/equipment/qr/regression-scenarios.spec.ts

grep -c "^\s*test(\|^\s*test\.describe" apps/frontend/tests/e2e/features/equipment/qr/regression-scenarios.spec.ts
# Expected: ≥6

grep -rn "systemAdminPage" apps/frontend/tests/e2e/features/equipment/qr/
# Expected: 0

grep -rn "handoverCheckoutId" apps/frontend/tests/e2e/features/equipment/qr/
# Expected: 0
```

---

### Phase 5 — S-7 `--touch-target-min` 44→48 영향 audit (read-only)

**목표:** 2026-05-11 sprint 에서 변경한 `--touch-target-min` 44→48px 의 영향 범위를 audit 문서로 closure.

**산출물:**
1. `docs/exec-plans/audits/2026-05-12-touch-target-44-to-48-audit.md` — 신규
   - 사용처 9 파일 enumeration
   - desktop sticky bar / list filter / button group 영향 검증
   - 결론: 의도된 상향 — desktop 영향 0

**검증:**
```bash
test -f docs/exec-plans/audits/2026-05-12-touch-target-44-to-48-audit.md

grep -c "apps/frontend/" docs/exec-plans/audits/2026-05-12-touch-target-44-to-48-audit.md
# Expected: ≥9
```

---

### Phase 6 — 차단 3건 closure + tech-debt-tracker 갱신

**목표:** S-2/S-5/S-8 사유 명시 + 트리거 기록. tech-debt-tracker.md atomic merge.

**변경 파일:**
1. `.claude/exec-plans/tech-debt-tracker.md` — 수정 (atomic read-modify-write)
2. `.claude/contracts/REGISTRY.md` — 수정
3. contract + exec-plan completed/ 이동 (Evaluator PASS 후)

**검증:**
```bash
grep -E "qr-visual-redesign S-[1346]|qr-visual-redesign S-7" .claude/exec-plans/tech-debt-tracker.md | grep -c "\[x\]"
# Expected: ≥5

grep -E "qr-visual-redesign S-[258]" .claude/exec-plans/tech-debt-tracker.md | grep -cE "WON'?T.DO|차단|보류"
# Expected: ≥3

git diff --name-only HEAD -- \
  "apps/backend/src/common/cache/cache-event.registry.ts" \
  "apps/backend/src/common/cache/cache-event-listener.ts" \
  "scripts/ultrareview-shield.sh" \
  ".gitleaks.toml" \
  "packages/schemas/src/audit-log.ts" \
  "packages/shared-constants/src/entity-routes.ts"
# Expected: 비어 있음
```

---

## 의사결정 로그

- 2026-05-12 1차 — S-6 우선순위: S-1 e2e 가 신 API만 검증해야 backward-compat silent fail 미발생 → S-6 → S-1 순서.
- 2026-05-12 2차 — S-4 cron 위치: 기존 `DocumentsModule` providers 추가 (신규 모듈 0).
- 2026-05-12 3차 — S-4 orphan 판정: `documents.classification` 부재 → `document_type` 사용 + 9 FK NULL + 24h 마진.
- 2026-05-12 4차 — S-4 audit 입자: batch 단위 1 audit + metadata.deletedIds 배열 (row N건 audit 폭주 회피).
- 2026-05-12 5차 — S-7 read-only: 사용처 9 파일 모두 모바일 경로 → desktop 영향 0 → audit md 단건.
- 2026-05-12 6차 — S-1 actor: `testOperatorPage` / `siteAdminPage`. `systemAdminPage` 금지 (verify-e2e Step 25).
- 2026-05-12 7차 — 다른 세션 격리: sw-validation / ultrareview-shield 도메인 미수정. M-16 grep contract.
- 2026-05-12 8차 — 옛 handover token API 회귀 차단: M-15 grep.

---

*Plan version*: 1 · *Date*: 2026-05-12 · *Mode 2 harness Planner*
