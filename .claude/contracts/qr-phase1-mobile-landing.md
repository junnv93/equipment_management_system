# 스프린트 계약: QR Phase 1 — 모바일 랜딩 + 개별 QR + SSOT 인프라

## 생성 시점
2026-04-17T00:00:00+09:00

## Slug
`qr-phase1-mobile-landing`

## 범위
사용자 승인 플랜 `/home/kmjkds/.claude/plans/qr-parallel-puppy.md`의 Phase 1 범위.
- Sub-Phase A: 공유 패키지 SSOT 확장 (frontend-routes, api-endpoints, qr-url, qr-config re-export)
- Sub-Phase B: 백엔드 `GET /equipment/by-management-number/:mgmt` 엔드포인트
- Sub-Phase C: 프론트엔드 모바일 랜딩 `/e/[managementNumber]` + 액션 시트 + 개별 QR + PWA 프리미티브
- Sub-Phase D: 검증 스킬 + 회귀 테스트

Phase 2(라벨 PDF, 스캐너, NCR)와 Phase 3(핸드오버 서명 토큰)은 **범위 외**.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

**전체 품질 게이트:**
- [ ] M-1: `pnpm tsc --noEmit` root exit 0 (backend + frontend + packages 전체)
- [ ] M-2: `pnpm --filter backend run build` 성공
- [ ] M-3: `pnpm --filter frontend run build` 성공 (PPR 프리렌더 에러 0, route group 충돌 0)
- [ ] M-4: `pnpm --filter backend run test` 전체 PASS (기존 회귀 0 + 신규 equipment.controller.spec 3건 추가)
- [ ] M-5: `pnpm --filter frontend run test` 전체 PASS (회귀 0)
- [ ] M-6: `pnpm lint` 에러 0 (신규 파일 포함)
- [ ] M-7: 신규 `any` 타입 0건
- [ ] M-8: `git status` clean (모든 변경 커밋됨)

**Sub-Phase A — 공유 패키지 SSOT:**
- [ ] M-A1: `packages/shared-constants/src/frontend-routes.ts`에 `FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(mgmt)`, 최상위 `SCAN`, `HANDOVER(token)` 정의 존재
- [ ] M-A2: `packages/shared-constants/src/qr-url.ts` 신규 파일에 `buildEquipmentQRUrl(mgmt, appUrl)` + `parseEquipmentQRUrl(url)` export. `appUrl` 인자 없을 시 명시적 throw. 환경변수 직접 `process.env.*` 참조 0건.
- [ ] M-A3: `packages/shared-constants/src/api-endpoints.ts`에 `API_ENDPOINTS.EQUIPMENT.BY_MANAGEMENT_NUMBER(mgmt)` 정의
- [ ] M-A4: `packages/shared-constants/src/index.ts`에 qr-config (`QR_CONFIG`, `LABEL_CONFIG`, `getLabelCellDimensions`, 타입) + qr-url(`buildEquipmentQRUrl`, `parseEquipmentQRUrl`) re-export 존재

**Sub-Phase B — 백엔드 엔드포인트:**
- [ ] M-B1: `GET /equipment/by-management-number/:mgmt` 핸들러 존재. `@RequirePermissions(Permission.VIEW_EQUIPMENT)` + `@AuditLog({ action: 'read', entityType: 'equipment' })` + `@Throttle` 데코레이터 부착
- [ ] M-B2: 유효하지 않은 관리번호 포맷(`INVALID-XYZ`) → `400 Bad Request` + error code `INVALID_MANAGEMENT_NUMBER`
- [ ] M-B3: 존재하지 않는 관리번호(`SUW-E9999`) → `404 Not Found` + error code `EQUIPMENT_NOT_FOUND`
- [ ] M-B4: 관리번호 검증은 `parseManagementNumber()` SSOT 경유 (정규식 재정의 0건)
- [ ] M-B5: `ParseManagementNumberPipe`가 DTO 폴더에 신규 존재
- [ ] M-B6: 비인증 요청 → `401` (기존 JwtAuthGuard 글로벌 적용 확인)
- [ ] M-B7: `VIEW_EQUIPMENT` 권한 없는 사용자 → `403`
- [ ] M-B8: **Cross-site 장비 조회 허용** — `VIEW_EQUIPMENT` 권한자는 장비 소속 사이트와 무관하게 조회 가능 (ForbiddenException 발생 0건). 단 `allowedActions`로 실행 가능 액션 제한.
- [ ] M-B9: 응답 shape에 `allowedActions: QRAllowedAction[]` 필드 포함
- [ ] M-B10: `QRAllowedAction` enum/상수는 `packages/shared-constants/src/qr-access.ts` SSOT에만 정의 (FE/BE 병행 정의 0건)
- [ ] M-B11: `QRAccessService.resolveAllowedActions()`가 5가지 액션을 판정: `view_detail`/`view_qr`/`request_checkout`/`mark_checkout_returned`/`report_nc`. 판정 로직은 권한 + 관계(active checkout 대여자 여부) 기반.
- [ ] M-B12: `mark_checkout_returned`는 `checkout_items` → `checkouts.borrowerUserId` 조인 결과로만 판정 (checkouts 테이블 직접 equipment_id 참조 0건 — 기존 스키마 규칙)
- [ ] M-B13: `request_checkout`는 `CREATE_CHECKOUT` 권한 + 장비 `available` 상태 + 사용자 사이트 === 장비 사이트 (cross-site 반출은 제외)
- [ ] M-B14: 신규 단위 테스트 4건 PASS: (a) 200 + allowedActions, (b) 400 invalid format, (c) 404 not found, (d) cross-site 조회 시 request_checkout 제외 검증
- [ ] M-B15: `AUDIT_ACTION_VALUES`에 `'read'` 추가 + `AUDIT_ACTION_LABELS`/`AUDIT_ACTION_COLORS`/`AUDIT_ACTION_BADGE_TOKENS`/`messages/{ko,en}/audit.json` 동시 동기화 (SSOT drift 0건)

**Sub-Phase C — 프론트엔드:**
- [ ] M-C1: `apps/frontend/app/(dashboard)/e/[managementNumber]/page.tsx` 존재 — sync Page + Suspense async 자식(PPR Non-Blocking 패턴)
- [ ] M-C2: params는 `Promise<{ managementNumber: string }>` 타입 (Next.js 16 규칙)
- [ ] M-C3: 비인증 상태 접근 → proxy.ts 자동 처리로 `/login?callbackUrl=%2Fe%2FSUW-E0001`로 리다이렉트 (새 matcher 규칙 추가 0건)
- [ ] M-C4: `not-found.tsx` 존재 — 미존재 관리번호 시 렌더
- [ ] M-C5: `MobileBottomSheet` 컴포넌트는 `components/ui/sheet.tsx` Radix를 래핑 (Radix 재구현 0건). `role="dialog"`, focus trap, `safe-area-inset-bottom` 패딩 적용
- [ ] M-C6: `EquipmentActionSheet` CTA 가시성은 **서버가 반환한 `equipment.allowedActions: QRAllowedAction[]` 배열 기반**. 클라이언트에서 `useAuth().can()`로 추가 판정 0건 (서버가 SSOT). 역할 리터럴 0건.
- [ ] M-C7: `EquipmentQRCode`는 `QR_CONFIG` SSOT 사용. `errorCorrectionLevel/margin/scale` 직접 하드코딩 0건. `buildEquipmentQRUrl` 경유.
- [ ] M-C8: 반출 신청 CTA는 `FRONTEND_ROUTES.CHECKOUTS.CREATE` + `?equipmentId=` 쿼리(리터럴 URL 0건)
- [ ] M-C9: `CreateCheckoutContent.tsx`가 `searchParams.equipmentId` 기반 프리필 처리. 미존재 id 무시(무한 루프 방지).
- [ ] M-C10: 신규 React Query 훅 `useEquipmentByManagementNumber`는 `queryKeys.equipment.byManagementNumber(mgmt)` 사용. `REFETCH_STRATEGIES.NORMAL` 적용.
- [ ] M-C11: `onSuccess`에서 `queryClient.setQueryData` 호출 0건 (invalidateQueries만 허용)
- [ ] M-C12: `useOptimisticMutation` 사용 시 TData/TCachedData 타입 분리 규칙 준수 (Phase 1 mutation 미사용일 경우 N/A)

**Sub-Phase C — PWA/모바일 프리미티브:**
- [ ] M-C13: `apps/frontend/public/manifest.json` 유효한 JSON. 필드: name, short_name, start_url='/', display='standalone', theme_color, background_color, lang='ko', icons(경로만 명시, 파일 자체는 별도 커밋 — 주석 확인)
- [ ] M-C14: `app/layout.tsx`의 `metadata`에 `manifest: '/manifest.json'` 추가. `<link rel="manifest">` 수동 삽입 0건.
- [ ] M-C15: `app/layout.tsx`의 `viewport`에 `viewportFit: 'cover'` 추가
- [ ] M-C16: `styles/globals.css`에 `--safe-area-inset-{top,right,bottom,left}` CSS 변수 + `.safe-area-bottom`/`.safe-area-top` 유틸 클래스 정의
- [ ] M-C17: `.touch-target-min` 또는 `min-h-[var(--touch-target-min)]` 등 기존 SSOT 재사용 (44px 하드코딩 0건)

**Sub-Phase C — i18n:**
- [ ] M-C18: `messages/ko/qr.json` 및 `messages/en/qr.json` 존재. 구조 동일. 섹션: `mobileActionSheet`, `qrDisplay`, `landing`
- [ ] M-C19: `i18n/request.ts`의 `namespaces` 배열에 `'qr'` 추가
- [ ] M-C20: 신규 Client/Server 컴포넌트에 하드코딩된 한국어/영어 문자열 0건 (`useTranslations('qr.*')` 또는 `getTranslations` 경유)

**보안/아키텍처:**
- [ ] M-S1: 백엔드 핸들러가 `req.user`에서 userId/role 추출 (body 신뢰 0건)
- [ ] M-S2: proxy 매처 기존 규칙 유지 (`/((?!login|api|_next/static|_next/image|images|favicon.ico).*)`) — 수정 0건
- [ ] M-S3: `middleware.ts` 신규 생성 0건 (Next.js 16 proxy.ts 컨벤션)
- [ ] M-S4: `verify-ssot` PASS (QR_CONFIG/LABEL_CONFIG/URL/라우트/권한 병행 정의 0건)
- [ ] M-S5: `verify-i18n` PASS (하드코딩 문자열 0건, 키 누락 0건, ko/en 키 mismatch 0건)
- [ ] M-S6: `verify-auth` PASS (역할 리터럴 0건, `can()` 사용)
- [ ] M-S7: `verify-nextjs` PASS (params Promise, proxy.ts, Server/Client 경계 정확)
- [ ] M-S8: `verify-design-tokens` PASS (semantic tokens, touch-target SSOT)
- [ ] M-S9: `verify-frontend-state` PASS (setQueryData in onSuccess 0건)
- [ ] M-S10: `verify-hardcoding` PASS (QR/라벨/URL 매직 숫자·리터럴 0건)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] S-1: `review-architecture` Critical 이슈 0개
- [ ] S-2: `review-design` 점수 ≥ 60 (모바일 컴포넌트 대상)
- [ ] S-3: Lighthouse 모바일(375×667) `/e/SUW-E0001`: LCP < 2.5s, CLS < 0.1, 터치 타깃 ≥ 44px 100%
- [ ] S-4: Playwright `tests/e2e/features/equipment/qr/phase1-mobile-landing.spec.ts` 추가 및 최소 2개 시나리오 PASS: (a) 인증 상태 `/e/SUW-E0001` 액션 시트 렌더, (b) 비인증 → 로그인 → callbackUrl 복귀
- [ ] S-5: Bundle size delta `<` +80KB gzipped (qrcode 라이브러리 도입 영향 측정)
- [ ] S-6: 접근성: axe-core로 `/e/:mgmt` 위반 Critical 0건 (dialog 포커스, alt 텍스트, ARIA labels)
- [ ] S-7: 장비 상세 `QR 보기/인쇄` 버튼 동선 수동 확인(인쇄 미리보기에 SVG 정상)

### 적용 verify 스킬

변경 영역 기반 자동 선택:
- **packages/shared-constants/*** → verify-ssot, verify-hardcoding
- **apps/backend/src/modules/equipment/*** → verify-auth, verify-zod, verify-ssot, verify-hardcoding, verify-security
- **apps/frontend/app/*** → verify-nextjs, verify-i18n, verify-auth, verify-ssot
- **apps/frontend/components/mobile/*** → verify-design-tokens, verify-i18n, verify-auth
- **apps/frontend/components/equipment/*** → verify-frontend-state, verify-i18n, verify-hardcoding
- **apps/frontend/styles/globals.css** → verify-design-tokens
- **apps/frontend/messages/** → verify-i18n
- **apps/frontend/lib/api/** → verify-frontend-state, verify-ssot

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 MUST 기준이 2회 연속 FAIL → 설계 문제로 간주, 수동 개입 요청
- 3회 반복 초과 시 자동 수동 개입 요청
- SHOULD 실패는 `.claude/exec-plans/tech-debt-tracker.md`에 기록, 루프 차단 없음

## Evaluator 참조
- 평가 리포트 경로: `.claude/evaluations/qr-phase1-mobile-landing.md`
- 소스 플랜 링크: `/home/kmjkds/.claude/plans/qr-parallel-puppy.md`
- 엑시큐션 플랜 링크: `.claude/exec-plans/active/2026-04-17-qr-phase1-mobile-landing.md`
