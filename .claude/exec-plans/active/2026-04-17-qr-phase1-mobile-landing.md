# QR Phase 1 — 모바일 랜딩 + 개별 QR + SSOT 기반 인프라 구현 계획

## 메타
- 생성: 2026-04-17T00:00:00+09:00
- 모드: Mode 2 (Planner → Generator → Evaluator)
- Slug: `qr-phase1-mobile-landing`
- 예상 변경: 18~22개 파일 (신규 12~14, 수정 6~8)
- 소스 플랜: `/home/kmjkds/.claude/plans/qr-parallel-puppy.md` (사용자 승인)

## 설계 철학
장비에 부착된 QR을 스캔한 현장 사용자가 로그인 복귀 후 **장비별 모바일 액션 시트**로 주요 워크플로우(조회/반출/반납/부적합)에 한 손으로 진입할 수 있도록 "단일 진입점(`/e/:mgmt`)"과 **모든 Phase가 공유할 SSOT 인프라**(QR 설정·URL 빌더·라우트·i18n·PWA 프리미티브)를 이번 Phase에서 완결한다. Phase 2/3는 인프라를 **소비**만 한다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| QR 페이로드 | `{APP_URL}/e/{managementNumber}` (관리번호 원문) | 육안으로도 장비 식별 가능(라벨 훼손 시 수동 입력 폴백) + 라우트가 URL 한 줄로 자명 → 스캐너/네이티브 카메라 공용. UUID보다 인간 친화적이며, 후속 서명 토큰 경로(handover)와 네임스페이스가 분리되어 의미 충돌 없음. |
| 조회 엔드포인트 | **신규** `GET /equipment/by-management-number/:mgmt` | 관리번호는 사이트 내 유일(스키마 레벨 unique). 기존 `GET /equipment/:uuid`는 UUID만 받아들여 QR 유입에서 재사용 불가. 검색 엔드포인트 재사용 시 권한/페이지네이션 오버헤드 + 단일 조회 의미 소실. `@Throttle('long')`로 enumeration 방어. |
| 관리번호 검증 | `parseManagementNumber()` SSOT via Zod pipe | 이미 `packages/schemas/src/enums/equipment.ts#parseManagementNumber`에 존재. 정규식 재정의 금지. 임시(`TEMP-`) 관리번호는 Phase 1 범위 제외(명시 주석). |
| 감사 로그 | `@AuditLog({ action: 'read', entityType: 'equipment' })` | 기존 데코레이터 재사용. 현장 QR 조회 추적은 감사 요구사항. **`read` 액션을 `AUDIT_ACTION_VALUES` SSOT에 추가** — 기존 배지/라벨/i18n도 동시 확장. |
| **Cross-site 접근 + 관계 기반 액션** (신규 결정) | 서버가 `allowedActions: QRAllowedAction[]` 계산해 응답. Site scope 위반 시 기본 뷰는 허용(`view_detail`만), 추가 액션은 권한+관계 조건 충족 시에만 포함. | 현장 시나리오(타 사이트 장비 대여 반납 / 입고 확인 등)가 기존 `enforceSiteAccess`의 엄격 차단과 충돌. 클라이언트는 `can()` 중복 계산 제거하고 배열 기반 렌더러. 서버가 **권한의 single source of truth**. |
| `QRAllowedAction` enum | `packages/shared-constants/src/qr-access.ts` 신규 SSOT. FE/BE 공유. | Phase 2(NCR 원탭)/Phase 3(handover) 에서 `report_nc` / `confirm_handover` 등 추가 예정 — 같은 enum 확장. |
| Active checkout 관계 판정 | `checkout_items` → `checkouts.borrowerUserId` 조인. 상태 `checked_out`이면 `mark_checkout_returned` 액션 활성화. | `checkouts` 테이블에 직접 equipment_id 없음 (기존 버그 교훈 메모리). `checkoutItems` 경유가 SSOT. |
| QR 렌더 형식 | **SVG** (`qrcode.toString(..., { type: 'svg' })`) | 인쇄 시 벡터 선명도 + DOM 검사 + 접근성(`<img alt>`) + Tailwind 스타일링 가능. PNG dataURL 대비 번들 크기 영향 없음, SSR 가능. |
| 랜딩 페이지 렌더 전략 | **Server Component(sync)** + **Suspense 내부 async 자식** | 기존 `equipment/[id]/page.tsx`의 PPR Non-Blocking 패턴(CLAUDE.md 기록) 준수. 정적 셸 즉시 전송 → 데이터 로드는 스트리밍. `notFound()`는 async 자식에서. |
| 인증 경로 | Proxy matcher 기존 규칙 재사용 (`(dashboard)` 그룹 = 전체 보호) | `/e/*`를 `app/(dashboard)/e/` 아래 배치하면 기존 proxy가 자동 보호 + `callbackUrl` 복귀 보장. 새 matcher 규칙 금지. |
| CTA 노출 로직 | `useAuth().can(Permission.X)` Client-side | `hooks/use-auth.ts#can`이 SSOT. 역할 리터럴(`role === 'admin'`) 금지. CLAUDE.md Rule 0. |
| 쿼리 키 | `queryKeys.equipment.byManagementNumber(mgmt)` 신규 | `lib/api/query-config.ts` SSOT 확장. `detail(id)`과 별도 계층(관리번호는 secondary key). Phase 2/3 재사용. |
| Refetch 전략 | `REFETCH_STRATEGIES.NORMAL` (window focus만) | 현장 조회는 CRITICAL 수준의 실시간성 불필요. 상태 변경은 CHECKOUT_CREATED 등 기존 SSE 이벤트로 간접 전파. |
| PWA manifest 통합 | `app/layout.tsx` metadata.manifest | Next.js 16 권장 방식(metadata API → `<link rel="manifest">` 자동 삽입). `public/manifest.json` 직접 `<link>` 수동 삽입 금지. `viewport.themeColor`는 이미 layout.tsx에 존재 → 확장만. |
| safe-area | `--safe-area-inset-*` CSS 변수 + `.safe-*` 유틸 | Radix Sheet(이미 존재)에 bottom padding 주입 시 iOS notch 보장. `env(safe-area-inset-bottom)` 직접 사용 금지(디자인 토큰 일관성). |
| 모바일 시트 | 신규 `MobileBottomSheet` 래퍼 | `components/ui/sheet.tsx`(Radix, side=bottom variant 이미 존재)를 얇게 래핑 — drag handle, safe-area padding, focus trap. Radix 재구현 금지. |
| i18n | `messages/{ko,en}/qr.json` 신규 네임스페이스 | `i18n/request.ts#namespaces`에 `'qr'` 추가. 섹션: `mobileActionSheet`, `qrDisplay`, `landing`. 하드코딩 문자열 0개. Phase 2/3는 같은 파일에 섹션 추가. |
| 쿼리 엔드포인트 상수 | `API_ENDPOINTS.EQUIPMENT.BY_MANAGEMENT_NUMBER(mgmt)` 신규 | `packages/shared-constants/src/api-endpoints.ts` SSOT 확장. 하드코딩된 경로 리터럴 금지. |
| 이벤트 발행 | 없음(read-only 엔드포인트) | 조회는 캐시 무효화 불필요. 후속 반출 생성은 기존 `CHECKOUT_CREATED` 이벤트가 처리. |
| QR URL 빌더 위치 | `packages/shared-constants/src/qr-url.ts` | FE/BE 양쪽 import 필요(BE는 테스트/향후 링크 생성, FE는 렌더). `appUrl` 파라미터 주입 방식 — 환경변수 직접 참조 금지(테스트 가능성). |

## 정찰 요약

**기존 SSOT 확인 (재사용 대상):**
- `packages/shared-constants/src/frontend-routes.ts` — `FRONTEND_ROUTES.EQUIPMENT.*` 기존 구조 확인 → 확장 필요
- `packages/shared-constants/src/api-endpoints.ts` — `API_ENDPOINTS.EQUIPMENT.*` 기존 구조 확인
- `packages/shared-constants/src/qr-config.ts` — **Generator가 이미 생성** (QR_CONFIG/LABEL_CONFIG/getLabelCellDimensions). 그대로 수용.
- `packages/schemas/src/enums/equipment.ts:258` — `parseManagementNumber()` SSOT 존재
- `apps/frontend/lib/api/query-config.ts` — `queryKeys.equipment.*` 네임스페이스 존재 (detail/list/search)
- `apps/frontend/hooks/use-auth.ts:36` — `useAuth().can(Permission.X)` SSOT
- `apps/frontend/components/ui/sheet.tsx` — Radix Sheet + `side=bottom` variant 이미 존재
- `apps/frontend/app/(dashboard)/equipment/[id]/page.tsx` — PPR Non-Blocking 패턴 레퍼런스(sync Page + Suspense async child + React.cache)
- `apps/frontend/proxy.ts:104` — matcher `/((?!login|api|_next/static|_next/image|images|favicon.ico).*)` → `/e/*`는 자동 보호됨
- `apps/frontend/i18n/request.ts` — `namespaces` 배열에 `'qr'` 추가 필요
- `apps/frontend/app/layout.tsx:45-63` — 기존 `metadata`/`viewport` 정의 존재, `manifest` 키 추가 가능
- `apps/backend/src/common/config/throttle.constants.ts` — `THROTTLER_CONFIGS`에 `'long'`(1분/300) 존재 → `@Throttle` 패턴 사용
- `apps/backend/src/modules/equipment/equipment.controller.ts` — `@RequirePermissions(Permission.VIEW_EQUIPMENT)` + `@AuditLog` + `SiteScoped` 패턴 레퍼런스
- `apps/frontend/styles/globals.css:339` — `--touch-target-min: 44px` 이미 정의됨. `safe-area-inset-*`은 **미존재** → 신규 추가 필요

**핵심 제약 발견:**
- `apps/frontend/public/`에 `manifest.json` 부재 확인 → 신규 생성
- `packages/shared-constants/src/index.ts`에 `qr-config`/`qr-url`/신규 FRONTEND_ROUTES 섹션 re-export 필요(현재 미export)
- `.env` 변수 `NEXT_PUBLIC_APP_URL`(FE) / `FRONTEND_URL`(BE)은 Phase 1에서 **필수 필드**로 운영 결정 완료 — 문서 주석만 명시, env.validation.ts 수정은 Phase 1 범위 외(운영 체크리스트에만 기록).

## 구현 Phase

### Sub-Phase A: 공유 패키지 SSOT 확장
**목표:** FE/BE 모두가 import할 URL/라우트/QR 설정 인프라를 완결한다.

**변경 파일:**
1. `packages/shared-constants/src/frontend-routes.ts` — **수정** `FRONTEND_ROUTES.EQUIPMENT`에 `BY_MGMT(mgmt)` 추가. 최상위 `SCAN` 라우트(Phase 2용 사전 등록, 값만). `HANDOVER(token)`는 Phase 3용 플레이스홀더로 이번 Phase에서 함께 등록(병합 충돌 방지). 하위 QR 인쇄 라우트는 이번 Phase에서 페이지로 만들지 않으므로 등록 보류.
2. `packages/shared-constants/src/qr-url.ts` — **신규** FE/BE 공용 `buildEquipmentQRUrl(mgmt, appUrl)` + `parseEquipmentQRUrl(url)` 순수 함수. `appUrl` 파라미터 주입 방식(환경변수 직접 참조 금지). 관리번호 유효성은 `parseManagementNumber()` SSOT 경유.
3. `packages/shared-constants/src/api-endpoints.ts` — **수정** `API_ENDPOINTS.EQUIPMENT.BY_MANAGEMENT_NUMBER(mgmt)` 추가.
4. `packages/shared-constants/src/qr-config.ts` — **이미 존재(수용)**. 변경 없음. index.ts에서 re-export 추가 필요.
5. `packages/shared-constants/src/index.ts` — **수정** `QR_CONFIG`, `LABEL_CONFIG`, `getLabelCellDimensions`, `buildEquipmentQRUrl`, `parseEquipmentQRUrl`, 타입 re-export.

**검증:**
- `pnpm --filter @equipment-management/shared-constants run build` (또는 tsc) 성공
- `pnpm tsc --noEmit` root에서 import 경로 통과

---

### Sub-Phase B: 백엔드 엔드포인트 + 권한 기반 액션 계산
**목표:** `GET /equipment/by-management-number/:mgmt` 단일 조회 경로를 권한·감사·rate limit 완비하여 제공. **Cross-site 장비도 기본 뷰는 허용**하되, 실행 가능한 액션은 서버가 권한·관계 기반으로 계산해 응답에 포함.

**아키텍처 패턴:** Scope-Aware Actions
- 응답 = `{ equipment: EquipmentDetail, allowedActions: QRAllowedAction[] }`
- 서버가 5가지 액션(`view_detail`, `view_qr`, `request_checkout`, `mark_checkout_returned`, `report_nc`)을 권한+관계로 판정
- Equipment import 관련 액션(`confirm_import_receipt` 등)은 Phase 2로 연기
- 프론트 ActionSheet는 `allowedActions` 배열만 소비(역할 리터럴 0건)

**변경 파일:**

1. `packages/shared-constants/src/qr-access.ts` — **신규** `QR_ACTION_VALUES` 배열 + `QRAllowedAction` type + 각 액션의 `description` 상수 (FE i18n key 매핑용). Phase 1 5종만 export, Phase 2/3 액션은 후속 확장.

2. `packages/shared-constants/src/index.ts` — **수정** qr-access re-export 추가.

3. `apps/backend/src/modules/equipment/dto/management-number-param.pipe.ts` — **신규** Zod 기반 ParseManagementNumberPipe. `parseManagementNumber()` SSOT를 사용한 유효성 검증, 실패 시 `BadRequestException` with error code(`INVALID_MANAGEMENT_NUMBER`).

4. `apps/backend/src/modules/equipment/services/qr-access.service.ts` — **신규** `resolveAllowedActions(equipment, user, db)`: 사용자의 role/permissions + active checkout 관계 + 장비 site/상태 기반으로 `QRAllowedAction[]` 계산. 
   - `view_detail`: `VIEW_EQUIPMENT` 권한자 모두 (cross-site 허용)
   - `view_qr`: `VIEW_EQUIPMENT` 권한자 모두
   - `request_checkout`: `CREATE_CHECKOUT` 권한 + 장비 `available` 상태 + 사용자 사이트 === 장비 사이트 (cross-site 반출은 기존 lender_*/borrower_* 플로우로만 — Phase 3)
   - `mark_checkout_returned`: 현재 사용자가 `checkout_items` → `checkouts.borrowerUserId`로 조인된 active checkout(`status in ['checked_out']`)의 대여자인 경우
   - `report_nc`: `CREATE_NON_CONFORMANCE` 권한자 (cross-site 허용 — 부적합 발견은 사이트 무관)

5. `apps/backend/src/modules/equipment/equipment.module.ts` — **수정** `QRAccessService` provider 등록.

6. `apps/backend/src/modules/equipment/equipment.controller.ts` — **수정** 신규 핸들러 `findByManagementNumber(@Param('mgmt', ParseManagementNumberPipe) mgmt: string, @Req() req)`. `@RequirePermissions(Permission.VIEW_EQUIPMENT)`, `@AuditLog({ action: 'read', entityType: 'equipment' })`, `@Throttle({ long: { limit: 60, ttl: 60_000 } })`. **기존 `enforceSiteAccess` 호출 제거** (cross-site 허용 정책). 응답 = `{ ...equipmentDetail, allowedActions: QRAllowedAction[] }`. 404/400/401/403은 그대로.

7. `apps/backend/src/modules/equipment/equipment.service.ts` — **수정** `findByManagementNumber(managementNumber, includeTeam)` 서비스 메서드 추가. cross-site 허용(site-scope where절 포함 안 함 — 컨트롤러가 액션 레벨로 제어). Join 구조는 `findOne`과 동일.

8. `packages/schemas/src/enums/audit.ts` — **수정** `AUDIT_ACTION_VALUES`에 `'read'` 추가. `AUDIT_ACTION_LABELS`/`AUDIT_ACTION_COLORS`/`AUDIT_ACTION_BADGE_TOKENS`/i18n(ko/en) 동시 확장.

9. `apps/backend/src/modules/equipment/equipment.controller.spec.ts` — **수정** 신규 핸들러 단위 테스트 4건: (a) 존재 장비 반환 + allowedActions 검증, (b) 미존재 → 404, (c) 잘못된 포맷 → 400, (d) cross-site 장비: 조회 성공 + `request_checkout` 제외된 allowedActions.

**검증:**
- `pnpm --filter backend run tsc --noEmit` exit 0
- `pnpm --filter backend run test equipment.controller.spec` 신규 3건 PASS
- `pnpm --filter backend run build` 성공
- 수동 검증: `curl -H "Authorization: Bearer <token>" http://localhost:3001/equipment/by-management-number/SUW-E0001` → 200, `/by-management-number/INVALID` → 400, `/by-management-number/SUW-E9999` → 404

---

### Sub-Phase C: 프론트엔드 모바일 랜딩 + 액션 시트 + 개별 QR
**목표:** `/e/:mgmt` 페이지가 인증·조회·액션 시트를 제공하고, 장비 상세에 QR 보기/인쇄 진입점을 추가한다.

**변경 파일:**
1. `apps/frontend/lib/api/query-config.ts` — **수정** `queryKeys.equipment.byManagementNumber(mgmt)` 추가. Phase 2/3가 소비할 예정.
2. `apps/frontend/lib/api/equipment-api.ts` — **수정** `getEquipmentByManagementNumber(mgmt: string)` 클라이언트 함수 추가. `API_ENDPOINTS.EQUIPMENT.BY_MANAGEMENT_NUMBER(mgmt)` 사용.
3. `apps/frontend/lib/api/equipment-api-server.ts` — **수정** Server Component용 동일 함수 추가 (SSR에서 초기 fetch). `isNotFoundError` 호환.
4. `apps/frontend/hooks/use-equipment-by-management-number.ts` — **신규** `useQuery` 기반 훅, `queryKeys.equipment.byManagementNumber(mgmt)` + `REFETCH_STRATEGIES.NORMAL`. TData는 기존 Equipment 타입 재사용.
5. `apps/frontend/app/(dashboard)/e/[managementNumber]/page.tsx` — **신규** Server Component sync + Suspense async 자식(`equipment/[id]/page.tsx` 패턴 미러링). params Promise await → `parseManagementNumber()` 유효성 → 실패 시 `notFound()` → 서버 fetch → 404 시 `notFound()` → Client 위임. `generateMetadata`에서 장비명·관리번호 타이틀 설정(React.cache 중복 fetch 방지).
6. `apps/frontend/app/(dashboard)/e/[managementNumber]/not-found.tsx` — **신규** 관리번호 미존재 시 안내 + 스캔 재시도/수동 입력 CTA(Phase 2 연결 지점).
7. `apps/frontend/components/mobile/MobileBottomSheet.tsx` — **신규** Radix Sheet(`side='bottom'`) 얇은 래퍼. props: `open/onOpenChange/title/description/children`. 기능: drag handle, `safe-area-inset-bottom` padding, focus trap(Radix 기본), `role="dialog"` + `aria-label`, Escape 닫기.
8. `apps/frontend/components/mobile/EquipmentActionSheet.tsx` — **신규** Client Component. props로 Equipment 수신. `useAuth().can()` 기반 CTA 목록: "상세 보기"(VIEW_EQUIPMENT), "반출 신청"(CREATE_CHECKOUT), "반납 기록"(기존 체크아웃 RETURN 권한), 부적합 신고(Phase 2 placeholder, disabled + tooltip). 각 CTA는 `FRONTEND_ROUTES` SSOT로 네비게이트, 반출 신청은 `/checkouts/create?equipmentId={uuid}` 프리필. i18n은 `qr.mobileActionSheet.*`.
9. `apps/frontend/components/mobile/EquipmentLandingClient.tsx` — **신규** Client 랩. 초기 데이터 prop으로 수신 → `useEquipmentByManagementNumber` hydration → `MobileBottomSheet` + `EquipmentActionSheet` 렌더. 장비 요약 카드(이미지/관리번호/이름/상태 배지) 상단, 액션 시트 하단 고정.
10. `apps/frontend/components/equipment/EquipmentQRCode.tsx` — **신규** 장비 uuid/mgmt 수신. `qrcode` 라이브러리(`toString(..., { type: 'svg', ...QR_CONFIG })`)로 SVG 문자열 생성 → `dangerouslySetInnerHTML` 또는 data-url. `QR_CONFIG` SSOT 사용(직접 옵션 금지). `<img alt>`는 `qr.qrDisplay.altText` i18n. 인쇄 버튼 `window.print()` + 인쇄 전용 CSS 클래스(`.print:block`, `.print:hidden`) 활용(기존 globals.css 유틸 재사용 가능 여부 확인, 없으면 이번 Phase에서 추가). `buildEquipmentQRUrl(mgmt, NEXT_PUBLIC_APP_URL)` SSOT 사용.
11. `apps/frontend/components/equipment/EquipmentDetailClient.tsx` — **수정** 기존 헤더 액션 영역에 "QR 보기/인쇄" 버튼 추가(Dialog 또는 Sheet 오픈). 권한: `VIEW_EQUIPMENT` 기본(장비 상세 접근자 = QR 인쇄 가능). 기존 레이아웃 최소 침습.
12. `apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx` — **수정** URL 쿼리 `?equipmentId=...` 처리. 해당 equipmentId로 장비 조회 → 폼 초기값 프리필. 기존 폼 검증 로직 영향 없음. 미존재 equipmentId는 무시(무한 루프 방지).
13. `apps/frontend/app/layout.tsx` — **수정** `export const metadata: Metadata`에 `manifest: '/manifest.json'` 추가. `viewport`에 `viewportFit: 'cover'` 추가(safe-area 활성화).
14. `apps/frontend/public/manifest.json` — **신규** PWA manifest. 필드: `name`, `short_name`, `start_url: '/'`, `display: 'standalone'`, `theme_color` (layout.tsx와 동기화), `background_color`, `icons` (최소 192/512 PNG, 경로는 `/icons/manifest-192.png` 등 — 아이콘 파일 자체 생성은 Phase 1 범위 외, 플레이스홀더 경로만 지정하고 실제 파일은 디자인 팀/Phase 완료 후 운영 단계에서 주입 — 주석으로 명시). `lang: 'ko'`.
15. `apps/frontend/styles/globals.css` — **수정** `:root`에 `--safe-area-inset-top/right/bottom/left: env(safe-area-inset-*, 0px);` 정의. 유틸 클래스 `.safe-area-bottom { padding-bottom: var(--safe-area-inset-bottom); }`, `.safe-area-top`. 인쇄 유틸(`@media print { .print\:hidden { display: none; } .print\:block { display: block; } }`) 미존재 시 추가.
16. `apps/frontend/i18n/request.ts` — **수정** `namespaces` 배열에 `'qr'` 추가.
17. `apps/frontend/messages/ko/qr.json` — **신규** 섹션: `mobileActionSheet.title/description/actions.view/checkout/return/reportNc/returnPlaceholder`, `qrDisplay.title/altText/printButton`, `landing.loadingLabel/notFoundTitle/notFoundBody/retryScan/manualEntry`.
18. `apps/frontend/messages/en/qr.json` — **신규** 한국어와 동일 key 구조, 영어 번역.

**검증:**
- `pnpm --filter frontend run tsc --noEmit` exit 0
- `pnpm --filter frontend run build` 성공(PPR + route group 충돌 없음)
- 수동: `/e/SUW-E0001` 접근 시 액션 시트 렌더, 비로그인 상태 → `/login?callbackUrl=%2Fe%2FSUW-E0001` 리다이렉트 후 복귀, `/e/INVALID` → not-found 페이지, `/e/SUW-E9999` → not-found 페이지
- 수동: 장비 상세 페이지 → QR 보기 → 인쇄 미리보기에 SVG 표시

---

### Sub-Phase D: 검증 스킬 + 회귀 테스트
**목표:** 모든 SSOT/하드코딩/i18n/auth/design-token 게이트를 통과하고 기존 회귀 0건을 보장한다.

**변경 파일:**
- 코드 변경 없음. 스킬 실행 + 기존 테스트 스냅샷 업데이트만(필요 시).

**검증:**
- `verify-ssot` (경로: 신규/수정 파일 자동 탐지) PASS
- `verify-i18n` PASS (신규 한국어 문자열 0 하드코딩)
- `verify-auth` PASS (역할 리터럴 0개, `useAuth().can()` 사용)
- `verify-nextjs` PASS (params Promise, proxy.ts, Server/Client 경계)
- `verify-design-tokens` PASS (semantic tokens only, touch-target ≥44px)
- `verify-frontend-state` PASS (setQueryData in onSuccess 0건, useOptimisticMutation 규칙 준수)
- `verify-hardcoding` PASS (QR 옵션·라벨 치수·URL 도메인 하드코딩 0건)
- `pnpm --filter backend run test` 기존 테스트 회귀 없음(신규 3건 추가, 전체 PASS)
- `pnpm --filter frontend run test` 기존 테스트 회귀 없음
- 선택(SHOULD): `playwright-e2e` 신규 spec `tests/e2e/features/equipment/qr/phase1-mobile-landing.spec.ts` 기본 렌더링 + 로그인 callbackUrl 플로우

## 전체 변경 파일 요약

### 신규 생성 (13)
| 파일 | 목적 |
|------|------|
| `packages/shared-constants/src/qr-url.ts` | FE/BE 공용 QR URL 빌더/파서 (appUrl 주입 방식) |
| `apps/backend/src/modules/equipment/dto/management-number-param.pipe.ts` | Zod pipe로 `parseManagementNumber` SSOT 경유 검증 |
| `apps/frontend/hooks/use-equipment-by-management-number.ts` | 관리번호 기반 장비 조회 React Query 훅 |
| `apps/frontend/app/(dashboard)/e/[managementNumber]/page.tsx` | 모바일 QR 랜딩 Server Component (PPR) |
| `apps/frontend/app/(dashboard)/e/[managementNumber]/not-found.tsx` | 관리번호 미존재 안내 페이지 |
| `apps/frontend/components/mobile/MobileBottomSheet.tsx` | Radix Sheet 모바일 프리미티브 래퍼 |
| `apps/frontend/components/mobile/EquipmentActionSheet.tsx` | 권한 기반 CTA 시트 (view/checkout/return) |
| `apps/frontend/components/mobile/EquipmentLandingClient.tsx` | 랜딩 Client 루트 (요약 카드 + 액션 시트) |
| `apps/frontend/components/equipment/EquipmentQRCode.tsx` | SVG QR 렌더 + 인쇄 |
| `apps/frontend/public/manifest.json` | PWA manifest (standalone, theme_color, icons) |
| `apps/frontend/messages/ko/qr.json` | QR 기능 i18n 네임스페이스 (한국어) |
| `apps/frontend/messages/en/qr.json` | QR 기능 i18n 네임스페이스 (영어) |
| (선택) `apps/frontend/tests/e2e/features/equipment/qr/phase1-mobile-landing.spec.ts` | SHOULD 기준 E2E spec |

### 수정 (8~9)
| 파일 | 변경 의도 |
|------|----------|
| `packages/shared-constants/src/frontend-routes.ts` | `EQUIPMENT.BY_MGMT(mgmt)`, 최상위 `SCAN`, `HANDOVER(token)` 추가 |
| `packages/shared-constants/src/api-endpoints.ts` | `EQUIPMENT.BY_MANAGEMENT_NUMBER(mgmt)` 추가 |
| `packages/shared-constants/src/index.ts` | qr-config, qr-url re-export 추가 |
| `apps/backend/src/modules/equipment/equipment.controller.ts` | 신규 `findByManagementNumber` 핸들러 + 데코레이터 |
| `apps/backend/src/modules/equipment/equipment.service.ts` | `findByManagementNumber` 서비스 메서드 |
| `apps/backend/src/modules/equipment/equipment.controller.spec.ts` | 신규 핸들러 단위 테스트 3건 |
| `apps/frontend/lib/api/query-config.ts` | `queryKeys.equipment.byManagementNumber` 추가 |
| `apps/frontend/lib/api/equipment-api.ts` | `getEquipmentByManagementNumber` 클라이언트 함수 |
| `apps/frontend/lib/api/equipment-api-server.ts` | Server Component용 동일 함수 |
| `apps/frontend/components/equipment/EquipmentDetailClient.tsx` | 헤더에 "QR 보기/인쇄" 액션 진입점 |
| `apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx` | `?equipmentId=` 프리필 처리 |
| `apps/frontend/app/layout.tsx` | metadata.manifest + viewport.viewportFit='cover' |
| `apps/frontend/styles/globals.css` | `--safe-area-inset-*` 변수 + `.safe-area-*` 유틸 + `.print:*` 유틸 |
| `apps/frontend/i18n/request.ts` | `namespaces`에 `'qr'` 추가 |

## 의사결정 로그

- **2026-04-17 10:00** — 소스 플랜의 백엔드 설계(`GET /equipment/by-management-number/:mgmt` + `parseManagementNumber` pipe + `@AuditLog` + `@Throttle`) 그대로 수용. 기존 `findOne` 재사용이 아닌 신규 메서드로 분리한 이유: 쿼리 키 의미·where 절·에러 타입(404 detail 차이)이 달라 추상화 비용이 분리 비용보다 큼.
- **2026-04-17 10:05** — QR SVG vs PNG data-url: SVG 선택. 인쇄 품질 + DOM 접근성 + 번들 크기 동일. `qrcode` 라이브러리의 `toString({ type: 'svg' })` 출력을 그대로 사용.
- **2026-04-17 10:10** — PWA manifest를 `<link rel="manifest">` 직접 삽입 대신 Next.js 16 `metadata.manifest` 사용. 이미 layout.tsx의 metadata API가 활성화되어 있어 관례 일관성.
- **2026-04-17 10:15** — `FRONTEND_ROUTES.SCAN`/`HANDOVER`는 Phase 2/3 대상이나 이번 Phase에서 사전 등록. 이유: SSOT 파일을 Phase별로 세 번 수정하는 것보다 1회 배치 변경이 병합 충돌을 줄임.
- **2026-04-17 10:20** — PWA 아이콘 PNG 실제 파일은 Phase 1 범위 외. `manifest.json`의 icons 경로는 확정하되, 아이콘 파일 자체는 디자이너 인수 후 별도 커밋. `/icons/manifest-{192,512}.png` 플레이스홀더 경로 + manifest.json에 주석으로 기록. 운영 체크리스트에 추가.
- **2026-04-17 10:25** — E2E spec은 SHOULD로 분류. MUST에 강제 시 루프가 Playwright 인프라/스토리지 상태 이슈로 흔들릴 위험. 기본 렌더링+callbackUrl은 수동 검증으로 커버.
- **2026-04-17 10:30** — `NEXT_PUBLIC_APP_URL`/`FRONTEND_URL` env 필수화는 env.validation.ts 수정 필요 → Phase 1 범위 포함 여부 재검토 결과: Generator가 validation.ts 변경 시 기존 스타트업 경로를 건드리므로 Phase 1 범위 외로 분류. 대신 `buildEquipmentQRUrl`이 `appUrl` 없을 때 명시적 `throw` → 사용처에서 fail-fast. 운영 체크리스트에 env 문서화 항목 추가.
- **2026-04-17 10:35** — 임시 관리번호(`TEMP-SUW-...`) 처리: Phase 1에서 `parseManagementNumber()`만 통과(정식 번호만). 임시 번호 QR 랜딩은 `parseTemporaryManagementNumber()` 폴백 추가 검토 사항이나 UX 혼동 회피 위해 Phase 1 제외. not-found 페이지에서 "임시 번호는 데스크톱에서 확인" 문구로 안내.
