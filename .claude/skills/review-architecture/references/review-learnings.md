# Review Learnings

리뷰를 통해 축적된 학습 기록입니다. 새로운 패턴, 예외, 안티패턴 발견 시 자동으로 업데이트됩니다.

## Table of Contents

1. [발견된 패턴](#발견된-패턴)
2. [추가된 예외](#추가된-예외)
3. [발견된 안티패턴](#발견된-안티패턴)
4. [업데이트 이력](#업데이트-이력)

---

## 발견된 패턴

리뷰 과정에서 발견된 프로젝트 고유 패턴으로, 체크리스트에 반영된 것들입니다.

<!-- 형식:
### [날짜] 패턴 이름
- **발견 위치**: `file:line`
- **설명**: 패턴 설명
- **체크리스트 반영**: review-checklist.md 섹션 N에 추가됨
-->

### [2026-03-21] Zod v4 UUID SSOT 유틸리티 (`uuidString`)
- **발견 위치**: `packages/schemas/src/utils/fields.ts`
- **설명**: Zod v4의 `z.string().uuid()`는 RFC 9562 버전/변형 니블을 엄격 검증하여 개발 시드 UUID(`00000000-0000-0000-0000-000000000002`)를 거부. `uuidString()` SSOT 유틸리티를 생성하고 프로젝트 전체(schemas 10파일 + backend DTO 16파일 + frontend 1파일)를 마이그레이션.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — 2회 이상 발견 시 review-checklist.md 섹션 6에 승격

### [2026-03-21] 모듈 로드 시점 SSOT 교차 검증 패턴
- **발견 위치**: `apps/backend/src/modules/notifications/events/notification-events.ts:113-122`
- **설명**: SSOT enum 배열(`NOTIFICATION_TYPE_VALUES`)과 런타임 변환 결과(`EVENT_TO_NOTIFICATION_TYPE`)의 정합성을 모듈 로드 시점에 `for..of` 루프로 교차 검증. 불일치 시 서버 시작 에러 발생 → CI에서 사전 탐지. 단순 변환 함수보다 견고한 SSOT 보장 패턴.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — 2회 이상 발견 시 review-checklist.md 섹션 1에 승격

---

## 추가된 예외

리뷰에서 처음에 이슈로 탐지되었으나, 의도된 설계임이 확인되어 예외로 등록된 케이스입니다.

<!-- 형식:
### [날짜] 예외 이름
- **최초 탐지**: 어떤 Step에서 무엇이 경고되었는지
- **예외 사유**: 왜 이것이 위반이 아닌지
- **SKILL.md 반영**: Exceptions 섹션에 추가됨
-->

(아직 기록 없음)

---

## 발견된 안티패턴

리뷰에서 반복적으로 발견되어 체크리스트에 명시적으로 추가된 안티패턴입니다.

<!-- 형식:
### [날짜] 안티패턴 이름
- **발견 빈도**: N회 (도메인: xxx, yyy)
- **설명**: 구체적 안티패턴
- **체크리스트 반영**: review-checklist.md 섹션 N에 추가됨
-->

### [2026-03-21] RBAC scope JOIN 유형 선택 (INNER vs LEFT)
- **발견 위치**: `apps/backend/src/modules/reports/reports.service.ts` 전체
- **설명**: RBAC scope 조건이 equipment 테이블 컬럼(`siteCode`, `teamId`)을 통해 적용되는 경우, `LEFT JOIN`은 NULL 행이 scope 조건을 우회할 수 있으므로 `INNER JOIN` 사용이 올바름. 단, equipment 기준 쿼리(활용률 등)에서 반출 없는 장비도 0%로 표시하려면 `LEFT JOIN`이 의도적. 또한 `teamsTable` JOIN은 팀 미배정 장비 표시를 위해 항상 `LEFT JOIN`.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 5 안티패턴 표

### [2026-03-21] COUNT(DISTINCT) + fan-out JOIN
- **발견 위치**: `apps/backend/src/modules/reports/reports.service.ts:153,296,308,1000`
- **설명**: checkouts → checkoutItems 다:1 관계에서 `count(checkoutsTable.id)`만 사용하면 item 수만큼 카운트 뻥튀기. `COUNT(DISTINCT checkoutsTable.id)` 필수. 활용률 쿼리에서도 `COALESCE(COUNT(DISTINCT ...), 0)` 패턴 사용.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 5 안티패턴 표

### [2026-03-21] Zod v4 `z.string().uuid()` 직접 사용
- **발견 빈도**: 1회 (frontend: IncidentHistoryTab.tsx) — 마이그레이션 누락
- **설명**: `z.string().uuid()` 직접 호출은 Zod v4에서 시드 UUID를 거부함. 반드시 `uuidString()` SSOT 유틸리티 사용 필요.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-21] SSOT enum↔변환 불일치 (런타임 미탐지)
- **발견 빈도**: 1회 (notifications: eventName→type camelCase 불일치)
- **설명**: 이벤트명→DB type 변환 결과가 SSOT enum에 없어도 런타임 에러가 발생하지 않던 문제. 배치 삽입이 Zod 검증을 우회하므로 불일치가 DB에 잘못된 값으로 저장됨. 모듈 로드 시점 교차 검증으로 해결.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-21] CAS 선점 순서 — 작업보다 CAS 체크가 먼저
- **발견 빈도**: 1회 (equipment: approveRequest)
- **설명**: `approveRequest`에서 장비 create/update/delete 작업이 CAS 체크(version WHERE) **이전에** 실행되어, 동시 승인 시 장비 중복 생성 가능. CAS 선점(요청 상태 업데이트)을 장비 작업 이전으로 이동하여 해결. `initiateReturn()`과 동일한 "CAS 선점 → 작업 → 보상" 패턴.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 2 "트랜잭션 경계"

### [2026-03-21] DB nullable → DTO optional 정규화 (null → undefined)
- **발견 빈도**: 1회 (auth: toAuthUser)
- **설명**: DB varchar nullable 컬럼은 `string | null`을 반환하지만, DTO/JWT 타입은 `string | undefined`를 기대. `teamId`만 `?? undefined`가 적용되고 `department`, `position`, `site`는 누락. JWT payload에 `null`이 들어가면 JSON 직렬화에서 `undefined`와 다르게 동작하여 `=== undefined` 체크 실패.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-21] Mutation 네비게이션 전 캐시 무효화 필수 (Navigate-Before-Invalidate 안티패턴)
- **발견 빈도**: 1회 (시스템 전반 — 9개 파일에서 동시 발견)
- **설명**: `useMutation`의 `onSuccess`에서 `router.push()`로 네비게이션한 뒤, `onSettled`에서 캐시를 무효화하면 대상 페이지에서 stale 데이터가 표시됨. 특히 STATIC 프리셋(`refetchOnMount: false`)에서 심각. `useFormSubmission` 훅의 패턴(invalidation → navigation in onSuccess)이 올바른 참조 구현. `useOptimisticMutation`에는 `onSettledCallback` 옵션을 추가하여 캐시 무효화 완료 후 네비게이션 실행 보장.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 3 #4 + 섹션 7 "Mutation 라이프사이클" (조기 승격: 9개 파일 동시 발견)

### [2026-03-22] Stale CAS 버전 사용 — extractVersion(originalData) 우선 패턴
- **발견 빈도**: 2회 (1차: 전체 카테고리 extractVersion 우선, 2차: equipment 카테고리 version 미전송)
- **설명**: 승인/반려 리스트 페이지에서 `extractVersion(originalData)`로 리스트 캐시의 CAS 버전을 우선 사용하면, 다단계 승인(3-step 교정계획서 등)에서 각 단계마다 casVersion이 증가하지만 리스트 캐시는 stale 값을 보유하여 VERSION_CONFLICT 발생. 또한 equipment 카테고리는 apiClient 직접 호출로 version 자체를 전송하지 않아 400 에러 발생. 상태 전이 액션(사용자 편집 데이터 없음)에서는 항상 최신 detail을 조회해야 함.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 2 "Frontend 계층" (2회 발견)

### [2026-03-22] aliasedTable 패턴 — 동일 테이블 다중 FK JOIN
- **발견 빈도**: 1회 (calibration: findPendingApprovals)
- **설명**: users 테이블을 registeredBy/approvedBy 두 FK로 동시 JOIN 시 `aliasedTable(schema.users, 'registrar')` 패턴 사용. Drizzle ORM에서 동일 테이블을 서로 다른 alias로 참조하여 SELECT/WHERE에서 구분. 프로젝트 최초 도입 사례.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-22] 클라이언트 네비게이션 중 Radix Select spurious onValueChange
- **발견 빈도**: 1회 (equipment: EquipmentFilters.tsx teamId Select)
- **설명**: Next.js App Router 클라이언트 라우팅 중 `useSearchParams()`가 일시적으로 이전 페이지(대시보드)의 빈 params를 반영 → `filters.teamId = ''` → Select의 `value`가 `_all`로 변경 → `onValueChange` 발생 → `updateURL({ teamId: '' })` → `teamId=_all` 설정 → 서버 리다이렉트가 `_all`을 "명시적 전체 선택"으로 인식하여 보정하지 않음. 두 계층 수정으로 해결: (1) `updateURL`에서 teamId "명시적 변경 vs 보존" 분기, (2) Select `onValueChange`에 중복 값 가드.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 7 "URL-driven 필터" (조기 승격: App Router 근본 이슈)

### [2026-03-22] 대시보드 카운트 vs 장비 목록 불일치 — 데이터 소스 불일치
- **발견 빈도**: 2회 (1차: activeCheckouts checkout 테이블 기반, 2차: overdueCalibrationCount 교정 테이블 기반)
- **설명**: 대시보드 KPI/AlertBanner 카운트가 다른 테이블(checkouts, calibrations)에서 집계되지만, 클릭 후 장비 목록은 `equipment.status` 기반 필터링. 카운트 소스와 목록 필터가 다른 테이블을 참조하여 불일치 발생. `equipmentStatusStats` (equipment.status GROUP BY)를 SSOT로 통일하여 해결.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 1 + 섹션 3 #5 (2회 발견)

### [2026-03-22] Pending 승인 목록 엔드포인트의 @SiteScoped 누락
- **발견 빈도**: 1회 (calibration, software 2개 모듈 동시)
- **설명**: `findAll()`에는 `@SiteScoped`가 적용되어 있지만, `GET /pending` 엔드포인트에는 누락되어 전 사이트/팀의 승인 대기 건이 노출. 사용자가 승인 시도 시 `enforceSiteAccess`에서 403 거부. 목록 단계에서 필터하지 않으면 사용자가 승인 불가 항목을 보게 되어 혼란 유발.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 4 "보안 계층" (조기 승격: 2개 모듈 동시 + 보안 영향)

### [2026-03-30] API 클라이언트 DTO 타입에 version 필드 누락 + as unknown as 캐스팅 우회
- **발견 위치**: `apps/frontend/lib/api/equipment-import-api.ts:147-155`, `ReceiveEquipmentImportForm.tsx:114`
- **설명**: 백엔드 Zod 스키마에 `...versionedSchema`가 추가되었지만, 프론트엔드 API 클라이언트 인터페이스(`ReceiveEquipmentImportDto`)에 `version: number`가 누락됨. 컴포넌트에서 `Record<string, unknown>`으로 payload를 구성한 뒤 `as unknown as ReceiveEquipmentImportDto`로 타입 우회. TypeScript가 version 누락을 탐지하지 못함.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — 2회 이상 발견 시 review-checklist.md 섹션 1 "계층 관통 추적" 항목으로 승격

### [2026-03-30] MULTER_UTF8_OPTIONS 일관성 — FilesInterceptor 적용 누락
- **발견 위치**: `apps/backend/src/modules/equipment-imports/equipment-imports.controller.ts:160`
- **설명**: `MULTER_UTF8_OPTIONS`를 특정 컨트롤러에만 적용하고 다른 컨트롤러를 누락하면, busboy가 기본값(latin1)으로 파일명을 디코딩하여 한국어 파일명이 mojibake로 DB에 영구 저장됨. `FileUploadService`에서 `file.originalname`을 직접 사용하므로 MULTER_UTF8_OPTIONS 미적용 시 복구 불가.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — 2회 이상 발견 시 섹션 4 "보안/인프라 계층"에 승격

### [2026-03-30] Stale CAS 버전 사용 — ReceiveEquipmentImportForm (3차 재발)
- **발견 위치**: `apps/frontend/components/equipment-imports/ReceiveEquipmentImportForm.tsx:115`
- **설명**: 같은 도메인의 `EquipmentImportDetail`은 모든 mutation에서 fresh fetch 패턴을 사용하지만, `ReceiveEquipmentImportForm`만 `equipmentImport!.version` (캐시 stale 버전) 사용. 이미 승격 완료된 안티패턴의 3번째 재발.
- **체크리스트 반영**: ✅ 승격 완료 (이미 섹션 2 "Frontend 계층"에 등재) — 재발 빈도 +1 기록

### [2026-03-30] photoThumbnails queryKey에 photoIds 미포함 — 파생 쿼리 stale 문제
- **발견 위치**: `apps/frontend/components/equipment/BasicInfoTab.tsx:99`, `lib/api/query-config.ts:394`
- **설명**: `queryKey`가 `equipmentId`만 포함하고 실제 의존성(`photos` 배열)을 미포함. 사진 추가/삭제 후 동일 `equipmentId`에 대해 캐시가 유효하다고 판단하여 새 사진 썸네일이 표시되지 않음. `photos.map(p => p.id).join(',')`을 queryKey에 포함하여 해결. **파생 쿼리(다른 쿼리 결과에 의존하는 쿼리)는 의존 데이터를 queryKey에 반영해야 함**.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — 2회 이상 발견 시 섹션 7 "프론트엔드 상태 아키텍처"에 승격

### [2026-03-25] 비-UUID actorId가 uuid 컬럼에 도달하는 Anti-Corruption Layer 부재
- **발견 빈도**: 1회 (notifications: 3개 스케줄러 × 5 emit 사이트)
- **설명**: 스케줄러가 `actorId: 'system'` 매직 스트링을 전달 → 디스패처가 그대로 DB uuid 컬럼에 INSERT → PostgreSQL 타입 에러 → 벌크 INSERT 전체 실패. SSOT 상수(`NOTIFICATION_CONFIG.SYSTEM_ACTOR_ID`)로 매직 스트링 제거 + 디스패처에 `normalizeActorForDb()` Anti-Corruption Layer 추가하여 해결. UUID 정규식으로 미래 비-UUID 입력도 방어.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-22] NC 유형별 전제조건 하드코딩 — requiresRepair 단일 함수 한계
- **발견 빈도**: 1회 (non-conformances, approvals, NCDetailClient 3곳 동시)
- **설명**: `requiresRepair()`가 damage/malfunction만 처리하여 calibration_overdue의 재교정 전제조건이 누락. `NC_CORRECTION_PREREQUISITES` SSOT 레지스트리로 유형별 전제조건(repair/recalibration/null)을 중앙 관리하도록 개선. 백엔드 `validateCorrectionPrerequisite()` + 프론트엔드 `getNCPrerequisite()` + 승인 카운트 쿼리까지 전 계층 적용.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-22] 교정 승인 시 NC 종결 워크플로우 바이패스 — 장비 상태 즉시 복원
- **발견 빈도**: 1회 (calibration.service.ts: markCalibrationOverdueAsCorrected)
- **설명**: 교정 승인 시 NC를 corrected로 변경하면서 장비를 동시에 available로 복원하여, NC의 3단계 워크플로우(open→corrected→closed)를 우회. 종결 반려 시 장비 available + NC open 상태 불일치 발생. 장비 상태 복원을 close() 메서드의 기존 로직(다른 열린 부적합 확인)에 위임하도록 수정.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-30] mapBackendErrorCode 에러 코드 매핑 누락 — 새 서비스 에러 코드 미매핑
- **발견 빈도**: 3회 (1차: IMPORT_ONLY_* 등 9개 / 2차: IMPORT_END_DATE_BEFORE_START / 3차: MIGRATION_* 5개 — 모두 2026-03-30~31)
- **설명**: 백엔드 서비스에 새 에러 코드(BadRequestException with custom `code`)를 추가할 때 프론트엔드 `mapBackendErrorCode`에 매핑을 추가하지 않는 패턴. 사용자에게 "알 수 없는 오류" 표시됨. 신규 모듈 구현 완료 후 에러 코드 매핑 동시 추가가 관행으로 정착해야 함.
- **체크리스트 반영**: ✅ 섹션 8 "에러 전파 체인"에 이미 등재됨 — 재발 빈도 +1 (3차)

### [2026-03-30] completeReturn() equipment UPDATE에 CAS version 조건 누락
- **발견 빈도**: 1회 (equipment-imports.service.ts: completeReturn)
- **설명**: `completeReturn()` 내 equipment 테이블 UPDATE WHERE 절에 `eq(equipment.version, ?)` 조건이 없어, 동시에 진행된 다른 equipment 상태 변경이 탐지 없이 덮어써짐. 같은 파일의 importResult CAS 패턴은 올바른데 equipment UPDATE만 누락됨.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-30] CAS 선점 후 보상 불완전 — 후속 작업 실패 시 import 상태 미복원
- **발견 빈도**: 1회 (equipment-imports.service.ts: initiateReturn)
- **설명**: CAS 선점으로 import 상태를 `RETURN_REQUESTED`로 전환 후 `equipmentService.updateStatus()` 또는 `checkoutsService.create()` 실패 시 보상 코드가 불완전. 장비 상태는 롤백되지만 import 상태는 복원 안 됨. 기존 "CAS 선점 순서" 안티패턴(2026-03-21)의 보상 코드 누락 변형.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — 2026-03-21 "CAS 선점 순서" 패턴과 연관

### [2026-03-30] checkouts activeStatuses에 OVERDUE 미포함
- **발견 빈도**: 1회 (checkouts.service.ts: create, activeStatuses 배열)
- **설명**: 중복 반출 방지 배열(`activeStatuses`)에 `OVERDUE`(기한 초과) 상태가 누락됨. 기한 초과 장비는 여전히 반출 진행 중이므로 포함되어야 함.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-31] `@SkipThrottle()` 기본값 — Named Throttler 무효화 버그
- **발견 위치**: `apps/backend/src/modules/notifications/sse/notification-sse.controller.ts`, `metrics.controller.ts`, `monitoring.controller.ts`, `dashboard.controller.ts`
- **설명**: `@nestjs/throttler` v6에서 `@SkipThrottle()`의 기본값은 `{ default: true }`이지만, named throttler(`short`, `medium`, `long`) 사용 시 guard는 `THROTTLER:SKIP+short` 메타데이터를 확인하므로 실제로 Skip이 적용되지 않음. SSE 엔드포인트에 429 폭탄 유발. `throttle.constants.ts`에 `SKIP_ALL_THROTTLES = Object.fromEntries(THROTTLER_CONFIGS.map(c => [c.name, true]))` SSOT 추가로 해결.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — Named throttler 추가 시 `SKIP_ALL_THROTTLES`도 자동 갱신되는 SSOT 패턴

### [2026-03-31] apiClient 이중 언래핑 — `response.data.data`
- **발견 위치**: `apps/frontend/lib/api/data-migration-api.ts:67,85`
- **설명**: `apiClient` axios interceptor가 `{ success, data }` 래퍼를 자동으로 벗겨내어 `response.data`가 이미 실제 페이로드. `apiClient.post<{ data: T }>(...).data.data` 패턴은 항상 `undefined` 반환. 제네릭 타입을 `apiClient.post<T>(...)`로 변경하고 `.data`만 반환해야 함.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 7 "API 클라이언트 패턴"

### [2026-03-31] 트랜잭션 내 서비스 메서드 — 외부 `this.db` 커넥션 사용
- **발견 위치**: `apps/backend/src/modules/equipment/services/equipment-approval.service.ts:442`
- **설명**: `db.transaction(async (tx) => { ... await equipmentService.create(...) })` 패턴에서 `equipmentService.create()`는 `this.db`(별도 커넥션)를 사용. tx 롤백 시 `create()` 내 변경사항은 이미 커밋됨 → 요청 상태는 PENDING으로 복원되지만 장비 레코드는 DB에 남아 관리번호 중복 에러 발생. 서비스 메서드에 `externalTx?: AppDatabase` 파라미터를 추가하여 외부 tx 컨텍스트 전달.
- **체크리스트 반영**: ✅ 승격 완료 — review-checklist.md 섹션 2 "트랜잭션 경계" (2회 이상: equipment-imports + equipment-approval)
- **재발 [2026-03-31]**: `createLocationHistoryInternal()`에서 `tx` 파라미터가 커밋 #52에서 제거됨 → 트랜잭션 내 3곳(equipment.service.ts:683, :1135 / data-migration.service.ts:201)에서 `this.db`로 위치 이력 INSERT → All-or-Nothing 의도 무효화. `tx?: AppDatabase` 파라미터 복원 후 `executor = tx ?? this.db` 패턴으로 수정.

### [2026-03-30] 트랜잭션 내 외부 커넥션 쿼리
- **발견 빈도**: 1회 (equipment-imports.service.ts: receive → generateUniqueTemporaryNumber)
- **설명**: 트랜잭션 내부에서 `this.db`(별도 커넥션)로 DB를 조회하면, 트랜잭션 외부에서 동일 값을 선택한 뒤 두 tx가 모두 진행하여 UNIQUE 제약 위반 발생. tx 파라미터를 유틸리티 함수에 전달하거나 생성 로직을 tx 외부로 이동해야 함.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-03-31] `@Query()` 파라미터 string→number 미변환 — CAS 항상 실패
- **발견 위치**: `apps/backend/src/modules/equipment/equipment.controller.ts:370`
- **설명**: NestJS `@Query('version') version: number | undefined`는 TypeScript 타입 선언이지만 런타임에서는 쿼리 파라미터가 항상 **string**으로 전달됨. 타입 변환 없이 `equipmentService.remove(uuid, version)`을 호출하면 Drizzle ORM의 `eq(equipment.version, "3")`에서 타입 불일치로 WHERE 절이 매칭되지 않아 CAS가 항상 실패(409 VERSION_CONFLICT). `@Query('version') versionStr: string | undefined` + `parseInt(versionStr, 10)` 변환 패턴으로 수정. **참조**: `equipment-history.controller.ts:145-153`에 올바른 패턴 존재.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — 2회 이상 발견 시 섹션 2 "CAS 계층 일관성" 또는 섹션 4에 승격

### [2026-03-31] `deleteByPrefix()` void 반환 — `Promise<unknown>[]` 배열에 push 금지
- **발견 위치**: `apps/backend/src/modules/data-migration/services/data-migration.service.ts`
- **설명**: `SimpleCacheService.deleteByPrefix()`는 `void`를 반환하지만 `RedisCacheService.deleteByPrefix()`는 `Promise<void>`를 반환. 인터페이스 `deleteByPrefix(prefix: string): void | Promise<void>`. `void`를 `Promise<unknown>[]` 배열에 `push()`하면 TypeScript 에러 TS2345 발생. 패턴: `await Promise.all(invalidations)` 완료 후 `deleteByPrefix()` 를 별도 동기 호출로 분리.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-04-17] alias 역색인 Map 충돌 — 동일 alias 두 ColumnMappingEntry 중복 등록
- **발견 위치**: `apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts:350, 356`
- **설명**: `buildAliasIndex()`는 `Map.set()`을 사용하므로 동일 alias는 나중에 등록된 항목이 이전 항목을 덮어씀. `technicalManager`(직접 DB 컬럼 매핑)와 `managerName`(FK 해석 가상 필드)이 모두 `'운영책임자(정)'` alias를 보유하여, Excel 파서가 해당 헤더를 항상 `managerName` FK 경로로만 라우팅하게 됨. 의도가 불분명할 경우 alias 중복이 조용히 경로를 바꿔 버그로 이어짐.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — 2회 이상 발견 시 review-checklist.md 섹션 6 "모듈 패턴 일관성" 또는 섹션 1에 승격

### [2026-03-31] `readonly const` 배열 `as [string, ...string[]]` 직접 캐스팅 실패
- **발견 위치**: `apps/backend/src/modules/data-migration/services/history-validator.service.ts:21,28`
- **설명**: `packages/schemas`의 SSOT enum 배열(`REPAIR_RESULT_VALUES`, `INCIDENT_TYPE_VALUES`)은 `readonly [...]` 타입. Zod `z.enum(VALUES as [string, ...string[]])`로 직접 캐스팅하면 `readonly` → mutable 변환 불가 에러(TS2352). `[...VALUES] as [string, ...string[]]` (spread로 mutable 복사 후 캐스팅) 패턴으로 해결.
- **체크리스트 반영**: ⏳ 관찰 중 (1회)

### [2026-04-18] EventEmitter2 emitAsync 위치 — 컨트롤러 금지, 서비스 전용 ✅ 해소
- **발견 위치**: `apps/backend/src/modules/non-conformances/non-conformances.controller.ts:391,429`
- **설명**: 프로젝트 전체에서 `EventEmitter2.emitAsync`는 서비스 계층에서만 발행(`checkouts.service.ts` 등). 컨트롤러에 직접 주입하면 도메인 이벤트 발행 위치가 분산되어 찾기 어려워짐. 컨트롤러는 HTTP 매핑, 서비스는 도메인 이벤트 발행 책임.
- **체크리스트 반영**: ✅ 해소 — ESLint `no-restricted-syntax` 빌드 타임 차단 추가 + NonConformancesService에 uploadAttachment/deleteAttachment 신설로 이관 완료

### [2026-04-18] async onSuccessCallback reject → onError 재진입 — 에러 격리 필요 ✅ 해소
- **발견 위치**: `apps/frontend/hooks/use-optimistic-mutation.ts:302`
- **설명**: `await onSuccessCallback?.()` 패턴에서 callback이 throw하면 TanStack Query가 mutation error로 재처리 → `onError` 재실행 → 성공 토스트 + 에러 토스트 중복 표시. `Promise.allSettled` 사용처는 throw 안 하지만 `invalidateQueries` 실패 등 예외 경로는 위험. callback 에러를 try/catch로 격리해야 함.
- **체크리스트 반영**: ✅ 해소 — `safeCallback` 헬퍼 신설로 use-optimistic-mutation/use-mutation-with-refresh 양쪽 모두 에러 격리

### [2026-04-14] AuditLogUserRole 확장 소비처 미갱신 — 'system'/'unknown' 라벨 누락
- **발견 위치**: `audit.service.ts:417`, `reports.service.ts:1039`, `messages/ko|en/common.json userRoles`
- **설명**: `AuditLogUserRole = UserRole | 'system' | 'unknown'` 타입을 소비하는 3개 계층에서 'system'/'unknown' 특수 값을 처리하지 않아 영문 원문이 그대로 노출됨. (1) 백엔드 `USER_ROLE_LABELS[role as UserRole]`는 'system'/'unknown'에 대해 `undefined` 반환 후 fallback으로 원문 반환. (2) frontend i18n `userRoles.system` 키 미등록. 수정: 백엔드는 'system'/'unknown' 분기를 `as UserRole` 이전에 추가, frontend i18n에 키 추가.
- **체크리스트 반영**: ⏳ 관찰 중 (1회) — 2회 이상 발견 시 섹션 6 "모듈 패턴 일관성" 또는 섹션 1 "계층 관통 추적"에 승격

---

## 아카이브

3개월 이상 미재발 + 20개 초과 시 오래된 순으로 이동되는 항목입니다.

(아직 기록 없음)

---

## 업데이트 이력

| 날짜 | 유형 | 설명 | 반영 파일 |
|---|---|---|---|
| (초기화) | - | 학습 기록 시스템 초기화 | review-learnings.md |
| 2026-03-21 | 새 패턴 | Zod v4 UUID SSOT `uuidString()` 마이그레이션 | review-learnings.md |
| 2026-03-21 | 안티패턴 | `z.string().uuid()` 직접 사용 → 시드 UUID 실패 | review-learnings.md |
| 2026-03-21 | 새 패턴 | 모듈 로드 시점 SSOT 교차 검증 (enum↔변환 결과) | review-learnings.md |
| 2026-03-21 | 안티패턴 | SSOT enum↔변환 불일치 런타임 미탐지 | review-learnings.md |
| 2026-03-21 | 새 패턴 | RBAC scope JOIN 유형 선택 (INNER vs LEFT) | review-learnings.md |
| 2026-03-21 | 새 패턴 | COUNT(DISTINCT) + fan-out JOIN 필수 | review-learnings.md |
| 2026-03-21 | 안티패턴 | CAS 선점 순서 — 작업보다 CAS 체크가 먼저 | review-learnings.md |
| 2026-03-21 | 안티패턴 | DB nullable → DTO optional 정규화 누락 | review-learnings.md |
| 2026-03-21 | 안티패턴 | Mutation Navigate-Before-Invalidate (9개 파일) | review-learnings.md |
| 2026-03-22 | 안티패턴 | Stale CAS 버전 사용 — extractVersion(originalData) 우선 패턴 | review-learnings.md |
| 2026-03-22 | 새 패턴 | aliasedTable — 동일 테이블 다중 FK JOIN (calibration) | review-learnings.md |
| 2026-03-22 | 안티패턴 | Pending 승인 목록 @SiteScoped 누락 (calibration, software) | review-learnings.md |
| 2026-03-22 | 새 패턴 | NC 유형별 전제조건 SSOT (`NC_CORRECTION_PREREQUISITES`) 도입 | review-learnings.md |
| 2026-03-22 | 안티패턴 | 교정 승인 시 NC 종결 워크플로우 바이패스 (장비 즉시 복원) | review-learnings.md |
| 2026-03-22 | 안티패턴 | 클라이언트 네비게이션 중 Radix Select spurious onValueChange | review-learnings.md |
| 2026-03-22 | 안티패턴 | 대시보드 카운트 vs 장비 목록 retired/disposed 불일치 | review-learnings.md |
| 2026-03-23 | 체계 개선 | learnings↔checklist SSOT 동기화 — 승격 상태 일괄 갱신 | review-learnings.md |
| 2026-03-23 | 체크리스트 보강 | 섹션 2: 트랜잭션 경계 + CAS 선점 순서 추가 | review-checklist.md |
| 2026-03-23 | 체크리스트 보강 | 섹션 3: Navigate-Before-Invalidate + 카운트↔목록 소스 일치 | review-checklist.md |
| 2026-03-23 | 체크리스트 보강 | 섹션 4: Pending 목록 @SiteScoped 확인 | review-checklist.md |
| 2026-03-24 | 새 패턴 | getLatestCasVersion() — 다단계 승인 Stale CAS 해결 (mutationFn 내 fresh fetch) | review-learnings.md |
| 2026-03-24 | 새 패턴 | enforceFactorAccess — equipment 경유 사이트 접근 제어 (approve/reject/delete) | review-learnings.md |
| 2026-03-24 | 새 패턴 | needsEquipmentJoin 조건부 JOIN — site/teamId 필터 시에만 JOIN 수행 (성능) | review-learnings.md |
| 2026-03-24 | 검증 결과 | correlated subquery → JOIN 전환 후 COUNT fan-out 없음 확인 (N:1 관계) | review-learnings.md |
| 2026-03-24 | 검증 결과 | calibration-factors 반려 approvedBy 패턴 통일 — pending에서 null이므로 미포함으로 유지 | review-learnings.md |
| 2026-03-23 | 체크리스트 보강 | 섹션 7: Mutation 라이프사이클 + URL-driven 필터 호환성 | review-checklist.md |
| 2026-03-23 | 정책 추가 | learnings 아카이브 정책 (3개월/20개 초과 시) | SKILL.md Step 9d |
| 2026-03-25 | 안티패턴 | 비-UUID actorId → uuid 컬럼 도달 (Anti-Corruption Layer 부재) | review-learnings.md |
| 2026-03-27 | 메타 검증 | 상태 표기 3종 통일(⏳/✅/📦), 아카이브 섹션 생성, Step 4 실행 보장 강화 | SKILL.md + review-learnings.md |
| 2026-03-30 | 안티패턴 | API 클라이언트 DTO 타입에 version 누락 + as unknown as 우회 (receive DTO) | review-learnings.md |
| 2026-03-30 | 수정 완료 | CAS 선점 보상 불완전 → initiateReturn() 2단계 완전 보상 패턴 적용 | equipment-imports.service.ts |
| 2026-03-30 | 수정 완료 | completeReturn() equipment UPDATE CAS version 조건 추가 (tx 내 현재 버전 조회) | equipment-imports.service.ts |
| 2026-03-30 | 수정 완료 | generateUniqueTemporaryNumber() tx 파라미터 추가 — race condition 해소 | equipment-imports.service.ts |
| 2026-03-30 | 수정 완료 | 5개 인라인 deleteByPattern → CacheInvalidationHelper 2개 메서드로 SSOT 통합 | cache-invalidation.helper.ts |
| 2026-03-31 | 안티패턴 | `@SkipThrottle()` 기본값이 named throttler와 불일치 (v6 버그) → SSOT `SKIP_ALL_THROTTLES` | review-learnings.md |
| 2026-03-31 | 안티패턴 | apiClient 이중 언래핑 — `response.data.data` → `response.data` (마이그레이션 API) | review-learnings.md |
| 2026-03-31 | 안티패턴 | `create()` 외부 tx 컨텍스트에서 `this.db` 별도 커넥션 사용 — 롤백 불가 (approval) | review-learnings.md |
| 2026-03-31 | 수정 완료 | `EquipmentService.create()` externalTx 파라미터 추가 — approval tx 원자성 보장 | equipment.service.ts |
| 2026-03-31 | 수정 완료 | `CreateEquipmentContent` router.push 전 명시적 invalidateQueries 추가 (3곳) | CreateEquipmentContent.tsx |
| 2026-03-31 | 수정 완료 | `data-migration-api.ts` apiClient 이중 언래핑 수정 + Site 타입 SSOT 적용 | data-migration-api.ts |
| 2026-03-30 | 수정 완료 | checkouts activeStatuses OVERDUE 추가 — 기한 초과 장비 중복 반출 방지 | checkouts.service.ts |
| 2026-03-30 | 수정 완료 | calibration NC 종결 if(updated && calibrationId) → if(calibrationId) — 과거 이력 승인 시 NC 종결 보장 | calibration.service.ts |
| 2026-03-30 | 수정 완료 | baseImportSchema .refine() 추가 — Zod 레벨 날짜 순서 검증 | create-equipment-import.dto.ts |
| 2026-03-30 | 수정 완료 | mapBackendErrorCode IMPORT_END_DATE_BEFORE_START 매핑 추가 | equipment-errors.ts |
| 2026-03-30 | 수정 완료 | CreateEquipmentImportForm onSuccess approval counts 무효화 추가 | CreateEquipmentImportForm.tsx |
| 2026-03-30 | 수정 완료 | QUERY_CONFIG.APPROVAL_COUNTS 프리셋 추가 → DashboardShell 하드코딩 제거 | query-config.ts + DashboardShell.tsx |
| 2026-03-30 | 재발 확인 | CAS 선점 순서 안티패턴 — equipment-imports.service.receive()에서 재발 | review-learnings.md |
| 2026-03-30 | 안티패턴 | MULTER_UTF8_OPTIONS 누락 (equipment-imports.controller.ts receive 엔드포인트) | review-learnings.md |
| 2026-03-30 | 재발 확인 (3차) | Stale CAS 버전 사용 — ReceiveEquipmentImportForm (이미 승격 완료 패턴) | review-learnings.md |
| 2026-03-30 | 안티패턴 | photoThumbnails queryKey에 photoIds 미포함 — 파생 쿼리 stale | review-learnings.md |
| 2026-03-30 | 에러 매핑 누락 | mapBackendErrorCode에 IMPORT_ONLY_* 등 9개 에러 코드 미매핑 추가 | review-learnings.md |
| 2026-03-30 | 재발 (2차) | mapBackendErrorCode 누락 — IMPORT_END_DATE_BEFORE_START (새 서비스 에러 코드 매핑 미추가) | review-learnings.md |
| 2026-03-30 | 안티패턴 | completeReturn() equipment UPDATE에 CAS version 조건 누락 | review-learnings.md |
| 2026-03-30 | 안티패턴 | CAS 선점 후 보상 불완전 — initiateReturn checkout 실패 시 import 상태 미복원 | review-learnings.md |
| 2026-03-30 | 안티패턴 | checkouts activeStatuses에 OVERDUE 미포함 — 기한 초과 장비 중복 반출 허용 | review-learnings.md |
| 2026-03-30 | 안티패턴 | tx 내 외부 커넥션 쿼리 — generateUniqueTemporaryNumber가 트랜잭션 외부 DB 사용 | review-learnings.md |
| 2026-03-31 | 재발 (3차) | mapBackendErrorCode 누락 — MIGRATION_* 5개 에러 코드 미매핑 (data-migration 신규 모듈) | equipment-errors.ts |
| 2026-03-31 | 수정 완료 | 컨트롤러 라우트 선언 순서 — template 고정경로를 :sessionId 파라미터 경로 앞으로 이동 | data-migration.controller.ts |
| 2026-03-31 | 수정 완료 | execute() All-or-Nothing 트랜잭션 내 try-catch 제거 + 대시보드 캐시 무효화 추가 | data-migration.service.ts |
| 2026-03-31 | 수정 완료 | PreviewStep execute onSuccess에 EquipmentCacheInvalidation + DashboardCacheInvalidation 추가 | PreviewStep.tsx |
| 2026-03-31 | 수정 완료 | PreviewStep execute onError 에러 코드 문자열 파싱 → mapBackendErrorCode + ApiError 패턴 교체 | PreviewStep.tsx |
| 2026-03-31 | 수정 완료 | page.tsx 서버 사이드 system_admin 역할 체크 + redirect('/dashboard') 추가 | data-migration/page.tsx |
| 2026-03-31 | 수정 완료 | assignManagementNumbers classificationCode WHERE 조건 추가 — 분류별 독립 serial 보장 | migration-validator.service.ts |
| 2026-03-31 | **예외 추가** | Next.js 16.1.6 proxy 컨벤션 — `middleware.ts`→`proxy.ts`, `middleware`→`proxy` 함수명 변경은 의도적 설계. `config` 직접 정의 필수(re-export 불가). 이를 이슈로 보고하지 않음 | SKILL.md Exceptions #6 |
| 2026-03-31 | 재발 확인 | `createLocationHistoryInternal` tx 파라미터 제거 → 트랜잭션 원자성 파괴 (3곳) — `tx?` 파라미터 복원으로 수정 | equipment-history.service.ts + 3 callers |
| 2026-03-31 | 안티패턴 | `@Query()` 파라미터 string→number 미변환 — CAS 항상 실패 (`remove()` version 쿼리 파라미터) | equipment.controller.ts |
| 2026-03-31 | 안티패턴 | `deleteByPrefix()` void 반환 → `Promise<unknown>[]` push 금지 — `Promise.all` 완료 후 별도 호출로 분리 | data-migration.service.ts |
| 2026-03-31 | 안티패턴 | readonly SSOT 배열 `as [string, ...string[]]` 직접 캐스팅 실패 → `[...VALUES]` spread 후 캐스팅 | history-validator.service.ts |
| 2026-03-31 | 수정 완료 | executeMultiSheet() 트랜잭션 내 try-catch 제거 (equipment/calibration/repair/incident 4섹션) | data-migration.service.ts |
| 2026-03-31 | 수정 완료 | getErrorReport() — multi-sheet 세션 fallback 추가 (MULTI_SESSION_CACHE_KEY_PREFIX) | data-migration.service.ts |
| 2026-03-31 | 수정 완료 | calibration 캐시 무효화 — executeMultiSheet 완료 후 deleteByPrefix 추가 | data-migration.service.ts |
| 2026-04-17 | 안티패턴 | alias 중복 충돌 — 동일 alias가 두 ColumnMappingEntry에 등록 시 buildAliasIndex Map에서 나중 것이 이김. equipment-column-mapping.ts에서 `운영책임자(정)`이 technicalManager(직접 DB 필드)와 managerName(FK 가상 필드)에 동시 등록됨 | review-learnings.md |
| 2026-04-18 | 안티패턴 | EventEmitter2 emitAsync 컨트롤러 직접 발행 — 서비스 전용 패턴 위반 (non-conformances.controller.ts) | review-learnings.md |
| 2026-04-18 | 안티패턴 | async onSuccessCallback reject → onError 재진입 — try/catch 격리 필요 (use-optimistic-mutation.ts) | review-learnings.md |
