# Saved Views 팀 공유 (localStorage → 서버) 구현 계획

## 메타
- 생성: 2026-05-12T00:00:00+09:00
- 모드: Mode 2 (Full harness)
- sprint slug: `saved-views-team-share`
- 예상 변경: 약 28~32개 파일 (신규 15, 수정 13~17)
- 출처 tech-debt: S-7 `saved-views-team-share` (tech-debt-tracker.md L67)

## 설계 철학
Saved Views를 클라이언트 단발 localStorage에서 서버 도메인으로 승격한다. **scope 트리아드(PRIVATE/TEAM/GLOBAL)** 로 협업 가능성을 열되, MVP에서는 backend SSOT + RBAC + audit만 완성하고 UI scope picker는 backward-compatible 기본값(PRIVATE)을 유지한다. 마이그레이션은 **사용자 명시 import 모드**(자동 sync 금지)로 silent 데이터 손실/덮어쓰기를 차단한다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| **scope 모델** | PRIVATE / TEAM / GLOBAL 트리아드 (enum SSOT) | 단순 OWNER/SHARED 이분법은 추후 GLOBAL(공지성 뷰) 확장 시 enum 변경 ripple. 첫 도입에서 3종 등록 + 권한 매트릭스 정의. UI는 MVP에서 PRIVATE 기본만 노출, TEAM/GLOBAL은 Phase 5 후속 toggle |
| **CAS(낙관적 잠금)** | **적용** (`version` integer 컬럼 + VersionedBaseService 상속) | 동일 사용자 다중 탭에서 드래그 정렬 + 추가/삭제 동시 발생 가능. 또한 TEAM scope는 같은 팀원 동시 편집 가능 → 409 명시 회복(prefix invalidateQueries) 표준 적용. 13개 모듈 패턴 일치 (계산 비용 0) |
| **모듈 위치** | **신규 모듈** `apps/backend/src/modules/saved-views/` (checkouts 서브모듈 아님) | (1) 본 모듈 확장 시 다른 도메인(equipment list, calibration plans 등)으로 일반화 가능 — checkouts에 묶이면 후속 sprint에 모듈 분리 비용. (2) checkouts 컨트롤러 sprawl(이미 30+ endpoint) 회피. (3) `MODULES` 표(CLAUDE.md)에 1행 추가만 |
| **마이그레이션 전략** | **명시 import 버튼** (자동 sync 금지) | 자동 마이그레이션은 (a) 다른 PC localStorage 중복 sync, (b) 다른 사용자 계정 sync 위험. SavedViewsToolbar 빈 상태에서 `localStorage에 N개 발견 — 가져오기` 배너 노출, 사용자 클릭 시 POST 일괄. 성공 후 localStorage clear |
| **권한 모델** | `Permission.MANAGE_SAVED_VIEWS_GLOBAL` (GLOBAL scope 작성/수정) 1개만 신설. PRIVATE/TEAM은 ownership/teamId 기반 row-level scope (permission 불필요) | enum 폭발 회피. VIEW_CHECKOUTS는 기존 권한 재사용. PRIVATE: ownerId == userId만 / TEAM: ownerId == userId OR (scope=TEAM AND teamId == userTeamId) / GLOBAL: 모두 read, 변경은 MANAGE_SAVED_VIEWS_GLOBAL |
| **테이블 스코프** | `saved_views.module` 컬럼 (varchar, 'checkouts' 등) | 본 sprint는 'checkouts' 한 모듈만 적용. 컬럼 추가로 향후 equipment/calibration 등 view scope 확장 시 schema 무변경. query는 `WHERE module = 'checkouts'` 강제 |
| **localStorage 정책** | "import 완료 후 자동 삭제" | 두 곳에 데이터 존재 = 회귀 위험. POST 200 후 즉시 `localStorage.removeItem('checkout_saved_views')` |
| **저장 fields** | `params: text` (URL search string 직렬화 그대로) | (a) URL fragment 변경 시 schema migration 불필요, (b) 클라이언트 검증 책임 명확화. max length는 4KB 제한 (`VALIDATION_RULES.LONG_TEXT_MAX_LENGTH`) |
| **다른 세션 도메인 침범** | 절대 금지 | `cache-event.registry.ts` / `cache-event-listener.ts` / `software-validations.service.spec.ts` / `ultrareview-shield.sh` / `.gitleaks.toml` / `scripts/__tests__/ultrareview-shield.spec.mjs` 수정 0건. Contract MUST K에 명시 |
| **Storybook entry** | scope 외 (S-9는 별도 차단 항목, 본 sprint 스킵) | tech-debt-tracker S-9 차단 사유 그대로 유지 |

## 구현 Phase

### Phase 0: 사전 결정 + 사용자 확인 게이트
**목표:** scope/CAS/마이그레이션 트레이드오프를 사용자에게 명시 확인. Phase 1 진입 전 승인 필수.
**변경 파일:** (없음 — 결정 로그만)
**검증:** 사용자 ACK (3가지 결정 — scope 트리아드 채택 / CAS 채택 / import 명시 모드)

### Phase 1: DB 스키마 + manual SQL migration (ADR-0010)
**목표:** `saved_views` 테이블 신설. journal append 절차 준수.
**변경 파일:**
1. `packages/db/src/schema/saved-views.ts` — 신규 Drizzle 테이블 정의 (id uuid PK / name varchar(80) / params text / ownerId uuid FK→users(restrict) / module varchar(40) / scope varchar(16) / teamId uuid FK→teams(nullable, set null) / sortOrder integer / version integer notNull default 1 / createdAt / updatedAt). Index: `(ownerId, module)` 복합 + `(scope, teamId, module)` 보조
2. `packages/db/src/schema/index.ts` — re-export 추가
3. `apps/backend/drizzle/0059_add_saved_views.sql` — 신규 manual SQL: CREATE TABLE + CREATE INDEX × 2 + 외래키 (users RESTRICT, teams SET NULL)
4. `apps/backend/drizzle/meta/_journal.json` — entries 추가 (`tag: "0059_add_saved_views"`)

**검증:** `pnpm --filter backend run db:migrate` (drizzle-kit migrate) 성공 + Drizzle Studio에서 신규 테이블 확인 + `\d saved_views` psql 출력

### Phase 2: Backend 모듈 (controller + service + DTO + audit + cache)
**목표:** REST 4 endpoint (LIST/CREATE/UPDATE/DELETE) + 1 (REORDER) + 1 (BULK_IMPORT). RBAC + CAS + AuditLog + 캐시 무효화.
**변경 파일:**
1. `apps/backend/src/modules/saved-views/saved-views.module.ts` — 신규 (CacheModule + AuditModule 의존)
2. `apps/backend/src/modules/saved-views/saved-views.controller.ts` — 신규 (6 endpoint, `@RequirePermissions` + `@AuditLog`, JWT 추출 `extractUserId`)
3. `apps/backend/src/modules/saved-views/saved-views.service.ts` — 신규 (extends VersionedBaseService<typeof savedViews>). list/create/update/delete/reorder/bulkImport. scope별 권한 fail-close 순서: scope check → FSM(N/A) → domain validation
4. `apps/backend/src/modules/saved-views/dto/create-saved-view.dto.ts` — 신규 Zod + ApiProperty (name 1-80 / params LONG_TEXT_MAX_LENGTH / scope enum / teamId optional UUID / module fixed 'checkouts' MVP)
5. `apps/backend/src/modules/saved-views/dto/update-saved-view.dto.ts` — 신규 (Partial + `version: number`)
6. `apps/backend/src/modules/saved-views/dto/reorder-saved-views.dto.ts` — rejection-presets와 동일 패턴 (`orders: { id, sortOrder }[]`)
7. `apps/backend/src/modules/saved-views/dto/bulk-import-saved-views.dto.ts` — `views: Array<{ name, params, sortOrder? }>` max 5 (MAX_VIEWS)
8. `apps/backend/src/modules/saved-views/saved-views-error-codes.ts` — 신규 SSOT (SAVED_VIEW_NOT_FOUND / SAVED_VIEW_SCOPE_FORBIDDEN / SAVED_VIEW_MAX_REACHED / SAVED_VIEW_TEAM_REQUIRED_FOR_SCOPE / SAVED_VIEW_VERSION_CONFLICT)
9. `apps/backend/src/modules/saved-views/__tests__/saved-views.service.spec.ts` — 신규 (scope RBAC × 6 시나리오 + CAS 충돌 × 1 + max 5 차단 + 본인 row만 update)
10. `apps/backend/src/modules/saved-views/__tests__/saved-views-dtos.spec.ts` — DTO Zod 검증
11. `apps/backend/src/app.module.ts` — SavedViewsModule import 추가

**캐시 키:** `saved-views:list:{userId}:{module}` (CACHE_TTL.SHORT) — invalidate on any mutation (해당 user). TEAM scope mutation은 같은 팀 멤버 캐시 무효화 — Phase 2.1에서 cache-event channel publishing은 SKIP(다른 세션 도메인). 대신 list endpoint TTL을 SHORT(30s)로 짧게 잡고 polling-friendly.

**검증:** `pnpm --filter backend run test -- saved-views` + `pnpm --filter backend run tsc --noEmit`

### Phase 3: SSOT 신규 등록
**목표:** 6 SSOT 위치 동시 갱신. tsc completeness 강제.
**변경 파일:**
1. `packages/shared-constants/src/permissions.ts` — `MANAGE_SAVED_VIEWS_GLOBAL` enum 추가 + ko/en 라벨 2곳 (`Record<Permission, string>` 자동 tsc 강제)
2. `packages/shared-constants/src/role-permissions.ts` — `system_admin` + `lab_manager` 배열에 `Permission.MANAGE_SAVED_VIEWS_GLOBAL` 추가
3. `packages/shared-constants/src/api-endpoints.ts` — `SAVED_VIEWS` namespace: `LIST` / `GET(id)` / `CREATE` / `UPDATE(id)` / `DELETE(id)` / `REORDER` / `BULK_IMPORT`
4. `packages/schemas/src/enums/audit.ts` — `AUDIT_ENTITY_TYPE_VALUES` 배열에 `'saved_view'` 추가
5. `packages/shared-constants/src/entity-routes.ts` — `ENTITY_ROUTES.saved_view: (id) => '/checkouts?savedView=' + id`
6. `packages/schemas/src/errors.ts` — `SavedViewNotFound` / `SavedViewScopeForbidden` / `SavedViewMaxReached` / `SavedViewTeamRequiredForScope` ErrorCode enum 추가 + `errorCodeToStatusCode` 매핑

**검증:** `pnpm tsc --noEmit` (모든 Record<...> SSOT가 누락 시 컴파일 에러) + `pnpm --filter backend run build`

### Phase 4: Frontend hook + API client + i18n
**목표:** localStorage hook을 TanStack Query 기반 server hook으로 마이그레이션. 호출자 API 호환성 최대 보존.
**변경 파일:**
1. `apps/frontend/lib/checkouts/saved-views.ts` — **migration helper 모듈로 재정의**: `MAX_VIEWS=5` 상수 export 유지(SSOT), localStorage 읽기 전용 헬퍼 (`readLocalStorageBackup()`). 쓰기 함수 deprecate. `SavedView` 타입은 server 응답 shape으로 갱신
2. `apps/frontend/hooks/use-saved-views.ts` — **TanStack Query 기반으로 재작성**: `useQuery(queryKeys.savedViews.list(module))` + `useOptimisticMutation` 4종(add/update/remove/move). VERSION_CONFLICT 시 frontend mapper로 toast + invalidateQueries(prefix)
3. `apps/frontend/lib/api/query-config.ts` — `queryKeys.savedViews = { all, list(module), detail(id) }` 신규 추가
4. `apps/frontend/lib/errors/saved-views-errors.ts` — 신규 mapper (`SavedViewErrorCode` enum + `mapBackendErrorCode` + `Record<SavedViewErrorCode, ErrorInfo>` 강제)
5. `apps/frontend/lib/api/saved-views-api.ts` — 신규 API client (apiClient.get/post/patch/delete + `API_ENDPOINTS.SAVED_VIEWS` 사용)
6. `apps/frontend/messages/ko/checkouts.json` — `savedViews` namespace 확장
7. `apps/frontend/messages/en/checkouts.json` — 동일 키 영문
8. `apps/frontend/messages/ko/errors.json` + `apps/frontend/messages/en/errors.json` — saved-views ErrorCode 4종 한/영 메시지

**검증:** `pnpm --filter frontend run tsc --noEmit` + `pnpm --filter frontend run test`

### Phase 5: 호출자 UI 수정 + import 배너
**목표:** `SavedViewsToolbar.tsx` + `SaveViewDialog.tsx` 서버 hook 연결. localStorage import 배너 신규.
**변경 파일:**
1. `apps/frontend/components/checkouts/SavedViewsToolbar.tsx` — `useSavedViews()` 반환 shape 변경 흡수 (loading state + version 필드). 드래그/키보드 정렬 로직 그대로 (서버 reorder mutation). VERSION_CONFLICT 시 invalidateQueries
2. `apps/frontend/components/checkouts/SaveViewDialog.tsx` — scope select 추가 (default PRIVATE, MVP hidden) + teamId auto-fill
3. `apps/frontend/components/checkouts/SavedViewsImportBanner.tsx` — 신규: localStorage 발견 시 1회 배너 → bulkImport mutation → 성공 시 localStorage.clear
4. `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx` (또는 인접 부모) — ImportBanner wiring

**검증:** `pnpm --filter frontend run build` + 수동 시나리오 6종

### Phase 6: 검증 + 문서 업데이트 + tech-debt closure
**목표:** harness MUST 통과 + 후속 SHOULD 등록 + sprint closure.
**변경 파일:**
1. `.claude/exec-plans/tech-debt-tracker.md` — L67 `[ ] S-7` → `[x] ~~...~~ — closure`
2. `.claude/contracts/REGISTRY.md` — Active → Completed 행 이동
3. exec-plan + contract → `completed/` 이동
4. `CLAUDE.md` — Backend Modules 27 → 28: `saved-views` 행 추가
5. `commitlint.config.js` — `BACKEND_MODULE_SCOPES` 배열에 `'saved-views'` 추가 (`scripts/__tests__/commitlint-config.spec.mjs` fs-sync 자동 검증)

**검증:** `pnpm tsc --noEmit` + `pnpm --filter backend run test` + `pnpm --filter frontend run test` + `pnpm --filter backend run build` + `pnpm --filter frontend run build`

## 전체 변경 파일 요약

### 신규 생성 (15)
| 파일 | 목적 |
|------|------|
| `packages/db/src/schema/saved-views.ts` | Drizzle 테이블 정의 |
| `apps/backend/drizzle/0059_add_saved_views.sql` | manual SQL migration |
| `apps/backend/src/modules/saved-views/saved-views.module.ts` | NestJS 모듈 |
| `apps/backend/src/modules/saved-views/saved-views.controller.ts` | 6 endpoint |
| `apps/backend/src/modules/saved-views/saved-views.service.ts` | CAS + scope RBAC |
| `apps/backend/src/modules/saved-views/dto/create-saved-view.dto.ts` | |
| `apps/backend/src/modules/saved-views/dto/update-saved-view.dto.ts` | |
| `apps/backend/src/modules/saved-views/dto/reorder-saved-views.dto.ts` | |
| `apps/backend/src/modules/saved-views/dto/bulk-import-saved-views.dto.ts` | |
| `apps/backend/src/modules/saved-views/saved-views-error-codes.ts` | 백엔드 SSOT |
| `apps/backend/src/modules/saved-views/__tests__/saved-views.service.spec.ts` | |
| `apps/backend/src/modules/saved-views/__tests__/saved-views-dtos.spec.ts` | |
| `apps/frontend/lib/errors/saved-views-errors.ts` | frontend mapper |
| `apps/frontend/lib/api/saved-views-api.ts` | API client |
| `apps/frontend/components/checkouts/SavedViewsImportBanner.tsx` | localStorage import UI |

### 수정 (13~17)
| 파일 | 변경 의도 |
|------|----------|
| `packages/db/src/schema/index.ts` | re-export |
| `apps/backend/drizzle/meta/_journal.json` | entries append |
| `packages/shared-constants/src/permissions.ts` | MANAGE_SAVED_VIEWS_GLOBAL + 라벨 ko/en |
| `packages/shared-constants/src/role-permissions.ts` | system_admin/lab_manager 매핑 |
| `packages/shared-constants/src/api-endpoints.ts` | SAVED_VIEWS namespace |
| `packages/shared-constants/src/entity-routes.ts` | saved_view route |
| `packages/schemas/src/enums/audit.ts` | 'saved_view' entity_type |
| `packages/schemas/src/errors.ts` | 4 SavedView ErrorCode + 상태 매핑 |
| `apps/backend/src/app.module.ts` | SavedViewsModule import |
| `apps/frontend/lib/checkouts/saved-views.ts` | localStorage helper만 보존 (deprecate 마크) |
| `apps/frontend/hooks/use-saved-views.ts` | TanStack Query 마이그레이션 |
| `apps/frontend/lib/api/query-config.ts` | queryKeys.savedViews |
| `apps/frontend/messages/{ko,en}/checkouts.json` | savedViews namespace 확장 |
| `apps/frontend/messages/{ko,en}/errors.json` | SavedView ErrorCode 메시지 |
| `apps/frontend/components/checkouts/SavedViewsToolbar.tsx` | server hook 연결 |
| `apps/frontend/components/checkouts/SaveViewDialog.tsx` | scope select (hidden MVP) |
| `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx` | ImportBanner 위치 |
| `CLAUDE.md` + `commitlint.config.js` | 28번째 모듈 등록 SSOT 정합 |

## 의사결정 로그
- 2026-05-12 T0: scope 트리아드(PRIVATE/TEAM/GLOBAL) vs 이분법 → 트리아드 채택 (enum 변경 ripple 회피 + GLOBAL 향후 활용)
- 2026-05-12 T0: CAS 적용 여부 → 적용 (다중 탭 + TEAM 협업 race). 13개 모듈 패턴 일치 비용 0
- 2026-05-12 T0: 자동 마이그레이션 vs 명시 import → 명시 (silent 손실 차단). MVP에서는 배너 + 사용자 클릭만
- 2026-05-12 T0: 모듈 위치 → `modules/saved-views/` 신규 (checkouts 서브 X). 일반화 + checkouts sprawl 회피
- 2026-05-12 T0: 권한 enum 폭발 회피 → `MANAGE_SAVED_VIEWS_GLOBAL` 1개만 (GLOBAL scope 작성/수정 전용). PRIVATE/TEAM은 row-level scope
- 2026-05-12 T0: cache-event registry 변경 금지 → 다른 세션 `sw-validation-event-channel-separation`이 점유. 본 sprint는 service-local cache만 사용, TEAM 동기화는 SHORT TTL polling 수용 (후속 SHOULD: cache-event 채널 등록)
