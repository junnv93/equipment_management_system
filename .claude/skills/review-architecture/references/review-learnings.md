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
- **체크리스트 반영**: review-checklist.md 섹션 6에 "UUID 검증 SSOT" 항목 추가 필요

### [2026-03-21] 모듈 로드 시점 SSOT 교차 검증 패턴
- **발견 위치**: `apps/backend/src/modules/notifications/events/notification-events.ts:113-122`
- **설명**: SSOT enum 배열(`NOTIFICATION_TYPE_VALUES`)과 런타임 변환 결과(`EVENT_TO_NOTIFICATION_TYPE`)의 정합성을 모듈 로드 시점에 `for..of` 루프로 교차 검증. 불일치 시 서버 시작 에러 발생 → CI에서 사전 탐지. 단순 변환 함수보다 견고한 SSOT 보장 패턴.
- **체크리스트 반영**: review-checklist.md 섹션 1 "계층 관통 추적"에 "enum↔변환 교차 검증" 항목 추가 고려

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
- **체크리스트 반영**: review-checklist.md 섹션 5 "성능 안티패턴"에 추가 고려

### [2026-03-21] COUNT(DISTINCT) + fan-out JOIN
- **발견 위치**: `apps/backend/src/modules/reports/reports.service.ts:153,296,308,1000`
- **설명**: checkouts → checkoutItems 다:1 관계에서 `count(checkoutsTable.id)`만 사용하면 item 수만큼 카운트 뻥튀기. `COUNT(DISTINCT checkoutsTable.id)` 필수. 활용률 쿼리에서도 `COALESCE(COUNT(DISTINCT ...), 0)` 패턴 사용.
- **체크리스트 반영**: review-checklist.md 섹션 5 "성능 안티패턴"에 추가 고려

### [2026-03-21] Zod v4 `z.string().uuid()` 직접 사용
- **발견 빈도**: 1회 (frontend: IncidentHistoryTab.tsx) — 마이그레이션 누락
- **설명**: `z.string().uuid()` 직접 호출은 Zod v4에서 시드 UUID를 거부함. 반드시 `uuidString()` SSOT 유틸리티 사용 필요.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md에 명시적 항목으로 승격

### [2026-03-21] SSOT enum↔변환 불일치 (런타임 미탐지)
- **발견 빈도**: 1회 (notifications: eventName→type camelCase 불일치)
- **설명**: 이벤트명→DB type 변환 결과가 SSOT enum에 없어도 런타임 에러가 발생하지 않던 문제. 배치 삽입이 Zod 검증을 우회하므로 불일치가 DB에 잘못된 값으로 저장됨. 모듈 로드 시점 교차 검증으로 해결.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md에 명시적 항목으로 승격

### [2026-03-21] CAS 선점 순서 — 작업보다 CAS 체크가 먼저
- **발견 빈도**: 1회 (equipment: approveRequest)
- **설명**: `approveRequest`에서 장비 create/update/delete 작업이 CAS 체크(version WHERE) **이전에** 실행되어, 동시 승인 시 장비 중복 생성 가능. CAS 선점(요청 상태 업데이트)을 장비 작업 이전으로 이동하여 해결. `initiateReturn()`과 동일한 "CAS 선점 → 작업 → 보상" 패턴.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md 섹션 2 "CAS 계층 일관성"에 명시적 항목으로 승격

### [2026-03-21] DB nullable → DTO optional 정규화 (null → undefined)
- **발견 빈도**: 1회 (auth: toAuthUser)
- **설명**: DB varchar nullable 컬럼은 `string | null`을 반환하지만, DTO/JWT 타입은 `string | undefined`를 기대. `teamId`만 `?? undefined`가 적용되고 `department`, `position`, `site`는 누락. JWT payload에 `null`이 들어가면 JSON 직렬화에서 `undefined`와 다르게 동작하여 `=== undefined` 체크 실패.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md 섹션 1 "계층 관통 추적"에 명시적 항목으로 승격

### [2026-03-21] Mutation 네비게이션 전 캐시 무효화 필수 (Navigate-Before-Invalidate 안티패턴)
- **발견 빈도**: 1회 (시스템 전반 — 9개 파일에서 동시 발견)
- **설명**: `useMutation`의 `onSuccess`에서 `router.push()`로 네비게이션한 뒤, `onSettled`에서 캐시를 무효화하면 대상 페이지에서 stale 데이터가 표시됨. 특히 STATIC 프리셋(`refetchOnMount: false`)에서 심각. `useFormSubmission` 훅의 패턴(invalidation → navigation in onSuccess)이 올바른 참조 구현. `useOptimisticMutation`에는 `onSettledCallback` 옵션을 추가하여 캐시 무효화 완료 후 네비게이션 실행 보장.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md 섹션 3 "캐시 코히어런스"에 명시적 항목으로 승격

### [2026-03-22] Stale CAS 버전 사용 — extractVersion(originalData) 우선 패턴
- **발견 빈도**: 2회 (1차: 전체 카테고리 extractVersion 우선, 2차: equipment 카테고리 version 미전송)
- **설명**: 승인/반려 리스트 페이지에서 `extractVersion(originalData)`로 리스트 캐시의 CAS 버전을 우선 사용하면, 다단계 승인(3-step 교정계획서 등)에서 각 단계마다 casVersion이 증가하지만 리스트 캐시는 stale 값을 보유하여 VERSION_CONFLICT 발생. 또한 equipment 카테고리는 apiClient 직접 호출로 version 자체를 전송하지 않아 400 에러 발생. 상태 전이 액션(사용자 편집 데이터 없음)에서는 항상 최신 detail을 조회해야 함.
- **체크리스트 반영**: ✅ 2회 발견 → review-checklist.md 섹션 2 "Frontend 계층"에 명시적 항목으로 승격 완료

### [2026-03-22] aliasedTable 패턴 — 동일 테이블 다중 FK JOIN
- **발견 빈도**: 1회 (calibration: findPendingApprovals)
- **설명**: users 테이블을 registeredBy/approvedBy 두 FK로 동시 JOIN 시 `aliasedTable(schema.users, 'registrar')` 패턴 사용. Drizzle ORM에서 동일 테이블을 서로 다른 alias로 참조하여 SELECT/WHERE에서 구분. 프로젝트 최초 도입 사례.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md 섹션 6 "모듈 간 패턴 일관성"에 참고 패턴으로 추가

### [2026-03-22] 클라이언트 네비게이션 중 Radix Select spurious onValueChange
- **발견 빈도**: 1회 (equipment: EquipmentFilters.tsx teamId Select)
- **설명**: Next.js App Router 클라이언트 라우팅 중 `useSearchParams()`가 일시적으로 이전 페이지(대시보드)의 빈 params를 반영 → `filters.teamId = ''` → Select의 `value`가 `_all`로 변경 → `onValueChange` 발생 → `updateURL({ teamId: '' })` → `teamId=_all` 설정 → 서버 리다이렉트가 `_all`을 "명시적 전체 선택"으로 인식하여 보정하지 않음. 두 계층 수정으로 해결: (1) `updateURL`에서 teamId "명시적 변경 vs 보존" 분기, (2) Select `onValueChange`에 중복 값 가드.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md 섹션 7 "프론트엔드 상태 아키텍처"에 "URL-driven 필터와 Radix Select의 클라이언트 네비게이션 호환성" 항목으로 승격

### [2026-03-22] 대시보드 카운트 vs 장비 목록 불일치 — retired/disposed 제외 누락
- **발견 빈도**: 1회 (dashboard: getSummary, getEquipmentByTeam, getEquipmentStatusStats)
- **설명**: 대시보드 카운트 쿼리가 모든 상태의 장비를 포함하지만, 장비 목록은 `showRetired=false`(기본값)로 retired/disposed를 숨김. 또한 "반출 중" 카운트가 `count(distinct checkouts.id)` (반출 건수)를 사용하여 장비 목록의 `status=checked_out` 장비 건수와 불일치. `DASHBOARD_EXCLUDED_STATUSES` SSOT 상수로 해결.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md 섹션 1 "계층 관통 추적"에 "카운트 쿼리↔목록 쿼리 필터 일치 검증" 항목으로 승격

### [2026-03-22] Pending 승인 목록 엔드포인트의 @SiteScoped 누락
- **발견 빈도**: 1회 (calibration, software 2개 모듈 동시)
- **설명**: `findAll()`에는 `@SiteScoped`가 적용되어 있지만, `GET /pending` 엔드포인트에는 누락되어 전 사이트/팀의 승인 대기 건이 노출. 사용자가 승인 시도 시 `enforceSiteAccess`에서 403 거부. 목록 단계에서 필터하지 않으면 사용자가 승인 불가 항목을 보게 되어 혼란 유발.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md 섹션 4 "보안 계층"에 명시적 항목으로 승격

### [2026-03-22] NC 유형별 전제조건 하드코딩 — requiresRepair 단일 함수 한계
- **발견 빈도**: 1회 (non-conformances, approvals, NCDetailClient 3곳 동시)
- **설명**: `requiresRepair()`가 damage/malfunction만 처리하여 calibration_overdue의 재교정 전제조건이 누락. `NC_CORRECTION_PREREQUISITES` SSOT 레지스트리로 유형별 전제조건(repair/recalibration/null)을 중앙 관리하도록 개선. 백엔드 `validateCorrectionPrerequisite()` + 프론트엔드 `getNCPrerequisite()` + 승인 카운트 쿼리까지 전 계층 적용.
- **체크리스트 반영**: review-checklist.md 섹션 6 "모듈 간 패턴 일관성"에 "NC 유형별 전제조건은 NC_CORRECTION_PREREQUISITES SSOT 참조" 항목 추가 고려

### [2026-03-22] 교정 승인 시 NC 종결 워크플로우 바이패스 — 장비 상태 즉시 복원
- **발견 빈도**: 1회 (calibration.service.ts: markCalibrationOverdueAsCorrected)
- **설명**: 교정 승인 시 NC를 corrected로 변경하면서 장비를 동시에 available로 복원하여, NC의 3단계 워크플로우(open→corrected→closed)를 우회. 종결 반려 시 장비 available + NC open 상태 불일치 발생. 장비 상태 복원을 close() 메서드의 기존 로직(다른 열린 부적합 확인)에 위임하도록 수정.
- **체크리스트 반영**: review-checklist.md 섹션 2 "CAS 계층 일관성"에 "장비 상태 복원은 NC close() 경로에서만 수행" 항목 추가 고려

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
