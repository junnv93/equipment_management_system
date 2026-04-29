# 스프린트 계약: calibration-plans Export 감사 + 전방위 리뷰

## 생성 시점
2026-04-20T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### 빌드/타입
- [ ] `pnpm --filter backend tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공

#### SSOT / 하드코딩
- [ ] M1: `calibration-plan.layout.ts`에 `SHEET_NAMES/DATA_START_ROW/COLUMN_COUNT/COLUMNS` export
- [ ] M2: export service/renderer가 `xlsx-helper`의 4개 함수 import+사용 (`loadWorksheetByName/captureRowStyles/writeDataRow/clearTrailingRows`)
- [ ] M5: `calibration-plan-exportability.ts`에 `EXPORTABLE_CALIBRATION_PLAN_STATUSES` + `isCalibrationPlanExportable` export
- [ ] M6: `CalibrationPlanDetailClient.tsx`가 `isCalibrationPlanExportable(plan.status)` 게이트 사용 — `isApproved` 인라인 조건 금지
- [ ] M7: `calibration-plans-api.ts` fallback 파일명이 `FORM_CATALOG` 참조 — `'교정계획서_'` 하드코딩 제거
- [ ] M12: export.service + layout 외 `'연간 교정계획서'` 문자열 리터럴 없음
- [ ] M18: 백엔드 export 파일명이 `FORM_CATALOG['UL-QP-19-01'].formNumber/name` 참조 — `'UL-QP-19-01_'` 하드코딩 금지

#### 보안/가드
- [ ] M3: approved 외 상태 export → `BadRequestException({code:'NON_EXPORTABLE_PLAN_STATUS'})` (unit test 확인)
- [ ] M4: controller export 엔드포인트에 `@SkipResponseTransform()` 적용
- [ ] M17: controller + 프론트 버튼이 `Permission.EXPORT_REPORTS` 사용 — `VIEW_CALIBRATION_PLANS` 잔존 금지

#### 테스트
- [ ] `pnpm --filter backend test calibration-plans` 전체 통과 (기존 + 신규)
- [ ] `pnpm --filter frontend test calibration-plan` 전체 통과
- [ ] M19: ExcelJS 기반 reverse 검증: buffer 로드 후 Row 1 제목/Row 6 순번/관리번호/현황유효일자 셀 값 일치

#### 시드
- [ ] M10: CPLAN_007 seed insert 성공, suwon+FCC_EMC_RF_SUWON + is_latest_version=true 조합에 draft/pending_approval/approved 최소 1건씩
- [ ] CPLAN_001 items 확장: 기존 2개 → 6개, 월별 분포 분산

#### CAS
- [ ] M11: CAS fetch-before-mutate가 `useCasGuardedMutation` 훅으로 통일 — CalibrationPlanDetailClient.tsx, ApprovalTimeline.tsx, PlanItemsTable.tsx 3곳에서 동일 패턴

#### i18n
- [ ] M14: `generateMetadata`가 translator 경유, 영문 로케일에서 한글 미노출
- [ ] loading.tsx + page.tsx skeleton title/description이 translator 경유

#### 접근성
- [ ] M15: KPI `aria-pressed` 분기 (active/inactive), 테이블 `role="region"` + `tabIndex={0}`, 행 키보드 네비(Tab+Enter), Reject `<Label htmlFor>` 연결

#### 디자인 토큰
- [ ] M13: `transition: all` 신규 추가 없음, `focus-visible` 유지, `bg-background` semantic token 유지

#### 회귀
- [ ] M16: 기존 calibration-plans 테스트 전부 통과, frontend/backend tsc 전체 통과

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] M20: `prefers-reduced-motion` 가드 — sticky + animation이 motion-reduce에서 비활성
- [ ] M21: `@axe-core/playwright` violation 0 (list/detail/create 상태)
- [ ] M22: CACHE_EVENTS 리스너 4종이 async/Promise 반환, invalidate regex 매칭 (verify-cache-events)
- [ ] M23: calibrationPlans list/detail에 IMPORTANT staleTime 적용
- [ ] M24: 템플릿 버퍼 캐시 확인
- [ ] M25: 문서 업데이트 (calibration-plans.md, CLAUDE.md SSOT 표, cas-patterns.md)
- [ ] review-architecture Critical 이슈 0개
- [ ] review-design 점수 >= 60

### 적용 verify 스킬
- verify-cas (CAS 패턴, casVersion 필드, 캐시 무효화)
- verify-ssot (FORM_CATALOG, Permission, queryKeys, SSOT 경유)
- verify-hardcoding (문자열 리터럴, API URL)
- verify-frontend-state (useOptimisticMutation 패턴, setQueryData 금지)
- verify-design-tokens (transition:all 금지, focus-visible, brand-*)
- verify-security (allowlist 가드, audit log, siteScope)
- verify-i18n (하드코딩 한국어)
- verify-cache-events (emitAsync, listener async, invalidate regex)
- verify-workflows (3단계 승인 흐름 완결성)
- verify-filters (URL-SSOT 필터)
- verify-seed-integrity (시드 무결성, UUID 일관성)
- verify-zod (DTO, schema SSOT)
- verify-nextjs (App Router, Proxy 컨벤션)
- review-architecture
- review-design

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
