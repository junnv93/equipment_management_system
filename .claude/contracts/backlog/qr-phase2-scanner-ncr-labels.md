# 스프린트 계약: QR Phase 2 — 라벨 PDF 일괄 + 앱 내 스캐너 + 원탭 NCR

## 생성 시점
2026-04-17T00:00:00+09:00

## Slug
`qr-phase2-scanner-ncr-labels`

## 범위
사용자 승인 플랜 Phase 2. Backend 변경 **0건** (documents/NCR DTO 확장 금지).

Phase 3 (핸드오버 서명 토큰)은 **범위 외**.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

**전체 품질 게이트:**
- [ ] M-1: `pnpm tsc --noEmit` root exit 0
- [ ] M-2: `pnpm --filter frontend run build` 성공 (Worker chunk 생성, SSR window 참조 0건)
- [ ] M-3: `pnpm --filter backend run build` 성공
- [ ] M-4: `pnpm --filter frontend run test` PASS (회귀 0 + 신규 use-bulk-selection 테스트)
- [ ] M-5: `pnpm --filter backend run test` 회귀 0
- [ ] M-6: `pnpm lint` 에러 0
- [ ] M-7: 신규 `any` 타입 0건
- [ ] M-8: `git status` clean

**Backend 불변성:**
- [ ] M-BE1: `apps/backend/src/modules/non-conformances/dto/create-non-conformance.dto.ts` diff 0라인
- [ ] M-BE2: `apps/backend/src/modules/documents/**` diff 0라인
- [ ] M-BE3: 신규 backend endpoint 0건

**Sub-Phase A — 프리미티브:**
- [ ] M-A1: `use-bulk-selection.ts` 존재, `useBulkSelection<T>(items, keyFn)` 제네릭 훅. React Query 무접촉(`useQuery`/`useMutation`/`queryClient` import 0건).
- [ ] M-A2: 반환 shape: `{ selected, selectedItems, toggle, selectAll, clear, isSelected, count }`
- [ ] M-A3: 단위 테스트 파일 존재 + 핵심 케이스 PASS
- [ ] M-A4: `FileUpload.tsx`에 `capture?: 'environment' | 'user'` optional prop. 기존 사용처 회귀 0.
- [ ] M-A5: `<input>`에 조건부 `capture` 속성 적용

**Sub-Phase B — 벌크 라벨 PDF:**
- [ ] M-B1: `generate-label-pdf.worker.ts` 신규 파일 존재
- [ ] M-B2: Worker 생성 패턴 `new Worker(new URL('./generate-label-pdf.worker.ts', import.meta.url), { type: 'module' })` (grep 검증). `worker-loader` 도입 0건.
- [ ] M-B3: `LABEL_CONFIG.maxBatch` SSOT 사용. 500 리터럴 0건.
- [ ] M-B4: `QR_CONFIG` + `buildEquipmentQRUrl` SSOT 사용. 옵션 하드코딩 0건.
- [ ] M-B5: Worker 메시지 타입 4종(`generate`/`progress`/`done`/`error`) 처리
- [ ] M-B6: `BulkLabelPrintButton.tsx`: 선택 0 → disabled, maxBatch 초과 → confirm, 진행률 표시, Blob URL revoke
- [ ] M-B7: 장비 목록에 체크박스 열 + `useBulkSelection<Equipment>` 통합
- [ ] M-B8: Worker 실패 시 toast.error + terminate (메모리 누수 0)

**Sub-Phase C — 스캐너:**
- [ ] M-C1: `/scan/page.tsx` 신규. sync Page + Suspense async 자식.
- [ ] M-C2: `QRScannerView.tsx`가 html5-qrcode를 **동적 import**. 정적 top-level import 0건 (grep `^import.*html5-qrcode` 결과 0)
- [ ] M-C3: 권한 거부 시 `ManualEntryFallback` 렌더. `getUserMedia` 호출 마운트 시 1회만.
- [ ] M-C4: 수동 입력 검증 `parseManagementNumber` + `parseEquipmentQRUrl` SSOT. 정규식 재정의 0.
- [ ] M-C5: 성공 → `router.push(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(mgmt))`. 리터럴 URL 0.
- [ ] M-C6: Cleanup: unmount 시 `Html5Qrcode.stop()` + `.clear()`
- [ ] M-C7: 수동 입력 폼 키보드만으로 완주 가능(수동 검증)
- [ ] M-C8: `DashboardShell.tsx` 모바일 헤더 Camera 아이콘 + `aria-label` + 터치 타깃 44px (`--touch-target-min`)
- [ ] M-C9: Proxy matcher 수정 0건

**Sub-Phase D — NCR:**
- [ ] M-D1: `MobileNCRQuickForm.tsx`: ncType(Select) + cause(Textarea) + discoveryDate(default 오늘) + photos(optional `capture="environment"`)
- [ ] M-D2: ncType 옵션은 `NonConformanceTypeEnum`/`NON_CONFORMANCE_TYPE_VALUES` SSOT. 리터럴 0.
- [ ] M-D3: 제출: NCR create → ncUuid 확보 → photos 병렬 `uploadDocument(file, 'photo', { equipmentId, description: 'NCR-{ncUuid}' })`
- [ ] M-D4: NCR create 페이로드에 photo/document 관련 신규 필드 0건 (grep)
- [ ] M-D5: `documentApi.uploadDocument` 호출에 `nonConformanceId` 전달 0건
- [ ] M-D6: 성공 시 `invalidateQueries({ queryKey: queryKeys.nonConformances.byEquipment(equipmentId) })`. `setQueryData` 0.
- [ ] M-D7: `EquipmentActionSheet.tsx` `report_nc` case가 `router.push` 0 → 시트 상태 전환
- [ ] M-D8: `EquipmentActionSheet.tsx` JSX에 `<MobileBottomSheet>...<MobileNCRQuickForm/></MobileBottomSheet>` 마운트
- [ ] M-D9: `QR_ACTION_VALUES`에 신규 값 추가 0
- [ ] M-D10: `QR_ACTION_PRIORITY` 변경 0
- [ ] M-D11: 사진 부분 실패 시 NCR은 성공 보고 + 실패 리스트 + 재시도 버튼

**i18n:**
- [ ] M-I1: `messages/ko/qr.json`에 `labelPrint`, `scanner`, `ncrQuick` 3 섹션 추가
- [ ] M-I2: `messages/en/qr.json` 동일 키
- [ ] M-I3: ko/en 키 mismatch 0
- [ ] M-I4: 신규 TSX에 하드코딩된 한국어/영어 문자열 0
- [ ] M-I5: `i18n/request.ts` `namespaces` 수정 0

**보안/아키텍처 스킬:**
- [ ] M-S1: `verify-ssot` PASS
- [ ] M-S2: `verify-i18n` PASS
- [ ] M-S3: `verify-hardcoding` PASS
- [ ] M-S4: `verify-nextjs` PASS
- [ ] M-S5: `verify-frontend-state` PASS
- [ ] M-S6: `verify-design-tokens` PASS
- [ ] M-S7: `verify-security` PASS

### 권장 (SHOULD) — tech-debt 등록 가능, 루프 차단 없음

- [ ] S-1: `review-architecture` Critical 0
- [ ] S-2: `review-design` ≥ 60 점 (NCR 폼/스캐너/벌크버튼)
- [ ] S-3: Playwright `phase2-scanner-ncr.spec.ts` 2~3 시나리오 PASS
- [ ] S-4: Chrome Performance 탭 500건 PDF 생성 시 Long Task < 50ms
- [ ] S-5: 초기 dashboard chunk < +10KB gz
- [ ] S-6: 번들 총계 delta < +300KB gz
- [ ] S-7: axe-core `/scan` + NCR 시트 + bulk 버튼 Critical 0
- [ ] S-8: `infra/nginx/nginx.conf.template` `media-src 'self' blob:` 추가 검토
- [ ] S-9: Lighthouse 모바일 `/scan` LCP < 3s

### 적용 verify 스킬

변경 영역 기반:
- **hooks/** → verify-frontend-state
- **lib/qr/** → verify-ssot, verify-hardcoding
- **app/(dashboard)/scan/** → verify-nextjs, verify-i18n, verify-ssot, verify-security
- **components/scan/** → verify-nextjs, verify-design-tokens, verify-i18n
- **components/equipment/BulkLabelPrintButton.tsx** → verify-hardcoding, verify-i18n, verify-frontend-state
- **components/non-conformances/MobileNCRQuickForm.tsx** → verify-frontend-state, verify-i18n, verify-ssot, verify-zod
- **components/mobile/EquipmentActionSheet.tsx** → verify-ssot, verify-auth, verify-i18n
- **components/layout/DashboardShell.tsx** → verify-design-tokens, verify-i18n
- **components/shared/FileUpload.tsx** → verify-hardcoding
- **messages/{ko,en}/qr.json** → verify-i18n

## 동시 세션 경고

병렬 세션 `history-card-qp1802` 활성화. Phase 2는 다음 파일 수정 **금지**:
- `apps/frontend/components/equipment/EquipmentStickyHeader.tsx`
- `apps/frontend/components/equipment/BasicInfoTab.tsx`
- `apps/backend/src/modules/equipment/**/history-card.service.ts`
- `apps/backend/src/modules/equipment/**/equipment-history.ts`
- `apps/backend/src/modules/data-migration/constants/**`

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 MUST 2회 연속 FAIL → 설계 문제, 수동 개입
- 3회 반복 초과 → 자동 수동 개입
- SHOULD 실패는 tech-debt-tracker 기록

## Evaluator 참조
- 평가 리포트: `.claude/evaluations/qr-phase2-scanner-ncr-labels.md`
- 소스 플랜: `/home/kmjkds/.claude/plans/qr-parallel-puppy.md` Phase 2
- 선행 Phase 1: `.claude/exec-plans/completed/2026-04-17-qr-phase1-mobile-landing.md`
