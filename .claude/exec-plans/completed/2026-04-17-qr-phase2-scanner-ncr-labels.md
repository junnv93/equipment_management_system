# QR Phase 2 — 라벨 PDF 일괄 + 앱 내 스캐너 + 원탭 NCR 구현 계획

## 메타
- 생성: 2026-04-17T00:00:00+09:00
- 모드: Mode 2 (Planner → Generator → Evaluator)
- Slug: `qr-phase2-scanner-ncr-labels`
- 예상 변경: ~18~22 파일 (신규 11, 수정 7~11)
- 선행: `.claude/exec-plans/completed/2026-04-17-qr-phase1-mobile-landing.md` (완료, commit 7a6255d1)
- 소스 플랜: `/home/kmjkds/.claude/plans/qr-parallel-puppy.md` Phase 2 (사용자 승인)

## 설계 철학
Phase 1이 완결한 SSOT (`QR_CONFIG`/`LABEL_CONFIG`/`QR_ACTION_VALUES`/`FRONTEND_ROUTES.SCAN`/`buildEquipmentQRUrl`/`parseEquipmentQRUrl`/`MobileBottomSheet`/`EquipmentActionSheet`/PWA)만 **소비**한다. 새 enum·URL 빌더·권한 규칙을 만들지 않는다. 대신 Phase 2는 *브라우저 성능 경계*(Web Worker, 카메라 권한, 사진 업로드) 세 축에서만 신규 인프라를 도입하며, 각 축은 독립적으로 배포 가능한 Sub-Phase로 분리한다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| Worker 번들링 | `new Worker(new URL('./generate-label-pdf.worker.ts', import.meta.url), { type: 'module' })` (Webpack 5 / Next.js 16 표준) | Next.js 16 Webpack 5가 기본 지원. `worker-loader` 플러그인 도입 불필요. TypeScript는 `.worker.ts` 서픽스로 명시. |
| PDF 라이브러리 | `jspdf` (+ `qrcode`) | pdf-lib 대비 번들 +30KB 이내 이득, `addImage(dataURL)` 원스톱 QR 삽입. 한글 폰트 임베드 불필요(라벨은 ASCII 관리번호만). |
| Worker 데이터 전송 | `postMessage({ type: 'generate', items, config })` → 진행률 `{ type: 'progress', done, total }` → 완료 `{ type: 'done', pdfBytes }` → 에러 `{ type: 'error', message }` | 구조화된 이벤트 타입으로 호출 측 reducer 단순화. Transferable `ArrayBuffer` 사용(대용량 PDF 메모리 복사 회피). |
| Batch 제한 | `LABEL_CONFIG.maxBatch` (SSOT, Phase 1에서 500으로 정의) | 매직 넘버 하드코딩 금지. 초과 시 사용자 확인 다이얼로그. |
| html5-qrcode 로드 | 동적 `import('html5-qrcode')` inside `useEffect` | SSR 시 `window` 참조 → 빌드 실패 방지. Next.js `dynamic(() => ..., { ssr: false })`은 컴포넌트 단위 분할 시에만 필요. |
| 스캐너 권한 UX | 마운트 시 1회 `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })` 시도 → 거부 시 수동 입력 폼 전면 전환. 재요청 금지. | 반복 prompt는 Android/iOS에서 영구 거부 유발. 수동 입력은 접근성 fallback + QR 훼손 대응 겸용. |
| 수동 입력 검증 | `parseManagementNumber()` SSOT + `parseEquipmentQRUrl()` 양방향 | 사용자 입력이 `SUW-E0001` 또는 `https://app/e/SUW-E0001` 모두 수용. |
| NCR 사진 링크 전략 | **NCR 생성 후 `documents` API에 `equipmentId`만 전달 + description 필드 `NCR-{ncUuid}` 프리픽스** | Backend 변경 0 제약 + 기존 documents 모듈이 `nonConformanceId` 필드 미지원. 장비 상세 → 문서 탭에서 프리픽스 필터로 가시. 향후 documents 모듈 확장 시 migration 1회로 전환(tech-debt). |
| 사진 업로드 순서 | **NCR 생성 → 성공 응답 ncUuid 확보 → 사진 병렬 업로드** | Pre-upload 후 NCR create 실패 시 orphan 문서 발생. Post-create 순서는 일부 사진 업로드 실패해도 NCR은 유효. |
| Bulk 선택 훅 | `useBulkSelection<T>(items, keyFn)` 순수 훅. React Query 캐시 비접촉. | 체크아웃/문서/NCR 목록도 재사용 가능. 상태는 `useState<Set<string>>` 기반. `selectedItems` 파생값은 `useMemo`. |
| FileUpload `capture` 확장 | 기존 `FileUploadProps`에 `capture?: 'environment' \| 'user'` 옵션 추가. `<input>`에 조건부 spread. | 기존 사용처 영향 0 (undefined 시 attribute 미삽입). |
| 스캐너 페이지 보호 | 기존 proxy `/((?!login\|api\|_next/static\|...))` 매처 재사용 (`/scan`는 dashboard 그룹 하위로 배치) | 새 matcher 금지 규칙 준수. |
| CSP | `infra/nginx/nginx.conf.template` `media-src 'self' blob:` 추가는 **SHOULD** (운영 체크리스트). 앱 코드 내 csp.ts 파일 미존재 — 확인 완료. | CSP 정책은 인프라 계층. 앱 코드 변경 최소화. |
| "report_nc" CTA 라우팅 변경 | `EquipmentActionSheet.handleActionClick('report_nc')`를 `router.push(NC_LIST?action=create)` → `setNcQuickOpen(true)` (시트 상태)로 교체 | Phase 1 placeholder 대체. `MobileBottomSheet` 재사용. 라우트 이동 제거로 모바일 UX 개선. |
| Dashboard 모바일 헤더 스캔 아이콘 | `DashboardShell.tsx` 내 `md:hidden` "카메라" 버튼 추가. onClick → `router.push(FRONTEND_ROUTES.SCAN)` | 새 라우트 상수 불필요(Phase 1에서 등록 완료). |
| i18n 구조 확장 | `messages/{ko,en}/qr.json`에 `labelPrint`, `scanner`, `ncrQuick` 신규 섹션 | `i18n/request.ts`의 `'qr'` 이미 등록. |
| Worker 실패 처리 | `worker.onerror` + `type: 'error'` 메시지 양쪽 수신. Blob URL revoke 보장. | 메인 스레드 블로킹 없음 + 메모리 누수 방지. |

## 정찰 요약

**Phase 1 완료 확인 (재사용 대상):**
- `packages/shared-constants/src/qr-config.ts` — `QR_CONFIG`, `LABEL_CONFIG`, `maxBatch: 500`
- `packages/shared-constants/src/qr-url.ts` — `buildEquipmentQRUrl`, `parseEquipmentQRUrl`
- `packages/shared-constants/src/qr-access.ts` — `QR_ACTION_VALUES`, `QR_ACTION_PRIORITY` (추가 금지)
- `packages/shared-constants/src/frontend-routes.ts` — `FRONTEND_ROUTES.SCAN` 이미 등록
- `apps/frontend/components/mobile/MobileBottomSheet.tsx` — NCR 시트 재사용
- `apps/frontend/components/mobile/EquipmentActionSheet.tsx` — `report_nc` 핸들러 수정만
- `apps/frontend/components/shared/FileUpload.tsx` — `capture` prop 추가만
- `apps/frontend/lib/api/document-api.ts` — `uploadDocument` 재사용
- `apps/frontend/styles/globals.css` — `--safe-area-inset-*` 이미 정의
- `apps/frontend/i18n/request.ts` — `namespaces`에 `'qr'` 이미 포함

**핵심 제약 발견:**
- documents 모듈이 `nonConformanceId` 필드 미지원 → `equipmentId` + `description` 프리픽스 우회 (아키텍처 결정 참조)
- `apps/frontend/lib/security/csp.ts` 미존재. CSP는 nginx 레벨
- Phase 1과 동일하게 E2E spec은 SHOULD로 처리

## 구현 Phase

### Sub-Phase A: 프리미티브 — Bulk Selection 훅 + FileUpload capture prop
**목표:** Phase B·D가 의존하는 재사용 프리미티브를 완결한다.

**변경 파일:**
1. `apps/frontend/hooks/use-bulk-selection.ts` — **신규** 제네릭 훅 `useBulkSelection<T>(items, keyFn)` → `{ selected, selectedItems, toggle, selectAll, clear, isSelected, count }`.
2. `apps/frontend/hooks/__tests__/use-bulk-selection.test.ts` — **신규** Jest 테스트.
3. `apps/frontend/components/shared/FileUpload.tsx` — **수정** `capture?: 'environment' | 'user'` 옵셔널 prop 추가.

**검증:**
- `pnpm --filter frontend run tsc --noEmit` 통과
- `pnpm --filter frontend run test hooks/` 신규 테스트 PASS
- FileUpload 기존 호출처 grep → 회귀 0

---

### Sub-Phase B: 벌크 라벨 PDF + Web Worker + 목록 통합
**변경 파일:**
1. `apps/frontend/lib/qr/generate-label-pdf.worker.ts` — **신규** Web Worker.
2. `apps/frontend/lib/qr/generate-label-pdf.ts` — **신규** Worker 래퍼.
3. `apps/frontend/lib/qr/label-batch-error.ts` — **신규** `LabelBatchExceededError`.
4. `apps/frontend/components/equipment/BulkLabelPrintButton.tsx` — **신규** 진행률 + Blob 다운로드.
5. `apps/frontend/app/(dashboard)/equipment/page.tsx` 또는 리스트 컴포넌트 — **수정** `useBulkSelection` 통합.
6. `apps/frontend/messages/ko/qr.json` — **수정** `labelPrint` 섹션 추가.
7. `apps/frontend/messages/en/qr.json` — **수정** 동일 섹션 영어.
8. `apps/frontend/package.json` — **수정** `jspdf` 의존성.

**검증:**
- `pnpm --filter frontend run build` 성공 (Worker chunk 생성)
- 500건 생성 시 Chrome Performance 탭에서 Long Task < 50ms (SHOULD)

---

### Sub-Phase C: 앱 내 스캐너 페이지
**변경 파일:**
1. `apps/frontend/app/(dashboard)/scan/page.tsx` — **신규** Server Page.
2. `apps/frontend/components/scan/QRScannerView.tsx` — **신규** html5-qrcode + 권한 관리.
3. `apps/frontend/components/scan/ManualEntryFallback.tsx` — **신규** 수동 입력 fallback.
4. `apps/frontend/components/layout/DashboardShell.tsx` — **수정** 모바일 헤더 Camera 아이콘.
5. `apps/frontend/messages/ko/qr.json` — **수정** `scanner` 섹션.
6. `apps/frontend/messages/en/qr.json` — **수정** 동일 섹션.
7. `apps/frontend/package.json` — **수정** `html5-qrcode` 의존성.

**검증:**
- `pnpm --filter frontend run build` — SSR 실패 0
- grep 정적 `import html5-qrcode` 0건
- 수동: `/scan` → 권한 허용 → 스캔 → `/e/SUW-E0001` 이동. 권한 거부 → 수동 입력 → 동일 이동.

---

### Sub-Phase D: 원탭 NCR + 사진 업로드
**변경 파일:**
1. `apps/frontend/components/non-conformances/MobileNCRQuickForm.tsx` — **신규** 3필드 + optional 사진.
2. `apps/frontend/components/mobile/EquipmentActionSheet.tsx` — **수정** `report_nc` CTA를 시트 오픈으로 교체.
3. `apps/frontend/messages/ko/qr.json` — **수정** `ncrQuick` 섹션.
4. `apps/frontend/messages/en/qr.json` — **수정** 동일 섹션.

**검증:**
- QR 랜딩 → 부적합 신고 → 시트 → 제출 → 장비 상세 NC 목록 가시 (수동)
- 사진 첨부 → 제출 → 장비 상세 문서 탭 `NCR-xxx` 가시 (수동)
- `verify-frontend-state`: `setQueryData` in onSuccess 0건

---

### Sub-Phase E: 검증 게이트
**변경 파일:** 코드 변경 없음.

**검증:**
- `pnpm tsc --noEmit` (root) exit 0
- `pnpm --filter frontend build + test` PASS
- `pnpm --filter backend test` 회귀 0
- 스킬: `verify-ssot`, `verify-i18n`, `verify-hardcoding`, `verify-nextjs`, `verify-frontend-state`, `verify-design-tokens`, `verify-security` PASS
- SHOULD: Playwright `phase2-scanner-ncr.spec.ts` 2~3 시나리오

## 전체 변경 파일 요약

### 신규 생성 (11)
| 파일 | 목적 |
|------|------|
| `apps/frontend/hooks/use-bulk-selection.ts` | 제네릭 벌크 선택 프리미티브 |
| `apps/frontend/hooks/__tests__/use-bulk-selection.test.ts` | 훅 단위 테스트 |
| `apps/frontend/lib/qr/generate-label-pdf.worker.ts` | Web Worker PDF 생성 |
| `apps/frontend/lib/qr/generate-label-pdf.ts` | Worker 래퍼 Promise API |
| `apps/frontend/lib/qr/label-batch-error.ts` | maxBatch 초과 에러 |
| `apps/frontend/components/equipment/BulkLabelPrintButton.tsx` | 진행률 + 다운로드 |
| `apps/frontend/app/(dashboard)/scan/page.tsx` | 스캐너 진입 |
| `apps/frontend/components/scan/QRScannerView.tsx` | html5-qrcode 래퍼 |
| `apps/frontend/components/scan/ManualEntryFallback.tsx` | 수동 입력 |
| `apps/frontend/components/non-conformances/MobileNCRQuickForm.tsx` | NCR 폼 |
| (SHOULD) `apps/frontend/tests/e2e/features/equipment/qr/phase2-scanner-ncr.spec.ts` | E2E |

### 수정 (7~9)
| 파일 | 변경 의도 |
|------|----------|
| `apps/frontend/components/shared/FileUpload.tsx` | `capture` prop 추가 |
| `apps/frontend/app/(dashboard)/equipment/page.tsx` | useBulkSelection + 체크박스 + 버튼 |
| `apps/frontend/components/mobile/EquipmentActionSheet.tsx` | report_nc CTA 시트 오픈 |
| `apps/frontend/components/layout/DashboardShell.tsx` | 모바일 Camera 버튼 |
| `apps/frontend/messages/ko/qr.json` | labelPrint/scanner/ncrQuick 섹션 |
| `apps/frontend/messages/en/qr.json` | 동일 영어 |
| `apps/frontend/package.json` | jspdf, html5-qrcode |
| (SHOULD) `infra/nginx/nginx.conf.template` | CSP media-src 확장 |

## 의사결정 로그

- **2026-04-17** — documents 모듈 `nonConformanceId` 미지원 실측 확인 → `equipmentId` + `description='NCR-{uuid}'` 우회
- **2026-04-17** — Worker 번들링 Next.js 16 표준 패턴 (worker-loader 불필요)
- **2026-04-17** — PDF 라이브러리 jspdf 선택 (pdf-lib 대비 번들 + 한글 폰트 임베드 불필요)
- **2026-04-17** — 스캐너 권한 1회만 prompt (재요청 금지)
- **2026-04-17** — html5-qrcode 동적 import (SSR window 참조 회피)
- **2026-04-17** — NCR 사진 Post-NCR-Create 순서 (orphan 방지)
- **2026-04-17** — CSP는 nginx 레벨, 앱 코드 변경 0, 운영 체크리스트 SHOULD
- **2026-04-17** — "report_nc" CTA는 라우트 이동 → 시트 오픈 전환 (Phase 1 placeholder 대체)
- **2026-04-17** — E2E spec은 Phase 1과 동일하게 SHOULD
- **2026-04-17** — `useBulkSelection`은 순수 React 훅(React Query 무접촉)
