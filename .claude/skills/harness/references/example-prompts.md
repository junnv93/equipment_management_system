# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 분석일: 2026-04-01**
> 코드베이스를 실제 분석하여 발견된 이슈/작업을 하네스 프롬프트로 정리.
> `/harness [프롬프트]` 형태로 사용.

---

## 🔴 CRITICAL — 보안/데이터 무결성

### SSE 엔드포인트 권한 강화 (Mode 1)

```
notification-sse.controller.ts의 SSE 엔드포인트에 권한 검증을 추가해줘.

현재 상태:
- stream() (line 32): @SseAuthenticated()만 사용 — 인증은 있지만 인가(권한) 검증 없음
- getStats() (line 57): 동일하게 @SseAuthenticated()만 사용

수정 사항:
- getStats()에 @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS) 추가
  (SSE 연결 통계는 시스템 관리 기능)
- stream()은 인증된 사용자 누구나 알림을 받아야 하므로 현재 유지 가능
  — 단, @SkipPermissions() 명시적 추가로 의도를 드러내기

검증: pnpm --filter backend run tsc --noEmit + 관련 테스트
```

### 부적합 관리 권한 버그 수정 (Mode 1)

```
test_engineer 역할이 부적합(NC) "기록 수정" 버튼을 볼 수 있는 권한 버그를 수정해줘.

FIXME 위치:
- tests/e2e/features/non-conformances/repair-workflow/group-2-repair-dialog/
  nc-management-permissions.spec.ts (line 26)
- "FIXME: 권한 버그 - 시험실무자(test_engineer)가 '기록 수정' 버튼을 볼 수 있음"

UL-QP-18 규칙:
- test_engineer(시험실무자)는 기본 CRUD만 가능
- 부적합 기록 수정은 technical_manager 이상만 가능

조사 포인트:
1. 프론트엔드: 해당 버튼의 permission 체크 로직 확인
2. 백엔드: NC update 엔드포인트의 @RequirePermissions 확인
3. FIXME 주석을 제거하고 테스트가 정상 통과하도록 수정

검증: E2E 테스트 nc-management-permissions.spec.ts PASS
```

---

## 🟠 HIGH — 기능 갭/성능

### ~~모니터링 캐시 통계 엔드포인트 완성 (Mode 1)~~ ✅ 완료 (2026-04-02)

```
결과: SimpleCacheService.getCacheStats()를 MonitoringService→Controller로 연결 완료.

변경 파일:
- packages/shared-constants/src/api-endpoints.ts — CACHE_STATS 경로 등록 (SSOT)
- apps/backend/src/modules/monitoring/monitoring.service.ts — SimpleCacheService 주입,
  getCacheStats() 위임, getHealthStatus() cache.hitRate 실제 연결,
  getDiagnostics() cache 필드 추가
- apps/backend/src/modules/monitoring/monitoring.controller.ts — GET cache-stats 엔드포인트
  + @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS),
  Controller↔Service 반환 타입 isSimulated 필드 동기화

교훈: Controller 반환 타입과 Service 반환 타입이 구조적 타이핑으로 tsc 통과하더라도
Swagger/OpenAPI 스키마에서 필드가 누락됨 — 반환 타입 수동 복사 시 isSimulated 같은
플래그 필드 누락 주의. 장기적으로 ReturnType<> 활용 권장.
```

### DB 인덱스 누락 보완 (Mode 1)

```
고빈도 조회 테이블에 인덱스가 누락되어 있어. 추가해줘.

1. equipment_maintenance_history (packages/db/src/schema/equipment-maintenance-history.ts)
   - 현재: PRIMARY KEY만 존재, 명시적 인덱스 0개
   - 추가 필요:
     - equipmentId (장비별 수리이력 조회 — 장비 상세 페이지 핵심 쿼리)
     - performedAt (날짜순 정렬)
     - (equipmentId, performedAt) 복합 인덱스 (가장 빈번한 쿼리 패턴)

2. user_preferences (packages/db/src/schema/user-preferences.ts)
   - 현재: 명시적 인덱스 0개
   - 추가 필요:
     - userId (사용자별 설정 조회 — 매 로그인 시 호출)

기존 인덱스 패턴 참고: packages/db/src/schema/equipment.ts의 인덱스 정의 방식
검증: pnpm --filter backend run db:generate → 마이그레이션 생성 확인
```

### Software 모듈 TODO 해소 — softwareType 스키마 추가 (Mode 1)

```
software.service.ts line 460의 TODO를 해소해줘:
"softwareType: null, // TODO: Add software type to schema"

작업:
1. packages/schemas에 SoftwareType enum 추가:
   - measurement (측정용), analysis (분석용), control (제어용), utility (유틸리티), other (기타)
2. packages/db/src/schema/software.ts에 softwareType 컬럼 추가 (varchar + $type<>)
3. software.service.ts의 getSoftwareUsageByEquipment()에서 null 대신 실제 값 매핑
4. 관련 DTO(create/update)에 softwareType 필드 추가
5. 프론트엔드 소프트웨어 등록/편집 폼에 타입 선택 드롭다운 추가

주의: varchar + $type<> 패턴 사용 (값이 확장될 수 있는 enum — CLAUDE.md 규칙)
검증: tsc --noEmit + software 테스트
```

### 누락된 loading.tsx 페이지 추가 (Mode 1)

```
page.tsx는 있지만 loading.tsx가 없는 라우트에 로딩 스켈레톤을 추가해줘.

누락 라우트 (확인된 것):
- (dashboard)/checkouts/manage/
- (dashboard)/checkouts/import/
- (dashboard)/checkouts/pending-checks/
- (dashboard)/checkouts/[id]/
- (dashboard)/reports/calibration-factors/
- (dashboard)/equipment/create/
- (dashboard)/calibration/register/
- (dashboard)/teams/create/

각 loading.tsx:
- 해당 페이지의 레이아웃에 맞는 Skeleton 컴포넌트 사용
- 기존 loading.tsx 패턴 참조: (dashboard)/equipment/loading.tsx
- Next.js 16 PPR과 호환되는 Suspense fallback 역할

검증: pnpm --filter frontend run build → 빌드 성공
```

---

## 🟡 MEDIUM — 테스트 커버리지/코드 품질

### 미커밋 테스트 파일 정리 및 보완 (Mode 0)

```
git status에 4개 untracked __tests__ 디렉토리가 있어. 내용을 확인하고 커밋해줘.

대상:
- apps/backend/src/modules/audit/__tests__/audit.service.spec.ts
- apps/backend/src/modules/monitoring/__tests__/monitoring.service.spec.ts
- apps/backend/src/modules/settings/__tests__/settings.service.spec.ts
- apps/backend/src/modules/software/__tests__/software.service.spec.ts

절차:
1. 각 테스트 파일이 실행 가능한지 확인 (pnpm --filter backend run test -- --grep "모듈명")
2. 실패하는 테스트가 있으면 수정
3. 통과 확인 후 커밋
```

### 부적합 수리 워크플로우 E2E 테스트 FIXME 해소 (Mode 1)

```
부적합 수리 워크플로우 E2E 테스트의 FIXME 4건을 해소해줘.

위치: tests/e2e/features/non-conformances/repair-workflow/group-4-integration/
      full-workflow.spec.ts

FIXME 목록:
- line 109: "수리 이력 등록 시 '입력 데이터 검증 실패' 오류 발생"
- line 179: "D-3 테스트에 의존하는 워크플로우 테스트"
- line 205: "D-3, D-4 테스트에 의존하는 워크플로우 테스트"
- line 239: "D-3~D-5 테스트에 의존하는 워크플로우 테스트"

조사 방향:
1. line 109: 백엔드 수리이력 등록 API의 Zod 스키마와 프론트엔드 폼 필드 불일치 확인
2. line 179+: serial 모드 테스트 의존성 체인 — 앞 테스트 실패 시 뒤 테스트 전부 스킵되는 구조
3. 근본 원인 수정 후 FIXME 주석 제거

검증: full-workflow.spec.ts 전체 PASS
```

### 모니터링 컨트롤러 @AuditLog 추가 (Mode 0)

```
monitoring.controller.ts의 상태 변경 엔드포인트에 @AuditLog 추가해줘.

대상:
- @Post('client-errors') reportClientError() (line 21)
  → @AuditLog({ action: 'report', entityType: 'client_error' })

나머지 GET 엔드포인트(health, metrics, diagnostics, status, http-stats)는
읽기 전용이므로 감사 로그 불필요.

검증: tsc --noEmit
```

### 미커밋 변경사항 정리 및 커밋 (Mode 0)

```
git status에 11개 수정 파일이 커밋되지 않은 상태야. 내용을 분석하고 논리적 단위로 나눠서 커밋해줘.

수정된 파일:
- apps/backend/src/common/cache/simple-cache.service.ts (캐시 통계 추가)
- apps/backend/src/modules/monitoring/monitoring.controller.ts
- apps/backend/src/modules/monitoring/monitoring.service.ts
- apps/frontend/components/approvals/ApprovalDetailModal.tsx (모션 토큰 수정)
- apps/frontend/lib/design-tokens/components/equipment.ts
- apps/frontend/lib/design-tokens/components/sidebar.ts
- apps/frontend/lib/design-tokens/index.ts
- apps/frontend/lib/design-tokens/motion.ts
- apps/frontend/next-env.d.ts
- apps/frontend/tailwind.config.js
- packages/shared-constants/src/business-rules.ts (MAX_TRACKED_ENDPOINTS)

커밋 분리 제안:
1. feat(monitoring): 캐시 통계 + 모니터링 개선 (backend 4파일 + shared-constants)
2. refactor(design-tokens): 모션 토큰 + 디자인 토큰 정리 (frontend 5파일)
3. chore: next-env.d.ts 업데이트 (자동생성)

각 커밋 전 tsc --noEmit 확인.
```

---

## 🔴 CRITICAL — CI/CD 인프라

### E2E CI 인프라 안정화 — auth.setup 환경 설정 (Mode 1)

```
CI 환경에서 Playwright E2E auth.setup.ts가 5개 역할 로그인에 모두 실패하는 문제를
시스템 아키텍처 수준에서 근본 해결해줘.

모든 이슈사항에 대해 시니어 웹개발 전문가로서 문제를 해결함에 있어 현재 문제를
단편적으로 임시방편으로 해결하는게 아니라 아키택처 수준에서 시스템 전반의 개선이
이루어질수있도록 SSOT를 준수하면서, 하드코딩하지않고, 크로스 사이트 워크플로우와
성능을 고려하면서 개발을 진행해줘.

현재 상태:
- PR #73에서 E2E CI job 추가 완료, continue-on-error: true로 임시 설정됨
- Backend 시작 성공 (NestJS "Application successfully started" 확인)
- DB migration + seed 성공 (30/30 checks passed)
- auth.setup.ts의 5개 역할 로그인 전부 실패 (test_engineer~system_admin)

에러: apps/frontend/tests/e2e/auth.setup.ts:53 — 로그인 실패

조사 방향 (아키텍처 수준):
1. auth.setup.ts 로그인 흐름 전체 추적:
   - auth.setup.ts → /login 페이지 → NextAuth signIn() → backend test-login API
   - 각 단계에서 필요한 환경변수가 CI에 전달되는지 E2E 스택 전체 검증
2. 환경변수 SSOT 확립:
   - .env.ci.example을 기준으로 CI workflow의 env 블록과 1:1 매핑 확인
   - 하드코딩된 CI fallback 값들이 실제 동작에 충분한지 검증
   - 특히: NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_API_URL, INTERNAL_API_KEY
3. test-login 엔드포인트 활성화 조건:
   - backend auth.controller.ts의 test-login 라우트가 NODE_ENV=test에서 활성화되는지
   - SiteScoped 격리 하에서 test 역할의 사이트 접근이 올바른지
4. Frontend 런타임 환경:
   - Next.js build 시점 vs runtime 시점 환경변수 구분 (NEXT_PUBLIC_* vs 서버사이드)
   - proxy.ts (구 middleware.ts)가 backend로 API 요청을 올바르게 프록시하는지

수정 원칙:
- 환경변수를 하드코딩하지 않음 — .env.ci.example + secrets fallback 패턴
- E2E 인증 흐름은 로컬과 CI에서 동일한 코드 경로를 사용해야 함 (분기 금지)
- auth.setup.ts의 storageState 기반 인증 아키텍처 유지 (CLAUDE.md E2E Auth Rules)

완료 후:
- continue-on-error: true 제거
- docker-build의 needs에 e2e-test 다시 추가
- branch protection ruleset에 "E2E Tests (Playwright)" 추가

검증:
1. PR CI에서 E2E Tests (Playwright) PASS
2. 로컬 E2E 테스트도 여전히 PASS (환경 패리티)
3. .env.ci.example과 CI workflow env 블록 1:1 매핑 확인
```

### CodeQL workflow 실패 수정 (Mode 1)

```
codeql.yml의 CodeQL Analysis가 PR에서 계속 실패하는 문제를
CI 인프라 아키텍처 수준에서 근본 해결해줘.

모든 이슈사항에 대해 시니어 웹개발 전문가로서 문제를 해결함에 있어 현재 문제를
단편적으로 임시방편으로 해결하는게 아니라 아키택처 수준에서 시스템 전반의 개선이
이루어질수있도록 SSOT를 준수하면서, 하드코딩하지않고 개발을 진행해줘.

현재 상태:
- .github/workflows/codeql.yml이 push/PR/weekly cron으로 실행
- 매 PR에서 7분 실행 후 fail
- main.yml과 별도 workflow — 직접적 배포 차단은 없지만 PR checks에 빨간 X

조사 방향 (아키텍처 수준):
1. codeql.yml 에러 로그 분석:
   - gh run view <run-id> --log-failed (codeql workflow의 run ID)
   - Autobuild 실패인지 Analysis 실패인지 구분
2. 빌드 환경 정합성:
   - main.yml은 pnpm/action-setup@v5 + packageManager 자동감지를 사용
   - codeql.yml은 Autobuild를 사용 — pnpm monorepo를 올바르게 인식하는지
   - turbo v2.9.3 업그레이드 후 Autobuild 호환성
3. 권한 정합성:
   - main.yml에 추가한 permissions 블록이 codeql.yml에도 필요한지
   - security-events: write가 CodeQL results 업로드에 필수
4. SSOT 개선:
   - main.yml과 codeql.yml의 공통 설정(Node 버전, pnpm 설정)을 일관되게 유지
   - Autobuild 대신 명시적 빌드 스텝 사용하여 빌드 방식을 SSOT로 관리

수정 원칙:
- Autobuild 의존 제거 → pnpm install + pnpm build 명시적 스텝 (main.yml과 동일)
- permissions 블록을 codeql.yml에도 추가
- Node/pnpm 버전을 main.yml과 동기화 (하드코딩 X, packageManager 자동감지)

검증:
1. PR에서 CodeQL Analysis PASS
2. GitHub Security 탭에 분석 결과 정상 표시
3. main.yml과 codeql.yml의 빌드 환경 일치 확인
```

---

## 🟢 LOW — 개선/정비

### 교정 필터 E2E 테스트 활성화 (Mode 1)

```
비활성화된 교정 필터 E2E 테스트를 수정하고 활성화해줘.

위치: tests/e2e/features/calibration/filters/calibration-filter.spec.ts (line 8)
상태: 2026-02-12 이후 전체 비활성화

조사:
1. 비활성화 사유 확인 (주석 또는 git blame)
2. 현재 교정 필터 UI가 테스트와 일치하는지 확인
3. 필요 시 locator 업데이트 (getByRole 패턴 준수)
4. auth.fixture 사용 확인 (loginAs 패턴 금지)

검증: calibration-filter.spec.ts 전체 PASS
```

### i18n 에러 메시지 Phase 3 구현 (Mode 1)

```
response-transformers.ts의 i18n TODO를 해소해줘:
"TODO(i18n): Phase 3에서 errors.json의 키(VALIDATION_ERROR, UNAUTHORIZED 등)로 전환"
(lib/api/utils/response-transformers.ts line 334)

현재: 에러 메시지가 한국어/영어 하드코딩
목표: i18n 키 기반으로 전환하여 locale에 따라 자동 전환

작업:
1. 에러 코드별 i18n 키 매핑 테이블 정의
2. mapBackendErrorCode()에서 i18n 키 반환하도록 수정
3. ERROR_MESSAGES를 i18n 파일(ko.json, en.json)로 이동
4. 기존 EquipmentErrorCode 체계와 호환 유지

주의: 프론트엔드 전체 에러 핸들링 체인에 영향 — 변경 범위 신중하게
검증: tsc --noEmit + 에러 발생 시나리오 수동 테스트
```

### 테스트 미존재 모듈 커버리지 확보 (Mode 2)

```
테스트가 없는 백엔드 모듈에 기본 테스트 스위트를 추가해줘.

대상 모듈:
1. data-migration — 마이그레이션 유틸리티 (서비스 단위 테스트)
2. documents — 문서 관리 (CRUD + 파일 업로드 mock 테스트)
3. notifications — 알림 서비스 (이벤트 발행/구독 + SSE 테스트)
4. reports — 리포트 생성 (DB 집계 쿼리 + 파일 생성 테스트)

각 모듈 테스트:
- 기존 테스트 패턴 참조: modules/calibration/__tests__/
- DI mock 패턴: common/testing/mock-providers.ts 활용
- SimpleCacheService, EventEmitter2 mock 포함 (보안 아키텍처 Phase 2+3 패턴)
- 최소 coverage: service 메서드별 1개 테스트 (happy path)

검증: pnpm --filter backend run test → 전체 PASS, 새 테스트 포함
```

### documents 스키마 Drizzle relations 보완 (Mode 0)

```
packages/db/src/schema/documents.ts에 foreign key는 있지만
Drizzle ORM relations() 정의가 누락되어 있어. 추가해줘.

누락된 relations:
- equipmentId → equipment 테이블
- calibrationId → calibrations 테이블
- requestId → equipment_requests 테이블

기존 relations 패턴 참조: packages/db/src/schema/equipment.ts의 equipmentRelations
검증: tsc --noEmit (타입 안전 쿼리 활성화)
```

---

## 📋 복합 작업 (Mode 2 — Full Harness)

### 모니터링 대시보드 통합 완성 (Mode 2)

```
현재 모니터링 백엔드는 거의 완성되어 있지만 프론트엔드와 통합이 부족해.
모니터링 대시보드를 완성해줘.

현재 상태:
- MonitoringService: 시스템 메트릭, HTTP 통계, DB 진단, 헬스체크 구현 완료
- MonitoringController: 6개 엔드포인트 존재
- SimpleCacheService: getCacheStats() 구현 완료
- 프론트엔드: /admin 페이지 존재하지만 모니터링 전용 대시보드 없음

구현:
1. 백엔드: ✅ GET /api/monitoring/cache-stats 엔드포인트 완료 (2026-04-02)
2. 프론트엔드: /admin/monitoring 페이지 생성
   - 시스템 리소스 (CPU, 메모리, 디스크) — 게이지 차트
   - HTTP 요청 통계 — 엔드포인트별 응답 시간, 에러율
   - 캐시 성능 — hit rate, size, 최대 용량
   - DB 상태 — 커넥션 풀, 쿼리 성능
   - 헬스 상태 — 서비스별 UP/DOWN
3. TanStack Query 적용: REFETCH_STRATEGIES.IMPORTANT (2분 폴링)
4. 역할 제한: lab_manager, system_admin만 접근

검증: tsc + build + 페이지 렌더링 확인
```

### 부적합→수리 워크플로우 안정화 (Mode 2)

```
부적합 관리의 수리 워크플로우에 여러 FIXME가 걸려 있어. 근본 원인을 찾아 전체 흐름을 안정화해줘.

문제점:
1. 수리이력 등록 시 "입력 데이터 검증 실패" (full-workflow.spec.ts:109)
   → 백엔드 Zod 스키마와 프론트엔드 폼 필드 불일치 의심
2. test_engineer가 "기록 수정" 버튼 접근 가능 (nc-management-permissions.spec.ts:26)
   → 권한 체크 로직 버그
3. 워크플로우 테스트 체인 전체가 첫 FIXME에 의존하여 연쇄 실패

조사 범위:
- 백엔드: non-conformances 모듈의 repair 관련 DTO/서비스/컨트롤러
- 프론트엔드: 부적합 상세 페이지의 수리 다이얼로그 컴포넌트
- 권한: @RequirePermissions 데코레이터 + 프론트엔드 permission 체크

목표: FIXME 5건 전부 제거 + E2E 테스트 전체 PASS
```
