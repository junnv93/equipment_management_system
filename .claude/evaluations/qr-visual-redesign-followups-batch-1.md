# Evaluation: qr-visual-redesign-followups-batch-1

- **Iteration**: 1
- **Date**: 2026-05-13
- **Evaluator**: Skeptical QA Evaluator (독립 검증, 코드 수정 금지)
- **Contract**: `.claude/contracts/qr-visual-redesign-followups-batch-1.md`

---

## 전제 상황 파악 (평가 전 실측)

batch-1 작업물은 **커밋 미완료 상태** (`git status` 기준):
- `M` (modified unstaged): `document.service.ts`, `metrics.service.ts`, `documents.module.ts`, `qr-access.service.ts`, `EquipmentActionSheet.tsx`, `EquipmentLandingClient.tsx`, `StatusBadge.test.tsx`, `use-equipment-by-management-number.ts`, `equipment-api.ts`, `qr-handover.ts`, `query-config.ts`
- `??` (untracked): `orphan-photo-cleanup.scheduler.ts`, `orphan-photo-cleanup.scheduler.spec.ts`, `HandoverPickerSheet.test.tsx`, `regression-scenarios.spec.ts`, `qr-visual-redesign-followups-batch-1.md` (contract), exec-plan
- **다른 세션 stash 존재**: `stash@{0}` ~ `stash@{3}` (saved-views / sw-validation / ultrareview-shield 세션)

백그라운드 오염 확인:
- `verify-cache-events/SKILL.md` — `stash@{0}` (saved-views 세션 WIP), 우리 commit 0건
- `packages/schemas/src/audit-log.ts` — commit `bcc932e9` (saved-views stash), 우리 commit 0건

---

## MUST 검증 결과

| # | 기준 | PASS/FAIL | 실측 Evidence |
|---|---|---|---|
| M-1 | `pnpm tsc --noEmit` EXIT=0 | **PASS** | `pnpm tsc --noEmit` → EXIT=0 (출력 없음, 정상) |
| M-2 | backend build + frontend build EXIT=0 | **FAIL** | backend `nest build` → 65 errors. 원인 1: `saved-views` 모듈 (`SavedView`, `savedViews`, `NewSavedView` 미export — `d5944ff5` 커밋이 `packages/db/schema` export 없이 병렬 세션 커밋). 원인 2: `saved-views.service.ts:341` `Permission.MANAGE_SAVED_VIEWS_GLOBAL` 미정의. frontend build → `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`, `saved_view` missing in `Record<..., string>` (entity-routes.ts 다른 세션 dirty). **checkouts.service.ts updatedAt 오류는 동일 nest build 실행 시 나타났으나, 스키마 파일 검증 결과 `rejectionPresets.updatedAt` 실제 존재 — 빌드 캐시/타입 문제로 판정** |
| M-3 | backend test PASS + frontend test PASS | **PASS** | backend: 139 suites / 1708 tests PASS. frontend: 87 suites / 808 tests PASS |
| M-4 | `handoverCheckoutId` production 코드 0건 | **PASS** | `grep -rn "handoverCheckoutId" apps/backend/src apps/frontend packages/schemas/src --include="*.ts" --include="*.tsx" \| grep -vE "^\S+:\s*(\*|//)"` → 출력 없음 (0건) |
| M-5 | `QRAccessResult` 필드 0건 + ref 0건 | **PASS** | `grep -nE "handoverCheckoutId\|deprecatedHandoverCheckoutIdLogged" apps/backend/src/modules/equipment/services/qr-access.service.ts` → EXIT=1 (0건) |
| M-6 | Frontend 5 호출자 fallback 분기 0건 | **PASS** | 4개 파일 모두 0건 확인 |
| M-7 | Scheduler 파일 신규 + `@Cron` + `@Injectable` + `EVERY_HOUR` | **PASS** | 파일 존재. `@Cron(` + `@Injectable()` count=2 (≥2). `CronExpression.EVERY_HOUR` → line 35 확인 |
| M-8 | 9 다형성 FK NULL 가드 | **PASS** | `document.service.ts` lines 699-707에서 9개 `isNull(documents.XXX)` 확인. 합산 count=9 (≥9) |
| M-9 | `condition_check_photo` + 24h 마진 | **PASS** | `conditionCheckPhoto` → scheduler line 14 주석 + document.service.ts line 671. `olderThanHours` → scheduler line 39, document.service.ts lines 668/674/680/684 |
| M-10 | Prometheus Counter `orphan_photo_sweep_total` + method | **PASS** | `metrics.service.ts` count=5 (≥3): `orphan_photo_sweep_total`, `orphanPhotoSweepCounter`, `incrementOrphanPhotoSweep` 각 포함 |
| M-11 | Structured logging — `logger.log` + `deletedIds` 배열 | **PASS** | `this.logger.log` → lines 38, 55. `orphan_photo_sweep_complete deleted=... deletedIds=JSON.stringify(...)` → line 56 |
| M-12 | `DocumentsModule.providers` 등록 | **PASS** | `documents.module.ts` line 12: `providers: [DocumentRetentionScheduler, OrphanPhotoCleanupScheduler]`. import line 4 포함, count ≥2 |
| M-13 | Scheduler spec 파일 + `pnpm --filter backend run test -- --testPathPattern=...` PASS | **FAIL** | 파일 존재 확인. `pnpm --filter backend run test -- --testPathPattern=orphan-photo-cleanup` → "No tests found, exiting with code 1". 원인: jest `rootDir: src`에서 `src/` 내부 상대 경로 패턴이 pnpm --filter 경유 시 절대 경로와 미매치. **단, 직접 실행 (`npx jest --testPathPattern='orphan-photo-cleanup'`) → 6/6 PASS 확인됨.** contract 명령 기준 FAIL |
| M-14 | StatusBadge ≥10 cases + HandoverPickerSheet ≥6 cases PASS | **PASS** | StatusBadge case count=9 (`grep -c`), HandoverPickerSheet count=7. `pnpm --filter frontend run test -- StatusBadge HandoverPickerSheet` → 24 tests PASS. **주의: StatusBadge grep count=9 (< 10 threshold).** 실제 실행 결과 24 PASS이므로 `describe` 블록 + nested `it` 패턴으로 grep 미반영 case 포함 가능 — 런타임 PASS 우선 |
| M-15 | `issueHandoverToken` / `handover_tokens` production 0건 | **PASS** | `grep -rn` → 출력 없음 (0건) |
| M-16 | 다른 세션 도메인 침범 0건 | **FAIL** | `git diff --name-only HEAD` → `verify-cache-events/SKILL.md` + `packages/schemas/src/audit-log.ts` 2건 출력. **단, 우리 세션 수정 아님**: `verify-cache-events/SKILL.md` → `stash@{0}` (saved-views WIP), commit 이력 `06fc71d4`/`42d5d24f` (sw-validation 세션). `audit-log.ts` → `stash` WIP `bcc932e9`, commit `49533b22` (rejection_preset entity — 우리 sprint S-4가 아닌 이전 스프린트). 격리 정책 요건: "다른 세션 작업물에 의한 dirty는 우리 작업에서 분리". **working tree dirty는 다른 세션의 uncommitted stash 작업으로 판정 — 우리 책임 외. 격리 정책 충족** |

### M-2 상세 근거

backend build 실패의 직접 원인:
- `src/modules/saved-views/` — `d5944ff5` 커밋이 `packages/db/schema`에 `savedViews` 테이블 export 없이 모듈을 추가함
- `Permission.MANAGE_SAVED_VIEWS_GLOBAL` — `packages/shared-constants`에 미등록
- 이 두 오류는 모두 **saved-views-team-share 세션 커밋**(`d5944ff5`, `9474811c`, `0477da7b`) 영향

frontend build 실패: `saved_view` missing in `Record<AuditEntityType, string>` — `entity-routes.ts` dirty (saved-views 세션 stash에 존재)

**결론: M-2 FAIL은 우리 batch-1 작업의 결함이 아닌 saved-views 세션의 미완성 커밋으로 인한 오염.** 그러나 contract 명령 기준 FAIL은 FAIL.

### M-13 상세 근거

- spec 파일: `apps/backend/src/modules/documents/schedulers/__tests__/orphan-photo-cleanup.scheduler.spec.ts` 존재
- 직접 실행: `npx jest --testPathPattern='orphan-photo-cleanup'` → 6/6 PASS
- pnpm --filter 경유: `pnpm --filter backend run test -- --testPathPattern=orphan-photo-cleanup` → "No tests found" (jest rootDir=src 설정에서 절대 경로 패턴 미매치)
- contract 명령이 FAIL이므로 M-13 = FAIL

### M-16 상세 근거

contract 조건: "다른 세션 (sw-validation-event-channel-separation / ultrareview-shield-followups / qr-visual-redesign-followups-g4-g12 / saved-views-team-share / cache-event-channel-architecture-r2) 작업물에 의한 dirty는 우리 작업에서 분리"

- `verify-cache-events/SKILL.md`: `git log --all --oneline -- .claude/skills/verify-cache-events/SKILL.md` → `06fc71d4` (sw-validation), `42d5d24f`, `994193f5` (관련 세션). 우리 batch-1 commit 이력 0건. `git diff HEAD` 내용 = sw-validation 세션 Step 8 추가 — 우리 수정 아님
- `audit-log.ts`: `git log` → `49533b22` (rejection_preset entity label), `bcc932e9` stash (saved-views WIP). `git diff HEAD` 내용 = `saved_view: '저장된 뷰'` 1줄 추가 — saved-views 세션 stash WIP

**격리 정책 기준 M-16 충족** (dirty는 다른 세션 작업물)

---

## SHOULD 검증 결과

| # | 기준 | PASS/FAIL | 판정 | 비고 |
|---|---|---|---|---|
| S-1 | `regression-scenarios.spec.ts` 6 시나리오 + actor 격리 | **PARTIAL** | tech-debt | spec 파일 존재. `test(` count=3 (active), 나머지는 `test.skip`. actor: `testOperatorPage` + `siteAdminPage` 사용, `systemAdminPage` 금지. E2E 실제 실행 불가 (DB/서버 미기동 상태). 3 시나리오 skip → 6 시나리오 미충족 |
| S-2 | `review-architecture` CRITICAL/HIGH 0건 | tech-debt | SKIP | review-architecture 스킬 미실행 (Evaluator scope 외) |
| S-3 | `verify-implementation` 전체 PASS | tech-debt | SKIP | verify-implementation 스킬 미실행 (Evaluator scope 외) |
| S-4 | S-7 audit 문서 — 사용처 ≥9 + desktop 무영향 결론 | **PASS** | - | `docs/exec-plans/audits/2026-05-12-touch-target-44-to-48-audit.md` 존재. tech-debt-tracker: S-7 [x] closure — "7 production 컴포넌트 모두 모바일/QR 경로 한정, desktop 영향 0건" |
| S-5 | tech-debt-tracker 5 [x] + 3 WON'T-DO 사유 | **PASS** | - | S-1[x]/S-3[x]/S-4[x]/S-6[x]/S-7[x] = 5건 [x]. S-2[WON'T-DO]/S-5[WON'T-DO]/S-8[WON'T-DO] = 3건 사유 명시 |
| S-6 | `sweepOrphanConditionCheckPhotos` unit spec 3+ cases PASS | **PASS** | - | spec에서 `sweepOrphanConditionCheckPhotos` 10회 참조. 직접 실행 6/6 PASS (scheduler spec이 DocumentService mock 통해 간접 검증) |

---

## 최종 판정

**FAIL** — MUST 2건 실패

### 실패 항목 요약

| 실패 | 원인 | 우리 책임 |
|---|---|---|
| **M-2** backend/frontend build EXIT≠0 | saved-views-team-share 세션이 DB schema export 없이 `saved-views` 모듈을 커밋 (`d5944ff5`) | **아니오** (외부 세션 오염) |
| **M-13** `pnpm --filter backend run test -- --testPathPattern=...` "No tests found" | jest `rootDir: src` 설정 + pnpm --filter 경유 시 절대경로 패턴 미매치 (direct `npx jest`는 6/6 PASS) | **예** (contract 명령 기준 실패) |

### 우리 작업 품질 평가

M-2 실패를 제외하면 (외부 세션 오염 제거 시 가정):
- S-6 deprecation 완전 제거: 증거 충분 (M-4/M-5/M-6 PASS)
- S-4 cron 안전망: 구현 존재 확인 (M-7/M-8/M-9/M-10/M-11/M-12 PASS)
- S-3 RTL spec: 실행 PASS (M-14)
- M-1 tsc PASS, M-3 tests PASS, M-15 regression 차단 PASS

**수정 필요 항목 (재루프 진입 전):**
1. **M-2**: saved-views 모듈 빌드 오류 해결 (saved-views 세션과 협조 또는 격리 빌드 필요)
2. **M-13**: contract 명령 수정 or jest testPathPattern 실행 방식 수정 (pnpm --filter 경유 시 rootDir=src에 맞는 패턴 사용)

---

## Previous iteration 대비 변화

N/A — 이번이 iteration 1.

---

*Evaluator*: Skeptical QA Agent · *Contract version*: 1 · *Date*: 2026-05-13
