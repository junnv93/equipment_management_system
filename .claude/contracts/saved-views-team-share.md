# 스프린트 계약: Saved Views 팀 공유 (localStorage → 서버)

## 생성 시점
2026-05-12T22:00:00+09:00 (재작성 — 다중 세션 race 손실 복구)

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

**A. 빌드 정합성**
- [ ] `pnpm --filter backend run tsc --noEmit` EXIT=0
- [ ] `pnpm --filter frontend run tsc --noEmit` EXIT=0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm lint` EXIT=0

**B. 테스트**
- [ ] `pnpm --filter backend run test -- saved-views` 신규 spec 전체 PASS (≥ 2 spec)
- [ ] `pnpm --filter backend run test` 기존 테스트 회귀 0
- [ ] `pnpm --filter frontend run test` 기존 테스트 회귀 0

**C. SSOT 준수 (grep 검증)**
- [ ] `grep -c "'saved_view'" packages/schemas/src/enums/audit.ts` ≥ 1
- [ ] `grep -c "MANAGE_SAVED_VIEWS_GLOBAL" packages/shared-constants/src/permissions.ts` ≥ 3 (enum + ko 라벨 + en 라벨)
- [ ] `grep -c "SAVED_VIEWS:" packages/shared-constants/src/api-endpoints.ts` ≥ 1
- [ ] `grep -c "saved_view" packages/shared-constants/src/entity-routes.ts` ≥ 1
- [ ] `grep -cE "SavedViewNotFound|SavedViewScopeForbidden|SavedViewMaxReached|SavedViewTeamRequiredForScope" packages/schemas/src/errors.ts` ≥ 8 (enum 4 + 매핑 4)
- [ ] `grep -c "savedViews" apps/frontend/lib/api/query-config.ts` ≥ 1
- [ ] `grep -c "SAVED_VIEWS:" apps/backend/src/common/cache/cache-key-prefixes.ts` ≥ 1

**D. 보안 (Rule 2 server-side userId)**
- [ ] `apps/backend/src/modules/saved-views/saved-views.controller.ts` body DTO 에 `ownerId` / `userId` 0건 (grep)
- [ ] `apps/backend/src/modules/saved-views/dto/*.ts` 에 `ownerId` / `userId` 필드 0건
- [ ] controller 의 mutation endpoint 모두 `extractUserId(req)` 또는 `req.user.userId` 경유

**E. CAS / 낙관적 잠금**
- [ ] `apps/backend/src/modules/saved-views/saved-views.service.ts` 에 `extends VersionedBaseService` 1건
- [ ] `packages/db/src/schema/saved-views.ts` 에 `version: integer('version').notNull().default(1)` 1건
- [ ] update DTO 에 `version: number` 필드 1건 (`updateSavedViewSchema` 가 `versionedSchema` 스프레드)
- [ ] frontend `use-saved-views.ts` invalidateQueries 가 `queryKeys.savedViews.all` 또는 동등 prefix 사용 + `setQueryData` 직접 호출 0건

**F. 권한 (RBAC scope별 fail-close 순서)**
- [ ] service.update/delete/reorder 가 ownership 검증을 도메인 검증보다 먼저 수행
- [ ] PRIVATE: ownerId !== userId 시 403
- [ ] TEAM: 다른 팀 시 403 (read) / 본인 외 write 403
- [ ] GLOBAL: read all / write 는 `MANAGE_SAVED_VIEWS_GLOBAL` 권한 필요

**G. 감사로그**
- [ ] controller mutation endpoint (POST/PATCH(:id)/DELETE/PATCH(reorder)/POST(bulk-import)) 에 `@AuditLog({ entityType: 'saved_view', ... })`

**H. Next.js 16 정합**
- [ ] frontend 변경 파일에 `useFormState` 사용 0건
- [ ] frontend 신규 page.tsx 추가 시 `await props.params` 패턴
- [ ] `middleware.ts` / `middleware` 함수명 0건

**I. i18n parity (ko/en 1:1)**
- [ ] `messages/ko/checkouts.json` 의 `savedViews.*` 키 set == en 동일
- [ ] `messages/ko/errors.json` 의 saved-view 관련 4 키 == en

**J. DB migration (ADR-0010)**
- [ ] `apps/backend/drizzle/0059_add_saved_views.sql` 존재
- [ ] `_journal.json` entries 에 `"tag": "0059_add_saved_views"` 1건
- [ ] `pnpm --filter backend run db:migrate` EXIT=0
- [ ] `db:generate` / `db:push` 호출 0건 (ADR-0010)

**K. 다른 세션 도메인 침범 금지 (격리 invariant)**
- [ ] `git diff --name-only origin/main..HEAD` 에서 다음 파일 미포함:
  - `apps/backend/src/common/cache/cache-event.registry.ts`
  - `apps/backend/src/common/cache/cache-event-listener.ts`
  - `apps/backend/src/common/cache/cache-events.ts`
  - `apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts`
  - `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts`
  - `apps/backend/src/modules/audit/__tests__/audit.service.spec.ts`
  - `apps/backend/src/modules/equipment/services/qr-access.service.spec.ts`
  - `scripts/ultrareview-shield.sh`
  - `scripts/ultrareview-preflight.mjs`
  - `scripts/audit-cache-event-channels.mjs`
  - `scripts/__tests__/ultrareview-shield.spec.mjs`
  - `.husky/pre-push`
  - `.gitleaks.toml`
  - `package.json`
  - `docs/references/ultrareview-usage.md`
  - `.claude/skills/verify-cache-events/SKILL.md`
  - `docs/design/oklch-migration-2026-05-12.md`
  - `apps/frontend/lib/design-tokens/**`
  - `apps/frontend/styles/globals.css`
  - `apps/frontend/components/ui/StatusBadge.tsx`
  - `apps/frontend/components/mobile/AutoProgressCountdown.tsx`
  - `apps/frontend/components/mobile/HandoverPickerSheet.tsx`
  - `apps/frontend/components/equipment/EquipmentQRButton.tsx`
  - `apps/frontend/components/equipment/EquipmentCardGrid.tsx`
  - `apps/frontend/components/equipment/NonConformanceBanner.tsx`
  - `apps/frontend/components/form-templates/**`
  - `apps/frontend/components/monitoring/**`
  - `apps/frontend/components/checkouts/CheckoutEquipmentRow.tsx`

**L. localStorage 데이터 흐름**
- [ ] import banner 성공 시 `localStorage.removeItem('checkout_saved_views')` 호출 1건 ≥
- [ ] `use-saved-views.ts` 본문에 `localStorage.setItem` 호출 0건

**M. 모듈 등록 SSOT 정합**
- [ ] `CLAUDE.md` Backend Modules 표에 `saved-views` 행 1개 추가
- [ ] `commitlint.config.js` `BACKEND_MODULE_SCOPES` 에 `'saved-views'` 추가
- [ ] `scripts/__tests__/commitlint-config.spec.mjs` fs-sync spec PASS

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] review-architecture Critical 0개
- [ ] playwright-e2e: PRIVATE 저장 + reorder + delete + import happy path (트리거: e2e infra 후속)
- [ ] saved-views service unit test coverage > 80% (scope RBAC × 6 + CAS × 1 + max 5 × 1 ≥ 8 시나리오)
- [ ] cache-event registry 등록 (TEAM cross-user 무효화) — 본 sprint 차단 (다른 세션 점유), 후속
- [ ] Admin GLOBAL CRUD UI 페이지 — MVP backend only, UI 후속
- [ ] scope picker UI 노출 (현 hidden) — UX 검토 후 노출
- [ ] saved_views.module 컬럼 활용 확장 — 본 sprint 'checkouts' 한 모듈만 wire

### 적용 verify 스킬
- 변경 영역 기반 자동 선택:
  - `verify-zod`, `verify-ssot`, `verify-auth`, `verify-frontend-state`, `verify-hardcoding`
  - `verify-nextjs`, `verify-sql-safety`, `verify-i18n`, `verify-security`, `verify-implementation`

---

## 종료 조건
- MUST 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입)
- 3회 반복 초과 → 수동 개입
- SHOULD 실패 → tech-debt-tracker.md 등록
- 다른 세션 도메인 침범(K) 발견 시 즉시 FAIL + 격리 복원
