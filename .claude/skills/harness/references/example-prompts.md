# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-08 (36차 — generate-prompts 전체 스캔, CRITICAL 1 + HIGH 6 + MEDIUM 3 신규 등재, 34차 stale 4건 정리)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

## 36차 신규 — generate-prompts 3-agent 병렬 스캔 (10건)

> **발견 배경 (2026-04-08, 36차)**: aria-label SSOT 롤아웃(35차) 완료 후 example-prompts.md 상단 우선순위가 모두 stale로 확인되어 generate-prompts 스킬 실행. Backend/Frontend/Infra+Packages 3개 에이전트 병렬 스캔 + 2차 verify(Read/Grep) 통과한 항목만 등재.

### 🔴 CRITICAL — audit_logs.userId FK 미설정 + relations() 미정의

```
배경: packages/db/src/schema/audit-logs.ts:36 의 `userId: uuid('user_id').notNull()` 에
`.references(() => users.id)` 가 누락되어 있다. 사용자 삭제 시 audit log가 orphan 상태로
남으며, 더 큰 문제는 이 파일에 `relations()` export가 전혀 없어서 audit 모듈이 drizzle
relation 타입 안전성 없이 user join을 수동으로 구성한다.

회피책 (현재): userName/userRole/userSite/userTeamId 를 비정규화로 박아둠 (line 37-57). 사용자
정보 변경 시 stale 가능. CASCADE/SET NULL 정책 부재.

근본 해결:
1. userId에 `.references(() => users.id, { onDelete: 'set null' })` 추가 + nullable 전환
   (audit log는 사용자 삭제 후에도 보존되어야 하므로 SET NULL이 정답).
2. relations() 블록 추가: `userId → users` 1:N. audit module의 수동 join 제거.
3. 마이그레이션: 기존 orphan userId 발견 시 SET NULL 백필.
4. ✅ 비정규화된 userName/Role/Site/TeamId는 유지 — 삭제 후에도 누가 무엇을 했는지 표시하기 위함.

영향 범위: packages/db/src/schema/audit-logs.ts (1 파일) + drizzle migration 1건 +
apps/backend/src/modules/audit/* 의 join 코드 (수동 join → relation 사용으로 단순화).
Mode 2 — DB 마이그레이션 동반.

검증:
- pnpm tsc --noEmit
- pnpm --filter backend run test
- 신규 마이그레이션 SQL 검토: ALTER TABLE audit_logs ADD CONSTRAINT ... ON DELETE SET NULL
- /verify-implementation PASS
- 회귀: 사용자 삭제 → audit log 조회 시 userName 보존 + userId NULL 확인
```

### ~~🟠 HIGH — equipment.requestedBy/approvedBy 타입 드리프트 (varchar(36) → uuid + FK)~~ ✅ 완료 (35차, 2026-04-08, f8e06b86)

```
배경: packages/db/src/schema/equipment.ts:112-113 의 `requestedBy: varchar('requested_by',
{ length: 36 })`, `approvedBy: varchar('approved_by', { length: 36 })` 가 다른 모든 user
참조 컬럼(`managerId`, `deputyManagerId` 등)과 타입이 다르다 (varchar(36) vs uuid).
- FK 제약 없음 → 존재하지 않는 사용자 ID 입력 가능
- JOIN 시 cast 필요 → 타입 안전성 손실
- drizzle relations() 에서 user 참조 불가

근본 해결:
1. 두 컬럼을 uuid로 변경 + `.references(() => users.id, { onDelete: 'set null' })` 추가
2. 마이그레이션: 기존 데이터 유효성 검사 → 잘못된 ID는 NULL로 백필 → 컬럼 타입 변경
3. relations() 블록에 두 관계 추가

영향 범위: packages/db/src/schema/equipment.ts (1 파일) + 마이그레이션 SQL 1건 + 등록/승인
서비스 코드의 타입 변경 (대부분 string → string이라 컴파일은 통과). Mode 2.

검증:
- pnpm tsc --noEmit (전 패키지)
- 마이그레이션 SQL: 데이터 무결성 검증 단계 포함
- 회귀: 장비 등록/승인 워크플로(WF-01/02) E2E 통과
```

### 🟠 HIGH — checkouts.lenderTeamId/lenderSiteId FK 누락 (시험소간 대여) — ⚠️ 부분 완료 (35차, lenderTeamId만, lenderSiteId 잔존)

```
배경: packages/db/src/schema/checkouts.ts:49-50 의 `lenderTeamId: uuid('lender_team_id')`
는 teams.id 를 참조해야 하지만 `.references()` 가 없다. `lenderSiteId: varchar('lender_site_id', { length: 50 })` 도
sites enum/테이블 검증 없음. 다른 user 참조 컬럼 (requesterId, approverId 등)은 모두 FK가
명시되어 있어 일관성 깨짐. 시험소간 대여 시나리오에서 dangling reference 가능.

근본 해결:
1. lenderTeamId에 `.references(() => teams.id, { onDelete: 'restrict' })` 추가
   (대여 중인 팀을 삭제하면 안 됨)
2. lenderSiteId는 SITE 상수와 정합성 검증 — packages/schemas의 SITE enum 사용 또는 CHECK 제약
3. 마이그레이션: 기존 NULL이 아닌 lenderTeamId 중 teams 미존재 ID 발견 시 사용자에게 보고

영향 범위: packages/db/src/schema/checkouts.ts (1 파일) + 마이그레이션 1건. Mode 2.

검증:
- pnpm tsc --noEmit
- 회귀: 시험소간 대여 워크플로(WF-08 또는 해당 spec) 통과
- 마이그레이션 무결성 검증
```

### ~~🟠 HIGH — calibrations.registeredBy/approvedBy FK 누락 (technicianId와 일관성 깨짐)~~ ✅ 완료 (35차, f8e06b86)

```
배경: packages/db/src/schema/calibrations.ts:69-70 의 `registeredBy: uuid('registered_by')`,
`approvedBy: uuid('approved_by')` 는 raw uuid 컬럼이고 `.references()` 가 없다. 같은 파일
line 44 의 `technicianId: uuid('technician_id').references(() => users.id, ...)` 는
FK가 있어 명백한 일관성 위반. 교정 3단계 승인(WF-04) 의 actor 추적 신뢰성 저하.

근본 해결:
1. 두 컬럼에 `.references(() => users.id, { onDelete: 'set null' })` 추가
2. relations() 블록에 두 관계 추가
3. 마이그레이션: 백필 검증

영향 범위: packages/db/src/schema/calibrations.ts (1 파일) + 마이그레이션 1건. Mode 2.

검증:
- pnpm tsc --noEmit + backend test
- 회귀: WF-04 교정 3단계 승인 E2E 통과
```

### ~~🟠 HIGH — notification_preferences.userId FK 누락 (notifications 정책 33차 후속)~~ ✅ 완료 (35차, f8e06b86)

```
배경: 33차 notifications FK 정책 정비(memory: project_notifications_fk_policy)에서
notification_preferences는 후속으로 분류되었음. packages/db/src/schema/notifications.ts:105
의 `userId: uuid().notNull().unique()` 에 `.references(() => users.id, { onDelete: 'cascade' })`
가 빠져 있다. 사용자 삭제 시 preference orphan 잔류.

근본 해결:
1. userId에 `.references(() => users.id, { onDelete: 'cascade' })` 추가 (preference는 사용자
   삭제 시 함께 삭제되어야 함 — recipient policy와 일관)
2. 마이그레이션 + orphan 백필 (DELETE FROM notification_preferences WHERE user_id NOT IN ...)

영향 범위: packages/db/src/schema/notifications.ts + 마이그레이션 1건. Mode 1.

검증:
- pnpm tsc --noEmit
- 0004/0005 마이그레이션과 동일 패턴 재사용
```

### ~~🟠 HIGH — RENTAL_IMPORT 5개 deprecated 권한 매핑 모순 (role-permissions.ts)~~ ✅ 완료 (35차 entropy 검증, 흔적 0건)

```
배경: packages/shared-constants/src/permissions.ts:181-197 의 5개 권한
(VIEW_RENTAL_IMPORTS, CREATE/APPROVE/COMPLETE/CANCEL_RENTAL_IMPORT)이 deprecated로 표시되어
있고, role-permissions.ts:199 에 "제외: DEPRECATED 권한 (VIEW_RENTAL_IMPORTS 등)" 주석이
있는데, 같은 파일 line 300-304 에는 여전히 해당 5개 권한이 한 role의 매핑에 포함되어 있다.
주석과 데이터가 모순. 백엔드 컨트롤러에서 해당 Permission을 사용하는 곳은 0건(검증 완료).

회피책 (현재): permissions.ts에 deprecated 표시만 하고 mapping은 그대로 둠.

근본 해결:
1. role-permissions.ts:300-304 에서 5개 deprecated 권한 항목 제거
2. permissions.ts 에서 5개 enum 항목 제거 (모든 사용처 0개 검증 완료)
3. api-endpoints.ts:483-496 의 RENTAL_IMPORTS 블록도 EQUIPMENT_IMPORTS와 string-for-string
   중복이므로 동시 제거
4. /verify-ssot로 dead enum 가드 회귀 확인

영향 범위: packages/shared-constants/src/{permissions,role-permissions,api-endpoints}.ts
(3 파일). Mode 1.

검증:
- pnpm tsc --noEmit (전 패키지)
- pnpm --filter backend run test + frontend test
- /verify-ssot PASS
- grep -rn "VIEW_RENTAL_IMPORTS\|CREATE_RENTAL_IMPORT\|APPROVE_RENTAL_IMPORT" apps/ packages/ → 0건
```

### ~~🟠 HIGH — apps/frontend/app/(dashboard)/form-templates/error.tsx 누락~~ ✅ 완료 (35차 entropy 검증, 파일 존재)

```
배경: apps/frontend/app/(dashboard)/form-templates/ 에 page.tsx + loading.tsx 만 있고
error.tsx 가 없다. 다른 모든 dashboard route segment(equipment, checkouts, calibration,
approvals 등)는 error.tsx + loading.tsx 한 쌍을 갖고 있어 패턴 일관성 깨짐. form-template
업로드/파싱 실패 시 fallback이 dashboard layout 단까지 올라가 사용자 경험 저하.

근본 해결:
1. error.tsx 추가 — 다른 segment의 error.tsx와 동일 구조 (use client + ErrorBoundary
   reset 핸들러 + 한국어 메시지)
2. /verify-nextjs 또는 /verify-implementation 의 route segment coverage 룰 추가 검토

영향 범위: 1 파일 신규 생성. Mode 0.

검증:
- pnpm tsc --noEmit
- 회귀: form-template 업로드 spec 통과
```

### 🟡 MEDIUM — Frontend Dockerfile build stage root 실행 + pnpm 중복 install

```
배경: apps/frontend/Dockerfile 의 build 스테이지(line 23-58)에서 `npm install -g pnpm`이
3개 스테이지에서 반복 실행되고, build 스테이지가 USER 직권 없이 root로 `npm run build`를
실행한다. production 스테이지(line 67-89)만 비-root로 전환. 또한 HEALTHCHECK 디렉티브가
production 스테이지에 부재. apps/backend/docker/Dockerfile 도 동일 패턴.

근본 해결:
1. multi-stage builder에서 deps 스테이지를 하나로 통합 → COPY --from=deps 로 재사용
2. build 스테이지에도 `USER node` 적용 (또는 별도 build user)
3. production 스테이지에 HEALTHCHECK 추가: `HEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1`
4. 동일 변경 backend Dockerfile에도 적용

영향 범위: apps/frontend/Dockerfile + apps/backend/docker/Dockerfile (2 파일). Mode 1.

검증:
- docker build 양 이미지 성공
- docker run 후 HEALTHCHECK status healthy 확인
- 이미지 크기 비교 (deps 통합 전/후)
```

### 🟡 MEDIUM — Backend Dockerfile layer caching 깨짐 (lockfile-only 레이어 무효화)

```
배경: apps/backend/docker/Dockerfile builder 스테이지에서 `pnpm install --frozen-lockfile`
(line 60) 직후 `COPY . .` (line 63) 가 실행되어 lockfile-only 레이어 캐싱 효과가 사라진다.
prod-deps 스테이지는 또다시 전체 install을 실행 → 같은 빌드에서 install 3회. CI 시간 손실.

근본 해결:
1. lockfile + package.json 만 먼저 COPY → install → 그 다음 COPY . . (표준 docker layer
   caching 패턴)
2. prod-deps 스테이지는 builder의 node_modules를 COPY --from 으로 재사용

영향 범위: apps/backend/docker/Dockerfile. Mode 0~1.

검증:
- docker build 시간 측정 (변경 전/후)
- 레이어 수 감소
```

### 🟡 MEDIUM — Reports 페이지 7개 useState 필터 → URL searchParams SSOT

```
배경: apps/frontend/app/(dashboard)/reports/ReportsContent.tsx:65-71 에서 reportType,
dateRange, customDateRange, reportFormat, site, teamId, status 7개 필터가 모두 useState
로 관리되고 있다. CLAUDE.md Filter SSOT 원칙(URL 파라미터가 유일한 진실의 소스)과 위배.
사용자가 특정 보고서 조합을 북마크/공유 불가능. Alerts 페이지(AlertsContent.tsx:125)도
searchQuery만 useState에 따로 보관하여 부분 위반.

근본 해결:
1. ReportsContent의 7개 useState → useSearchParams + URL 동기화 hook (다른 list 페이지의
   필터 패턴 재사용)
2. AlertsContent의 searchQuery도 동일 처리 — 이미 useSearchParams를 import 중이므로 변경 작음
3. /verify-filters 로 회귀

영향 범위: apps/frontend/app/(dashboard)/reports/ReportsContent.tsx +
apps/frontend/app/(dashboard)/alerts/AlertsContent.tsx (2 파일). Mode 1.

검증:
- pnpm tsc --noEmit + frontend test
- /verify-filters PASS
- 수동: ?reportType=...&site=... URL로 진입 시 필터 초기 상태 반영 확인
```

---

## 34차 후속 — wf20-infra-debt harness 결과 review-architecture tech debt (3건)

> **발견 배경 (2026-04-08, wf20-infra-debt harness PASS 직후 review-architecture)**:
> SelfInspectionTab.tsx 행 액션 aria-label SSOT 패턴 도입 후, 동일 도메인의 다른 컴포넌트에서
> divergence가 확인되었다. wf20-infra-debt harness contract의 SHOULD criteria로 분류되었던
> 항목 + producer/consumer scope 정합성 검증 중 발견된 항목을 등재.

### ~~🟠 HIGH — 점검/케이블/SW/교정 행 액션 aria-label SSOT 미적용~~ ✅ 완료 (35차, 2026-04-08, 커밋 ec8ccd46) — Cable scope 제외, Calibration 부분 적용, IntermediateInspection 키명 변경

### ~~🟠 HIGH — 점검/케이블/SW/교정 행 액션 aria-label SSOT 미적용 (cross-component divergence)~~ ✅ 완료 (35차, 2026-04-08, ec8ccd46)

```
배경: wf20-infra-debt harness (2026-04-08, PASS) 가 SelfInspectionTab.tsx 의 3개 행 액션 버튼
(edit/confirm/delete) 에 i18n 기반 컨텍스트 aria-label 패턴을 도입했다 — 키:
selfInspection.actions.{edit|confirm|delete}AriaLabel + ICU {date}.

review-architecture 결과: 동일 "장비 상세 행 액션" 도메인의 IntermediateInspectionList.tsx 는
aria-label 0개 (cross-component divergence). 케이블/SW/교정 행 액션도 동일하게 미적용.
이로 인해 다음 문제가 누적된다:
1. 다른 워크플로우 spec 작성 시 동일한 selfInspectionCard() narrowing 우회를 다시 발명해야 함
2. 스크린리더 사용자 경험 일관성 결여
3. SSOT 부분 적용으로 인한 패턴 분기 — 4번째 컴포넌트에서 또 다른 변형이 등장할 위험

작업:
1. 다음 i18n 네임스페이스에 *AriaLabel 키 3종 추가 (ko + en, ICU {date}):
   - intermediateInspection.actions
   - cable.actions (또는 cablePathLoss.actions)
   - software.actions (시험용 SW 행 액션)
   - calibration.actions (교정 기록 행 액션 — 적용 가능 여부 먼저 판단)
2. 각 컴포넌트에서 행 단위 식별자(점검일/케이블 ID/SW 명/교정일)를 ICU 변수로 주입
3. 각 컴포넌트의 e2e spec (있는 경우) 에서 일반 name='수정' 매칭을 컨텍스트 aria-label
   regex 매칭으로 교체
4. SelfInspectionTab 와 동일한 helper (clickBelowStickyHeader, expectToastVisible) 사용

검증:
- pnpm --filter frontend exec tsc --noEmit exit 0
- pnpm --filter frontend run test exit 0
- /verify-i18n PASS (ko/en 키 대칭 + ICU 변수 일치)
- grep "name: '수정'" apps/frontend/tests/e2e → 자체점검/중간점검/케이블/SW/교정 spec 0건
- 자체 회귀: WF-20 spec 통과 유지

영향 범위: 자체점검/중간점검/케이블/SW/교정 4~5개 도메인의 행 액션 컴포넌트 + 동일 수의
e2e spec. Mode 1 ~ Mode 2 경계 (예상 변경 12~20 파일).

⚠️ 사이드 이펙트: i18n 키 추가만으로는 회귀 없음. 컴포넌트 prop drilling 증가 시 검토 필요.
```

### 🟢 LOW — sticky-header CSS 변수명 string literal 중복 (3 곳, 4번째 등장 시 상수화)

```
배경: wf20-infra-debt harness review-architecture 검증 결과:
'--sticky-header-height' CSS 변수가 producer 1곳 + consumer 2곳에 string literal 로 중복 박혀 있다:
1. Producer: apps/frontend/components/equipment/EquipmentDetailClient.tsx:96
   document.documentElement.style.setProperty('--sticky-header-height', ...)
2. Consumer (CSS): apps/frontend/lib/design-tokens/components/equipment.ts:809
   top-[var(--sticky-header-height,0px)]
3. Consumer (e2e): apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts:34
   getComputedStyle(documentElement).getPropertyValue('--sticky-header-height')

세 지점 모두 :root 스코프로 통일되어 silent 0 반환 리스크는 없으나, 4번째 consumer (예: 다른
sticky tab 컨테이너) 가 등장할 때 오타/스코프 불일치 가능성이 있다.

작업 (4번째 consumer 등장 시점에만 진행 — 현재는 over-engineering):
1. apps/frontend/lib/design-tokens/primitives/ 또는 shared-constants 에
   STICKY_HEADER_HEIGHT_VAR = '--sticky-header-height' 상수 추가
2. 3 곳 모두 import 로 교체
3. /verify-hardcoding 룰: CSS 변수명 string literal 2회+ 사용 시 상수화 권고 추가 (선택)

검증:
- pnpm tsc --noEmit exit 0
- grep "'--sticky-header-height'" apps/frontend → import 외 0 hit

⚠️ 현재는 트리거 조건 미달 (3 hit). 4번째 hit 발생 시 자동 승격.
```

### ~~🟢 LOW — sticky-helpers.ts 언/마운트 race 동작 주석 보강 (Mode 0)~~ ✅ 완료 (35차, 2026-04-08)

### ~~🟢 LOW — sticky-helpers race 주석 (legacy entry)~~

```
배경: wf20-infra-debt harness review-architecture 검증 결과:
sticky-helpers.ts 의 clickBelowStickyHeader 가 EquipmentDetailClient 언마운트 직후/마운트 직전
찰나에 호출되면 --sticky-header-height 가 미설정 상태이므로 0 을 반환한다. 이 경우 sticky 가
아직 (또는 더 이상) 화면에 없으므로 일반 scrollIntoView 만으로 충분해 race 가 아니지만,
미래 작업자가 0 반환을 버그로 오인할 가능성이 있다.

작업:
1. apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts 의 stickyHeight 계산 직후에 주석 추가:
   "// --sticky-header-height 미설정 시 0 반환 — EquipmentDetailClient 언/마운트 시점에는
   //  sticky 자체가 화면에 없어 race 가 아니다 (의도된 fallback)."
2. 변경 검증: pnpm --filter frontend exec tsc --noEmit exit 0

영향 범위: 1 파일, 주석 1줄. Mode 0 직접 처리 가능.
```

---

## 34차 신규 — WF-20 작업 중 발견된 인프라/디자인 부채 (5건)

> **발견 배경 (2026-04-08, 34차)**: WF-20 자체점검 update/confirm UI 구현 + UI 동선 spec 작성 중
> production 버그 (`getSelfInspections` 반환 shape 불일치)를 발견·수정하면서, 5개의 임시방편으로
> 우회한 인프라/디자인 약점이 동시에 드러났다. 모든 워크플로우에 영향을 주므로 분리 트래킹.

### ~~🟡 MEDIUM — 장비 상세 sticky header가 행 액션 클릭을 가로챔 (z-index/pointer-events)~~ ✅ 완료 (35차 entropy 검증, 2026-04-08)

> 회피책 → 정식화 완료: `clickBelowStickyHeader` 헬퍼(`apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts`)로 일원화. wf-20-self-inspection-ui spec에 `safeClick`/`force: true` 매칭 0건.

### ~~🟡 MEDIUM — sticky (legacy entry)~~

```
배경: WF-20 UI spec 작성 중 발견. 장비 상세 페이지에서 점검 행의 "수정"/"확인"/"삭제" 버튼을
Playwright `click()` 으로 누르면 sticky header(`<header role="banner">`) + 통계 카드(`5건/0건`)
+ Card-header 가 pointer events 를 가로채 60s 안에 액션이 도달하지 못한다.

회피책 (현재): wf-20-self-inspection-ui.spec.ts 의 `safeClick(force: true)` — actionability
검사를 우회. 사용자가 마우스로 누를 때는 z-index 레이어링 문제 그대로 남음.

근본 해결:
1. EquipmentPageHeader sticky 컨테이너 z-index 검토 — 헤더만 sticky 이고 통계 카드는
   non-sticky 여야 함 (현재 통계 카드도 viewport 상단에 떠 있는 듯).
2. SelfInspectionTab/IntermediateInspectionList 행 액션 영역에 `position: relative; z-index: 1`
   부여해 sticky 위로 올림.
3. CSS 변수 `--sticky-header-height` 가 이미 정의되어 있음 (메모리 참조) — `padding-top` 보정
   확인.

영향 범위: WF-19/20/25 등 장비 상세 탭 전반에 영향. 키보드 사용자/실사용자의 클릭이
sticky 영역 아래로 가려지는 시각적 결함도 동반.

검증:
- safeClick `force: false` 로 wf-20-self-inspection-ui spec 통과
- review-design 카드 z-index/spacing 점수 확인
- a11y: tab focus 가 sticky 가려진 버튼으로 이동 가능한지
```

### ~~🟡 MEDIUM — 페이지 내 동일 accessible name "수정" 다중 발생 (a11y/SSOT)~~ ✅ 완료 (35차, 2026-04-08)

> 행 식별자 포함 aria-label 패턴(`{date}`/`{name}` ICU 변수)을 IntermediateInspectionList/SoftwareTab/CalibrationHistorySection에 적용. SelfInspectionTab은 wf20-infra-debt에서 선행 적용. cross-component SSOT 일관성 확보.

### ~~🟡 MEDIUM — 수정 중복 (legacy entry)~~

```
배경: WF-20 UI spec 작성 중 발견. `getByRole('button', { name: '수정' })` 가 한 페이지에 4+
요소를 매칭한다 — 자체점검 카드 행 액션, 장비 헤더 "장비 수정", 다른 탭의 수정 액션 등.
i18n key 로 grep 시 "수정" 라벨 사용처가 5+ (ko/equipment.json line 284, 337, 582, 1042, 1101).

회피책 (현재): wf-20-self-inspection-ui.spec.ts 가 `selfInspectionCard()` 헬퍼로
parent locator 를 좁힌 뒤 `getByRole('button', { name: '수정' })` 사용. 테스트는 통과하나
스크린리더 사용자에게는 같은 이름의 버튼이 페이지 곳곳에 흩어져 있어 컨텍스트 불명확.

근본 해결:
1. 행 액션 버튼에 `aria-label` 명시 — "자체점검 2026-04-08 수정", "케이블 SUW-C0001 수정" 등
   행 식별자 포함.
2. 또는 SSOT i18n 키 분리 — `selfInspection.actions.editLabel: "자체점검 수정"` 처럼
   문맥별 키 도입.
3. /verify-i18n 에 동일 i18n 값 다중 사용 패턴 감지 룰 추가 검토.

영향 범위: 자체점검/중간점검/케이블/장비/SW/교정계획 등 거의 모든 행 액션 카드.
```

### ~~🟡 MEDIUM → 🚨 HIGH — useToast 분리 상태 머신 (silent production bug) — toast-ssot-dedup~~ ✅ 완료 (36차, 2026-04-08)

> **35차 false-positive 판정 정정**: Radix dual presentation 자체는 a11y 의도가 맞으나, 그 조사 과정에서 진짜 SSOT 위반이 드러났다.
>
> **실제 문제**: `apps/frontend/hooks/use-toast.ts` (TOAST_REMOVE_DELAY=1000000ms) ↔ `apps/frontend/components/ui/use-toast.ts` (1000ms) 두 파일이 각자의 private `memoryState` + `listeners` 보유. `<Toaster />`는 후자만 구독. 전자를 import하던 6개 컴포넌트(`disposal/{Cancel,Review,Approval,Request}Dialog`, `MaintenanceHistorySection`, `admin/audit-logs/AuditLogsContent`)의 `toast()` 호출은 별도 state로 dispatch되어 **화면 렌더 0건 — silent production bug**.
>
> **해결**: 6개 import path → `@/components/ui/use-toast`로 마이그레이션, `hooks/use-toast.ts` 삭제. e2e 5개 spec(`s19-receive-with-certificate`, `incident-history-ui`, `intermediate-check`, `permission-error`, `10-cas-version-conflict`)을 `expectToastVisible`/`toastLocator` helper로 일원화. `verify-frontend-state` Step 10/11 (useToast 단일 경로 + e2e 토스트 helper 강제) 신설.
>
> **검증**: tsc 0, frontend test 99/99, build PASS, `@/hooks/use-toast` grep 0 hit. /verify-implementation 4스킬 PASS, /review-architecture 6 area PASS.
>
> **교훈**: 모듈-스코프 closure state(`memoryState`, `listeners` 배열)는 import path 단위로 격리됨 — singleton 가정이 path divergence로 깨질 수 있음. file dedup이 아니라 React module instance graph 점검이 본질.

### ~~🟡 MEDIUM — useToast 중복 (legacy entry)~~

```
배경: WF-20 UI spec 작성 중 발견. `await expect(page.getByText('자체점검 기록이 생성되었습니다.'))`
가 strict mode violation 으로 실패 — 매칭되는 요소 2개:
  1. <div class="text-sm opacity-90">자체점검 기록이 생성되었습니다.</div>  (시각 토스트)
  2. <span role="status" aria-live="assertive">Notification 자체점검 기록이 생성되었습니다.</span>

회피책 (현재): wf-20-self-inspection-ui.spec.ts 가 `.first()` 추가로 통과. 그러나 이는
`useToast` 가 SSOT 를 위반하고 한 메시지를 두 번 DOM 에 박는다는 뜻 — 스크린리더가
"Notification 자체점검..." 을 읽고, 시각 토스트도 따로 표시.

근본 해결:
1. shadcn/Toaster 컴포넌트 검토 — `<ol role="region" aria-label="Notifications">` 단일
   래퍼만 두고 자식 토스트가 자체적으로 `aria-live` 를 갖도록 구조 정리.
2. "Notification " 접두사가 어디서 붙는지 (`Toaster` 의 visually-hidden status?) 확인.
3. /verify-i18n 또는 /verify-frontend-state 에 토스트 중복 발화 가드 추가.

영향 범위: 모든 mutation 토스트가 동일 패턴으로 strict mode 충돌을 일으킬 수 있음.
WF-19/20/21/25 등 다수 spec 이 이미 `.first()` 우회 사용 가능성.
```

### ~~🟡 MEDIUM — 시드 직후 undici keep-alive 소켓 끊김으로 첫 fetch 실패~~ ✅ 완료 (33차, 2026-04-08)

> `fetchWithRetry` 헬퍼 도입 (api-helpers.ts) + global-setup overdue trigger을 재시도 wrapper로 감싸기 + seed 후 300ms settle. 회귀 테스트 한 번에 16/16 통과.

```
배경: WF-20 UI spec 디버깅 중 발견. global-setup 의 `pnpm seed-test-new.ts` (execSync) 가
완료된 직후 `fetchBackendToken('lab_manager')` 가 `SocketError: other side closed` 로 100%
실패. curl 로 같은 endpoint 호출 시 즉시 200 — backend 자체는 정상.

원인: undici fetch 의 keep-alive 풀이 시드 스크립트의 backend HTTP 연결을 재사용하려다,
backend가 시드 PG truncate 시점에 inflight 응답을 close 하면서 socket 이 stale 상태가 됨.

회피책 (현재): apps/frontend/tests/e2e/shared/helpers/api-helpers.ts 의 fetchBackendToken
에 3회 retry + exponential backoff 추가. spec 자체는 정상 통과하지만 매 시드마다 1~2회
재시도가 발생.

근본 해결 (택1):
1. seed-test-new.ts 종료 직전 backend `/api/health` 또는 cache-clear 호출로 connection
   풀 정리 + warmup ping. seed 종료 시점에 undici 가 새 connection 으로 강제 전환.
2. global-setup 에서 seed 후 `await new Promise(r => setTimeout(r, 1000))` + warmup GET 1회
   (gracefully) — 단순하지만 deterministic.
3. backend 에 `Connection: close` 를 시드 트랜잭션 직후 일시 적용 (가장 침투적).

영향 범위: 모든 e2e workflow 의 안정성. 시드 자체는 30/30 검증 통과지만 직후 fetch 가
flake 로 first-attempt 실패.

검증:
- pnpm e2e 10회 연속 실행, fetchBackendToken retry 카운트 0 유지
- api-helpers 의 retry 루프 제거 후에도 통과
```

### ~~🟡 MEDIUM — audit_logs 시드 카운트 drift~~ ✅ 완료 (33차에 이미 해결, 34차 검증)

> `verification.ts:268-272` 에 `minOnly: true` 적용됨, `seed-test-new.ts:103` 에 audit_logs truncate 포함됨. 34차 harness wf20-infra-debt 작업 중 false positive 로 확인되어 아카이브.

### ~~🟡 MEDIUM — audit_logs 시드 카운트 drift (legacy entry)~~

```
배경: WF-20 UI spec 다중 실행 중 발견. seed 검증의 hardcoded expectation `Audit Logs count
expected 20` 가 테스트 실행마다 늘어남 — 24/20, 28/20 등. 매번 수동 reseed 필요.

원인: seed-test-new.ts 가 audit_logs 테이블을 truncate 대상에 포함하지 않거나, 시드 데이터
로딩 자체가 audit log 를 추가하면서 baseline 이 흔들림. 테스트 실행 시 추가 audit log 생성
(create/update/confirm 액션) 가 누적.

회피책 (현재): 매 spec 실행 전 `cd apps/backend && npx ts-node src/database/seed-test-new.ts`
수동 호출. global-setup 의 seed 도 같은 스크립트인데 왜 manual 만 통과하는지는 불분명.

근본 해결:
1. seed-test-new.ts 의 truncate 시퀀스에 `audit_logs` 명시적으로 포함 (이미 truncated 면
   확인).
2. seed 검증 expectation 을 audit_logs 만 ">=" 또는 동적 계산 (시드 후 audit_logs 모두
   삭제 후 재시드).
3. backend 의 seed 시 자체가 audit log 생성하지 않도록 transaction 안에서 trigger off.

영향 범위: 모든 e2e workflow. 첫 spec 실행 후 두 번째부터 global-setup 이 fail 하면서
"수동 reseed → 재실행" 패턴이 강제됨. CI/CD 에서는 격리된 컨테이너라 영향 적지만
로컬 개발 워크플로우 마찰 큼.

검증:
- pnpm e2e 5회 연속 실행, 매번 30/30 통과
- audit_logs 카운트가 매 실행 후 정확히 20 으로 reset
```

---

## 33차 신규 — review-architecture 후속 이슈 (3건)

### ~~🟠 HIGH — /admin/approvals cross-site pending 노출 (프론트/백엔드 site scope 비대칭)~~ ✅ 완료 (35차, 2026-04-08, fix/approvals-cross-site-scope)

> **해결**: `checkouts.service.ts buildQueryConditions` + `approvals.service.ts getCheckoutCount`의 site/teamId 필터를 `enforceScopeFromData` 액션 가드와 동일 정의(`checkoutItems→equipment` JOIN)로 정합. 비rental은 equipment 소속, rental은 lender + borrower 폴백. WF-33 spec 8건 순회 루프 제거 + 01-access-control TC-08 회귀 케이스 추가. 백엔드 486 테스트 + tsc 통과.
> 
> **35차 후속 라운드 — review-architecture Warning 3건 모두 해소 (2026-04-08)**:
> - ✅ `checkout-scope.util.ts` SSOT 헬퍼 추출 (병렬 세션 산물): `buildCheckoutSiteCondition` / `buildCheckoutTeamCondition` / `buildCheckoutScopeFromResolved` / `buildCheckoutScopeForUser`. List/KPI/Action 3-way 단일 SSOT.
> - ✅ frontend `getPendingOutgoing` 에 `direction='outbound'` 명시 → predicate 가 case 1+3 로 좁혀짐 (case 2 borrower 가시성 누출 차단)
> - ✅ `getCheckoutCount` + `getOutgoingKpi` 모두 `direction='outbound'` 전달 → KPI/list/action 비대칭 완전 해소
> - ✅ TC-08 강화: `expect(total).toBeGreaterThan(0)` (시드 드리프트 silent failure 방지) + 모든 row 에 대한 `GET /api/checkouts/:id` dry-check (read-side 가드 회귀 가드) + `expect(dialog).toBeHidden()` (waitForTimeout 제거)
> - ✅ `checkout-scope.util.spec.ts` 12 케이스 단위 테스트 — 권위적 회귀 가드 (4 시나리오 × 3 direction)
> - ✅ Backend 498 tests PASS (12 신규), frontend tsc PASS

```
WF-33 spec 작성 중 발견 (커밋 d3251006): TM(site=suwon) 이 /admin/approvals?tab=outgoing
에서 목록 첫 항목으로 CHECKOUT_004 (Uiwang W repair) 를 본다. 그러나 이 항목의 "승인"
버튼을 누르면 backend 가 403 SCOPE_ACCESS_DENIED 로 튕는다.

사용자 증상: "보이는데 못 누르는 유령 행". WF-33 spec 은 이를 회피하기 위해 최대 8건
순회 루프를 쓰고 있음 (wf-33-approval-count-realtime.spec.ts:95-130).

의심 원인 (확인 필요):
1. 백엔드: GET /api/approvals/pending?category=outgoing 쿼리에서 site filter INNER JOIN
   누락. 프론트로 cross-site checkouts 가 전달됨.
2. 또는 프론트: getPendingOutgoing() 이 user.site 를 query param 에 싣지 않아 백엔드가
   전체 반환.

작업:
1. apps/backend/src/modules/approvals/approvals.service.ts 의 outgoing 쿼리 분기
   (getPendingOutgoing 등) 에서 site filter 가 INNER JOIN 인지 grep 확인
2. apps/frontend/lib/api/approvals-api.ts 에서 user.site 를 params 로 넘기는지 확인
3. 원인에 해당하는 쪽 수정:
   - 백엔드: `.innerJoin(equipment, ...).where(eq(equipment.site, scope.site))`
   - 프론트: 의도적으로 cross-site 를 보여주되 disabled 렌더 (사용자 피드백 포함)
4. WF-33 spec 의 "최대 8건 순회" 루프를 "첫 항목 바로 클릭" 으로 단순화
5. features/approvals/comprehensive/01-access-control.spec.ts 에 cross-site 노출 회귀
   케이스 추가

검증:
- pnpm --filter backend exec tsc --noEmit exit 0
- pnpm --filter backend run test -- approvals exit 0
- pnpm --filter frontend exec playwright test wf-33-approval-count-realtime --project=chromium
  통과 유지 (루프 단순화 후에도)
- TM(suwon) 으로 직접 로그인 후 /admin/approvals?tab=outgoing 에 Uiwang 행 미노출 확인

⚠️ 보안/UX 사이드 이펙트: 백엔드 쪽 수정은 쿼리 결과 집합이 바뀌므로 다른 spec(02-kpi-and-
counts.spec.ts, waitForApprovalListOrEmpty 가정) 회귀 범위 점검 필수.
```

### 🟡 MEDIUM — E2E 스켈레톤 대기용 CSS class selector → data-testid 전환 (verify-e2e 강화)

```
WF-33 spec 과 09-actual-approve-reject.spec.ts 가 KPI "전체 대기" 카드의 스켈레톤
소멸을 기다릴 때 `.locator('.h-8.w-14')` Tailwind 유틸 클래스 셀렉터를 쓴다.
메모리 규칙("CSS 셀렉터 금지, getByRole/getByText 만") 위반이며 Tailwind 리팩토링 시
무음 브레이크 위험.

발견 파일 (2곳):
- apps/frontend/tests/e2e/workflows/wf-33-approval-count-realtime.spec.ts:56
- apps/frontend/tests/e2e/features/approvals/comprehensive/09-actual-approve-reject.spec.ts:135

작업:
1. 승인 KPI 스켈레톤 컴포넌트 (apps/frontend/components/approvals/ApprovalKpi.tsx 또는
   관련 컴포넌트) 에서 스켈레톤 엘리먼트에 `data-testid="kpi-pending-skeleton"` 부여
2. 두 spec 파일의 `.locator('.h-8.w-14')` 를 `getByTestId('kpi-pending-skeleton')` 로 교체
3. 다른 KPI 카드/스켈레톤 대기 패턴도 grep 으로 찾아 일괄 전환:
   `grep -rn "locator('\.h-[0-9]" apps/frontend/tests/e2e`
4. .claude/skills/verify-e2e/ 규칙에 "Tailwind 유틸 class locator 금지" 명시 추가

검증:
- grep "locator('\\.(h|w)-" apps/frontend/tests/e2e → 0 hit
- pnpm --filter frontend exec playwright test wf-33-approval-count-realtime
  09-actual-approve-reject --project=chromium exit 0
```

### 🟢 LOW — global-setup 에러 로그 정밀화 (seed vs trigger-overdue 구분) (Mode 0)

```
apps/frontend/tests/e2e/global-setup.ts 의 외부 try/catch 가 seed 실패 + trigger-overdue
실패 둘 다 "❌ 시드 데이터 로딩/검증 실패" 메시지로 출력한다. 실제로는 trigger-overdue
가 throw 한 경우도 있어 디버깅 시 misleading.

작업:
1. trigger-overdue 블록을 별도 try/catch 로 분리 (여전히 outer throw 유지)
2. 각각 다른 error prefix 출력:
   - "❌ 시드 데이터 로딩/검증 실패" (seed 전용)
   - "❌ 교정 기한 초과 트리거 실패" (trigger-overdue 전용)
3. 두 경우 모두 수동 재현 명령을 함께 출력

검증:
- pnpm --filter frontend exec tsc --noEmit exit 0
- 두 에러 경로를 주석으로 설명 (향후 작업자 혼동 방지)
```

---

## 현재 미해결 프롬프트: 9건 (+ 사용자 결정 대기 1건) — 33차 신규 3건 포함 (상단 참조)

### ~~🟠 HIGH — WF-21 케이블 Path Loss 관리 E2E 워크플로우 spec 부재 (Playwright)~~ ✅ 완료 (35차 entropy 검증, 2026-04-08)

> spec 존재 확인: `apps/frontend/tests/e2e/workflows/wf-21-cable-path-loss.spec.ts` + `wf-21-cable-ui.spec.ts` + `features/permissions/comprehensive/cable-permissions.spec.ts`

### 🟠 ~~HIGH — WF-21 (legacy entry)~~

```
docs/workflows/critical-workflows.md WF-21 (UL-QP-18-08 케이블 Path Loss 관리) 가
정식 등재되어 있고 코드(`CablesService`, `CablesController`, `CableListContent`,
`CableDetailContent`, `MeasurementFormDialog`, `FormTemplateExportService`)는 모두 존재하지만,
apps/frontend/tests/e2e/workflows/ 트리에 wf-21-* spec 이 없다.
features/ 트리에서도 cable 관련 spec 0건 (find -iname '*cable*' 결과 없음).

WF-19/WF-20 export spec(`wf-19b-intermediate-inspection-export.spec.ts`,
`wf-20b-self-inspection-export.spec.ts`) 패턴을 그대로 답습해 케이블 등록 → 측정 추가 →
QP-18-08 export 까지 cover.

작업:
1. apps/frontend/tests/e2e/workflows/wf-21-cable-path-loss.spec.ts 신규 작성
2. 시나리오: TE 로그인 → /cables → "케이블 등록" → ELLLX-NNN 형식 관리번호 → 상세 진입 → 측정 추가
   (Freq/Data 포인트 N개) → latestDataPoints 표시 확인 → 목록 "내보내기" → xlsx 다운로드 → 시트1(목록) +
   개별 케이블 시트 검증
3. CAS 충돌은 케이블 수정 단계에서 1건만 (선택)
4. 도메인 데이터 fabricate 금지 — 관리번호 형식 ELLLX-NNN 만 준수, 실측 dB 값은 더미 0/1/2 허용

검증:
- pnpm --filter frontend exec playwright test wf-21-cable-path-loss exit 0
- 시드 의존성: cables 시드 (없으면 spec 내부 API 직접 생성)
- find apps/frontend/tests/e2e -iname '*cable*' → 1+ hit
```

### ~~🟠 HIGH — WF-35 CAS 충돌 프론트엔드 UI 복구 E2E (다탭 시뮬레이션) (Playwright)~~ ✅ 완료 (35차 entropy 검증, 2026-04-08)

> spec 존재 확인: `apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts`

### 🟠 ~~HIGH — WF-35 (legacy entry)~~

```
critical-workflows.md WF-35 (CAS 충돌 UI 복구) 신규 등재됨. 백엔드 관점 spec 은
features/non-conformances/comprehensive/s35-cas-cache.spec.ts 와
features/approvals/comprehensive/10-cas-version-conflict.spec.ts 가 이미 있지만,
**프론트엔드 사용자 동선** (다탭 동시 편집 → 한국어 토스트 → 자동 refetch → 재시도 성공) 은
verify된 spec 으로 cover되지 않는다.

확인된 코드 경로:
- use-optimistic-mutation.ts:249 — getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT, t)
- InspectionFormDialog.tsx:121, SelfInspectionFormDialog.tsx:89, ReceiveEquipmentImportForm.tsx:151
- CalibrationPlanDetailClient.tsx:149 공통 핸들러

작업:
1. apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts 신규
2. 시나리오:
   a. 같은 storageState 로 두 BrowserContext 열기 (또는 한 컨텍스트 내 두 페이지)
   b. 양쪽 페이지 모두 /equipment/[id] 또는 /equipment/[id]/edit 진입
   c. 페이지A: 필드 수정 → "저장" → 토스트 확인, version +1
   d. 페이지B: 다른 필드 수정 → "저장" → 409 응답
   e. 페이지B 에서 한국어 토스트 텍스트 검증 (`getByRole('status', { name: /다른 사용자/ })` 등)
   f. 페이지B 폼이 최신 version 으로 reload 되었는지 확인
   g. 페이지B 에서 다시 "저장" → 성공 토스트
3. WF-19 의 `wf-19-intermediate-inspection-3step-approval.spec.ts` 다탭 패턴 참고

검증:
- pnpm --filter frontend exec playwright test wf-35-cas-ui-recovery exit 0
- 토스트 셀렉터는 getByRole/getByText (CSS 셀렉터 금지 — 사용자 메모리 규칙)
- 회귀: features/non-conformances/comprehensive/s35-cas-cache.spec.ts 통과 유지
```

### ~~🟡 MEDIUM — WF-25 alerts → 장비 상세 → 반출 신청 cross-flow E2E~~ ✅ 완료 (32차, 2026-04-08)

- spec: `apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts`
- 시드 보강: `apps/backend/src/database/seed-data/admin/notifications.seed.ts` — TE 대상 calibration_due 알림 1건 deterministic
- 부수 architecture fix (cross-cutting):
  - `notifications` Phase 0 truncate 추가 (idempotency 회복, 누적 280건 → 1건)
  - `verification.ts` SSOT 리팩토링 — 16개 magic number → `SEED_DATA.length/.filter().length` 도출
  - `global-setup.ts` fail-fast (warn → throw, false negative 차단)
  - `notifications.{recipient,team,equipment,actor}_id` hard FK + ON DELETE 정책 (migration `0004_opposite_selene.sql`)
- 검증: WF-25 + alert-kpi 13/13, backend 473/473, 시드 30/30

### ~~🟡 MEDIUM — global-setup 교정 overdue 트리거 실패 (lab_manager 토큰 발급) (Mode 1)~~ ✅ 완료 (33차, 2026-04-08, 커밋 d3251006)

- 실제 원인: lab_manager 토큰 자체는 정상. 2가지 문제 존재했음.
  1. 응답이 flat (`{"processed":3}`) 인데 global-setup 이 `result?.data?.processed` 로 읽어 성공 시에도 "0건" 로깅 — ResponseTransformInterceptor 미적용 엔드포인트
  2. `catch {}` silent 처리로 fail-fast 로 전환된 주변 블록과 일관성 위반 + 원인 진단 불가
- 수정: silent catch 제거(throw), timeout 10s→30s (fresh seed 직후 N+1 대응), `result.processed` 직접 읽음
- 곁들임: verification.ts audit_logs 를 `minOnly` 로 완화 — running backend 와 async `@OnEvent('audit.auth.success')` 핸들러 경합으로 seed insert 와 verify 사이에 +1 row 가 끼어들 수 있음 (SSOT 원칙 유지, 하한만 강제)
- 검증: 재실행 시 `✅ 교정 기한 초과 점검 완료 (처리: 3건, 부적합 생성: 3건)` 정상 로깅, WF-33 e2e 통과

### ~~🟢 LOW — verification.ts SSOT 리팩토링 후속 커버리지 갭 (Mode 0 or Mode 1)~~ ✅ 완료 (35차, 2026-04-08)

> 6개 checkCount 추가: repair_history, checkout_items, calibration_factors, software_validations, equipment_test_software, disposal_requests. 시드 재실행 36/36 PASS. calibration_plan_items 상태별 분포는 items에 status 필드 부재로 보류.

### ~~🟢 LOW — verification.ts coverage gap (legacy entry)~~

```
32차 세션에서 verification.ts 의 모든 count 체크를 SEED_DATA 기반 SSOT 로 전환했으나,
아래 테이블/항목은 여전히 검증 누락 상태이다.

누락 항목:
1. `repair_history` — REPAIR_HISTORY_SEED_DATA.length 로 검증 추가 가능
2. `calibration_factors` — CALIBRATION_FACTORS_SEED_DATA.length
3. `software_validations` — SOFTWARE_VALIDATIONS_SEED_DATA.length
4. `equipment_test_software` — EQUIPMENT_TEST_SOFTWARE_SEED_DATA.length
5. `disposal_requests` — DISPOSAL_REQUESTS_SEED_DATA.length
6. `checkout_items` — CHECKOUT_ITEMS_SEED_DATA.length (FK 파생이지만 명시적 체크 권장)
7. `calibration_plan_items` 상태별 분포 (기존 plans 만 상태 체크, items 는 count 만)

작업:
1. apps/backend/src/database/utils/verification.ts 에 누락된 6~7 개 checkCount 호출 추가
2. 각 seed 파일 import 추가
3. 재시드 → 전체 PASS 확인

검증:
- pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts → "Summary: N/N checks passed"
- 수치가 drift 되면 자동 실패 (SSOT 원칙)
```

### 🟢 LOW — WF-25 spec D-day 배지 soft assertion 보강 (Mode 0)

```
apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts 는 현재
알림 → 장비 상세 → checkouts/create prefill 까지는 검증하지만, 장비 상세 페이지의
EquipmentStickyHeader calibrationStatus 배지 (D-7/D-30/기한 초과) 는 검증하지 않는다
(주석 8)번에 의도적 생략 명시).

본 cross-flow 가 "alerts 의 교정 임박 신호 → 장비 상세의 교정 강조 시각 신호" 일관성을
cover하려면 soft assertion 추가가 필요하다.

작업:
1. 장비 상세 페이지 진입 후, calibrationStatus 배지 locator 확인 (D-\d+ 또는 기한 초과)
2. `if (await badge.count() > 0) await expect(badge).toBeVisible()` 형태의 soft 검증 추가
3. 배지가 없는 경우(일반 상태)는 skip 하지 않고 통과 (soft 성격 유지)

검증:
- pnpm --filter frontend exec playwright test wf-25-alert-to-checkout --project=chromium 통과 유지
- tech-debt-tracker.md 해당 항목 해결 처리
```

### ~~🟡 MEDIUM — WF-33 SSE 다탭 승인 카운트 동기화 E2E (Playwright)~~ ✅ 완료 (33차, 2026-04-08, 커밋 d3251006)

- spec: `apps/frontend/tests/e2e/workflows/wf-33-approval-count-realtime.spec.ts`
- 실측한 전략: approvals counts 는 `REFETCH_STRATEGIES.SSE_BACKED` (refetchInterval 10분 폴백) → 15s window 내 감소 = SSE 푸시 증명
- 파이프라인 검증: 탭A 승인 클릭 → `ApprovalSseListener` → `NotificationSseService.broadcastApprovalChanged()` → 두 탭 `useNotificationStream` 이 `countsAll` prefix 무효화 → 자동 refetch
- 견고성: 탭A 의 "첫 항목" 이 cross-site uiwang checkout 이어서 403 SCOPE_ACCESS_DENIED 였음 → 최대 8건 순회해 승인 가능한 것 선택 (프론트엔드가 cross-site pending 을 목록에 노출하는 것 자체는 별도 관찰 사항)
- 승인 PATCH 응답은 `waitForResponse` 로 명시 대기 → 토스트 플레이키함 제거
- Step 5 (bell 카운트 +1) 는 별도 notification 트리거가 필요해 본 spec 범위 밖
- 검증: playwright 14.6s 통과, 7 passed

---

## 31차 신규 — Export spec API-only 갭 + WF-21 후속 + 보안 (5건)

### ~~🔴 CRITICAL — Form Template Export site scope bypass~~ ✅ 완료 (33차, 2026-04-08, 23192fd8)

> `resolveSiteFilter` 헬퍼 도입 + 3곳 치환 + 403 reject(OWASP IDOR 표준) + 5 cases unit test. 실측 grep 결과 취약 파일 1개(form-template-export.service.ts)뿐이었음.

<details><summary>원문</summary>

```
배경: 31차 review-architecture에서 발견 (WF-21 spec이 ?site=suwon 을 명시 호출한 첫 케이스라
가시화됨). form-template-export.service.ts의 다수 exporter 가 `params.site || scope?.site`
패턴을 사용 — JS 단락 평가상 **쿼리 파라미터가 서버 scope를 덮어쓴다**.

위협 시나리오:
- suwon 사이트로 scope된 사용자가 GET /api/reports/export/form/UL-QP-18-08?site=incheon
  요청 → exporter는 scope 무시하고 incheon 데이터로 XLSX 반환
- 동일 패턴이 다른 양식(QP-18-01/05 등) exporter에도 5+ 곳 존재 가능 — grep 필요

⚠️ 부분 완화 현황 (Defense-in-depth 갭):
- CableListContent.tsx:110 — 프론트엔드는 `if (user?.site) params.site = user.site;`
  로 자기 사이트만 자동 전송 → 일반 클릭 동선으로는 노출 안 됨
- 그러나 사용자가 fetch/curl/Postman 으로 직접 호출하면 우회 가능 → 백엔드 단의 정정이
  여전히 필수 (CLAUDE.md Rule 2 정신: 클라이언트 신뢰 금지)
- 다른 양식 export 페이지의 프론트엔드도 동일하게 user.site 강제하는지 grep 필요
- CLAUDE.md Rule 2 (Server-Side User Extraction) 와 동일한 정신 위반:
  클라이언트가 보낸 값으로 권한을 확장할 수 있어서는 안 됨

확인 필요:
- form-template-export.service.ts grep `params.site || scope` / `params.site ?? scope`
  → 모든 exporter 헤드 위치 식별
- _resolveReportScope (reports.controller.ts) 가 admin / 비scoped 사용자에게
  어떻게 동작하는지 (admin 은 scope?.site === undefined 이어야 params.site 가 의미 있음)
- params.teamId 도 동일 패턴인지 검토

작업:
1. form-template-export.service.ts 내 모든 exporter에서 site 우선순위 역전:
   `const siteFilter = scope?.site ?? params.site;` (서버 scope 우선)
2. teamId 도 동일하게 `scope?.teamId ?? params.teamId` 로 변경
3. 음성 테스트 추가:
   - apps/backend/test 또는 e2e — suwon-scoped 사용자 + ?site=incheon → 결과가 suwon 데이터
4. WF-21 spec 에 회귀 케이스 1건 추가: scoped 사용자가 다른 site 요청 시 cross-site 누출 0
5. 정책 결정 필요: silent override (scope 강제) vs 403 reject — 다른 controller/guard 와 일관성
   우선 (현재 monitoring/audit 등이 어떻게 처리하는지 확인 후 결정)

검증:
- pnpm --filter backend exec tsc --noEmit exit 0
- pnpm --filter backend run test exit 0
- grep "params.site || scope\\|params.site ?? scope" apps/backend/src/modules/reports
  → 0 hit (또는 모두 역전된 형태)
- 회귀: 기존 export spec (wf-19b/20b/21) 통과 유지

⚠️ 보안 패치이므로 별도 PR + 위험 작업 표 (CLAUDE.md) 에 준해 브랜치 사용 권장.
정책 영향이 크므로 silent override vs reject 결정을 사용자에게 먼저 확인할 것.
```

</details>

---

## 31차 신규 — Export spec API-only 갭 + WF-21 후속 (4건)

> **갭 발견 배경 (2026-04-08, 31차)**: WF-21 cable path loss spec을 wf-19b/wf-20b 패턴 답습해 작성한 결과 API-only로 정착. 사용자 피드백: "테스트 후 어떤 UI가 검증되었는지 항상 설명해라"
> → 스캔 결과 wf-19b/wf-20b/wf-21 3개 export spec 모두 사용자가 누르는 "내보내기" 버튼 동선이 0건 검증된 상태. 패턴화된 회귀 위험.
> 또한 WF-21 자체의 케이블 등록 다이얼로그/측정 폼 다이얼로그도 미검증 (기존 spec은 백엔드 API만 호출).

### ~~🟠 HIGH — WF-21 UI 동선 검증 spec~~ ✅ 완료 (33차, 99ea61f1 / 검증 2026-04-08)

> wf-21-cable-ui.spec.ts 8 step 모두 구현. Playwright 14/14 통과 확인.

```
방금 추가된 wf-21-cable-path-loss.spec.ts (31차)는 백엔드 API만 검증한다.
사용자가 화면에서 보고/누르는 다음 UI 동선은 하나도 cover되지 않는다.

⚠️ 작업 시작 전 필수 사전 확인 (잘못된 가정 방지):
- 등록 UI: **별도 페이지** /cables/create 로 이동 (다이얼로그 아님)
  - 라우트: FRONTEND_ROUTES.CABLES.CREATE = '/cables/create'
  - 컴포넌트: apps/frontend/app/(dashboard)/cables/create/CreateCableContent.tsx
- 측정 추가 UI: **다이얼로그** apps/frontend/components/cables/MeasurementFormDialog.tsx
- 모든 라벨이 i18n: useTranslations('cables') — getByText 시 라벨 하드코딩 금지,
  apps/frontend/messages/ko.json 의 cables 네임스페이스를 먼저 grep해서 실제 한국어 라벨 확정 후 사용
- 목록 컴포넌트: apps/frontend/app/(dashboard)/cables/CableListContent.tsx
- 상세 컴포넌트: apps/frontend/app/(dashboard)/cables/[id]/CableDetailContent.tsx

미검증 동선 (이 spec이 cover해야 함):
- /cables 목록 페이지 렌더링 (페이지 타이틀, 표 헤더, 행, 빈 상태)
- 검색 input + connectorType/status Select 필터 → URL params 반영
- "케이블 등록" 버튼(getByRole link/button) 클릭 → /cables/create 페이지 이동
- /cables/create 폼 필드 입력 (관리번호 / 길이 / connectorType / 주파수 min/max / 시리얼 / 위치 / site)
- 빈 관리번호 등 잘못된 입력 → 한국어 유효성 메시지 (VM.required / VM.string.max)
- "저장" 클릭 → 성공 토스트 → /cables 또는 /cables/[id] 리다이렉트
- 목록 검색에 관리번호 입력 → 행 보임 → 행 내 관리번호 링크 클릭 → /cables/[id] 진입
- 상세 페이지 헤더에 관리번호 / 커넥터 / 주파수범위 표시
- "측정 추가" 버튼 클릭 → MeasurementFormDialog (getByRole('dialog')) 열림
- 측정일 입력, Freq/Loss 데이터 포인트 행 추가, 저장 → 토스트 + 측정 이력 카드 즉시 반영
- 목록 "내보내기" 버튼 → page.waitForEvent('download') 트리거 (XLSX 파일명 검증)

작업:
1. apps/frontend/tests/e2e/workflows/wf-21-cable-ui.spec.ts 신규
2. fixture: testOperatorPage (../shared/fixtures/auth.fixture)
3. 시나리오 (mode: 'serial', step별 분리 — wf-19/wf-20 패턴):
   Step 1: 목록 페이지 진입 + 헤더/표/필터 가시성
   Step 2: "케이블 등록" 클릭 → /cables/create 이동 검증
   Step 3: 폼 빈 제출 → 한국어 에러 메시지
   Step 4: 정상 입력 → 저장 → 토스트 → 리다이렉트
   Step 5: 목록 검색 → 새 케이블 행 → 클릭 → 상세
   Step 6: 상세 헤더 검증
   Step 7: "측정 추가" → 다이얼로그 → 입력 → 저장 → 측정 카드 반영
   Step 8: 목록 복귀 → "내보내기" 버튼 → download 이벤트
   afterAll: API로 생성된 케이블 hard delete (또는 status retired) + cleanupSharedPool

규칙:
- CSS 셀렉터 금지 (메모리 규칙). getByRole / getByText / getByLabel 만 사용
- 라벨 텍스트는 messages/ko.json 에서 그대로 가져와야 함 — 추측 금지
- 도메인 데이터 fabricate 금지: 관리번호 ELLLX-NNN, dB는 더미 0.5/1.0 등
- WF-21 API spec과 격리: 다른 관리번호 슬롯 사용 (충돌 방지)
- frontend dev server 상태: playwright config 에 webServer 설정 있는지 먼저 확인.
  없으면 사용자에게 개발 서버 기동 요청

검증:
- pnpm --filter frontend exec playwright test wf-21-cable-ui --project=chromium exit 0
- pnpm --filter frontend exec tsc --noEmit exit 0
- 회귀: wf-21-cable-path-loss.spec.ts (API spec) 통과 유지
- find apps/frontend/tests/e2e -iname '*cable*' → 2 hits (API + UI)
- 라벨 확정 출처: messages/ko.json 의 "cables.list.title", "cables.list.createButton",
  "cables.list.exportButton" 등 — 실제 키는 코드 grep으로 확정
```

### ~~🟠 HIGH — WF-21 권한 가시성 spec~~ ✅ 완료 (33차, 2026-04-08, 3a8ae03d)

> UI gating 구현(canCreate/canUpdate) + features/permissions/comprehensive/cable-permissions.spec.ts 10 cases. Defense-in-depth (QM POST → 403) 포함.

```
WF-21 cable path loss UI에서 역할별로 어떤 액션이 노출/숨김/disabled 되는지 검증되지 않음.
permissions/comprehensive/ 트리에 cable 권한 spec 0건 (find -iname '*cable*' 결과 없음).

확인 필요한 권한 매트릭스:
- VIEW_CALIBRATIONS (목록/상세 진입 가능 역할)
- UPDATE_CALIBRATION (등록/수정/측정 추가 가능 역할)
- 폐기/retire 액션은 누가? (CablesService 코드 grep 필요)

작업:
1. apps/frontend/tests/e2e/permissions/cable-permissions.spec.ts 신규
2. 각 역할로 storageState 로드 후 /cables 진입:
   - test_engineer: 등록 버튼 visible, 행 측정 추가 visible
   - quality_manager: 등록 visible? (UPDATE_CALIBRATION 보유 여부 grep 후 확정)
   - technical_manager: 등록 visible
   - lab_manager: 동상
   - (만약 read-only 역할이 있다면) 등록 버튼 not visible
3. 권한 없는 역할이 직접 URL로 /api/cables POST 호출 → 403 검증 (페이지 접근과 별개)

확인 코드:
- packages/shared-constants/src/role-permissions.ts — 각 역할의 UPDATE_CALIBRATION 보유 여부
- apps/backend/src/modules/cables/cables.controller.ts — @RequirePermissions 데코레이터

검증:
- pnpm --filter frontend exec playwright test cable-permissions --project=chromium exit 0
- 회귀: 다른 permissions/* spec 통과 유지
```

### 🟡 MEDIUM — Export 다운로드 UX 검증 spec (wf-19b/20b/21 공통 갭)

```
3개 export spec (wf-19b-intermediate-inspection-export, wf-20b-self-inspection-export,
wf-21-cable-path-loss) 모두 page.request.get 으로 API 응답만 검증한다.
**사용자가 화면에서 클릭하는 "내보내기" 버튼 → 브라우저 다운로드 트리거** 동선은
0건 검증.

미검증 항목:
- 목록/상세 페이지의 "내보내기" 버튼/드롭다운 가시성
- 클릭 시 download 이벤트 발생 (page.waitForEvent('download'))
- Content-Disposition filename* UTF-8 인코딩이 OS에 도달했을 때 한국어 깨짐 없음
- 다운로드 진행 토스트/스피너
- 에러 시 (404/500) 사용자 피드백 토스트

작업:
1. apps/frontend/tests/e2e/workflows/wf-export-ui.spec.ts 신규 (3개 양식 통합 또는 spec 분리)
2. 시나리오 per 양식 (UL-QP-18-03 / UL-QP-18-05 / UL-QP-18-08):
   a. 데이터 prerequisite 확보 (API로 1건 생성 — 기존 helper 재사용)
   b. 해당 목록 페이지 (/equipment/[id] 또는 /cables) 진입
   c. "내보내기" 버튼 클릭 (getByRole('button', { name: /내보내기/ }))
   d. const downloadPromise = page.waitForEvent('download'); await button.click();
   e. const download = await downloadPromise;
   f. expect(download.suggestedFilename()).toMatch(/UL-QP-18-(03|05|08)/)
   g. 한국어 파일명 깨짐 검증 (filename에 한글 포함 시 정상 디코딩)
   h. 다운로드 path 저장 후 파일 크기 > 1KB
3. 회귀 보호: 기존 wf-19b/20b/21 export API spec은 그대로 유지

확인 필요:
- 각 페이지 컴포넌트의 export 트리거 위치
  (CableListContent.tsx, IntermediateInspectionTab.tsx, SelfInspectionTab.tsx)
- 버튼이 양식별 select dropdown인지 단일 버튼인지

검증:
- pnpm --filter frontend exec playwright test wf-export-ui --project=chromium exit 0
- 회귀: wf-19b/20b/21 통과 유지
- 다운로드 임시 디렉토리 정리 (test.afterAll)
```

### 🟡 MEDIUM — Export spec UI 갭 패턴 가드 (verify-* 스킬 보강)

```
배경: 31차에서 wf-19b/20b/21 3개 export spec이 모두 API-only로 정착한 패턴이 발견됨.
앞으로 추가될 export spec (UL-QP-18-04/06/07/09/11 등 미작성 양식)도 동일 함정에 빠질
위험. verify-e2e 또는 verify-workflows 스킬에 가드 추가 필요.

작업:
1. .claude/skills/verify-e2e/SKILL.md (또는 verify-workflows) 에 새 체크 추가:
   - "export 키워드 + page.request.get 만 사용하는 spec은 동일 양식의 UI 다운로드 spec
     동행 여부 확인" 룰
   - grep 패턴: spec 파일 내 'export/form/UL-QP-18' 등장 + 'waitForEvent("download")' 부재
     → WARN
2. 또는 manage-skills 워크플로로 신규 verify-export-ui-coverage 스킬 생성
3. tech-debt-tracker.md에 "Export UI 다운로드 동선 미검증 양식" 누적 트래킹 항목 추가

검증:
- /verify-e2e (또는 신규 스킬) 실행 시 wf-19b/20b/21 3건이 WARN으로 보고됨
- 위 'WF-21 UI 동선 검증 spec'과 'Export 다운로드 UX 검증 spec' 추가 후 WARN 0건
- 메타 변경이므로 tsc/test 영향 없음

선택: 단순 docs/development/E2E_PATTERNS.md 에 "export spec은 API + UI 다운로드 한 쌍으로
작성" 가이드라인 명시만 해도 가능 (스킬 보강 vs 문서화 — 사용자 결정 필요)
```

---

## 현재 미해결 프롬프트: 3건 (29차 이월 1건 + 30차 후속 2건)

> **30차 처리 (2026-04-08)**: #6 self-inspections CAS 통일 ✅ PASS, #7 Docker Node 20 LTS ✅ 완료, #8 setQueryData → false positive
> **30차 후속 등재**: review-architecture/verify-security에서 발견한 dormant code path + hardening gap 2건

### ~~🟠 HIGH — self-inspections.service.ts CAS 중복 구현~~ ✅ 완료 (30차)

> 30차 (2026-04-08). VersionedBaseService 상속으로 전환, update()/confirm() updateWithVersion 사용,
> confirm() transaction wrap, 테스트 mock 갱신 (CAS 경로 변경 반영). 473/473 PASS.

### ~~🟠 HIGH — Docker Node 18 → 20 LTS~~ ✅ 완료 (30차)

> 30차 (2026-04-08). backend.Dockerfile/frontend.Dockerfile FROM 라인 변경.
> engines 필드는 이미 >=20.18.0 였음 (drift 상태였던 것).

### ~~🟡 MEDIUM — use-management-number-check setQueryData~~ ❌ False Positive (30차)

> 30차 (2026-04-08). 검증 결과: useOptimisticMutation 안이 아닌 일반 prefetch 패턴.
> 캐시 키 타입(useQuery line 79, ManagementNumberCheckResult|null) = setQueryData 값 타입 동일.
> CLAUDE.md 규칙은 useOptimisticMutation onSuccess 한정. 코드 변경 없음.

### 🟠 HIGH — 자체점검 update/confirm UI 미구현 (백엔드 CAS dormant) (Mode 1)

```
30차 (2026-04-08) review-architecture에서 발견. 백엔드 self-inspections CAS는 완벽히
구현/검증되었으나 (commit a7c276bd), 프론트엔드 사용자 동선에서 update/confirm을 호출하는
컴포넌트가 존재하지 않는다.

확인된 현황:
- apps/frontend/lib/api/self-inspection-api.ts:104,112 — updateSelfInspection/confirmSelfInspection 정의됨
- apps/frontend/components/equipment/SelfInspectionFormDialog.tsx — create 전용
- apps/frontend/components/equipment/SelfInspectionTab.tsx — read-only
- apps/frontend/tests/e2e/.../workflow-helpers.ts:1081,1101 — E2E helper만 호출
- 사용자가 UI에서 자체점검 수정/확인 시 → 동작 불가 (호출 진입점 없음)

작업:
1. SelfInspectionFormDialog를 create/edit 겸용으로 확장 (mode prop 추가) 또는
   별도 SelfInspectionEditDialog 신규
2. SelfInspectionTab에 행별 "수정"/"확인" 버튼 + 권한 체크 (UPDATE_CALIBRATION,
   confirmedBy 권한)
3. useOptimisticMutation 사용 — confirm은 status 'completed' → 'confirmed' 단방향
4. VERSION_CONFLICT 처리: getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT)
   + 상세 캐시 삭제 후 refetch (CLAUDE.md CAS 규칙)
5. 캐시 무효화: queryKeys.equipment.selfInspections(equipmentId) +
   EquipmentCacheInvalidation 교차 무효화
6. confirmed 상태에서는 수정/삭제 버튼 비활성 (백엔드 ALREADY_CONFIRMED 가드 미러링)

검증:
- pnpm --filter frontend exec tsc --noEmit exit 0
- pnpm --filter frontend run test exit 0
- E2E: workflow-helpers.ts의 자체점검 update/confirm flow가 새 UI를 통해 동작
  (helper에서 API 직접 호출 → page object 경유로 마이그레이션 검토)
- /verify-frontend-state, /verify-cas 통과
```

### 🟡 MEDIUM — Dockerfile USER 미선언 (root 실행 hardening) (Mode 0)

```
30차 (2026-04-08) verify-security에서 발견 (pre-existing). 두 Dockerfile 모두 USER
디렉티브가 없어 모든 stage가 root로 실행된다. CIS Docker Benchmark 4.1 위반.

확인된 파일:
- docker/backend.Dockerfile (alpine, 5 stages: base/deps/development/builder/production)
- docker/frontend.Dockerfile (slim, 5 stages: base/deps/development/builder/production)

node:20-alpine은 기본 'node' user를 제공 (uid 1000). slim도 동일.

작업:
1. backend.Dockerfile production stage 끝부분에 USER node 추가
   - WORKDIR /app 소유권을 node:node로 chown (COPY --chown=node:node)
2. frontend.Dockerfile production stage 동일
3. development stage는 volume mount 권한 충돌 가능 — production만 적용 권장
4. CMD/ENTRYPOINT가 :80/:443 등 privileged port 사용 안 하는지 확인 (현재 3000/3001 → OK)

검증:
- docker compose -f docker-compose.prod.yml build (가능 시)
- docker run --rm -it <image> id → uid=1000(node) gid=1000(node)
- 컨테이너 내부에서 /app 쓰기 가능 (logs/uploads 디렉토리 권한)
- pnpm tsc --noEmit / test 무관 (Dockerfile만 변경)

선택: development stage도 USER node 시 docker-compose volume mount 시 host UID 매핑
필요 → 별도 작업으로 분리 가능
```

### 🟠 HIGH — UL-QP-19-01 exporters map 누락 (런타임 NotImplementedException) (Mode 0)

```
packages/shared-constants/src/form-catalog.ts:121-129 에서 'UL-QP-19-01'이
implemented: true 로 마킹되어 있지만, apps/backend/src/modules/reports/form-template-export.service.ts:110-122
의 exporters Record에는 해당 키가 등록되어 있지 않다 (UL-QP-18-10이 마지막).

이 상태로는 사용자가 UL-QP-19-01 export 요청 시 controller가 isImplemented(formNumber) → true 로 통과한 뒤
exporters[formNumber]가 undefined → 런타임 NotImplementedException 또는 빈 응답으로 폴백된다.

옵션 A: UL-QP-19-01 exporter 구현 (procedure 원문 확인 후 — fabricate 금지)
옵션 B: form-catalog.ts에서 implemented: false 로 임시 강등 + tech-debt 트래커 등록

작업 전 사용자에게 어느 옵션인지 확인할 것. 도메인 데이터를 임의로 만들면 안 됨.

검증:
- pnpm --filter backend exec tsc --noEmit exit 0
- pnpm --filter backend run test exit 0
- 옵션 A: form-template-export.service.ts에 exportXxx 메서드 + exporters[formNumber] 등록
- 옵션 B: form-catalog.ts UL-QP-19-01 implemented: false, isImplemented() 테스트 추가
```

### 🟠 HIGH — self-inspections.service.ts CAS 중복 구현 (VersionedBaseService 미상속) (Mode 1)

```
apps/backend/src/modules/self-inspections/self-inspections.service.ts:25 가 VersionedBaseService를
상속하지 않고 수동으로 CAS를 구현하고 있다 (lines 185-192, 235, 295-302, 304-319).
다른 12개 서비스(checkouts, calibration, equipment, disposal 등)는 모두 base class의
updateWithVersion<T>() 헬퍼를 사용해 atomic check+update 한다.

현재 패턴의 문제:
1. 라인 185 pre-check + 라인 235 WHERE eq(version) 분리 → 두 단계 사이에 race window 존재
2. createVersionConflictException() 수동 throw — 다른 서비스와 에러 메시지/코드 divergence 위험
3. confirm() (라인 304-319)는 transaction으로 감싸지지 않음. checkout.approve(line 1821), calibration.approve(line 1188)는 transaction 사용

작업:
1. SelfInspectionsService extends VersionedBaseService 로 변경
2. update()/confirm()의 manual CAS를 this.updateWithVersion<EquipmentSelfInspection>(...) 호출로 교체
3. confirm()의 status update + items reload 를 this.db.transaction()으로 감싸기

CAS 의미는 변경 금지 — 동일한 동시성 보장이어야 함.

검증:
- pnpm --filter backend exec tsc --noEmit exit 0
- pnpm --filter backend run test -- --grep "self-inspection" exit 0
- grep "extends VersionedBaseService" self-inspections.service.ts → 1 hit
- grep "updateWithVersion" self-inspections.service.ts → 2+ hits
- 회귀 0 (전체 backend test)
```

### 🟠 HIGH — Docker base image Node 18 → Node 20 LTS 업그레이드 (Mode 0)

```
docker/backend.Dockerfile:1 (FROM node:18-alpine)
docker/frontend.Dockerfile:1 (FROM node:18-slim)

Node 18은 2025-04-30 EOL 도달함 (현재 2026-04-08 기준 1년 지남).
보안 패치 미수신 + 일부 의존성(예: 최신 NestJS/Next.js)이 Node 20+ engines 요구.

작업:
1. 두 Dockerfile FROM line만 node:20-alpine / node:20-slim 으로 변경
2. multi-stage 내 모든 stage 동일 변경 (base 외 builder/runner 등 grep 후 일괄)
3. package.json engines 필드에 "node": ">=20.0.0" 명시 (없는 경우 추가)

검증:
- grep "node:18" docker/ → 0 hit
- grep "node:20" docker/ → 2+ hit
- pnpm --filter backend run build exit 0 (로컬 호환성 확인)
- pnpm --filter frontend run build exit 0
- (선택) docker compose build 통과
```

### 🟡 MEDIUM — use-management-number-check.ts setQueryData 안티패턴 (Mode 0)

```
apps/frontend/hooks/use-management-number-check.ts:135 에서 queryClient.setQueryData(...)를
직접 호출한다. CLAUDE.md Rule "useOptimisticMutation의 onSuccess에서 setQueryData 호출 금지
(TData ≠ TCachedData 75%)" 위반 가능 지점이다.

use-optimistic-mutation.ts:38, 280 본인 파일이 이 안티패턴을 명시적으로 금지하고 있는데
별도 hook이 같은 패턴을 우회한다.

작업:
1. line 135 setQueryData가 TData/TCachedData 일치하는지 검사 (Read 후 타입 확인)
2. 일치하면: 인라인 주석으로 의도 명시 + 타입 가드 추가
3. 불일치하면: invalidateQueries(queryKeys.management.check(value))로 교체

검증:
- pnpm --filter frontend exec tsc --noEmit exit 0
- 변경 후 관리번호 중복 체크 동작 직접 테스트(또는 기존 unit test 회귀)
- grep "setQueryData" use-management-number-check.ts → 0 hit (교체한 경우) or 주석 포함 1 hit
```

---

## 사용자 결정 대기 (1건)

### ❓ UL-QP-18-02 이력카드 form-catalog 플래그 vs endpoint 불일치

**상황:**
- `packages/shared-constants/src/form-catalog.ts:44-49` → UL-QP-18-02 `implemented: false`
- `packages/shared-constants/src/api-endpoints.ts:34` → `EQUIPMENT.HISTORY_CARD` endpoint 정의됨
- `form-template-export.service.ts` exporters map에는 UL-QP-18-02 키 없음

**질문:** UL-QP-18-02 (이력카드)는 별도 history-card endpoint로 출력하는 게 정책인가, 아니면 통합 form-template-export 경로로 합쳐야 하는가?
- A안: history-card 전용 경로 유지 → form-catalog 주석에 "별도 endpoint" 명시 (현 상태 유지, 문서화만)
- B안: form-template-export로 통합 → exporter 추가 + implemented: true 변경
- C안: 둘 다 유지 (중복 OK, 사용자가 양쪽 모두 호출 가능)

도메인 절차서(UL-QP-18) 기준 의도 확인 필요.

---

## False Positives (30차, 2026-04-08 — WF 후보 검증)

WF-22~37 등재 시 후보로 올랐으나 이미 features/ 트리에 spec 존재가 확인되어 신규 프롬프트 채택 제외:

| WF 후보 | 검증 결과 | 기존 spec |
|---|---|---|
| WF-22 인증 + 사이드바 가시성 | **이미 cover** | features/auth/auth.spec.ts, f2-role-permissions.spec.ts, permissions/comprehensive/sidebar-visibility.spec.ts |
| WF-23 권한 거부 (admin 라우트 + 액션 버튼) | **이미 cover** | permissions/comprehensive/page-access-control.spec.ts, equipment-crud-permissions.spec.ts, module-crud-permissions.spec.ts |
| WF-24 알림 드롭다운 + 페이지 + 읽음 | **이미 cover** | features/notifications/notification-dropdown.spec.ts, notification-list.spec.ts |
| WF-26 목록 필터/검색/페이지네이션 SSOT | **이미 cover** | equipment/list/group-c-search.spec.ts, group-c-pagination.spec.ts, group-e-url-state.spec.ts, group-g-ssot-verification.spec.ts |
| WF-27 사이트/팀 격리 | **이미 cover** | features/auth/site-data-isolation.spec.ts, f1-team-constraints.spec.ts |
| WF-32 감사 로그 조회 | **이미 cover** | features/admin/audit-logs/audit-logs.spec.ts |
| WF-28~31, 34, 36, 37 (양식/리포트/설정/팀/레이아웃/마이그/모니터링) | **부분 cover** | features/form-templates, reports, settings, teams, data-migration, admin/monitoring 트리에 spec 존재 — 신규 갭 식별 시 별도 프롬프트화 |

---

## False Positives (29차, 2026-04-08 스캔)

| 항목 | Agent | 검증 결과 |
|---|---|---|
| calibrations/non_conformances/equipment_imports/software_validations에 version 컬럼 없음 | C | **FALSE** — 4개 모두 `version: integer('version').notNull().default(1)` 존재 |
| disposal.controller.ts review/approve에 @AuditLog 없음 | A | **FALSE** — review:108, approve:147에 존재 |
| use-optimistic-mutation.ts:227 setQueryData 위반 | B | **FALSE** — onMutate 내부 optimistic update 컨텍스트(허용 패턴), 금지된 건 onSuccess만 |
| useState로 searchInput 관리(SSOT 위반) | B | **FALSE** (의심) — debounce input local state는 URL push와 별개의 일반 패턴, 필터 자체는 URL이 여전히 SSOT |

---

<details>
<summary>✅ 아카이브 — 완료된 프롬프트 (28차 세션, 2026-04-05)</summary>

### ~~🟠 HIGH — WF-17/18 E2E: 팀 스코프 테스트 데이터 조정~~ ✅ 완료

> 28차 (2026-04-05). workflow-helpers.ts 버그 4건 수정: startCheckout/returnCheckout PATCH→POST,
> 기본 role TE→TM, correctNonConformance API 경로. 장비 FCC EMC/RF 팀으로 변경.
> WF-17 5/5 PASS, WF-18 4/4 PASS.

### ~~🟠 HIGH — WF-19 E2E: 중간점검표 3단계 승인 + 반려~~ ✅ 완료

> 26차 (2026-04-05). wf-19-intermediate-inspection-3step-approval.spec.ts 생성.
> 9/9 PASS: draft→submitted→reviewed→approved + 반려 흐름.
> TE 권한 추가 (UPDATE_CALIBRATION), 교정 시드 고정 UUID (CALIB_001~003).

### ~~🟡 MEDIUM — WF-20 E2E: 자체점검표 확인 + 잠금~~ ✅ 완료

> 26차 (2026-04-05). wf-20-self-inspection-confirmation.spec.ts 생성.
> 7/7 PASS: 생성→수정→확인→잠금(수정/삭제 400)→권한(TE confirm 403).
> API 직접 생성 방식 — 시드 무의존.

### ~~🟡 MEDIUM — TE 교정 권한 검토: 중간점검 작성 권한 갭~~ ✅ 완료

> 26차 (2026-04-05). TE에게 UPDATE_CALIBRATION 추가 (role-permissions.ts).
> 절차서 기준 TE가 중간점검 점검자.

### ~~🟠 HIGH — E2E 시드 데이터: 교정 UUID 시딩~~ ✅ 부분 완료

> 26차 (2026-04-05). calibrations.seed.ts에 CALIB_001~003 고정 UUID 부여.
> WF-19 교정 시드 의존성 해결. WF-17/18 팀 스코프는 별도 프롬프트.

### ~~🟠 HIGH — API_ENDPOINTS.INTERMEDIATE_INSPECTIONS 미정의~~ ✅ 완료

> 25차 (2026-04-05). api-endpoints.ts에 INTERMEDIATE_INSPECTIONS 섹션 7개 엔드포인트 추가.

### ~~🟢 LOW — auth.controller.ts login/refresh @AuditLog 미적용~~ ✅ 완료

> 25차 (2026-04-05). login에 @AuditLog create, refresh에 @AuditLog update 추가.

### ~~🟠 HIGH — Frontend Dockerfile pnpm 버전 불일치~~ ✅ 완료

> 25차 (2026-04-05). pnpm@10.7.0 → 10.7.1 통일 (3곳).

### ~~🟡 MEDIUM — 새 라우트 error.tsx / loading.tsx 누락~~ ✅ 완료

> 25차 (2026-04-05). software/create/ error.tsx + loading.tsx 추가.

### ~~🟡 MEDIUM — 유효성확인 방법 1 공급자 첨부파일 + 수정 UI~~ ✅ 완료

> 커밋 fa466d99 (2026-04-05). ValidationDetailContent.tsx에 문서 첨부파일 Card 추가.

### ~~🟠 HIGH — UL-QP-18 절차서 준수 갭 해소~~ ✅ 완료

> PR #109 (2026-04-05). Harness Mode 2, MUST 15/15 PASS.

### SHOULD
- E2E CSS 셀렉터 → getByRole/getByText 전환 — pending-checks + create-equipment (2026-04-03, 10차)
- ReportsContent date-fns format → useDateFormatter 전환 (2026-04-03, 10차)

### ~~🟡 MEDIUM — 소프트웨어 관리대장 페이지네이션 + manufacturer 필터~~ ✅ 완료
### ~~🟡 MEDIUM — P0043 중복 관리번호 UNIQUE 제거~~ ✅ 완료
### ~~🟡 MEDIUM — 유효성확인 방법 1 receivedBy/receivedDate~~ ✅ 부분 완료
### ~~🟡 MEDIUM — AlertsContent aria-label~~ ✅ 완료
### ~~🟡 MEDIUM — Notifications @AuditLog + VIEW 퍼미션~~ ✅ 완료
### ~~🟡 MEDIUM — error.tsx / loading.tsx 루트별~~ ✅ 대부분 완료
### ~~🟠 HIGH — CI trivy-action + copilot-setup-steps~~ ✅ 완료
### ~~🟠 HIGH — UL-QP-18-03 중간점검표~~ ✅ 완료
### ~~🟠 HIGH — UL-QP-18-08 Cable/Path Loss~~ ✅ 완료
### ~~🟠 HIGH — 승인 대시보드 QM 누락~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — test_software createdBy~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — calibration_plans FK~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 유효성 확인 상세 뷰 + 반려~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 유효성확인 DB 컬럼 + 품질승인~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 장비 상세 탭 통합~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 장비↔시험용SW M:N 링크~~ ✅ 완료 (이전 세션)
### ~~🔴 CRITICAL — 소프트웨어 도메인 재설계~~ ✅ 완료 (PR #104)
### ~~🔴 CRITICAL — 담당자(정/부) JOIN + 폼 필드~~ ✅ 완료 (이전 세션)
### ~~🔴 CRITICAL — UL-QP-18-09 방법 2 프론트엔드~~ ✅ 완료 (이전 세션)
### ~~🔴 CRITICAL — 유효성확인 첨부파일 인프라~~ ✅ 완료 (이전 세션)

</details>

<details>
<summary>❌ False Positives — 누적 (22~26차)</summary>

### cables/intermediate-inspections 전용 Permission 분리 필요
> 사용자 판단: TE가 장비/교정/케이블 전부 조회·작성하는 게 기본 권한. 교정 권한 재사용 유지. FALSE POSITIVE (설계 의도).

### docker-compose.prod.yml postgres depends_on condition 누락
> 검증 결과: `condition: service_healthy` 명시 확인. FALSE POSITIVE.

### SELF_INSPECTIONS CREATE endpoint 누락
> BY_EQUIPMENT이 POST/GET 겸용 RESTful 패턴. FALSE POSITIVE.

### Cable enum / SelfInspection enum 미사용
> 프론트엔드 3파일 + 백엔드 DTO 2파일에서 사용 확인. FALSE POSITIVE.

### self-inspections delete() 캐시 무효화 누락
> 서비스에 캐시 인프라 자체가 없음. FALSE POSITIVE.

### SW-validations update/revise userId 미추출
> 이미 @Request() _req 있음. FALSE POSITIVE.

### Dockerfile COPY / history-card XML / console.log / 하드코딩 / FK 인덱스
> 모두 이전 세션에서 이미 수정 완료. FALSE POSITIVE (스캔 시점 차이).

### intermediate-checks API 미구현 (22차)
> calibration.controller.ts에 구현 확인. FALSE POSITIVE.

### software-validations update() 캐시 무효화 (22차)
> service에서 호출 확인. FALSE POSITIVE.

</details>
