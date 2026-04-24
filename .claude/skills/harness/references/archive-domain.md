# Harness 완료 프롬프트 아카이브 — 도메인 기능 (장비/점검/팀/SW 등)

> 완료 처리된 프롬프트 섹션들. 최신 차수부터 역순 정렬.
> 전체 인덱스: [archive-index.md](./archive-index.md)

---

## ~~2026-04-17 신규 — QR Phase 1-3 후속 개선 (10건)~~ ✅ 전체 완료 (2026-04-20)

> **발견 배경**: QR 모바일 워크플로우 Phase 1-3 완료 후 "SSOT/비하드코딩/워크플로우/성능/보안/접근성" 자체 감사에서 도출. 2-agent 병렬 verify (SHOULD 항목 + 시스템 와이드 구조적 개선). 모든 항목 `confirmed` — file:line 증거 포함.
> **원칙 준수**: (1) QR은 경로 (feedback_qr_is_path_not_workflow.md) — QR 시나리오 전용 새 워크플로우 추가 금지, 기존 서비스로 연결만. (2) 커밋 전 자체 감사 (feedback_pre_commit_self_audit.md) — SSOT/하드코딩/eslint-disable/a11y/워크플로우 재사용/성능/검증 7항목.

### ~~🟠 HIGH — `documents.nonConformanceId` FK 도입 + NCR 첨부 모듈 완결 (Mode 2)~~ ✅ 완료 (2026-04-18)

```
조치: schema + migration 0030 + DocumentService.findByNonConformanceId + NC 전용 엔드포인트(ATTACHMENTS)
+ Permission UPLOAD/DELETE_NON_CONFORMANCE_ATTACHMENT 신설 + CreateNonConformanceForm photos
+ NCDocumentsSection 썸네일/삭제 UI + i18n 이관.
```

### ~~🟠 HIGH — CSP `media-src 'self' blob:` + sops `HANDOVER_TOKEN_SECRET` 추가 (Mode 1)~~ ✅ 완료 (2026-04-18)

```
조치: CSP nonce 기반 재설계(proxy.ts SSOT, strict-dynamic), report-uri 엔드포인트(SecurityController),
nginx pass-through, 기존 camera=() 카메라 차단 버그 + limit_req off 문법 버그 병행 수정.
```

### ~~🟠 HIGH — QR Phase 1-3 Playwright E2E 시나리오 3종 (Mode 1)~~ ✅ 완료 (2026-04-18)

```
조치: phase1-mobile-landing.spec.ts / phase2-scanner-ncr.spec.ts / phase3-handover.spec.ts
verify 500 수정(ZodSerializerInterceptor 제거) + Phase 3 API-level 재설계. 10/10 PASS.
Phase 2 벌크 PDF는 EquipmentList UI 사전 selection 필요(별도 UI 작업으로 이연).
```

### ~~🟡 MEDIUM — Per-row 체크박스 + BulkActionBar 프리미티브 추출 (Mode 1)~~ ✅ 완료 (2026-04-18)

```
조치: useRowSelection SSOT 훅 (snapshot LRU, isSelectable, resetOn, isAllPageSelected, isIndeterminate).
Generic BulkActionBar + RowSelectCell 컴포넌트 신설.
EquipmentTable/EquipmentCardGrid 양쪽 연결, EquipmentListContent에서 단일 인스턴스 공유.
```

### ~~🟡 MEDIUM — Intent URL 파라미터 일반화 + 타 모듈 확산 (Mode 2)~~ ✅ 완료 (2026-04-19)

```
조치: FRONTEND_ROUTES에 딥링크 빌더 5종 추가
(CHECKOUTS.CREATE_FOR_EQUIPMENT / CALIBRATION_PLANS.CREATE_FOR_EQUIPMENT /
EQUIPMENT.SELF_INSPECTION_CREATE / INTERMEDIATE_INSPECTION_CREATE / EQUIPMENT_REQUEST_CREATE).
EquipmentActionSheet request_checkout 하드코딩 → 빌더 교체.
```

### ~~🟡 MEDIUM — Handover 토큰 모델 → 범용 1회성 서명 토큰 프리미티브 추출 (Mode 2)~~ ✅ 완료 (2026-04-19)

```
조치: common/one-time-token/ 신설 OneTimeTokenService<T> (JWT HS256 + Redis jti nonce).
HandoverTokenService가 얇은 래퍼로 리팩토링 — 공개 API 불변, 6 tests PASS.
```

### ~~🟡 MEDIUM — verify-qr-ssot + verify-handover-security 검증 스킬 신설 (Mode 1)~~ ✅ 완료 (2026-04-19)

```
조치: verify-qr-ssot 7단계(URL 빌더/경로 상수/설정 매직넘버/액션/appUrl/딥링크 빌더/서버 판정 중복).
verify-handover-security 7단계(시크릿 분리/OneTimeToken위임/jti 원자성/TTL SSOT/권한 가드/토큰 영속화/dev 엔드포인트).
드라이런 전 항목 PASS.
```

### ~~🟡 MEDIUM — PWA 완결 (아이콘 PNG + 서비스워커 + Install Prompt) (Mode 1)~~ ✅ 완료 (2026-04-19)

```
조치: @serwist/next@9.5.7 도입, app/sw.ts(precache+defaultCache+/~offline fallback),
app/~offline/page.tsx(정적 fallback), hooks/usePWAInstall.ts(BeforeInstallPromptEvent+standalone 감지),
components/pwa/PWAInstallBanner.tsx(고정 하단 배너, layout.tsx 등록),
public/icons/manifest-{192,512}.png(SVG→PNG). tsc 0 errors.
```

### ~~🟢 LOW — Lighthouse/axe-core/번들 크기 배포 게이트 통합 (Mode 1)~~ ✅ 완료 (2026-04-20)

```
조치: .github/workflows/performance-audit.yml + accessibility-audit.yml + bundle-size.yml 3종 신규.
docs/operations/performance-budgets.md SSOT (Lighthouse/CWV/axe/bundle 임계값).
```

### ~~🟢 LOW — pre-commit self-audit 7항목 자동화 스크립트 (Mode 0)~~ ✅ 완료 (2026-04-18)

```
조치: scripts/self-audit.mjs 신규 — 7대 체크(하드코딩 URL/eslint-disable/any타입/SSOT우회/role리터럴/setQueryData/a11y).
.husky/pre-commit + main.yml quality-gate 양방향 게이트.
--all exit 0 (1702파일), --staged 위반 차단 확인.
```

---

## ~~70차 신규 — 3-agent 병렬 스캔 (4건, 2026-04-15)~~ ✅ 전부 완료 (2026-04-15, Mode 1 harness)

> **발견 배경 (2026-04-15, 70차)**: 68차 항목 전부 소진 후 신규 3-agent 병렬 스캔 + 2차 검증.
> FALSE POSITIVE 제거: rustfs :latest(릴리즈 없어 TODO 유지), process.env(NestJS 부트스트랩 필수), as unknown as(Zod 패턴), 테스트 as any(허용).
> 검증 통과 4건 → Mode 1 harness 1 iteration PASS (683/683 tests).

### ~~🟡 MEDIUM — form-template-export.service.ts 순차 await → Promise.all 병렬화 (Mode 0)~~ ✅ 완료 (2026-04-15, 70차)

```
intermediate export: inspector + approver + items + measureEquipment 4개 → Promise.all
checkout export: condChecks + requester + approver 3개 → Promise.all
각 export 20-60ms 단축 예상
```

### ~~🟡 MEDIUM — 장비 상세 탭 6개 + FormTemplates 3개 QUERY_CONFIG spread 누락 (Mode 0)~~ ✅ 완료 (2026-04-15, 70차)

```
query-config.ts: EQUIPMENT_DOCUMENTS(LONG) + FORM_TEMPLATES(=REFETCH_STRATEGIES.STATIC) 추가
AttachmentsTab, CalibrationHistoryTab(2건), CheckoutHistoryTab(누락), SoftwareTab(2건), EquipmentImportDetail → QUERY_CONFIG spread
FormTemplatesContent, FormTemplatesArchivedTable, FormTemplateHistoryDialog(2건) → FORM_TEMPLATES
```

### ~~🟡 MEDIUM — equipment_test_software testSoftwareId 역방향 인덱스 누락 (Mode 1+DB)~~ ✅ 완료 (2026-04-15, 70차, migration 0026)

```
packages/db/src/schema/equipment-test-software.ts:
  testSoftwareIdIdx: index('equipment_test_software_test_software_id_idx').on(table.testSoftwareId)
migration 0026_test_software_id_idx.sql: CREATE INDEX IF NOT EXISTS ... ON equipment_test_software(test_software_id)
test-software.service.ts:433, 477 testSoftwareId 역방향 조회 성능 개선
```

---

## ~~68차 신규 — 3-agent 병렬 스캔 (4건, 2026-04-14)~~ ✅ 전부 완료 (2026-04-14)

> **발견 배경 (2026-04-14, 68차)**: Backend/Frontend/Infra 3-agent 병렬 스캔 + 2차 검증(Read/Grep).
> FALSE POSITIVE 5건 제거: admin/* error.tsx 누락(부모 admin/error.tsx 커버), checkouts/* error.tsx 누락(부모 checkouts/error.tsx 커버), process.env in drizzle/index.ts(NestJS DI 미적용 부트스트랩 필수), CalibrationRegisterDialog as unknown as(react-hook-form input/output 이중 제네릭 패턴), Korean text in comments(정상).
> 검증 통과 4건 등재.

### 🟡 MEDIUM — 장비 이력 탭 3개 useQuery QUERY_CONFIG.HISTORY spread 누락 (Mode 0)

```
TanStack Query staleTime 누락:
- apps/frontend/components/equipment/LocationHistoryTab.tsx:98-102
- apps/frontend/components/equipment/MaintenanceHistoryTab.tsx:89-93
- apps/frontend/components/equipment/IncidentHistoryTab.tsx:183-187

세 탭 모두 useQuery에 staleTime/gcTime 없음:
  const { data: history = [], isLoading } = useQuery({
    queryKey: queryKeys.equipment.locationHistory(equipmentId),
    queryFn: () => equipmentApi.getLocationHistory(equipmentId),
    enabled: !!equipmentId,
    // staleTime 없음 → 탭 전환마다 불필요 refetch
  });

lib/api/query-config.ts에 QUERY_CONFIG.HISTORY가 이미 정의됨 (line 195-200):
  HISTORY: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: true,
    retry: 2,
  }

장비 상세 페이지에서 위치/유지보수/사고 탭을 전환할 때마다 API 재호출 발생.

작업:
3개 탭의 useQuery에 `...QUERY_CONFIG.HISTORY` spread 추가:

  import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
  // (queryKeys는 이미 import됨 — QUERY_CONFIG만 추가)

  const { data: history = [], isLoading } = useQuery({
    queryKey: queryKeys.equipment.locationHistory(equipmentId),
    queryFn: () => equipmentApi.getLocationHistory(equipmentId),
    enabled: !!equipmentId,
    ...QUERY_CONFIG.HISTORY,  // staleTime + gcTime + refetchOnWindowFocus + retry
  });

동일 패턴을 MaintenanceHistoryTab.tsx, IncidentHistoryTab.tsx에도 적용.

검증:
- pnpm --filter frontend run tsc --noEmit → exit 0
- grep -n 'QUERY_CONFIG.HISTORY\|staleTime' apps/frontend/components/equipment/LocationHistoryTab.tsx → 1 hit
- grep -n 'QUERY_CONFIG.HISTORY\|staleTime' apps/frontend/components/equipment/MaintenanceHistoryTab.tsx → 1 hit
- grep -n 'QUERY_CONFIG.HISTORY\|staleTime' apps/frontend/components/equipment/IncidentHistoryTab.tsx → 1 hit
```

### 🟡 MEDIUM — audit.service.ts cursor/user limit 하드코딩 → QUERY_SAFETY_LIMITS SSOT (Mode 0)

```
하드코딩 이슈:
- apps/backend/src/modules/audit/audit.service.ts:177 — limit = 30 (cursor page size)
- apps/backend/src/modules/audit/audit.service.ts:379 — limit = 100 (findByUser)

현재:
  async findAllCursor(filter, cursor?, limit = 30, scope?): Promise<CursorPaginatedResult>
  async findByUser(userId, limit = 100, scope?): Promise<AuditLog[]>

QUERY_SAFETY_LIMITS (packages/shared-constants/src/business-rules.ts:67)에
AUDIT_LOGS_PER_ENTITY: 500 이 있으나, cursor page size(30)와 by-user limit(100)은
별도 상수가 없음. 두 값이 코드에 박혀 있어 SSOT 위반.

작업:
1. packages/shared-constants/src/business-rules.ts의 QUERY_SAFETY_LIMITS에 추가:
   AUDIT_CURSOR_PAGE_SIZE: 30,   // cursor 기반 페이지 크기 (UI UX 최적화 값)
   AUDIT_LOGS_BY_USER: 100,      // 사용자별 최근 감사 로그 최대 수

2. audit.service.ts에서 import 추가 후 교체:
   import { ..., QUERY_SAFETY_LIMITS } from '@equipment-management/shared-constants';

   async findAllCursor(filter, cursor?, limit = QUERY_SAFETY_LIMITS.AUDIT_CURSOR_PAGE_SIZE, ...)
   async findByUser(userId, limit = QUERY_SAFETY_LIMITS.AUDIT_LOGS_BY_USER, ...)

주의:
- 기존 limit 값(30, 100)은 그대로 유지 — 상수명만 추가, 기능 변경 없음
- findByUser limit = 100은 AUDIT_LOGS_PER_ENTITY(=500)와 다른 의미 (by-user 최근 로그 vs per-entity 전체)
  → 별도 상수로 분리 필요

검증:
- pnpm --filter backend run tsc --noEmit → exit 0
- pnpm --filter @equipment-management/shared-constants run tsc --noEmit → exit 0
- grep 'limit = 30\|limit = 100' apps/backend/src/modules/audit/audit.service.ts → 0 hit
- grep 'AUDIT_CURSOR_PAGE_SIZE\|AUDIT_LOGS_BY_USER' packages/shared-constants → 1 hit each
```

### 🟡 MEDIUM — dashboard.service.ts `days = 30` → CALIBRATION_THRESHOLDS.WARNING_DAYS SSOT (Mode 0)

```
하드코딩 이슈:
- apps/backend/src/modules/dashboard/dashboard.service.ts:355 — days: number = 30
- apps/backend/src/modules/dashboard/dashboard.service.ts:626 — days = 30

현재:
  async getUpcomingCheckoutReturns(days: number = 30, teamId?: string, ...)
  async getCalibrationDueItems(teamId?: string, siteId?: string, days = 30)

CALIBRATION_THRESHOLDS.WARNING_DAYS = 30 이 이미 packages/shared-constants/src/business-rules.ts:54에 정의됨.
dashboard.service.ts는 @equipment-management/schemas를 import하지만 @equipment-management/shared-constants는 import하지 않음 → 30이 하드코딩됨.

30일은 "교정 기한 임박 경고 기간"의 비즈니스 규칙이므로 변경 시 한 곳에서만 관리해야 함.

작업:
1. dashboard.service.ts 상단에 import 추가:
   import { CALIBRATION_THRESHOLDS } from '@equipment-management/shared-constants';

2. 두 메서드의 기본값 교체:
   async getUpcomingCheckoutReturns(
     days: number = CALIBRATION_THRESHOLDS.WARNING_DAYS,
     ...
   )
   async getCalibrationDueItems(
     ...,
     days = CALIBRATION_THRESHOLDS.WARNING_DAYS
   )

주의:
- @equipment-management/shared-constants는 package.json에 이미 의존성으로 있어야 함
  (다른 모듈에서 사용 중이므로 추가 불필요)
- 기본값만 교체 — 함수 시그니처/반환 타입 변경 없음

검증:
- pnpm --filter backend run tsc --noEmit → exit 0
- grep 'days = 30\|days: number = 30' apps/backend/src/modules/dashboard/dashboard.service.ts → 0 hit
- grep 'CALIBRATION_THRESHOLDS' apps/backend/src/modules/dashboard/dashboard.service.ts → 2 hit
```

### 🟢 LOW — repair-history Drizzle relations createdByUser/deletedByUser 미완성 (Mode 0)

```
스키마 정합성 이슈:
- packages/db/src/schema/repair-history.ts:87-98

현재 repairHistoryRelations:
  export const repairHistoryRelations = relations(repairHistory, ({ one }) => ({
    equipment: one(equipment, { ... }),
    nonConformance: one(nonConformances, { ... }),
    // createdByUser: 없음 ← createdBy FK 존재 (line 51, NOT NULL)
    // deletedByUser: 없음 ← deletedBy FK 존재 (line 46, nullable)
  }));

repairHistory 스키마:
  - deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }) // line 46
  - createdBy: uuid('created_by')                                                       // line 51
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' })

users는 이미 import됨 (line 15). 다른 테이블(notifications, equipment 등)은 user FK에
대한 relations를 정의하는데 repair-history만 누락. .query API에서 createdByUser/deletedByUser
with 절 사용 불가 (type-safe join 미지원).

작업:
packages/db/src/schema/repair-history.ts의 repairHistoryRelations에 추가:
  createdByUser: one(users, {
    fields: [repairHistory.createdBy],
    references: [users.id],
    relationName: 'repair_history_created_by',
  }),
  deletedByUser: one(users, {
    fields: [repairHistory.deletedBy],
    references: [users.id],
    relationName: 'repair_history_deleted_by',
  }),

주의:
- DB 마이그레이션 필요 없음 — Drizzle relations()는 런타임 타입 메타데이터만 변경
- repair-history.service.ts가 현재 raw select 쿼리 사용 → 즉각적 동작 변경 없음
  (향후 .query.repairHistory.findMany({ with: { createdByUser: true } }) 사용 가능해짐)

검증:
- pnpm --filter @equipment-management/db run tsc --noEmit → exit 0
- pnpm --filter backend run tsc --noEmit → exit 0
- grep 'createdByUser\|deletedByUser' packages/db/src/schema/repair-history.ts → 2 hit
```

---

## ~~67차 신규 — 3-agent 병렬 스캔 (2건, 2026-04-14)~~ ✅ 전부 완료 (commit 0482fd49)

> **발견 배경 (2026-04-14, 67차)**: Backend/Frontend/Infra 3-agent 병렬 스캔 + 2차 검증(Read/Grep).
> FALSE POSITIVE 7건 제거: error.tsx 누락((dashboard)/error.tsx가 모든 하위 경로 커버), loading.tsx 누락(TanStack Query 컴포넌트 레벨 처리), repair-history FK(nullable deletedBy vs NOT NULL createdBy — 의도적), documents FK(equipment restrict + workflow cascade — 의도적), equipment-imports FK(audit trail semantics — 의도적), NC FK(이미 검토됨), 대형 컴포넌트(기능 완결형 의도적 설계 — 62차 확인).
> 검증 통과 2건 → commit 0482fd49에서 완료.

### ~~🟡 MEDIUM — icon-only Button/Link aria-label 누락 2건 (Mode 0)~~ ✅ 완료 (2026-04-14, 67차)

```
접근성 이슈:
- apps/frontend/app/(dashboard)/calibration-plans/create/CreateCalibrationPlanContent.tsx:170
- apps/frontend/app/(dashboard)/alerts/AlertsContent.tsx:283

두 파일 모두 size="icon" asChild Button → Link 패턴에서 aria-label 없음:

1. CreateCalibrationPlanContent.tsx:170
   현재: <Button variant="ghost" size="icon" asChild>
           <Link href="/calibration-plans">
             <ArrowLeft className="h-4 w-4" />
           </Link>
         </Button>
   스크린 리더가 목적지/기능을 알 수 없음.

2. AlertsContent.tsx:283
   현재: <Button variant="outline" size="icon" asChild>
           <Link href="/settings/notifications">
             <Settings className="h-4 w-4" />
           </Link>
         </Button>

참조 (올바른 패턴):
- CalibrationPlanDetailClient.tsx:318 → aria-label={t('planDetail.backToList')} + ArrowLeft aria-hidden
- EditEquipmentClient.tsx:181 → aria-label={t('editPage.backToDetail')} + ArrowLeft aria-hidden
- PageHeader.tsx:62 → aria-label={backLabel}

작업:
1. CreateCalibrationPlanContent.tsx:170
   <Button variant="ghost" size="icon" asChild aria-label={t('planCreate.backToList')}>
     <Link href="/calibration-plans">
       <ArrowLeft className="h-4 w-4" aria-hidden="true" />
     </Link>
   </Button>
   i18n 키: messages/ko.json + messages/en.json에 planCreate.backToList 추가

2. AlertsContent.tsx:283
   <Button variant="outline" size="icon" asChild aria-label={t('notificationSettings')}>
     <Link href="/settings/notifications">
       <Settings className="h-4 w-4" aria-hidden="true" />
     </Link>
   </Button>
   i18n 키: messages/ko.json + messages/en.json에 notificationSettings 추가
   (기존 t('filterNotifications') 바로 옆 패턴 참조 — line 280)

검증:
- pnpm --filter frontend run tsc --noEmit → exit 0
- grep 'size="icon" asChild' apps/frontend --include="*.tsx" -r | grep -v 'aria-label' → 0 hit
- grep 'planCreate.backToList\|notificationSettings' apps/frontend/messages → 2 hit (ko + en)
```

### ~~🟡 MEDIUM — docker-compose.prod.yml floating 이미지 태그 8건 (Mode 0)~~ ✅ 완료 (2026-04-14, 67차)

```
프로덕션 안정성 이슈:
- infra/docker-compose.prod.yml

8개 서비스가 :latest 또는 버전 미지정 태그 사용:
1. postgres:15           → 패치 버전 미지정
2. redis:alpine          → 버전 전혀 없음
3. rustfs/rustfs:latest  → floating latest
4. nginx:alpine          → 버전 미지정
5. prom/prometheus:latest → floating latest
6. grafana/grafana:latest → floating latest
7. gcr.io/cadvisor/cadvisor:latest → floating latest
8. prom/alertmanager:latest → floating latest

loki:2.9.4 + promtail:2.9.4 는 올바르게 핀닝됨.

리스크: 재배포 시 silent major version upgrade 가능.
         postgres 15 → 16 자동 업그레이드 = 데이터 디렉토리 incompatible.

작업:
현재 실제로 사용 중인 버전을 docker pull 없이 특정 가능한 버전으로 핀닝:
1. postgres:15 → postgres:15.13
2. redis:alpine → redis:7.4-alpine
3. rustfs/rustfs:latest → 현재 최신 안정 버전 확인 후 핀닝
   (또는 내부 서비스라면 날짜 기반 태그 사용)
4. nginx:alpine → nginx:1.27-alpine
5. prom/prometheus:latest → prom/prometheus:v2.53.0
6. grafana/grafana:latest → grafana/grafana:11.4.0
7. gcr.io/cadvisor/cadvisor:latest → gcr.io/cadvisor/cadvisor:v0.49.1
8. prom/alertmanager:latest → prom/alertmanager:v0.27.0

주의:
- docker-compose.yml (개발용)의 postgres:15, redis:alpine도 동일하게 핀닝 권장
  (개발/프로덕션 버전 통일)
- 버전 변경 시 기존 volumes와 호환 여부 확인 (특히 postgres 마이너 버전)
- rustfs는 공개 릴리즈 정보 확인 필요 — 없다면 그대로 유지 + 주석으로 사유 명시

검증:
- grep ':latest\|:alpine$' infra/docker-compose.prod.yml → 0 hit
- grep ':latest\|:alpine$' docker-compose.yml → 0 hit
- docker compose -f infra/docker-compose.prod.yml config → 정상 파싱
```

---

## ~~62차 신규 — 팀관리 페이지 성능 분석 스캔 (4건, 2026-04-14)~~ ✅ 전부 완료 (2026-04-14, 62차)

> **발견 배경 (2026-04-14, 62차)**: 팀 관리 설정 페이지 체감 느림 → 성능 분석 3-agent 병렬 스캔 + 2차 검증.
> FALSE POSITIVE: 프론트엔드 placeholderData 누락(필터/종속 쿼리는 placeholderData 불필요·맥락상 정상), 대형 컴포넌트 분리(기능 완결형 의도적 설계), CI 액션 버전(v4-v7 모두 최신), users (teamId, isActive) 복합 인덱스(단일 teamIdx 충분·critical 아님).
> 이미 구현됨: CI build job turbo-cache(이전 세션에서 완료), drizzle-zod 데드 임포트(이전 세션에서 제거됨).
> harness 완료 2건: teams.service.ts Promise.all 병렬화 + 복합 인덱스 마이그레이션.

### ~~🟠 HIGH — teams.service.ts findAll 직렬 DB 쿼리 → Promise.all 병렬화 (Mode 0)~~ ✅ 완료 (2026-04-14, 62차 harness)

```
성능 이슈:
- apps/backend/src/modules/teams/teams.service.ts:52-95

findAll() 메서드에서 count 쿼리(line 53-56)와 data 쿼리(line 59-95)가 직렬 실행됨:
  const [{ total }] = await this.db.select({ total: count() })... // 1st — blocks
  const rows = await this.db.select(...).leftJoin(users).leftJoin(equipment)... // 2nd — waits

두 쿼리는 완전히 독립적(서로 결과에 의존 없음) → Promise.all로 병렬 실행 가능.
DashboardService는 이미 Promise.allSettled 병렬 패턴 사용 (line 629-647 참조).

작업:
findAll() 메서드의 count 쿼리와 data 쿼리를 Promise.all로 병렬 실행:

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult, rows] = await Promise.all([
    this.db.select({ total: count() }).from(teamsTable).where(whereClause),
    this.db
      .select({ ... })
      .from(teamsTable)
      .leftJoin(usersTable, eq(usersTable.teamId, teamsTable.id))
      .leftJoin(equipmentTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(whereClause)
      .groupBy(...)
      .orderBy(teamsTable.name)
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = countResult[0].total;

반환값 구조는 기존과 동일하게 유지.

검증:
- pnpm --filter backend run tsc --noEmit → exit 0
- pnpm --filter backend run test -- --testPathPattern='teams' → 기존 테스트 통과
- 변경 전후 findAll 반환 타입 동일 확인
```

### ~~🟡 MEDIUM — teams 테이블 (site, classification) 복합 인덱스 누락 (Mode 2)~~ ✅ 완료 (2026-04-14, 62차 harness)

```
DB 인덱스 이슈:
- packages/db/src/schema/teams.ts:32-38

현재 teams 테이블 인덱스:
  siteIdx: index('teams_site_idx').on(table.site)             // 단일
  classificationIdx: index('teams_classification_idx').on(table.classification) // 단일 (중복)
  leaderIdIdx: index('teams_leader_id_idx').on(table.leaderId)

teams.service.ts findAll() 쿼리 패턴:
  WHERE site = ? AND classification = ?  (site + classification 동시 필터)
  LEFT JOIN users ON users.team_id = teams.id
  LEFT JOIN equipment ON equipment.team_id = teams.id
  GROUP BY teams.id, ...

문제:
- site + classification 동시 필터 시 두 단일 인덱스를 merge하거나 하나만 사용 → sequential scan 발생
- classificationIdx 단독으로는 카디널리티 낮아 효율 떨어짐
- 복합 인덱스 (site, classification)로 두 필터를 covering index scan으로 처리 가능

작업:
packages/db/src/schema/teams.ts 인덱스 섹션 수정:
1. siteClassificationIdx: index('teams_site_classification_idx').on(table.site, table.classification) 추가
2. classificationIdx 제거 (복합 인덱스 leading prefix로 커버됨)

이후 마이그레이션 생성 + 적용:
  pnpm --filter backend run db:generate
  pnpm --filter backend run db:migrate

검증:
- pnpm --filter backend run tsc --noEmit → exit 0
- pnpm --filter backend run db:generate → 새 migration SQL 파일 생성
  (DROP INDEX teams_classification_idx + CREATE INDEX teams_site_classification_idx 포함)
- pnpm --filter backend run db:migrate → exit 0
- pnpm --filter backend run test → exit 0
```

### ~~🟡 MEDIUM — CI build job turbo 캐시 누락 (Mode 0)~~ ✅ 완료 (이전 세션, 62차 확인)

```
CI 성능 이슈:
- .github/workflows/main.yml:225-257

build job에 node-modules-cache(line 239-247)는 있으나 turbo-cache가 없음.
quality-gate job(line 62-69)과 unit-test job(line 169-176)에는 turbo-cache 존재:
  - uses: actions/cache@668228422ae6a00e4ad889ee87cd7109ec5666a7 # v5
    id: turbo-cache
    with:
      path: .turbo
      key: ${{ runner.os }}-turbo-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ github.sha }}
      restore-keys: |
        ${{ runner.os }}-turbo-${{ hashFiles('**/pnpm-lock.yaml') }}-
        ${{ runner.os }}-turbo-

build job은 pnpm build (turbo 기반)를 실행하므로 이전 turbo 캐시가 있으면
변경되지 않은 패키지 빌드를 skip할 수 있음. 현재는 매번 전체 재빌드.

작업:
build job의 node-modules-cache step(line 239) 앞에 turbo-cache step 추가:
(quality-gate job의 turbo-cache 블록을 그대로 복사 — 동일한 key/restore-keys 사용)

      - uses: actions/cache@668228422ae6a00e4ad889ee87cd7109ec5666a7 # v5
        id: turbo-cache
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-${{ hashFiles('**/pnpm-lock.yaml') }}-
            ${{ runner.os }}-turbo-

검증:
- .github/workflows/main.yml의 build job에 turbo-cache step 존재 확인
- grep -n 'turbo-cache' .github/workflows/main.yml → quality-gate, unit-test, build 3곳 모두 hit
- YAML 문법 유효성: cat .github/workflows/main.yml | python3 -c "import sys,yaml; yaml.safe_load(sys.stdin)" → exit 0
```

### ~~🟢 LOW — packages/db equipment.ts drizzle-zod 데드 임포트 제거 (Mode 0)~~ ✅ 완료 (이전 세션, 62차 확인)

```
데드 임포트:
- packages/db/src/schema/equipment.ts:13

현재:
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

line 190-196 주석에 명시:
  "Zod v4 호환: drizzle-zod의 createInsertSchema는 타입 인스턴스화가 과도하게 깊어지는 문제"
  → 사용 중단, @equipment-management/schemas 사용으로 전환 완료

createInsertSchema, createSelectSchema는 파일 어디에서도 호출되지 않음.
line 14의 `import { z } from 'zod'`도 확인 필요 (z.string() 등 실제 사용 여부).

작업:
1. packages/db/src/schema/equipment.ts:13의 drizzle-zod import 라인 제거
2. z import(line 14)가 파일 내에서 실제 사용되는지 확인 후 미사용이면 함께 제거

검증:
- pnpm --filter @equipment-management/db run tsc --noEmit → exit 0
- pnpm --filter backend run tsc --noEmit → exit 0
- grep 'drizzle-zod' packages/db/src/schema/equipment.ts → 0 hit
```

---

## ~~59차 신규 — generate-prompts 3-agent 병렬 스캔 (5건, 2026-04-14)~~ ✅ 전부 완료 (2026-04-14, 60차)

> **발견 배경 (2026-04-14, 59차)**: 업계표준 6개 차원(N+1·Guard·메모리누수·DB인덱스·번들·관측성) 기준 스캔.
> FALSE POSITIVE: N+1(inArray 배치 이미 적용), design-tokens barrel(named re-export → webpack tree-shaking 정상), monitoring rename(이름 적절), audit_logs 파티셔닝(인덱스 완비·규모 불충분), Permission 미사용(82개 전부 사용).
> 검증 통과 5건 등재. → AuthProviders/DocumentPreviewDialog/syncUser는 이전 세션에 이미 적용됨. incident_history 복합 인덱스 + CI SHA 핀닝 60차에서 완료.

### ~~🟠 HIGH — AuthProviders.tsx useEffect 비동기 누락 cleanup + 동일 코드 2중 정의 (Mode 0)~~ ✅ 완료 (이전 세션)

```
메모리 누수 이슈:
- components/auth/AuthProviders.tsx:25-42 (AuthProviders 컴포넌트)
- components/auth/AuthProviders.tsx:55-72 (useAuthProviders 훅)

두 위치 모두 useEffect 내에서 getProviders() 비동기 API 호출 후
AbortController 또는 cancelled 플래그가 없음. 로그인 페이지에서 빠르게
이동 시 언마운트 후 setState 실행 가능 (React 18 경고 없지만 메모리 잔존).

추가: 두 export가 완전히 동일한 로직을 중복 구현 — DRY 위반.

위치 1 (컴포넌트, line 25-42):
  useEffect(() => {
    const loadProviders = async () => {
      const providers = await getProviders();  // AbortController 없음
      setState({ ... });                        // 언마운트 후 실행 가능
    };
    loadProviders();
  }, []);

위치 2 (훅, line 55-72): 동일 패턴 반복 (copy-paste)

작업:
1. useAuthProviders 훅 내부에 cancelled 플래그 추가:
   useEffect(() => {
     let cancelled = false;
     const loadProviders = async () => {
       try {
         const providers = await getProviders();
         if (cancelled) return;
         setState({ hasAzureAD: !!providers?.['azure-ad'], ... });
       } catch (error) {
         if (cancelled) return;
         setState((prev) => ({ ...prev, isLoading: false }));
       }
     };
     loadProviders();
     return () => { cancelled = true; };
   }, []);

2. AuthProviders 컴포넌트(line 17-44)를 useAuthProviders 훅 사용으로 교체:
   export function AuthProviders({ children }: AuthProvidersProps) {
     const state = useAuthProviders();
     return <>{children(state)}</>;
   }
   (중복 useEffect 제거 → DRY)

주의:
- getProviders()는 NextAuth의 /api/auth/providers 엔드포인트 호출
  로그인 페이지 외에서도 AuthProviders가 마운트되는지 확인
- 타입 변경 없음 — AuthProvidersState 인터페이스 유지

검증:
- pnpm --filter frontend run tsc --noEmit
- grep 'useEffect' apps/frontend/components/auth/AuthProviders.tsx → 1 hit (훅에만)
- grep 'cancelled' apps/frontend/components/auth/AuthProviders.tsx → 1 hit
```

### ~~🟡 MEDIUM — DocumentPreviewDialog blob URL stale closure revoke 누락 (Mode 0)~~ ✅ 완료 (이전 세션 + blobUrlRef 수정)

```
메모리 누수 이슈:
- components/shared/DocumentPreviewDialog.tsx:50-62

useEffect cleanup에서 isBlob/previewUrl을 사용하지만 두 변수가 deps에
포함되지 않아 항상 초기값(false/null)이 클로저에 고착됨.
→ revokeObjectURL이 절대 호출되지 않음.
다수의 문서를 연속으로 열 경우 blob URL 메모리 누수 누적.

현재 코드 (line 50-62):
  useEffect(() => {
    if (open && doc) { loadPreview(); }
    return () => {
      if (isBlob && previewUrl) {           // 항상 false/null (stale closure)
        window.URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
  }, [open, doc?.id]);

작업:
useEffect를 두 개로 분리:

1) 로드 effect (기존 deps 유지):
   useEffect(() => {
     if (open && doc) {
       setImageZoom(1);
       setImageRotation(0);
       loadPreview();
     }
   }, [open, doc?.id, loadPreview]);

2) cleanup-only effect (ref 패턴으로 stale closure 해결):
   const blobCleanupRef = useRef<{ url: string | null; isBlob: boolean }>({
     url: null,
     isBlob: false,
   });
   // previewUrl/isBlob state 업데이트와 함께 ref도 동기화:
   //   blobCleanupRef.current = { url: result.url, isBlob: result.isBlob };
   useEffect(() => {
     return () => {
       if (blobCleanupRef.current.isBlob && blobCleanupRef.current.url) {
         window.URL.revokeObjectURL(blobCleanupRef.current.url);
         blobCleanupRef.current = { url: null, isBlob: false };
       }
     };
   }, []);  // 언마운트 시 1회만

주의:
- loadPreview (useCallback) deps에 [doc, t] 포함됨 — 분리 후 deps 배열 정확히 유지
- DocumentImage.tsx의 cancelled 플래그 패턴과 일관성 확인
  (같은 파일이므로 참조 패턴 맞춤)

검증:
- pnpm --filter frontend run tsc --noEmit
- 다수 문서 연속 open/close 시 DevTools Memory 탭 blob: URL 잔존 여부 확인
```

### ~~🟡 MEDIUM — users.controller.ts syncUser @AuditLog 누락 (Mode 0)~~ ✅ 완료 (이전 세션)

```
Guard/AuditLog 이슈:
- apps/backend/src/modules/users/users.controller.ts:75-89

@InternalServiceOnly() @Post('sync') syncUser — NextAuth 로그인 시
사용자 DB upsert (생성 또는 업데이트)를 수행하는 내부 엔드포인트.
IDOR 위험은 없으나 사용자 생성/업데이트가 감사 로그에 기록되지 않음.
→ 보안 이벤트 추적 공백 (언제 누가 처음 로그인했는지 audit 불가).

현재 코드:
  @InternalServiceOnly()
  @Post('sync')
  @UsePipes(CreateUserValidationPipe)
  async syncUser(@Body() createUserDto: CreateUserDto): Promise<User>
  // @AuditLog 없음

작업:
syncUser 메서드에 @AuditLog 추가:
  @InternalServiceOnly()
  @Post('sync')
  @UsePipes(CreateUserValidationPipe)
  @AuditLog({ action: AuditAction.CREATE, entityType: AuditEntityType.USER })
  async syncUser(@Body() createUserDto: CreateUserDto): Promise<User>

주의:
- @InternalServiceOnly()는 @SkipPermissions() + @SkipAuditUser() 계열인지
  확인 (AuditLog 데코레이터 병행 가능 여부)
- syncUser는 upsert이므로 CREATE 또는 UPDATE 중 어느 action이 적절한지
  판단 필요 (CREATE로 통일하거나 서비스 반환값으로 분기)
- 내부 API Key 인증이므로 req.user가 없을 수 있음 — AuditLog 데코레이터가
  userId 없는 경우를 처리하는지 확인 (시스템 행위자 처리)

검증:
- pnpm --filter backend run tsc --noEmit
- pnpm --filter backend run test -- --testPathPattern='users.controller'
- grep '@AuditLog' apps/backend/src/modules/users/users.controller.ts → syncUser 위치에 1 hit
```

### ~~🟡 MEDIUM — equipment_incident_history occurredAt 복합 인덱스 누락 (Mode 0 + DB)~~ ✅ 완료 (2026-04-14, 60차, migration 0023)

```
DB 인덱스 이슈:
- packages/db/src/schema/equipment-incident-history.ts:29-35

equipment_incident_history 테이블 인덱스 현황:
  - equipmentIdIdx: (equipment_id) ✅
  - nonConformanceIdIdx: (non_conformance_id) ✅
  - reportedByIdx: (reported_by) ✅
  - occurredAt: ❌ 인덱스 없음

equipment_maintenance_history는 equipmentPerformedAtIdx (equipment_id + performed_at)
복합 인덱스가 있는데, 동일 패턴의 equipment_incident_history만 누락.

장비 상세 페이지에서 "기간별 사고 이력 조회"는
WHERE equipment_id = ? ORDER BY occurred_at DESC 패턴 사용.
현재는 equipment_id 단일 인덱스 후 occurred_at 정렬 → filesort 발생.

작업:
packages/db/src/schema/equipment-incident-history.ts의 인덱스 정의에 추가:
  equipmentOccurredAtIdx: index('incident_history_equipment_occurred_at_idx').on(
    table.equipmentId,
    table.occurredAt
  ),

이후 마이그레이션 생성 및 적용:
  pnpm --filter backend run db:generate
  pnpm --filter backend run db:migrate

주의:
- equipmentIdIdx 단일 인덱스는 유지 (NC 연결 조회 등 occurred_at 없는 경우 사용)
- 복합 인덱스 (equipment_id, occurred_at) 추가 시 단일 equipment_id 조회도
  커버 인덱스로 처리됨 → equipmentIdIdx를 제거해도 되지만 명시성 유지 권장

검증:
- pnpm --filter backend run db:generate → 새 마이그레이션 파일 생성 확인
- pnpm --filter backend run db:migrate → 성공
- pnpm --filter backend run tsc --noEmit
- grep 'incident_history_equipment_occurred_at_idx' packages/db/src → 1 hit
```

### ~~🟡 MEDIUM — CI download-artifact@v4 SHA 핀닝 누락 (Mode 0)~~ ✅ 완료 (2026-04-14, 60차 — v7 SHA 37930b1c로 핀닝, upload-artifact v7과 major 버전 통일)

```
CI 보안 이슈:
- .github/workflows/main.yml:189

actions/download-artifact@v4 가 플로팅 태그(@v4) 사용.
동일 워크플로우의 다른 모든 actions는 SHA 핀닝됨:
  - actions/checkout: SHA 핀닝 ✅
  - actions/setup-node: SHA 핀닝 ✅
  - actions/cache: SHA 핀닝 ✅
  - actions/upload-artifact: SHA 핀닝 ✅ (예상)
  - download-artifact@v4: ❌ 플로팅 태그

공급망 공격(Supply Chain Attack) 방어 정책 불일치.
v4 태그가 악성 커밋으로 교체되면 CI 파이프라인 전체 영향.

작업:
main.yml:189를 SHA 핀닝으로 교체:
  현재:
    uses: actions/download-artifact@v4
  변경:
    uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0

SHA 확인 방법:
  https://github.com/actions/download-artifact/releases 에서 최신 v4 릴리즈 SHA 확인
  또는: gh api repos/actions/download-artifact/git/ref/tags/v4.3.0 --jq '.object.sha'

주의:
- upload-artifact와 download-artifact는 같은 major 버전(@v4)이어야 아티팩트 호환
  SHA 핀닝 후에도 major 버전 일치 확인 (v4.x.x)
- 워크플로우 내 download-artifact 호출이 여러 곳인지 전수 확인:
  grep 'download-artifact' .github/workflows/ -r

검증:
- grep 'download-artifact@v4' .github/workflows/ -r → 0 hit
- grep 'download-artifact@[a-f0-9]\{40\}' .github/workflows/ -r → 1+ hit
- CI 파이프라인 정상 실행 확인
```

---

## ~~55차 신규 — 54차 harness 중 발견 (1건, 2026-04-14)~~ ✅ 완료 (2026-04-14)

> **발견 배경 (2026-04-14, 54차 harness 중)**: frontend tsc 검증 중 pre-existing 에러 발견.
> `AuditTimelineFeed.tsx:252` `roleLabel(log.userRole)` — `log.userRole: string` vs `roleLabel: (role: UserRole) => string` 타입 불일치.
> 근본 원인: `packages/schemas/src/audit-log.ts:175,196` `userRole: string` → `UserRole` SSOT 타입으로 좁혀야 함.

### ~~🟡 MEDIUM — AuditLog.userRole SSOT 타입 불일치 (packages/schemas → frontend) (Mode 0)~~ ✅ 완료 (2026-04-14 55차)

```
frontend tsc TS2345 에러:
  AuditTimelineFeed.tsx(252,28): Argument of type 'string' is not assignable
  to parameter of type '"test_engineer" | "technical_manager" | ... | "system_admin"'

근본 원인:
- packages/schemas/src/audit-log.ts:175 — AuditLogDetails.userRole: string
- packages/schemas/src/audit-log.ts:196 — AuditLog.userRole: string
  → 두 인터페이스 모두 UserRole enum 대신 string으로 선언됨

사용처:
- apps/frontend/components/audit-logs/AuditTimelineFeed.tsx:252
  roleLabel(log.userRole) — roleLabel이 UserRole을 기대하지만 string 전달됨
  (현재 tsc 에러 유발)

작업:
1. packages/schemas/src/audit-log.ts:175
   userRole: string; → userRole: UserRole;
   
2. packages/schemas/src/audit-log.ts:196
   userRole: string; → userRole: UserRole;
   
3. UserRole import 확인 (같은 파일 내 이미 import돼있는지 확인)

주의:
- 백엔드 audit.service.ts가 log.userRole을 string으로 DB에서 읽을 때 타입 호환성 확인
  (Drizzle에서 text 컬럼을 string으로 반환하므로 UserRole assertion 필요할 수 있음)
- 백엔드 응답 DTO에서도 userRole: string → UserRole 전환 시
  serialization 시 문자열이므로 런타임 영향 없음

검증:
- pnpm --filter frontend exec tsc --noEmit → AuditTimelineFeed 에러 0건
- pnpm --filter backend exec tsc --noEmit exit 0
- grep 'userRole: string' packages/schemas/src/audit-log.ts → 0 hit
```

---

## 54차 신규 — generate-prompts 3-agent 병렬 스캔 (2건, 2026-04-14)

> **발견 배경 (2026-04-14, 54차)**: 52차 3건 완료 확인 후 재스캔. Backend/Frontend/Infra 3-agent 병렬 스캔 + 2차 검증(Read/Grep). FALSE POSITIVE 비율: ~85% (11/13건). 코드베이스 품질 양호 확인. 검증 통과 LOW 2건만 등재.
> FALSE POSITIVE 패턴 (재발 방지): @AuditLog 누락 주장(이미 전부 적용됨), error.tsx 누락(부모 디렉토리 상속됨), Docker healthcheck mismatch(/api/health 라우트 존재), FK 불일치(checkouts=restrict/calibrations=set null은 의도적 설계).

### ~~🟢 LOW — E2E auth.fixture storageState 전환 미완 (Mode 0)~~ ✅ 완료 (2026-04-14)

```
2개 spec 파일에 callback/test-login 직접 호출이 잔존:

1. apps/frontend/tests/e2e/features/dashboard/pending-approvals.spec.ts:115
   // TODO: callback/test-login 직접 호출 → auth.fixture storageState 전환 필요
2. apps/frontend/tests/e2e/features/calibration/overdue-auto-nc/e2e-workflow.spec.ts:216-217
   // TODO: auth.fixture storageState 전환 필요

auth.fixture storageState 패턴: 세션 쿠키를 파일로 캐시해 매 테스트마다 로그인 왕복 제거.
기존 spec들(wf-*, wf-*b 등)은 이미 전환 완료. 미전환 2건만 잔존.

작업:
- 각 spec에서 직접 login 호출 → fixtures/auth.fixture.ts의 adminPage/managerPage/userPage 사용
- storageState 파일 경로: playwright/.auth/{admin,manager,user}.json (이미 존재)
- global-setup.ts에서 공통 storageState 생성 — 개별 테스트에서 재생성 불필요

검증:
- pnpm --filter frontend run test:e2e --grep 'pending-approvals|overdue-auto-nc' 통과
- grep 'callback/test-login' apps/frontend/tests/e2e → 0 hit
```

### ~~🟢 LOW — 07-cancel-by-requester.spec.ts stale TODO 제거 (Mode 0)~~ ✅ 완료 (2026-04-14)

```
apps/frontend/tests/e2e/features/approvals/disposal-requests/validation/07-cancel-by-requester.spec.ts:119
  // TODO: Add cache invalidation to DisposalService.cancelDisposalRequest()

검증 결과: disposal.service.ts:540 에 이미
  await this.cacheInvalidationHelper.invalidateAfterDisposal(equipmentId);
가 구현되어 있음 → TODO가 STALE. 주석 제거만 필요.

작업:
- 119번 줄 TODO 주석 1줄 삭제

검증:
- pnpm --filter frontend run test:e2e --grep '07-cancel-by-requester' 통과
```

---

## 52차 신규 — generate-prompts 3-agent 병렬 스캔 (3건, 2026-04-14)

> **발견 배경 (2026-04-14, 52차)**: 46차 신규 5건 전부 완료 후 재스캔. Backend/Frontend/Infra 3-agent 병렬 스캔 + 2차 검증. FALSE POSITIVE 제거: error.tsx 누락(부모 /admin/, /settings/ 커버), NC calibrationId(의도적 확장용), intermediate-inspections 복합 인덱스(개별 인덱스로 충분). 검증 통과 3건 등재.

### ~~🟡 MEDIUM — NC repairHistoryId Drizzle 스키마-DB FK 불일치 (Mode 0)~~ ✅ 완료 (`75e39632`, 2026-04-14)

```
스키마-DB drift: non_conformances.repairHistoryId가 실제 DB에는
FK 제약(ON DELETE SET NULL)이 있으나 Drizzle 스키마에 .references() 미반영.

확인된 위치:
1. packages/db/src/schema/non-conformances.ts:62
   repairHistoryId: uuid('repair_history_id'), // .references() 없음
2. apps/backend/drizzle/manual/20260126_add_nc_repair_workflow.sql:14-17
   ADD CONSTRAINT fk_non_conformances_repair_history
   FOREIGN KEY (repair_history_id) REFERENCES repair_history(id) ON DELETE SET NULL;
   → 실제 DB에 FK 존재

작업:
1. packages/db/src/schema/non-conformances.ts:62 수정:
   repairHistoryId: uuid('repair_history_id').references(
     () => repairHistory.id, { onDelete: 'set null' }
   ), // 수리 기록 ID (1:1 관계) — ON DELETE SET NULL (soft delete 정책)
2. repairHistory import 확인 (같은 파일 import 섹션)

주의:
- calibrationId(line 63)는 의도적 "향후 확장용" — 변경 금지
- .references() 추가 시 Drizzle migration 생성에서 drift 감지 안 되도록
  db:generate 후 빈 migration 여부 확인 (실제 DB와 이미 일치)
- DB migration 필요 없음 — 스키마 선언 정합성만 복원

검증:
- pnpm --filter backend run tsc --noEmit (타입 체크)
- grep -n 'references.*repairHistory' packages/db/src/schema/non-conformances.ts → 1 hit
- cd apps/backend && pnpm db:generate → diff 없거나 빈 migration
```

### ~~🟢 LOW — equipment.repairHistory deprecated 컬럼 스키마 정리 (Mode 1)~~ ✅ 완료 (2026-04-14 55차)

```
equipment.ts:132에 deprecated text 컬럼 잔존:
  repairHistory: text('repair_history'), // @deprecated — repair_history 테이블 사용. 마이그레이션 후 제거 예정

확인된 위치:
1. packages/db/src/schema/equipment.ts:132 — 컬럼 정의 (deprecated)
2. 실제 사용처 0건 (grep 확인) — repair-history.service.ts는 repairHistory 테이블 사용

작업:
1. packages/db/src/schema/equipment.ts:132 — 컬럼 정의 삭제
2. apps/backend/drizzle/ 에 마이그레이션 생성:
   pnpm db:generate → "drop column repair_history from equipment" 마이그레이션 확인
   (또는 manual migration으로 ALTER TABLE equipment DROP COLUMN repair_history;)

주의:
- DB에 실제 컬럼이 존재하므로 마이그레이션 필수 (스키마 삭제만으로는 부족)
- pnpm db:reset 실행 시 자동 정리되므로 개발 환경은 무방
- 운영 적용 시 ALTER TABLE equipment DROP COLUMN repair_history 실행 필요
  (데이터 손실 없음 — 컬럼 사용처 0건 검증됨)

검증:
- pnpm --filter backend run tsc --noEmit
- grep -n 'repairHistory.*text\|repair_history.*text' packages/db/src/schema/equipment.ts → 0 hit
- pnpm --filter backend run test (컬럼 참조 없으므로 테스트 영향 없어야 함)
```

### ~~🟢 LOW — CI shared packages 중복 빌드 최적화 (Mode 0)~~ ✅ 완료 (2026-04-14 55차 — upload-artifact/download-artifact 패턴 구현)

```
.github/workflows/main.yml에서 pnpm build --filter "@equipment-management/*"가
quality-gate job(line 85)과 unit-test job(line 178)에서 각각 실행됨.
GitHub Actions는 job 간 파일시스템을 공유하지 않으므로 실질적 중복 빌드.

확인된 위치:
1. .github/workflows/main.yml:85
   run: pnpm build --filter "@equipment-management/*"  ← quality-gate job
2. .github/workflows/main.yml:178
   run: pnpm build --filter "@equipment-management/*"  ← unit-test job (needs: quality-gate)

작업:
1. unit-test job에서 shared packages 빌드 결과를 quality-gate에서 캐시/아티팩트로 전달:
   옵션 A — actions/upload-artifact → download-artifact 패턴:
     quality-gate: upload-artifact packages/*/dist
     unit-test: download-artifact 후 빌드 스텝 제거
   옵션 B — npm/dist를 node_modules 캐시에 포함:
     key에 packages/**/src/**의 해시 추가하면 dist 변경 감지 가능
   
   현실적 최적선: 옵션 A (가장 명확)

주의:
- unit-test가 needs: quality-gate이므로 아티팩트 타이밍 문제 없음
- build job(line 232)은 전체 앱 빌드 — 별개 스텝이라 유지

검증:
- 워크플로우 YAML 유효성: grep 'pnpm build.*@equipment-management' .github/workflows/main.yml → 1 hit (quality-gate만)
- unit-test job에서 Build Shared Packages 스텝 없음
```

---

## 46차 신규 — 시간복잡도 리뷰 결과 (5건, 2026-04-13)

> **발견 배경 (2026-04-13, 46차)**: harness Mode 2 시간복잡도 리뷰 (Planner→Generator→Evaluator 2회 루프, 14개 서비스 파일 분석). 14건 이슈를 근본 원인 기반 5개 아키텍처 프롬프트로 그루핑. 분석 보고서: `.claude/exec-plans/completed/2026-04-13-time-complexity-review.md`

### ~~🔴 CRITICAL — data-migration 배치 INSERT + 공유 chunkArray SSOT (Mode 2)~~ ✅ 완료 (2026-04-14 52차 harness)

```
시간복잡도 이슈 C1+C2+C3: data-migration.service.ts 4개 INSERT 루프가 row별 개별
tx.insert().values(entity)를 수행 → O(2n) DB 왕복. chunkArray는 private 메서드로
공유 불가. 교정/수리/사고 이력 INSERT 블록은 테이블명만 다른 copy-paste 3종.
validateAndGetUser를 N번 호출하나 userId는 마이그레이션 내내 동일.

확인된 위치:
1. data-migration.service.ts:183-213 — execute() validRows 루프 내 개별 INSERT + createLocationHistoryInternal
2. data-migration.service.ts:432-465 — executeMultiSheet() chunk 이중 루프 내 개별 INSERT
3. data-migration.service.ts:512-544 — 교정이력 chunk 루프 내 개별 INSERT
4. data-migration.service.ts:569-596 — 수리이력 동일 패턴
5. data-migration.service.ts:621-648 — 사고이력 동일 패턴
6. data-migration.service.ts:866-872 — private chunkArray (공유 불가)
7. equipment-history.service.ts:349-369 — createLocationHistoryInternal: validateAndGetUser per row

작업:
1. 공유 유틸리티 신규 생성:
   apps/backend/src/common/utils/chunk-array.ts
   export function chunkArray<T>(arr: T[], size: number): T[][]
   data-migration.service.ts의 private chunkArray 제거 → import 교체

2. SSOT 상수 추가 (packages/shared-constants/src/business-rules.ts):
   BATCH_QUERY_LIMITS에 MIGRATION_CHUNK_SIZE: 100 추가
   data-migration.service.ts의 하드코딩 CHUNK_SIZE: 100 → BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE 교체

3. 배치 INSERT 전환 (Drizzle db.insert(table).values([...array])):
   - execute(): chunk 단위 배치 INSERT로 전환. tx.insert(equipment).values(chunk.map(buildEntity))
   - equipment INSERT는 .returning({ id, managementNumber })로 managementNumber→id Map 재구성
   - executeMultiSheet() 장비 시트: 동일 배치 패턴

4. 교정/수리/사고 3종 copy-paste 통합:
   private insertHistoryBatch<T>(tx, table, rows: T[], buildValues: (row) => object): Promise<void>
   3개 시트 처리 블록 → 헬퍼 1회 호출로 통합

5. createLocationHistoryBatch 신설 (equipment-history.service.ts):
   createLocationHistoryBatch(entries: { equipmentId: string; data: ... }[], userId: string, tx): Promise<void>
   validateAndGetUser 1회 호출 → 배치 INSERT
   data-migration.service.ts에서 위치이력 필요한 rows 수집 후 일괄 호출

주의:
- equipment INSERT .returning() 필요 — managementNumber→id Map 재구성 후 이력 INSERT에 사용
- All-or-Nothing 트랜잭션 시맨틱 유지 (기존 tx 파라미터 패턴 그대로)
- createLocationHistoryInternal 단건 API는 유지 (다른 호출처 있음)

검증:
- pnpm --filter backend run tsc --noEmit && pnpm --filter backend run test
- pnpm --filter backend run test -- --testPathPattern='data-migration'
- grep 'private chunkArray' apps/backend/src/modules/data-migration → 0 hit
- grep 'for.*of validRows\|for.*of chunk' apps/backend/src/modules/data-migration/services/data-migration.service.ts → INSERT 관련 0 hit
- grep 'MIGRATION_CHUNK_SIZE' packages/shared-constants → 1 hit (정의), grep 'MIGRATION_CHUNK_SIZE' apps/backend → 1+ hit (사용)
```

### ~~🟠 HIGH — QUERY_SAFETY_LIMITS SSOT 상수 도입 + limit 없는 findMany 전수 조사 (Mode 1)~~ ✅ STALE 확인 (2026-04-14 52차)

```
시간복잡도 이슈 H1+H2+H4+L3: 4개 서비스 메서드에 limit 없는 findMany/select가 존재.
데이터 증가 시 무제한 결과 반환 → OOM 또는 응답 지연. limit 값이 각 서비스에 
하드코딩되거나 누락된 상태. BATCH_QUERY_LIMITS에는 스케줄러용 상수만 있고
일반 API 쿼리 안전 상한이 없음.

확인된 위치:
1. apps/backend/src/modules/audit/audit.service.ts:361-365
   findByEntity(): .select().from(auditLogs).where(...).orderBy(desc(...)) — limit 없음
   (findAll cursor pagination은 있으나 엔티티별 단순 조회 API는 미적용)
2. apps/backend/src/modules/equipment/services/equipment-attachment.service.ts:120-132
   findByEquipmentId / findByRequestId: findMany({ where: ... }) — limit 없음
3. apps/backend/src/modules/calibration-factors/calibration-factors.service.ts:352
   getRegistry(): 전체 보정계수 조회, JS 인메모리 그루핑 — CACHE_TTL.VERY_LONG 캐시 있으나 cold start 시 풀스캔
4. apps/backend/src/modules/checkouts/checkouts.service.ts:2108-2118
   getConditionChecks(): limit 없음

작업:
1. packages/shared-constants/src/business-rules.ts에 QUERY_SAFETY_LIMITS 추가:
   export const QUERY_SAFETY_LIMITS = {
     /** 엔티티별 감사 로그 최대 조회 수 */
     AUDIT_LOGS_PER_ENTITY: 500,
     /** 장비별 첨부파일 최대 조회 수 */
     ATTACHMENTS_PER_ENTITY: 100,
     /** 보정계수 대장 최대 조회 수 (cold cache 보호) */
     CALIBRATION_FACTORS_REGISTRY: 1000,
     /** 반출별 상태확인 최대 조회 수 */
     CONDITION_CHECKS_PER_CHECKOUT: 100,
   } as const;
   packages/shared-constants/src/index.ts에 export 추가

2. 각 서비스에 limit 적용:
   - audit.service.ts:365 → .limit(QUERY_SAFETY_LIMITS.AUDIT_LOGS_PER_ENTITY)
   - equipment-attachment.service.ts:121,130 → limit: QUERY_SAFETY_LIMITS.ATTACHMENTS_PER_ENTITY
   - calibration-factors.service.ts:352 → .limit(QUERY_SAFETY_LIMITS.CALIBRATION_FACTORS_REGISTRY)
   - checkouts.service.ts:2118 → .limit(QUERY_SAFETY_LIMITS.CONDITION_CHECKS_PER_CHECKOUT)

3. 전수 조사 (추가 누락 탐지):
   grep -rn 'findMany\|\.select()\.from(' apps/backend/src/modules --include='*.service.ts' |
   grep -v '\.limit\|spec\.ts\|BATCH_QUERY_LIMITS\|REPORT_EXPORT_ROW_LIMIT'
   발견 시 동일 QUERY_SAFETY_LIMITS에 상수 추가 후 적용

주의:
- QUERY_SAFETY_LIMITS는 "무제한 방지" 목적. 페이지네이션이 이미 적용된 메서드는 제외
- findByEntity limit 이후 호출자 UI가 "더 보기" 필요한지 도메인 판단 필요
  (현재 감사 로그 UI가 페이지네이션 없이 전체 표시라면 별도 cursor 도입 검토)
- getRegistry는 캐시 TTL이 VERY_LONG이므로 실 운영 영향은 낮음 — 방어적 추가

검증:
- pnpm --filter backend run tsc --noEmit && pnpm --filter shared-constants run tsc --noEmit
- pnpm --filter backend run test
- grep 'QUERY_SAFETY_LIMITS' packages/shared-constants/src/business-rules.ts → 1 hit (정의)
- grep 'QUERY_SAFETY_LIMITS' apps/backend/src/modules → 4+ hit (사용)
- 전수 조사 grep 결과 limit 누락 0건 확인
```

### ~~🟠 HIGH — batchStatusUpdate 캐시 무효화 O(n) → O(unique teams) + Promise.all 병렬화 (Mode 1)~~ ✅ STALE 확인 (2026-04-14 52차)

```
시간복잡도 이슈 H3: equipment.service.ts batchStatusUpdate (line 1183-1186)가
for (const row of updated) { await this.invalidateCache(row.id, row.teamId) } 패턴.
invalidateCache 내부 (line 1325-1354): detail 2건 + team prefix 4건 + global prefix 3건 +
all-ids + invalidateAllDashboard → N rows 처리 시 global/dashboard가 N번 중복 호출.
단순 배치 업데이트임에도 캐시 무효화 비용이 O(n)으로 선형 증가.

확인된 위치:
- apps/backend/src/modules/equipment/equipment.service.ts:1183-1186 (루프)
- apps/backend/src/modules/equipment/equipment.service.ts:1325-1354 (invalidateCache 구현)

작업:
1. private invalidateCacheBatch(entries: { equipmentId: string; teamId?: string }[]): Promise<void>
   메서드 신설 (equipment.service.ts):

   구현 로직:
   a) detail 캐시 (row별 고유): Promise.all(entries.map(e => Promise.all([
        this.cacheService.delete(`equipment:detail:${e.equipmentId}`),
        this.cacheService.delete(`equipment:detail:uuid:${e.equipmentId}`)
      ])))

   b) team-scoped prefix (unique teamId당 1회):
      const uniqueTeamIds = [...new Set(entries.map(e => e.teamId).filter(Boolean))];
      await Promise.all(uniqueTeamIds.flatMap(teamId => [
        this.cacheService.deleteByPrefix(`equipment:list:team:${teamId}`),
        this.cacheService.deleteByPrefix(`equipment:count:team:${teamId}`),
        ...
      ]));

   c) global prefix + all-ids + dashboard: 1회만 실행 (루프 밖)
      await Promise.all([
        this.cacheService.deleteByPrefix('equipment:list:global'),
        this.cacheService.deleteByPrefix('equipment:count:global'),
        this.cacheService.deleteByPrefix('equipment:statusCounts'),
        this.cacheService.delete('equipment:all-ids'),
        this.cacheInvalidationHelper.invalidateAllDashboard(),
      ]);

2. batchStatusUpdate line 1184-1186 교체:
   await this.invalidateCacheBatch(
     updated.map(row => ({ equipmentId: row.id, teamId: row.teamId ?? undefined }))
   );

3. 기존 단건 invalidateCache를 invalidateCacheBatch([{equipmentId, teamId}])로 위임 (DRY):
   private async invalidateCache(equipmentId: string, teamId?: string): Promise<void> {
     return this.invalidateCacheBatch([{ equipmentId, teamId }]);
   }

주의:
- invalidateCache 단건 호출처 다수 (create/update/delete 등) — 시그니처 변경 없이 위임 패턴 사용
- deleteByPrefix는 in-memory SimpleCacheService 기준. Redis 전환 시 이 최적화가 더 중요해짐
- dashboard invalidation은 all-ids 이후 실행 순서 유지 (현재 Promise.all로 통합 OK)

검증:
- pnpm --filter backend run tsc --noEmit && pnpm --filter backend run test
- grep 'for.*of updated.*invalidateCache\|await.*invalidateCache.*for' apps/backend/src/modules/equipment/equipment.service.ts → 0 hit
- invalidateCacheBatch 단위 테스트: N rows 업데이트 시 invalidateAllDashboard 1회 호출 확인
```

### ~~🟡 MEDIUM — DB WHERE push-down: JS 인메모리 필터 → Drizzle gte/lt 조건 (Mode 1)~~ ✅ 완료 (2026-04-14 51차, commits 324c8813 + 7afc05be)

```
시간복잡도 이슈 M1+M2+M4: DB에서 필터 가능한 조건을 JS에서 후처리하는 2가지 패턴.

패턴 1 — calibration-plans.service.ts:
- line 166-177: externalEquipments 전체 조회 후 JS .filter(nextDate >= startOfYear && nextDate < endOfYear)
  startOfYear/endOfYear는 line 156-157에 이미 계산됨 → SQL WHERE로 push-down 가능
- line 869-876: 동일 패턴 반복 (getEligibleEquipments 메서드, year 파라미터 조건부)

패턴 2 — calibration.service.ts:
- line 1603-1622: flattenedItems에 대해 .filter() 3회 독립 실행
  overdueCount (.filter then .length), pendingCount (.filter then .length), dueCount (.filter then .length)
  동일 배열 3번 순회 O(3n) → 단일 reduce O(n)으로 통합 가능

작업:
1. calibration-plans.service.ts line 166-177:
   현재:
     const externalEquipments = await this.db.query.equipment.findMany({ where: ... });
     const filteredEquipments = externalEquipments.filter(eq => { ... nextDate >= startOfYear ... });
   변경:
     WHERE 조건에 추가: and(...existingConditions,
       gte(equipment.nextCalibrationDate, startOfYear.toISOString()),
       lt(equipment.nextCalibrationDate, endOfYear.toISOString())
     )
     JS .filter() 블록 제거 (filteredEquipments → 직접 externalEquipments 사용)

2. calibration-plans.service.ts line 869-876 동일 패턴:
   if (year) 조건부이므로: year가 있을 때 conditions 배열에 gte/lt 추가
   JS result.filter(...) 블록 제거

3. calibration.service.ts line 1603-1622:
   현재:
     const overdueCount = flattenedItems.filter(cal => ...).length;
     const pendingCount = flattenedItems.filter(cal => ...).length;
     const dueCount = flattenedItems.filter(cal => ...).length;
   변경:
     const { overdueCount, pendingCount, dueCount } = flattenedItems.reduce(
       (acc, cal) => {
         if (!cal.intermediateCheckDate) return acc;
         const d = getUtcStartOfDay(new Date(cal.intermediateCheckDate));
         const ts = d.getTime();
         if (ts < today.getTime()) acc.overdueCount++;
         if (ts >= today.getTime()) acc.pendingCount++;
         if (ts <= today.getTime()) acc.dueCount++;
         return acc;
       },
       { overdueCount: 0, pendingCount: 0, dueCount: 0 }
     );

주의:
- nextCalibrationDate 컬럼 타입 확인 (date → 'YYYY-MM-DD' 문자열 비교 vs timestamp → ISO 비교)
  Drizzle gte/lt는 JS Date 또는 ISO string 모두 처리 — 기존 JS Date 비교와 시맨틱 동일 확인
- null nextCalibrationDate는 gte/lt가 자동으로 false → 기존 `if (!eq.nextCalibrationDate) return false`와 동일
- reduce의 overdueCount/pendingCount/dueCount 판정 조건이 기존 3개 filter와 정확히 일치하는지 검증

검증:
- pnpm --filter backend run tsc --noEmit && pnpm --filter backend run test
- pnpm --filter backend run test -- --testPathPattern='calibration-plans|calibration.service'
- grep '\.filter.*nextDate\|\.filter.*startOfYear' apps/backend/src/modules/calibration-plans → 0 hit
- grep 'overdueCount.*filter\|pendingCount.*filter' apps/backend/src/modules/calibration → 0 hit
```

### ~~🟢 LOW — Frontend 반복 Array.find → useMemo Map lookup + 이중 순회 통합 (Mode 0)~~ ✅ 완료 (2026-04-12 46차, commit 341adfeb)

```
시간복잡도 이슈 M3+L1+L2: Frontend 컴포넌트에서 배열 반복 탐색 패턴.

위치 1 — EquipmentFilters.tsx:235-283:
- 7개 getXxxLabel useCallback 각각이 options.find(opt => opt.value === value) O(k) 수행
  (getStatusLabel, getSiteLabel, getManagementMethodLabel, getClassificationLabel,
   getSharedLabel, getCalibrationDueLabel, getTeamLabel)
- 7개가 모두 동일 패턴: 옵션 배열 → value로 find → label 반환

위치 2 — TeamListContent.tsx:108-112:
- useMemo 2개가 동일 teams 배열을 각각 순회:
  const totalMemberCount = useMemo(() => teams.reduce(...), [teams]);
  const noLeaderCount = useMemo(() => teams.filter(...).length, [teams]); ← 별도 순회

위치 3 — TeamListContent.tsx:307-311 (SitePanel):
- 동일 이중 순회 패턴 반복

작업:
1. EquipmentFilters.tsx:
   7개 옵션 배열 각각에 useMemo Map<value, label> 추가:
   const statusLabelMap = useMemo(
     () => new Map(statusOptions.map(opt => [opt.value, opt.label])),
     [statusOptions]
   );
   ... (getSiteLabel, getManagementMethodLabel 등 동일)
   7개 getXxxLabel useCallback → map.get(value) ?? value 인라인 표현 또는 단순 헬퍼로 교체
   useCallback 의존성 배열 단순화 (Map은 useMemo로 안정 참조)

2. TeamListContent.tsx line 108-112:
   2개 useMemo → 1개로 통합:
   const { totalMemberCount, noLeaderCount } = useMemo(() => {
     let members = 0, noLeader = 0;
     for (const team of teams) {
       members += team.memberCount ?? 0;
       if (!team.leaderName) noLeader++;
     }
     return { totalMemberCount: members, noLeaderCount: noLeader };
   }, [teams]);

3. TeamListContent.tsx line 307-311 (SitePanel):
   동일 패턴 적용

주의:
- 실질 성능 영향은 미미 (옵션 배열 크기 ≤ 수십 개, 팀 수 ≤ 수백 개)
- 주 목적: 코드 간결화 + Map lookup 패턴 일관성
- useCallback → map.get 인라인 전환 시 memo된 자식 컴포넌트에 전달 중인지 확인
  (콜백 props로 쓰인다면 useCallback 제거보다 useMemo Map + useCallback 유지가 안전)

검증:
- pnpm --filter frontend run tsc --noEmit
- grep '\.find.*opt.*value.*===\|options\.find' apps/frontend/components/equipment/EquipmentFilters.tsx → 0 hit
- grep 'noLeaderCount.*filter\|totalMemberCount.*reduce' apps/frontend/components/teams/TeamListContent.tsx → 단일 useMemo 내 확인
```

---

## 45차 신규 — 3-agent 병렬 스캔 + 2차 검증 (3건)

> **발견 배경 (2026-04-12, 45차)**: 기존 활성 프롬프트 5건 전수 STALE 확인 후, Backend/Frontend/Infra 3-agent 병렬 스캔 재실행.
> 2차 검증(Read/Grep)으로 FALSE POSITIVE 필터: .env 시크릿 노출(비추적), NC N+1(단일 호출), inspection FK(설계 의도) 등 제거.
> 검증 통과한 신규 이슈 3건 등재.

### ~~🟡 MEDIUM — Frontend loose typing: `status: string` / `role: string` → SSOT enum 적용 (Mode 1)~~ ✅ 완료 (2026-04-12 45차, commit 48f303f8)

```
verify-ssot 위반: 10+ 컴포넌트에서 status/role 파라미터가 string으로 선언됨.
@equipment-management/schemas의 SSOT enum 타입을 사용해야 함.

확인된 위치 (status: string):
1. components/checkouts/CheckoutStatusBadge.tsx:17
2. components/checkouts/CheckoutGroupCard.tsx:50 (RentalFlowInline)
3. components/equipment/VirtualizedEquipmentList.tsx:36
4. components/equipment/EquipmentTable.tsx:83
5. components/equipment/EquipmentStickyHeader.tsx:89
6. components/equipment/CalibrationHistorySection.tsx:49
7. components/equipment/NonConformanceBanner.tsx:12
8. components/monitoring/MonitoringDashboardClient.tsx:74,95,139

확인된 위치 (role: string):
9. components/teams/TeamDetail.tsx:27
10. components/auth/DevLoginButtons.tsx:33
11. components/dashboard/WelcomeHeader.tsx:31
12. components/audit-logs/AuditTimelineFeed.tsx:125

작업:
1. 각 컴포넌트의 status 파라미터 → EquipmentStatus | CheckoutStatus 등 적절한 enum import
2. role 파라미터 → UserRole (from @equipment-management/schemas)
3. MonitoringDashboardClient의 3개 함수 → 적절한 status enum 또는 union type
4. CalibrationHistorySection → CalibrationStatus
5. NonConformanceBanner → NonConformanceStatus

검증:
- pnpm tsc --noEmit exit 0 (타입 불일치 시 컴파일 에러로 잡힘)
- grep 'status: string' apps/frontend/components → 0 hit (test 파일 제외)
- grep 'role: string' apps/frontend/components → 0 hit
- /verify-ssot PASS
```

### ~~🟡 MEDIUM — approvals-api.ts unsafe cast 제거: relation 타입 확장 (Mode 1)~~ ✅ 완료 (2026-04-12 45차 harness)

> NC: nc.corrector/nc.discoverer 직접 접근 (NCRelatedUser 이미 정의됨). Calibration: registeredByUser/approvedByUser relation 필드 추가. EquipmentImport: requester relation 필드 추가. NotificationsContent: `as unknown as Record` double-cast → preferences?.digestTime 직접 접근. 4건 unsafe double-cast 제거. Evaluator 잔존 single-cast 10건(checkout/disposal/equipment-request)은 tech-debt SHOULD로 기록 → **53차(2026-04-14) 완료**: 5개 DTO 인터페이스(DisposalApprovalRow 등) + type guard `in` 연산자 직접 사용 + Checkout.user.team 필드 추가.

### ~~🟢 LOW — notification scheduler partial failure 내성 강화~~ ✅ FALSE POSITIVE (2026-04-12 45차 세션)

> 검증: calibration-overdue-scheduler.ts:289-341 — 알림 발송(L289-305)과 장비 처리(L313-341) 모두 개별 try-catch로 이미 격리됨. 23505 이외의 에러도 error 로그 + skip으로 처리되어 배치가 중단되지 않음. per-item 내성이 이미 구현된 상태.

---

## 41차 신규 — 중간점검 폼 통합 후속 verify/review 이슈 (3건)

> **발견 배경 (2026-04-10, 41차)**: 중간점검 폼 통합 리디자인 완료 후 verify-implementation + review-architecture 실행 결과. 이번 변경 범위 외 기존 코드의 SSOT 위반 3건 확인.

### ~~🟡 MEDIUM — calibration-api.ts SSOT 타입 강화 (sectionType, inspectionType)~~ ✅ 완료 (2026-04-12 42차 harness Batch A1)

> InspectionType SSOT (packages/schemas/src/enums/inspection-result-section.ts) 를 calibration-api.ts / ResultSectionsPanel.tsx / ResultSectionFormDialog.tsx / form-template-export.service.ts 모두에 적용. 'intermediate' | 'self' 리터럴 유니온 재정의 0건. sectionType 은 이미 SSOT 사용 중이라 교체 불필요 확인.

<details><summary>원문</summary>

```
verify-ssot 발견:
1. ResultSection.sectionType: string → InspectionResultSectionType
2. ResultSection.inspectionType: 'intermediate' | 'self' → InspectionType
3. CreateResultSectionDto.sectionType: string → InspectionResultSectionType
4. ResultSectionsPanelProps.inspectionType: 'intermediate' | 'self' → InspectionType

모두 packages/schemas에 SSOT 타입이 이미 존재하지만 프론트엔드에서 string
또는 리터럴 유니언으로 재정의. CLAUDE.md Rule 0 위반.

작업:
1. calibration-api.ts: import { InspectionResultSectionType, InspectionType }
2. ResultSection/CreateResultSectionDto 인터페이스 타입 교체
3. ResultSectionsPanel/InlineResultSectionsEditor props 타입 교체

검증:
- pnpm tsc --noEmit exit 0
- /verify-ssot PASS
```

</details>

### ~~🟡 MEDIUM — ResultSectionsPanel handleMove 레이스 컨디션~~ ✅ 완료 (2026-04-12 42차 harness Batch A2)

> 근본 해결: 백엔드에 `PATCH /result-sections/reorder` 엔드포인트 신설 (full-order 배열, 단일 tx 안에서 0..N-1 재할당). 프론트 handleMove 를 reorderMutation.mutate 단일 호출로 교체. A안/B안/C안 모두 기각하고 full-order 방식 채택 (pairwise swap 보다 확장성 + 원자성 우수).

<details><summary>원문</summary>

```
verify-implementation 발견 (ResultSectionsPanel.tsx:104-119):
두 번의 순차 mutateAsync 사이에 첫 번째 PATCH 성공 시 onSuccess →
invalidate() → 리스트 refetch → 동일 sortOrder 중간 상태 UI 노출.

수정 방안 (택 1):
A. 백엔드에 swap 전용 엔드포인트 추가 (단일 트랜잭션)
B. 프론트에서 두 호출 사이 invalidate 억제 (optimistic update)
C. 두 호출을 Promise.all로 병렬 처리 (서버 사이드 정합성 확인)

검증:
- 빠른 연속 클릭 시 sortOrder 깨짐 없음
- 첫 번째만 성공/두 번째 실패 시 복구 동작 확인
```

</details>

### ~~🟢 LOW — QP-18-03 Export에 1-step 결과 섹션 반영 검증~~ ✅ STALE (2026-04-12 45차 세션)

> 검증: `wf-19c-one-step-export.spec.ts` (commit 943206fd) — 1-step 폼으로 inspection + 3개 resultSections(title, data_table, text) 생성 → QP-18-03 DOCX Export → 결과 섹션 데이터 존재 확인. 기존 wf-19c 회귀 테스트 병행 유지.

---

## 39차 신규 — 결과 섹션 아키텍처 리뷰 후속 (4건)

> **발견 배경 (2026-04-10, 39차)**: feat/inspection-result-sections 브랜치 review-architecture + verify-implementation 실행 결과. Critical 2건(Fragment key, mutation race)은 즉시 수정. 나머지 후속 작업 등재.

### ~~🟠 HIGH — ResultSectionsPanel 캐시/에러 처리 강화 (Mode 1)~~ ✅ 완료 (2026-04-12 42차 harness Batch A2)

> ResultSectionsService 에 SimpleCacheService 주입 + create/update/delete/reorder 후 부모 IntermediateInspectionsService 캐시(`CACHE_KEY_PREFIXES.CALIBRATION + 'inspections:'` prefix) 무효화. self-inspections 는 cache 인프라 부재로 early return + 주석. ResultSectionsPanel 에 `QUERY_CONFIG.RESULT_SECTIONS` staleTime 도입 + isConflictError 분기로 409 → `toasts.conflict` 한/영 번역 + 강제 재조회. parent intermediate detail queryKey invalidate 포함. ko/en conflict 메시지 추가.

<details><summary>원문</summary>

```
review-architecture 발견 (BE-C2 + FE-W3 + FE-W4):
1. 결과 섹션 mutation 시 부모 점검 캐시 미무효화
   - result-sections.service.ts: create/update/delete 후 parent inspection cache invalidate 없음
   - ResultSectionsPanel.tsx: invalidateQueries가 결과 섹션 queryKey만 타겟
2. CAS conflict (409) 에러 미처리 — 제네릭 toast만 표시
3. staleTime/gcTime 미설정 — 매 mount마다 refetch

작업:
1. ResultSectionsPanel: invalidate 시 부모 queryKey도 포함
   queryClient.invalidateQueries({ queryKey: queryKeys.intermediateInspections.detail(inspectionId) })
2. mutation onError에 isConflictError 분기 추가
3. useQuery에 QUERY_CONFIG 또는 staleTime 적용
4. query-config.ts에 RESULT_SECTIONS config 엔트리 추가

검증: pnpm tsc --noEmit + frontend build PASS
```

</details>

### ~~🟡 MEDIUM — rich_table 프론트엔드 폼 UI 구현 (Mode 1)~~ ✅ STALE (2026-04-12 45차 세션)

> 검증: 전체 스택 구현 완료. (1) ResultSectionFormDialog.tsx:40-41 — SECTION_TYPE_OPTIONS에 'table' 포함, L44-52 frontend↔backend 매핑, (2) VisualTableEditor.tsx — 텍스트/이미지 셀 편집 + 붙여넣기 + 열/행 관리, (3) ResultSectionPreview.tsx:88-132 — rich_table 렌더링 + DocumentImage, (4) Backend CRUD + Export appendRichTable + Zod 검증 + i18n 완비.

### ~~🟡 MEDIUM — ResultSectionsPanel N+1 쿼리 최적화 (Mode 1)~~ ✅ 완료 (2026-04-12 42차 harness Batch A3)

> FE: SelfInspectionTab 에 `expandedId` state + ChevronRight/Down 토글 버튼(aria-expanded + i18n) 추가, `{isExpanded && <ResultSectionsPanel}` 조건부 렌더로 N+1 제거. BE: `renderResultSections` 를 documentId 선수집 → `inArray(documents.id, ids)` batch SELECT → `Promise.allSettled(storage.download)` 병렬 다운로드 → `Map<id, {buffer, ext}>` 조회로 리팩토링. 두 컨트롤러의 CSV upload FileInterceptor 에 `FILE_UPLOAD_LIMITS.CSV_MAX_FILE_SIZE = 1MB` 적용.

<details><summary>원문</summary>

```
FE-W5: SelfInspectionTab에서 모든 점검 카드에 ResultSectionsPanel을 무조건 렌더링.
각 패널이 독립 useQuery를 실행하여 N개 점검 × 1 API 호출 = N+1 문제.

BE-W2: renderResultSections에서 photo/rich_table 이미지 로딩이 sequential.
문서 ID를 미리 수집 → batch WHERE IN 쿼리 + Promise.all 다운로드로 최적화 가능.

작업:
1. SelfInspectionTab: ResultSectionsPanel을 펼치기 토글 뒤에 조건부 렌더 (lazy)
2. renderResultSections: 이미지 documentId 선수집 → batch 조회
3. CSV 업로드 fileSize 제한 추가 (1MB)

검증: pnpm tsc --noEmit + backend build + backend test PASS
```

</details>

### ~~🟢 LOW — ResultSectionsPanel 접근성 + 타입 안전성 개선 (Mode 0)~~ ✅ STALE (2026-04-12 45차 세션)

> 검증: 3건 모두 42차 harness Batch A2/A3에서 이미 수정 완료. (1) ResultSectionsPanel.tsx:216-247 — moveUp/moveDown/editSection/deleteSection aria-label 적용, (2) result-sections.service.ts:100 — `Partial<NewInspectionResultSection>` 사용 중, (3) inspection-result-sections.ts:74 — updatedBy 컬럼 + 인덱스 + JSDoc 완비.

---

---

## 반출입 관리 — 완료 항목 (2026-04-22 81차 정리)

### ~~🔴 CRITICAL — PR-1: FSM SSOT 도입 — `checkout-fsm.ts` + unit tests (Mode 1)~~ ✅

> 완료: checkout-fsm.ts(packages/schemas/src/fsm/), CheckoutAction/NextActor/TransitionRule/NextStepDescriptor 타입, CHECKOUT_TRANSITIONS 전이 테이블(calibration/repair 5단, rental 7단), getNextStep/canPerformAction/computeStepIndex/computeUrgency 공개 API, assertFsmInvariants 불변식 검증, checkout-fsm.test.ts 10개 스냅샷 PASS.

### ~~🔴 CRITICAL — PR-2: Backend FSM 통합 — guard 교체 + audit + cache event (Mode 2)~~ ✅

> 완료: checkouts.service.ts 8개 guard site → canPerformAction() 교체, calculateAvailableActions FSM 기반 재구현, buildNextStep 메서드 + CheckoutWithMeta.nextStep 필드 추가, AuditLogService.create() 전이 8곳 연결, emitAsync 페이로드 nextActor 확장, checkouts.fsm.e2e-spec.ts 신규(valid/invalid 전이 + 권한 + audit_logs 확인).

### ~~🟡 MEDIUM — PR-21: 프론트엔드 구조 수정 — WCAG tablist 위치 + Radix Select 가드 + QUERY_CONFIG SSOT + URL 일원화 (Mode 1)~~ ✅

> 완료(2026-04-22): OutboundCheckoutsTab tablist → tabpanel sibling으로 이동(WCAG 4.1.2), CheckoutsContent.tsx 4개 Select 핸들러 spurious 가드 추가, QUERY_CONFIG.checkout 프리셋 신규 + staleTime 3곳 교체, handlePageChange/handleSubTabChange → filtersToSearchParams 경유 일원화.

### ~~🟠 HIGH — PR-12: 목록 IA 서브탭 + 이중 카운트 헤더 + 빈 상태 3종 (Mode 2)~~ ✅

> 완료(2026-04-24, 89차): backend statuses 복수 필터 이미 지원(0·1번 생략), SUBTAB_STATUS_GROUPS/CheckoutListTabs/서브탭 URL SSOT 이미 구현(3번 생략).
> 신규: CheckoutEmptyState.tsx(variant→아이콘/testid 자동 결정, CHECKOUT_ICON_MAP.emptyState 경유, role=status+aria-live), CHECKOUT_EMPTY_STATE_TOKENS(checkout-empty-state.ts), design-tokens barrel export 추가.
> OutboundCheckoutsTab: emptyStateParams → renderEmptyState() 직접 분기 교체(overdue-clear celebration 분기 제외).
> CheckoutListTabs: currentEquipmentCount prop 추가 + 이중 카운트 배지 "반출 N건 · 장비 M대"(클라이언트 reduce 파생, 백엔드 스키마 변경 없음).
