---
slug: tech-debt-batch-0430e
created: 2026-04-30
mode: 1 (Lightweight)
scope:
  - apps/frontend/app/(dashboard)/settings/display/DisplayPreferencesContent.tsx
  - apps/frontend/tests/e2e/workflows/wf-ap02-approvals-bulk-reject.spec.ts
  - apps/frontend/tests/e2e/features/pwa/legacy-sw-cleanup.spec.ts (신규)
---

# Contract: tech-debt-batch-0430e

## 목적

3개의 tech-debt SHOULD 항목을 처리한다:

1. **S1 display-preferences-select-ssot** — DisplayPreferencesContent.tsx SelectItem value를 SSOT 배열(.map())로 교체
2. **S8 bulk-reject e2e** — wf-ap02 스펙에 Step 8(5건 mock bulk-reject) + Step 9(부분 실패 시뮬레이션) 추가
3. **legacy-sw-unregister-e2e-verification** — LegacyServiceWorkerCleanup 컴포넌트 E2E 검증 스펙 신설

---

## MUST Criteria (FAIL → 루프 재진입)

### M1: TypeScript 컴파일 통과
- `pnpm --filter frontend run tsc --noEmit` 오류 0건
- 변경된 파일의 타입 에러 없음

### M2: SSOT .map() 교체 (S1)
- `DisplayPreferencesContent.tsx`에서 `ITEMS_PER_PAGE_OPTIONS`, `DATE_FORMAT_OPTIONS`, `EQUIPMENT_SORT_OPTIONS`, `SUPPORTED_LOCALES` 4개 모두 `@equipment-management/schemas`에서 import
- 4개 Select 필드 모두 SSOT 배열 `.map()`으로 SelectItem 생성 (hardcoded value 문자열 잔존 금지)
- `grep -n 'value="ko"\|value="en"\|value="10"\|value="20"\|value="50"\|value="YYYY-MM-DD"\|value="YYYY.MM.DD"\|value="managementNumber"\|value="name"\|value="updatedAt"' DisplayPreferencesContent.tsx` → 0건 (또는 .map() 내부에서만 사용)

### M3: dateFormat UI 렌더링 정확성 (S1)
- `YYYY-MM-DD` 포맷의 예시 날짜 `2026-02-15`와 i18n 키 `iso`가 올바르게 렌더링
- `YYYY.MM.DD` 포맷의 예시 날짜 `2026.02.15`와 i18n 키 `korean`이 올바르게 렌더링
- 로컬 UI 상수(`DATE_FORMAT_EXAMPLE`, `DATE_FORMAT_I18N_KEY` 또는 동등 패턴) 존재

### M4: wf-ap02 Step 8 — bulk-reject 전체 성공 mock (S8)
- `page.route()` 또는 `page.context().route()`로 `**/api/checkouts/bulk-reject` intercept
  (approvals 목록 API는 다중 도메인 집계 구조라 단일 mock 불가 — bulk-reject 응답만 mock)
- Mock 응답: `{ rejected: [{ id, version }], failed: [] }` (전체 성공)
- 전체 성공 toast 검증 — `/건이 반려되었습니다/` 또는 `bulkRejectAll` 동등 텍스트
- `page.unroute()` 또는 finally 블록 route 정리 확인

### M5: wf-ap02 Step 9 — 부분 실패 시뮬레이션 (S8)
- `page.route()`로 bulk-reject API intercept
- 응답: `{ rejected: [{ id, version }], failed: [{ id, error }] }` 형태
- 부분 실패 toast 표시 검증 (variant: destructive 또는 error 관련 텍스트)
- `page.unroute()` 또는 route 정리 확인

### M6: legacy-sw-cleanup.spec.ts 신설 (SW cleanup)
- 파일 생성: `apps/frontend/tests/e2e/features/pwa/legacy-sw-cleanup.spec.ts`
- 공통 auth fixture import (`../../shared/fixtures/auth.fixture`)
  (파일 위치 `features/pwa/` → 상대 경로 2단계 상위 `tests/e2e/shared/fixtures/auth.fixture`)
- TC-01: 페이지 로드 후 `navigator.serviceWorker.getRegistrations().length === 0` 검증
- TC-02: localStorage `__legacy_sw_cleaned_v1` 플래그 설정 확인
- TC-03: reload 정책 문서화 — 강제 reload 없음(현재 설계), SR 접근에 영향 없음을 주석으로 명시

### M7: 임포트 경로 무결성
- `@equipment-management/schemas` 임포트가 이미 해당 파일에 존재하는 경우 중복 임포트 금지
- E2E spec의 `import` 경로가 실제 파일 경로와 일치

---

## SHOULD Criteria (FAIL → tech-debt 기록 후 진행)

### S1: frontend build 통과
- `pnpm --filter frontend run build` 성공

### S2: E2E spec Playwright 문법 준수
- `test.describe`, `test()`, `expect()` 패턴 일관성
- `test.describe.configure({ mode: 'serial' })` 사용 (상태 변경 테스트)
- `test.beforeAll/afterAll`로 공유 상태 정리

### S3: date format 예시 날짜 동적 파생 또는 설명 주석
- `2026-02-15` 같은 예시 날짜는 UI-only 렌더링 상수임을 주석으로 명시 (하드코딩 아님 — 실제 날짜 데이터가 아닌 표시 예시)

### S4: verify-implementation PASS
- 새로 추가된 verify 스텝이 있는 경우 PASS

---

## 성공 정의

All MUST criteria PASS.
SHOULD criteria 실패는 tech-debt-tracker.md에 기록 후 완료 처리.
