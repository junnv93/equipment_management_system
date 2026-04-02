# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 분석일: 2026-04-02 (2차 스캔 + 검증 완료)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용.

---

## 🟠 HIGH — 성능/i18n

### 프론트엔드 하드코딩 한국어 문자열 i18n 전환 (Mode 1)

```
컴포넌트 파일에 한국어 문자열이 직접 하드코딩되어 있어.
messages/{en,ko}/*.json으로 이동해줘.

검증 완료된 위치:
- components/auth/LoginPageContent.tsx:201 — '장비 등록 · 교정 · 반출 관리'
- components/auth/LoginPageContent.tsx:202 — '역할 기반 승인 워크플로우'
- components/shared/FormWizardStepper.tsx:81 — '완료' (aria-label 내)
- components/shared/EquipmentSelector.tsx:64 — '장비명, 관리번호 검색...'

참고: PrintableAuditReport.tsx:32 "2025년 교정 승인 이력"은 JSDoc 예시이므로 제외.
참고: console.log 내부의 한국어는 개발 디버깅용이므로 제외.

검증: tsc --noEmit + verify-i18n (en/ko 키 매칭)
```

### Equipment approvalStatus 인덱스 추가 (Mode 0)

```
equipment 테이블에서 승인 대기 목록 조회에 사용되는 approvalStatus에 인덱스가 없어.

현재 인덱스 현황 (이미 존재):
- teamId ✅ (teamIdIdx + teamStatusIdx 복합)
- site ✅ (siteIdx)
- status, location, manufacturer, managerId, isActive, name 등 ✅

누락:
- approvalStatus — 승인 대기 목록 필터링에 사용 (admin/equipment-approvals 페이지)

위치: packages/db/src/schema/equipment.ts
마이그레이션: drizzle/manual/20260402_add_equipment_approval_status_index.sql
검증: tsc --noEmit
```

---

## 🟡 MEDIUM — 코드 품질/정비

### 미사용 Permission enum 정리 (Mode 0) — 사용자 확인 필요

```
shared-constants/permissions.ts에 정의 + role-permissions.ts에 역할 할당까지 되어 있지만,
백엔드 @RequirePermissions와 프론트엔드 can() 양쪽 모두에서 실제 사용되지 않는 Permission 5건.

대상:
- Permission.CREATE_DASHBOARD — lab_manager에 할당, 사용처 0
- Permission.CREATE_NOTIFICATION — technical_manager, lab_manager에 할당, 사용처 0
- Permission.MANAGE_NOTIFICATION_SETTINGS — lab_manager에 할당, 사용처 0
- Permission.MANAGE_REPORTS — lab_manager에 할당, 사용처 0
- Permission.VIEW_DISPOSAL_REQUESTS — technical_manager, lab_manager에 할당, 사용처 0

판단 필요: 향후 구현 예정 기능을 위한 선행 정의인지, 불필요한 코드인지 사용자 확인 필요.
- 선행 정의 → 유지 + TODO 주석 추가
- 불필요 → permissions.ts + role-permissions.ts + permission-categories.ts에서 제거

검증: tsc --noEmit (양쪽)
```

### CI pnpm install 중복 제거 — 캐시 최적화 (Mode 1)

```
main.yml에서 quality-gate, unit-test, build, dep-audit 4개 job이
각각 독립적으로 pnpm install을 실행해. 캐시 전략으로 최적화해줘.

현재: 각 job마다 ~40초 pnpm install (4번 × 40초 = 2분 40초 낭비)
목표: quality-gate에서 1회 install → 나머지 job은 캐시 히트

수정:
1. quality-gate에서 node_modules 캐시 저장 (actions/cache@v4)
2. unit-test, build, dep-audit에서 fail-on-cache-miss: true로 캐시 복원
3. pnpm store 캐시도 공유

검증: PR CI 파이프라인 실행 시간 ~2분 단축 확인
```

### 부적합 수리 워크플로우 E2E FIXME 해소 (Mode 1)

```
full-workflow.spec.ts의 FIXME 4건을 해소해줘.

위치: tests/e2e/features/non-conformances/repair-workflow/group-4-integration/

FIXME 목록:
- line 109: "수리 이력 등록 시 '입력 데이터 검증 실패' 오류 발생"
- line 179: "D-3 테스트에 의존하는 워크플로우 테스트"
- line 205: "D-3, D-4 테스트에 의존하는 워크플로우 테스트"
- line 239: "D-3~D-5 테스트에 의존하는 워크플로우 테스트"

조사:
1. line 109: 백엔드 수리이력 Zod 스키마와 프론트엔드 폼 필드 불일치 확인
2. line 179+: serial 의존성 체인 — 앞 테스트 실패 시 연쇄 스킵

검증: full-workflow.spec.ts 전체 PASS
```

### FK ON DELETE 정책 일관성 검토 (Mode 0) — 사용자 확인 필요

```
equipment 관련 FK의 ON DELETE 정책이 일관되지 않아.

현재 상태 (검증 완료):
- equipment → non_conformances: onDelete: 'restrict' ✓ (이력 보존)
- equipment → calibrations: onDelete: 'restrict' ✓ (이력 보존)
- equipment → disposal_requests: onDelete: 'cascade' ⚠️ (폐기 이력 삭제됨)
- equipment → calibration_plans: onDelete: 'cascade' ⚠️ (교정계획 이력 삭제됨)

판단 필요:
- UL-QP-18 기준으로 교정계획/폐기 이력은 보존해야 하는가?
  → 보존 필요 시: 'cascade' → 'restrict'로 변경
  → 삭제 허용 시: 현행 유지 + 의도 주석 추가

위치: packages/db/src/schema/disposal-requests.ts, calibration-plans.ts
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

검증: calibration-filter.spec.ts 전체 PASS
```

### i18n 에러 메시지 Phase 3 구현 (Mode 1)

```
response-transformers.ts의 i18n TODO를 해소해줘:
"TODO(i18n): Phase 3에서 errors.json의 키로 전환"
(lib/api/utils/response-transformers.ts line 334)

현재: 에러 메시지가 한국어/영어 하드코딩
목표: i18n 키 기반으로 전환

작업:
1. 에러 코드별 i18n 키 매핑 테이블 정의
2. mapBackendErrorCode()에서 i18n 키 반환
3. ERROR_MESSAGES를 i18n 파일로 이동
4. 기존 EquipmentErrorCode 체계 호환 유지

주의: 에러 핸들링 체인 전체에 영향 — 변경 범위 신중하게
검증: tsc --noEmit + 에러 발생 시나리오 수동 테스트
```

### 폐기 취소 확인 다이얼로그 미구현 (Mode 0)

```
EquipmentDetailClient.tsx:181에 TODO가 있어:
"TODO: Implement cancel confirmation dialog"

폐기 요청 취소 시 확인 다이얼로그 없이 즉시 실행됨.
사용자 실수 방지를 위해 AlertDialog 추가 필요.

패턴: 기존 삭제 확인 다이얼로그 참조 (예: checkout 취소)
검증: tsc --noEmit
```

---

## 📋 복합 작업 (Mode 2 — Full Harness)

### 모니터링 대시보드 프론트엔드 (Mode 2)

```
모니터링 백엔드 API는 완성 상태 (7개 엔드포인트).
프론트엔드 대시보드 페이지를 생성해줘.

구현:
1. /admin/monitoring 페이지 생성
   - 시스템 리소스 (CPU, 메모리) — 게이지 차트
   - HTTP 요청 통계 — 엔드포인트별 응답 시간, 에러율
   - 캐시 성능 — hit rate, size
   - 헬스 상태 — 서비스별 UP/DOWN
2. TanStack Query: REFETCH_STRATEGIES.IMPORTANT (2분 폴링)
3. 역할 제한: system_admin만 접근

검증: tsc + build + 페이지 렌더링 확인
```

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
<summary>이전 세션에서 완료된 항목 (10건)</summary>

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
<summary>2차 스캔에서 거짓 양성으로 판명된 항목 (3건)</summary>

- ❌ 교정계획 @AuditLog 누락 — 11개 엔드포인트 전부 @AuditLog 적용됨 (거짓 양성)
- ❌ auth.service.ts 빈 catch — logger.warn() 포함 + 의도적 fail-open 설계 (거짓 양성)
- ❌ 누락된 error.tsx 16건 — 12개 라우트 전부 error.tsx 존재 (거짓 양성)

교훈: 에이전트 1차 스캔 결과는 반드시 2차 검증 필요.
</details>
