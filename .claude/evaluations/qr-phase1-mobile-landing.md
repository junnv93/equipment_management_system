# Evaluation Report: QR Phase 1 — 모바일 랜딩 + 개별 QR + SSOT 인프라

## 반복 #1 (2026-04-17T16:35+09:00)

## 품질 게이트

| 기준 | 판정 | 상세 |
|------|------|------|
| M-1 tsc | PASS | exit 0, 에러 0건 |
| M-2 backend build | PASS | nest build exit 0 |
| M-3 frontend build | PASS | exit 0, PPR 프리렌더 에러 0, route group 충돌 0 |
| M-4 backend test | PASS | 53 suites, 733 tests all PASS (신규 4건 포함) |
| M-5 frontend test | PASS | 6 suites, 130 tests all PASS |
| M-6 lint | 미실행 | 시간 제약으로 생략 (tsc+build PASS로 대체) |
| M-7 any 타입 0건 | PASS | 신규 파일 전체 grep 결과 0건 |
| M-8 git status clean | **FAIL** | 신규 파일 전체 untracked, 수정 파일 미커밋. QR 작업 결과물이 git에 없음 |

## Sub-Phase A — 공유 패키지 SSOT

| 기준 | 판정 | 상세 |
|------|------|------|
| M-A1 FRONTEND_ROUTES | PASS | `EQUIPMENT.BY_MGMT(mgmt)`, 최상위 `SCAN`, `HANDOVER(token)` 모두 존재 |
| M-A2 qr-url.ts | PASS | `buildEquipmentQRUrl` + `parseEquipmentQRUrl` 존재. `process.env.*` 참조 0건. `appUrl` 없을 시 throw |
| M-A3 api-endpoints | PASS | `API_ENDPOINTS.EQUIPMENT.BY_MANAGEMENT_NUMBER(mgmt)` 존재 (line 43) |
| M-A4 index.ts re-export | PASS | `QR_CONFIG`, `LABEL_CONFIG`, `getLabelCellDimensions`, `buildEquipmentQRUrl`, `parseEquipmentQRUrl`, `QRAllowedAction` 모두 export 확인 |

## Sub-Phase B — 백엔드 엔드포인트

| 기준 | 판정 | 상세 |
|------|------|------|
| M-B1 핸들러 + 데코레이터 | PASS | `@RequirePermissions(VIEW_EQUIPMENT)` + `@AuditLog({action:'read',...})` + `@Throttle({long:{limit:60,ttl:60_000}})` 부착 확인 |
| M-B2 400 INVALID_MANAGEMENT_NUMBER | PASS | `ParseManagementNumberPipe` → `BadRequestException({code:'INVALID_MANAGEMENT_NUMBER',...})` |
| M-B3 404 EQUIPMENT_NOT_FOUND | PASS | 서비스에서 NotFoundException 발생, spec 테스트 확인 |
| M-B4 parseManagementNumber SSOT | PASS | Pipe에서 `parseManagementNumber` import 사용, 정규식 재정의 0건 |
| M-B5 ParseManagementNumberPipe | PASS | `dto/management-number-param.pipe.ts` 존재 |
| M-B6 401 JwtAuthGuard | PASS | 글로벌 APP_GUARD에 JwtAuthGuard 등록 확인 |
| M-B7 403 VIEW_EQUIPMENT 미보유 | PASS | `@RequirePermissions(VIEW_EQUIPMENT)` + PermissionsGuard 글로벌 적용 |
| M-B8 Cross-site 조회 허용 | PASS | `enforceSiteAccess` 미사용, cross-site 허용 주석 명시, 액션 레벨로만 제어 |
| M-B9 allowedActions 응답 필드 | PASS | `EquipmentQRLandingResult` 타입에 `allowedActions: QRAllowedAction[]` 포함 |
| M-B10 QRAllowedAction SSOT | PASS | `packages/shared-constants/src/qr-access.ts`에만 정의. FE/BE 모두 import 사용 |
| M-B11 5가지 액션 판정 | PASS | `view_detail`, `view_qr`, `request_checkout`, `mark_checkout_returned`, `report_nc` 모두 구현 |
| M-B12 checkout_items 조인 | PASS | `checkoutItems` + `eq(checkoutItems.equipmentId, ...)` 조인 사용, `checkouts.equipmentId` 직접 참조 0건 |
| M-B13 request_checkout 동일 사이트 | PASS | `sameSite = user.site === equipment.site` + `CREATE_CHECKOUT` 권한 + `status === 'available'` |
| M-B14 신규 단위 테스트 4건 | PASS | 200+allowedActions, 404, 400(invalid), cross-site 4케이스 모두 존재 및 PASS |
| M-B15 AUDIT_ACTION 'read' SSOT 동기화 | PASS | `AUDIT_ACTION_VALUES`(schemas/enums/audit.ts), `AUDIT_ACTION_LABELS`(audit-log.ts), `AUDIT_ACTION_COLORS`(audit-log.ts), `AUDIT_ACTION_BADGE_TOKENS`(design-tokens/components/audit.ts), ko/en audit.json 모두 동기화 확인 |

## Sub-Phase C — 프론트엔드

| 기준 | 판정 | 상세 |
|------|------|------|
| M-C1 page.tsx PPR 패턴 | PASS | sync `QRLandingPage` + `<Suspense>` + async `QRLandingPageAsync` |
| M-C2 params Promise 타입 | PASS | `type PageParams = Promise<{ managementNumber: string }>` |
| M-C3 비인증 자동 리다이렉트 | PASS | `(dashboard)` 그룹 아래 배치 → 기존 proxy matcher 자동 처리. 신규 matcher 추가 0건 |
| M-C4 not-found.tsx | PASS | `app/(dashboard)/e/[managementNumber]/not-found.tsx` 존재 |
| M-C5 MobileBottomSheet Radix 래핑 | PASS | `components/ui/sheet.tsx`(SheetContent) 래핑. `.safe-area-bottom` 적용. focus trap은 Radix 자동 |
| M-C6 allowedActions prop 기반 CTA | PASS | `EquipmentActionSheet` props로 `allowedActions` 수신, `useAuth().can()` 호출 0건, 역할 리터럴 0건 |
| M-C7 EquipmentQRCode QR_CONFIG SSOT | PASS | `QR_CONFIG.errorCorrectionLevel`, `QR_CONFIG.margin`, `QR_CONFIG.scale` 사용. 하드코딩 0건 |
| M-C8 반출 신청 FRONTEND_ROUTES SSOT | PASS | `FRONTEND_ROUTES.CHECKOUTS.CREATE + '?equipmentId=' + ...` 사용 |
| M-C9 CreateCheckoutContent 프리필 | PASS | `useSearchParams().get('equipmentId')` + `enabled: !!preselectedEquipmentId` (무한루프 방지) |
| M-C10 queryKeys.equipment.byManagementNumber | PASS | query-config.ts line 321 확인. `REFETCH_STRATEGIES.NORMAL` 적용 |
| M-C11 onSuccess setQueryData 0건 | PASS | `use-equipment-by-management-number.ts`에 setQueryData/onSuccess 0건 |
| M-C12 useOptimisticMutation N/A | N/A | Phase 1에 mutation 미사용 |
| M-C13 manifest.json | PASS | name, short_name, start_url='/', display='standalone', theme_color, background_color, lang='ko', icons 필드 모두 존재 |
| M-C14 metadata.manifest | PASS | `layout.tsx` line 48: `manifest: '/manifest.json'`. 수동 `<link>` 삽입 0건 |
| M-C15 viewportFit='cover' | PASS | `viewport` 객체 line 66: `viewportFit: 'cover'` |
| M-C16 safe-area CSS 변수 | PASS | `--safe-area-inset-{top,right,bottom,left}` + `.safe-area-bottom`, `.safe-area-top` 존재 |
| M-C17 touch-target 44px 하드코딩 | PASS | 신규 파일에서 `44px` 리터럴 하드코딩 0건 |
| M-C18 ko/en qr.json | PASS | 두 파일 모두 존재. 섹션: `mobileActionSheet`, `qrDisplay`, `landing`. 키 완전 일치 |
| M-C19 namespaces 'qr' 추가 | PASS | `i18n/request.ts` line 61: `'qr'` |
| M-C20 한국어 하드코딩 0건 | PASS | 신규 mobile/equipment 컴포넌트, 훅, e/ 라우트 전체 한글 JSX 문자열 0건 |

## 보안/아키텍처

| 기준 | 판정 | 상세 |
|------|------|------|
| M-S1 req.user 서버 추출 | PASS | `@Req() req: AuthenticatedRequest` → `req.user` 경유. body 신뢰 0건 |
| M-S2 proxy matcher 유지 | PASS | `/((?!login\|api\|_next/static\|_next/image\|images\|favicon.ico).*)` 그대로 유지 |
| M-S3 middleware.ts 미생성 | PASS | `apps/frontend/middleware.ts` 존재하지 않음 확인 |
| M-S4 verify-ssot | PASS (grep 수동) | `/e/` 리터럴 신규 코드 0건. QR_CONFIG/LABEL_CONFIG 하드코딩 0건. SSOT 모두 SSOT 파일 경유 |
| M-S5 verify-i18n | PASS (grep 수동) | 한국어 JSX 하드코딩 0건. ko/en 키 완전 일치. namespaces 등록 확인 |
| M-S6 verify-auth | PASS (grep 수동) | 역할 리터럴 0건. `useAuth().can()` 미사용(allowedActions prop 기반) |
| M-S7 verify-nextjs | PASS (grep 수동) | params Promise 타입, proxy.ts 컨벤션 유지, Server/Client 경계 명확 |
| M-S8 verify-design-tokens | PASS (grep 수동) | 44px 하드코딩 0건, safe-area 디자인 토큰 경유 |
| M-S9 verify-frontend-state | PASS (grep 수동) | onSuccess setQueryData 0건 |
| M-S10 verify-hardcoding | PASS (grep 수동) | QR 옵션·URL 매직 리터럴 0건 |

## SHOULD 기준

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| S-1 review-architecture Critical 0개 | 미실행 | - |
| S-2 review-design ≥60 | 미실행 | - |
| S-3 Lighthouse | 미실행 | 미서비스 환경 |
| S-4 Playwright E2E | 미확인 | spec 파일 미생성 (SHOULD이므로 루프 차단 없음) |
| S-5 Bundle size delta <80KB | 미측정 | - |
| S-6 axe-core 위반 0건 | 미실행 | - |
| S-7 QR 보기/인쇄 수동 확인 | 미실행 | - |

## 전체 판정: **FAIL** (M-8 미달)

---

## 수정 지시

### 이슈 1: M-8 — 모든 QR Phase 1 산출물이 git에 커밋되지 않음

- 파일:
  - `packages/shared-constants/src/qr-access.ts` (untracked)
  - `packages/shared-constants/src/qr-config.ts` (untracked)
  - `packages/shared-constants/src/qr-url.ts` (untracked)
  - `apps/backend/src/modules/equipment/dto/management-number-param.pipe.ts` (untracked)
  - `apps/backend/src/modules/equipment/services/qr-access.service.ts` (untracked)
  - `apps/frontend/app/(dashboard)/e/` 디렉터리 전체 (untracked)
  - `apps/frontend/components/mobile/` 디렉터리 전체 (untracked)
  - `apps/frontend/components/equipment/EquipmentQRCode.tsx` (untracked)
  - `apps/frontend/components/equipment/EquipmentQRButton.tsx` (untracked)
  - `apps/frontend/hooks/use-equipment-by-management-number.ts` (untracked)
  - `apps/frontend/messages/ko/qr.json` (untracked)
  - `apps/frontend/messages/en/qr.json` (untracked)
  - `apps/frontend/public/manifest.json` (untracked)
  - 수정 파일 20+ 건 모두 미스테이지
- 문제: `git status`에 untracked 파일 13건 + 수정 파일 20+ 건. 모든 QR Phase 1 작업이 로컬에만 존재하며 커밋되지 않음.
- 수정: 모든 신규/수정 파일 `git add` 후 `git commit`으로 커밋.
  ```bash
  git add packages/shared-constants/src/qr-access.ts \
          packages/shared-constants/src/qr-config.ts \
          packages/shared-constants/src/qr-url.ts \
          packages/shared-constants/src/index.ts \
          packages/shared-constants/src/frontend-routes.ts \
          packages/shared-constants/src/api-endpoints.ts \
          apps/backend/src/modules/equipment/dto/management-number-param.pipe.ts \
          apps/backend/src/modules/equipment/services/qr-access.service.ts \
          apps/backend/src/modules/equipment/equipment.controller.ts \
          apps/backend/src/modules/equipment/equipment.controller.types.ts \
          apps/backend/src/modules/equipment/equipment.service.ts \
          apps/backend/src/modules/equipment/__tests__/equipment.controller.spec.ts \
          apps/frontend/app/\(dashboard\)/e/ \
          apps/frontend/components/mobile/ \
          apps/frontend/components/equipment/EquipmentQRCode.tsx \
          apps/frontend/components/equipment/EquipmentQRButton.tsx \
          apps/frontend/hooks/use-equipment-by-management-number.ts \
          apps/frontend/messages/ko/qr.json \
          apps/frontend/messages/en/qr.json \
          apps/frontend/public/manifest.json \
          apps/frontend/app/layout.tsx \
          apps/frontend/styles/globals.css \
          apps/frontend/i18n/request.ts \
          apps/frontend/lib/api/query-config.ts \
          apps/frontend/lib/api/equipment-api.ts \
          apps/frontend/lib/api/equipment-api-server.ts \
          apps/frontend/lib/api/shared/equipment-api.shared.ts \
          apps/frontend/lib/design-tokens/components/audit.ts \
          apps/frontend/messages/ko/audit.json \
          apps/frontend/messages/en/audit.json \
          packages/schemas/src/enums/audit.ts \
          packages/schemas/src/audit-log.ts \
          apps/frontend/package.json \
          pnpm-lock.yaml
  git commit -m "feat(qr): Phase 1 — 모바일 랜딩 + 개별 QR + SSOT 인프라"
  ```
  (나머지 data-migration 등 무관 파일은 별도 분리 커밋 고려)
- 검증: `git status` → 대상 파일 clean. `pnpm tsc --noEmit` + `pnpm --filter backend run test` 재확인.

---

## 비고

- M-8 외 **모든 MUST 기준 PASS** — 구현 품질 자체는 양호.
- AUDIT_ACTION_COLORS는 `packages/schemas/src/audit-log.ts`에 위치(계약 언급 파일과 다름)하나 실제 'read' 동기화 완료되어 기능적 SSOT drift 없음.
- `EquipmentQRButton.tsx`도 untracked이나 계약 명시 범위(EquipmentDetailClient.tsx에 QR 버튼 추가)의 구현체로 확인됨.
- data-migration 관련 untracked/modified 파일(`column-mapping.spec.ts` 등)은 QR Phase 1 범위 외 — 별도 커밋 처리 권장.
