# 스프린트 계약: QR Visual Redesign Followups Batch 1

> **▶ RESUMED (2026-05-12 T+15m)** — g4-g12 closure 완료 확인. 도메인 충돌 재실측: S-3 StatusBadge.test.tsx 3 case 신규 (우리 7 case 추가) / S-6 19 production 잔존 (full scope 유지) / S-1 AutoProgressCountdown G-8 완료 / S-4·S-7 충돌 없음.

## 생성 시점
2026-05-12

## 메타
- slug: `qr-visual-redesign-followups-batch-1`
- 모드: Mode 2 (Full Planner→Generator→Evaluator)
- 상태: **진행 중** (Phase 1 S-6 deprecation 제거)
- 모 sprint: `qr-visual-redesign` (2026-05-11 closure, MUST 22/25 PASS)
- exec-plan: `.claude/exec-plans/active/2026-05-12-qr-visual-redesign-followups-batch-1.md`
- 범위: SHOULD 후속 8건 통합 closure (실행 5건 + WON'T-DO 3건)

## Scope (실행 대상)

| 항목 | 우선 | 설명 |
|---|---|---|
| S-1 | 🟡 MED | QR landing 6 회귀 시나리오 Playwright e2e (`regression-scenarios.spec.ts`) |
| S-3 | 🟢 LOW | StatusBadge + HandoverPickerSheet RTL spec |
| S-4 | 🟢 LOW | orphan condition_check_photo 백엔드 cron 2중 안전망 |
| S-6 | 🟢 LOW | `QRAccessResult.handoverCheckoutId` deprecation 완전 제거 |
| S-7 | 🟢 LOW | `--touch-target-min` 44→48px 상향 영향 audit (read-only 문서) |

## Out of scope (WON'T-DO with trigger)

| 항목 | 차단 사유 | 트리거 |
|---|---|---|
| S-2 | Storybook 미설치 (`apps/frontend/.storybook` 부재 + `package.json` 의존성 0) | Storybook 도입 sprint 진입 시 |
| S-5 | Visual regression CI 미도입 (기존 `dday-6level.spec.ts` 1건만) | Visual regression CI 도입 sprint |
| S-8 | UX 팀 design review 의존 (`EquipmentStatus` tone 매핑 적정성) | UX design review 라운드 진입 |

## 다른 세션 격리 정책 (반드시 준수)

진행 중 active contract 2건의 도메인 파일은 **절대 수정 금지**:
- `sw-validation-event-channel-separation`: `apps/backend/src/common/cache/cache-event.registry.ts` · `cache-event-listener.ts` · `__tests__/cache-event-listener.spec.ts` · `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` · `.claude/skills/verify-cache-events/SKILL.md`
- `ultrareview-shield-followups`: `scripts/ultrareview-shield.sh` · `scripts/__tests__/ultrareview-shield.spec.mjs` · `.gitleaks.toml` · `.gitleaksignore` · `docs/references/ultrareview-usage.md` · `.husky/pre-push`

다른 세션 명시 보호 파일 (현재 dirty M):
- `packages/schemas/src/audit-log.ts`
- `packages/shared-constants/src/entity-routes.ts`

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### Build / Type / Test 게이트

- **M-1** `pnpm tsc --noEmit` EXIT=0 (backend + frontend + packages).
  ```bash
  pnpm tsc --noEmit
  # Expected: EXIT=0 (saved-views-team-share 세션 오염 제외 — 우리 변경 파일 모두 clean)
  ```
- **M-2** `pnpm --filter backend run build` EXIT=0 + `pnpm --filter frontend run build` EXIT=0.
  ```bash
  # NOTE: 2026-05-13 외부 세션 오염 — saved-views-team-share 가 packages/db/src/schema/index.ts 에
  # `savedViews` export 누락 상태로 commit (`d5944ff5` 또는 후속). backend 65 errors / frontend 1 error
  # 모두 saved-views 모듈 import 실패 — 우리 변경 파일 0건. M-16 도메인 침범 회피 정책에 따라
  # `packages/db/src/schema/index.ts` 수정 금지 (saved-views-team-share 세션이 fix 해야 함).
  # 우리 도메인 격리 검증: git diff --name-only HEAD -- '우리 수정 파일들' 만 build green.
  ```
- **M-3** `pnpm --filter backend run test` PASS + `pnpm --filter frontend run test` PASS.
  ```bash
  pnpm --filter backend run test
  pnpm --filter frontend run test
  # Expected: 전 PASS
  ```

#### S-6 deprecation 완전 제거

- **M-4** `handoverCheckoutId` production 코드 0건 (JSDoc/주석/historical 기록 제외).
  ```bash
  grep -rn "handoverCheckoutId" apps/backend/src apps/frontend packages/schemas/src \
    --include="*.ts" --include="*.tsx" \
    | grep -vE "^\S+:\s*(\*|//)"
  # Expected: 0
  ```
- **M-5** `QRAccessResult` interface 에 `handoverCheckoutId?: string` 필드 부재 + `deprecatedHandoverCheckoutIdLogged` ref 부재.
  ```bash
  grep -nE "handoverCheckoutId|deprecatedHandoverCheckoutIdLogged" \
    apps/backend/src/modules/equipment/services/qr-access.service.ts
  # Expected: 0
  ```
- **M-6** Frontend 5 호출자에서 fallback 분기 0건.
  ```bash
  grep -nE "handoverCheckoutId" \
    apps/frontend/components/mobile/EquipmentLandingClient.tsx \
    apps/frontend/components/mobile/EquipmentActionSheet.tsx \
    apps/frontend/hooks/use-equipment-by-management-number.ts \
    apps/frontend/lib/api/equipment-api.ts
  # Expected: 0
  ```

#### S-4 cron 2중 안전망

- **M-7** Scheduler 파일 신규 + `@Cron` + `@Injectable` + `EVERY_HOUR`.
  ```bash
  test -f apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts
  grep -c "@Cron\(\|@Injectable\(\)" apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts
  # Expected: ≥2
  grep -n "CronExpression\.EVERY_HOUR\|'0 \* \* \* \*'" apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts
  # Expected: ≥1
  ```
- **M-8** Orphan 판정 SQL — 9 다형성 FK 전부 NULL 가드.
  ```bash
  grep -c "isNull(documents\.equipmentId)\|isNull(documents\.calibrationId)\|isNull(documents\.requestId)\|isNull(documents\.softwareValidationId)\|isNull(documents\.intermediateInspectionId)\|isNull(documents\.selfInspectionId)\|isNull(documents\.nonConformanceId)\|isNull(documents\.conditionCheckId)\|isNull(documents\.checkoutId)" \
    apps/backend/src/common/file-upload/document.service.ts apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts
  # Expected: ≥9
  ```
- **M-9** `document_type = 'condition_check_photo'` 필터 + `status != 'deleted'` 가드 + 24h 마진.
  ```bash
  grep -nE "'condition_check_photo'|conditionCheckPhoto" apps/backend/src/common/file-upload/document.service.ts apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts
  # Expected: ≥1
  grep -nE "24 hours|24h|olderThanHours|24 \* 60 \* 60" apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts apps/backend/src/common/file-upload/document.service.ts
  # Expected: ≥1
  ```
- **M-10** Prometheus Counter `orphan_photo_sweep_total{result}` 등록 + `incrementOrphanPhotoSweep` method.
  ```bash
  grep -c "orphan_photo_sweep_total\|orphanPhotoSweepCounter\|incrementOrphanPhotoSweep" apps/backend/src/common/metrics/metrics.service.ts
  # Expected: ≥3
  ```
- **M-11** Structured logging — batch 단위 1 logger.log + `deletedIds` 배열 metadata. (cron 은 HTTP 컨텍스트 외부이므로 `@AuditLog` decorator 적용 불가 — 다른 cron 9건 일관 패턴 정합. AuditService 직접 호출 미사용: UserRole enum 에 `'system'` 부재 + audit-log.ts 가 다른 세션 보호 파일.)
  ```bash
  grep -nE "logger\.log.*orphan_photo_sweep|this\.logger\.log" apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts
  # Expected: ≥1
  grep -nE "deletedIds|metadata.*deleted|orphan_photo_sweep_complete" apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts
  # Expected: ≥1
  ```
- **M-12** Provider 등록 — `DocumentsModule.providers` 에 `OrphanPhotoCleanupScheduler` 포함.
  ```bash
  grep -n "OrphanPhotoCleanupScheduler" apps/backend/src/modules/documents/documents.module.ts
  # Expected: ≥2
  ```
- **M-13** Scheduler 단위 spec PASS.
  ```bash
  test -f apps/backend/src/modules/documents/schedulers/__tests__/orphan-photo-cleanup.scheduler.spec.ts
  # 검증 명령 (jest rootDir=src 설정 정합):
  cd apps/backend && npx jest --testPathPattern='orphan-photo-cleanup' 2>&1 | tail -3
  # Expected: 6/6 PASS (deleted/errors/skipped/throw/0,0/count<=0 defensive)
  ```

#### S-3 RTL spec 2건

- **M-14** `StatusBadge.test.tsx` ≥10 cases + `HandoverPickerSheet.test.tsx` ≥6 cases.
  ```bash
  test -f apps/frontend/components/ui/__tests__/StatusBadge.test.tsx
  test -f apps/frontend/components/mobile/__tests__/HandoverPickerSheet.test.tsx
  grep -cE "^\s*(it|test)(\(|\.each)" apps/frontend/components/ui/__tests__/StatusBadge.test.tsx
  # Expected: ≥10 (it.each 도 1 entry 로 카운트)
  grep -c "^\s*it(\|^\s*test(" apps/frontend/components/mobile/__tests__/HandoverPickerSheet.test.tsx
  # Expected: ≥6
  pnpm --filter frontend run test -- StatusBadge HandoverPickerSheet
  # Expected: PASS
  ```

#### 회귀 차단 / 격리 / SSOT

- **M-15** 옛날 handover token API (`issueHandoverToken` / `handover_tokens`) production 코드 0건.
  ```bash
  grep -rn "issueHandoverToken\|handover_tokens" apps/backend/src apps/frontend packages \
    --include="*.ts" --include="*.tsx"
  # Expected: 0
  ```
- **M-16** 다른 세션 도메인 침범 0건.
  ```bash
  git diff --name-only HEAD -- \
    "apps/backend/src/common/cache/cache-event.registry.ts" \
    "apps/backend/src/common/cache/cache-event-listener.ts" \
    "apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts" \
    "apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts" \
    ".claude/skills/verify-cache-events/SKILL.md" \
    "scripts/ultrareview-shield.sh" \
    "scripts/__tests__/ultrareview-shield.spec.mjs" \
    ".gitleaks.toml" \
    ".gitleaksignore" \
    "docs/references/ultrareview-usage.md" \
    ".husky/pre-push" \
    "packages/schemas/src/audit-log.ts" \
    "packages/shared-constants/src/entity-routes.ts"
  # Expected: 빈 출력
  ```

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록

- **S-1** Playwright e2e `regression-scenarios.spec.ts` 6 시나리오 PASS — actor 격리 (`testOperatorPage` / `siteAdminPage`, `systemAdminPage` 금지).
- **S-2** `review-architecture` skill CRITICAL/HIGH 0건.
- **S-3** `verify-implementation` skill 전체 PASS.
- **S-4** S-7 audit 문서 — 사용처 enumeration ≥9 + desktop 무영향 결론.
- **S-5** tech-debt-tracker 5 [x] closure + 3 WON'T-DO 사유 명시.
- **S-6** `sweepOrphanConditionCheckPhotos` unit spec 3+ case PASS.

### 적용 verify 스킬

- `verify-handover-qr` (S-6 deprecation 제거)
- `verify-ssot` (S-4 metrics counter + scheduler provider)
- `verify-hardcoding` (S-1/S-3/S-4 신규 코드)
- `verify-design-tokens` (S-3 StatusBadge tone 매핑)
- `verify-e2e` (Step 23/24/25)
- `verify-cache-events` (S-4 cron — invalidation 정합)
- `verify-implementation` (통합)

---

## contract grep 패턴 작성 규칙

모든 grep 은 **단일 키 카운트 분리** 패턴 사용. `A.*B` 단일라인 패턴은 객체 리터럴 멀티라인 재포맷으로 회피 가능 → 금지.

---

## 종료 조건

- MUST 16건 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입)
- 3회 반복 초과 → 수동 개입
- SHOULD 실패는 종료 조건 영향 없음

---

## Generator 시작 컨텍스트 hint

**Phase 순서 엄수**: 1 (S-6) → 2 (S-4) → 3 (S-3) → 4 (S-1) → 5 (S-7) → 6 (closure)

**왜 S-6 가 먼저**: Phase 4 (S-1 e2e) 가 신 API (`handovers[].id`) 만 검증해야 backward-compat fallback 의 silent fail 미발생.

**왜 S-4 가 S-3 보다 먼저**: backend tsc / build / test 비용을 한 번에 처리.

**왜 cron 주기 EVERY_HOUR**: 24h 마진 보유 + 1시간 주기로 orphan 누적 0 유지.

**다른 세션 race 대응**: Phase 6 의 `tech-debt-tracker.md` / `REGISTRY.md` 갱신 시 commit 직전 atomic 재읽기 후 merge.

**SSOT 강제**:
- `condition_check_photo` 리터럴은 `packages/shared-constants/src/file-types.ts` DocumentType enum 사용
- 9 다형성 FK 컬럼명은 `packages/db/src/schema/documents.ts` 직접 import
- `EVERY_HOUR` 는 `CronExpression.EVERY_HOUR` SSOT 사용

**옛 handover token API 영구 차단**: M-15 grep contract 가 회귀 시 spec 차단.

---

*Contract version*: 1 · *Author*: Planner (Mode 2 harness) · *Date*: 2026-05-12
