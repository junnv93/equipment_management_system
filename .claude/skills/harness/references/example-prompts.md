# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-02 (4차 스캔 — 3-Agent 병렬 스캔 + 2차 검증)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용.

---

## 🟠 HIGH (성능/데이터 무결성)

### checkoutItems FK onDelete 정책 누락 (Mode 0)

```
checkoutItems.equipmentId FK에 onDelete 정책이 누락되어 있어.
PR #92에서 다른 FK는 restrict로 통일했는데 이건 빠짐.

위치: packages/db/src/schema/checkouts.ts:115-117
현재: .references(() => equipment.id)  // onDelete 없음
비교: checkoutItems.checkoutId는 { onDelete: 'cascade' } 적용됨

수정: { onDelete: 'restrict' } 추가 (장비 삭제 시 checkout 이력 보존)
검증: pnpm --filter @equipment-management/db run build && pnpm --filter backend run tsc --noEmit
```

### CI unit-test Turbo 캐시 미적용 (Mode 0)

```
CI main.yml의 unit-test job에 Turbo 캐시가 없어서 공유 패키지를 매번 재빌드해.

위치: .github/workflows/main.yml:132-153
문제: quality-gate job은 turbo cache (line 59-66) 사용하지만,
      unit-test job (line 142-150)은 node-modules-cache만 있고 turbo cache 없음
      → pnpm build --filter "@equipment-management/*" 매번 풀 빌드

수정: unit-test steps에 quality-gate와 동일한 turbo cache step 추가
검증: GitHub Actions에서 unit-test job의 Build 단계 시간 비교 (기대: ~15s → ~3s)
```

---

## 🟡 MEDIUM (품질/DX)

### AlertsContent activeTab URL SSOT 위반 (Mode 0)

```
알림 페이지의 activeTab이 useState로 관리되어 URL과 동기화되지 않아.
URL 공유/새로고침 시 탭 상태 유실됨.

위치: apps/frontend/app/(dashboard)/alerts/AlertsContent.tsx:102
현재: const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')
패턴: 다른 페이지들은 useSearchParams()로 URL SSOT 유지

수정: searchParams에서 tab 파라미터 읽기/쓰기 패턴으로 변경
참조: components/approvals/ApprovalsClient.tsx의 URL 탭 패턴
검증: 1) 탭 전환 후 새로고침 → 탭 유지  2) pnpm --filter frontend run tsc --noEmit
```

### PendingChecks 필터 미동작 (Mode 0)

```
PendingChecksClient의 필터 버튼(전체/대여자/대출자)이 UI에만 존재하고 실제 쿼리에 적용되지 않아.

위치: apps/frontend/app/(dashboard)/checkouts/pending-checks/PendingChecksClient.tsx:63
문제: _filter 상태가 버튼 variant 스타일에만 사용 (line 183,190,197)
      실제 useQuery의 queryFn에는 filter 파라미터 전달 없음 (line 66-72)

수정 방안:
  A) 필터를 쿼리에 반영 (백엔드 API가 지원하면)
  B) 클라이언트 사이드 필터링 적용
  C) 미구현 기능이면 필터 UI 제거
→ 도메인 결정 필요

검증: 필터 버튼 클릭 시 목록이 실제로 필터링되는지 확인
```

### softwareType TODO 해소 (Mode 1)

```
소프트웨어 장비별 조회 응답에서 softwareType이 항상 null 반환.

위치: apps/backend/src/modules/software/software.service.ts:460
현재: softwareType: null, // TODO: Add software type to schema

수정:
1. software 테이블의 softwareType 컬럼 확인 (packages/db/src/schema/software.ts)
2. 쿼리에서 softwareType 조회 → 응답에 매핑
3. softwareType이 스키마에 없으면 추가 필요 여부 판단

검증: GET /api/software/:id/equipment 응답에 softwareType 포함 확인
```

### userPreferences relations() 미정의 (Mode 0)

```
userPreferences 테이블에 Drizzle relations() 정의가 없어.

위치: packages/db/src/schema/user-preferences.ts
현재: 테이블 정의만 존재, relations() export 없음
비교: 다른 테이블(users, equipment 등)은 모두 relations() 정의됨

수정: userPreferencesRelations 추가 (userId → users.id 관계)
검증: pnpm --filter @equipment-management/db run build
```

---

## 🟢 LOW (접근성/정리)

### NCDetailClient 뒤로가기 버튼 aria-label (Mode 0)

```
부적합 상세 페이지의 뒤로가기 아이콘 버튼에 aria-label이 없어.

위치: apps/frontend/components/non-conformances/NCDetailClient.tsx:281
현재: <Button variant="ghost" size="icon" ...> <ArrowLeft /> </Button>

수정: aria-label={t('detail.backButton')} 추가 + i18n 키 등록
검증: 스크린리더에서 "뒤로가기" 버튼으로 인식 확인
```

### i18n Phase 3 유틸리티 TODO (Mode 1)

```
response-transformers.ts의 HTTP 에러 메시지가 아직 i18n 키로 전환되지 않았어.

위치: apps/frontend/lib/api/utils/response-transformers.ts:334
TODO: Phase 3에서 errors.json의 키(VALIDATION_ERROR, UNAUTHORIZED 등)로 전환
현재: 순수 유틸리티 함수로 translation context 없음 — 호출자 레벨에서 처리 예정

수정: 호출자 컴포넌트에서 errorCode 기반 i18n 메시지 표시 패턴 적용
참조: lib/errors/ 패턴
검증: pnpm --filter frontend run tsc --noEmit + 에러 발생 시 한국어 메시지 확인
```

---

## 📋 복합 작업 (Mode 2 — Full Harness)

### 테스트 커버리지 확대 (Mode 2)

```
테스트가 부족한 백엔드 모듈에 기본 테스트 스위트를 추가해줘.

대상 (test.todo 2건 포함):
1. checkouts — approve/return 테스트 todo 2건 해소
2. calibration-plans — 승인 워크플로우 테스트 부재

각 모듈 테스트:
- 기존 패턴 참조: modules/calibration/__tests__/
- DI mock 패턴: common/testing/mock-providers.ts 활용
- 최소 coverage: service 메서드별 1개 테스트 (happy path)

검증: pnpm --filter backend run test → 전체 PASS
```

---

## 📦 완료 항목 아카이브

<details>
<summary>완료된 항목 (21건)</summary>

### 🟠 HIGH
- ✅ 프론트엔드 하드코딩 한국어 i18n 전환 — commit d6c8c0cd (2026-04-02)
- ✅ Equipment approvalStatus 인덱스 추가 — commit d6c8c0cd (2026-04-02)

### 🟡 MEDIUM
- ✅ 미사용 Permission enum 5건 정리 — PR #92 (2026-04-02)
- ✅ CI pnpm install 캐시 최적화 — PR #92 (2026-04-02)
- ✅ FK ON DELETE 정책 cascade→restrict 통일 — PR #92 (2026-04-02)
- ✅ 부적합 수리 워크플로우 E2E FIXME 해소 — commit 3f93f3e3 (2026-04-02)

### 🟢 LOW
- ✅ 교정 필터 E2E 테스트 — PR #85에서 중복 삭제 (list-primary-filters.spec.ts가 커버)
- ✅ i18n 에러 메시지 Phase 3 구현 — PR #85 (2026-04-02)
- ✅ 폐기 취소 확인 다이얼로그 — commit d6c8c0cd (2026-04-02)

### 📋 복합
- ✅ 모니터링 대시보드 프론트엔드 — PR #88 (2026-04-02)

### 이전 세션 완료
- ✅ SSE 엔드포인트 권한 강화 — 이미 구현됨 (2026-04-02)
- ✅ 부적합 관리 권한 버그 — PR #79 (2026-04-02)
- ✅ 모니터링 cache-stats 엔드포인트 — PR #77 (2026-04-02)
- ✅ Software softwareType 스키마 — PR #82 (2026-04-02)
- ✅ 누락된 loading.tsx — 이전 세션 완료
- ✅ DB 인덱스 (calibrations.technicianId) — 이전 세션 완료
- ✅ 미커밋 테스트 정리 — 이미 커밋됨
- ✅ documents relations — 이미 구현됨
- ❌ 모니터링 @AuditLog — @Public 엔드포인트라 적용 불가
- ✅ E2E CI auth.setup — PR #83 (2026-04-02)
- ✅ CodeQL workflow — PR #74 (비활성화)

</details>

<details>
<summary>거짓 양성으로 판명된 항목 (8건)</summary>

### 이전 스캔 (2026-04-02 3차)
- ❌ 교정계획 @AuditLog 누락 — 11개 엔드포인트 전부 @AuditLog 적용됨
- ❌ auth.service.ts 빈 catch — logger.warn() 포함 + 의도적 fail-open 설계
- ❌ 누락된 error.tsx 16건 — 12개 라우트 전부 error.tsx 존재

### 4차 스캔 (2026-04-02)
- ❌ @AuditLog decorator 순서 (non-conformances.controller.ts) — NestJS method decorator 순서는 기능에 영향 없음
- ❌ error.tsx/loading.tsx 26건 누락 — 부모 라우트 cascading error boundary가 자식 라우트 커버 (28 error.tsx, 29 loading.tsx 존재)
- ❌ Turbo cache key pnpm-lock만 참조 — Turbo 자체 내부 해싱이 package.json 변경 감지
- ❌ system-settings 인덱스 부족 — 100 rows 미만 테이블, compound index(category, site) 충분
- ❌ PATCH 'me/preferences' @AuditLog 누락 — display preferences는 비즈니스 감사 대상 아님

교훈: 에이전트 1차 스캔 결과는 반드시 2차 검증 필요. 4차 스캔 거짓양성률: 38% (5/13).
</details>
