# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-21 (QR Phase 1-3 후속 개선 섹션 9건 전체 archive-domain.md 이동. 미완료 1건: sticky-header CSS 변수(트리거 조건 미달).)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

## 2026-04-17 신규 — QR Phase 1-3 후속 개선 (10건) [9건 완료, 1건 사용자 결정 대기]

> **발견 배경**: QR 모바일 워크플로우 Phase 1-3 완료 후 "SSOT/비하드코딩/워크플로우/성능/보안/접근성" 자체 감사에서 도출. 2-agent 병렬 verify (SHOULD 항목 + 시스템 와이드 구조적 개선). 모든 항목 `confirmed` — file:line 증거 포함.
> **원칙 준수**: (1) QR은 경로 (feedback_qr_is_path_not_workflow.md) — QR 시나리오 전용 새 워크플로우 추가 금지, 기존 서비스로 연결만. (2) 커밋 전 자체 감사 (feedback_pre_commit_self_audit.md) — SSOT/하드코딩/eslint-disable/a11y/워크플로우 재사용/성능/검증 7항목.

### ~~🟠 HIGH — `documents.nonConformanceId` FK 도입 + NCR 첨부 모듈 완결 (Mode 2)~~ ✅ 완료 (2026-04-18)

```
문제 (아키텍처 수준):
- 현재 NC 생성 UI는 사진/첨부 필드 없음 (confirmed: components/non-conformances/CreateNonConformanceForm.tsx — 추출된 폼에 photos/attachments prop 0건)
- `documents` 테이블이 다형성 FK(equipmentId, calibrationId, requestId, softwareValidationId)만 지원하고 nonConformanceId 컬럼 부재 (packages/db/src/schema/documents.ts 확인)
- 결과: QR 현장 사용자가 부적합 신고 시 사진 첨부 경로가 아예 없음 (기존 데스크톱/모바일 동일)
- QR Phase 2-D rollback 후 description='NCR-{uuid}' 프리픽스 우회도 제거됨 — 현재는 사진 첨부가 전혀 불가능한 상태

조치 (backend migration + 모듈 확장 + 프론트 폼 확장):
1. packages/db/src/schema/documents.ts: `nonConformanceId uuid` 컬럼 + FK + index 추가
2. drizzle migration: `0030_add_documents_non_conformance_id.sql`
3. apps/backend/src/modules/documents/dto + service: context option에 nonConformanceId 추가
4. apps/backend/src/modules/non-conformances/:
   - GET /non-conformances/:id/documents 신규 (기존 equipmentId 기반 조회와 패러렐)
   - POST /non-conformances/:id/documents 신규 (or documents 모듈 직접 호출 + context.nonConformanceId)
5. apps/frontend/lib/api/non-conformances-api.ts: `getDocumentsByNc(ncId)`, `uploadNcDocument(ncId, file)` 추가
6. components/non-conformances/CreateNonConformanceForm.tsx: optional photos 필드 추가 (FileUpload capture='environment' 재사용). 제출 순서: NC create → 사진 병렬 업로드 with context.nonConformanceId
7. components/non-conformances/NCDetailClient.tsx: Documents 탭에 `nonConformanceId` 컨텍스트 사진 목록 표시
8. 기존 equipmentId + description='NCR-*' 우회 흔적 전수 확인 및 제거

원칙 준수 체크:
- SSOT: DocumentType/queryKeys/FRONTEND_ROUTES 재사용
- 하드코딩 0: context key는 DTO enum으로 상수화
- 워크플로우: QR 전용 flow 추가 금지 — 기존 NC 폼에 필드 추가 시 QR/데스크톱 모두 혜택
- 성능: Presigned URL 업로드 재사용, 이미지 multi-upload는 Promise.allSettled
- 접근성: FileUpload aria-label + 에러 공지

검증 (MUST):
- pnpm tsc --noEmit exit 0 (3 workspaces)
- pnpm --filter backend test (documents/non-conformances spec 회귀 0 + 신규 2건)
- drizzle migrate 정방향/역방향 확인
- QR 랜딩 → 부적합 신고 → 기존 페이지로 이동 → 사진 첨부 가능 수동 확인
- 자체 감사 체크리스트 7항목 PASS (feedback_pre_commit_self_audit.md)

의존성: 선행 없음. 우선 실행 권장 (QR Phase 2-D가 제기한 근본 문제 해결).
추정: Mode 2 / 8-12 파일 / ~4시간.
```

### ~~🟠 HIGH — CSP `media-src 'self' blob:` + sops `HANDOVER_TOKEN_SECRET` 추가 (Mode 1)~~ ✅ 완료 (2026-04-18)

```
문제:
- infra/nginx/nginx.conf.template에 Content-Security-Policy 키워드 0건 (confirmed)
  → 프로덕션 배포 시 카메라 MediaStream(html5-qrcode) 또는 Blob URL(qrcode SVG, PDF 다운로드)이 기본 CSP로 차단될 가능성
- infra/secrets/prod.env.sops.yaml에 HANDOVER_TOKEN_SECRET 누락 (confirmed — JWT_SECRET, INTERNAL_API_KEY 등만 존재)
  → Phase 3 handover 기능이 프로덕션에서 환경변수 검증 실패로 앱 기동 실패 가능

조치:
1. infra/nginx/nginx.conf.template:
   - `add_header Content-Security-Policy "default-src 'self'; media-src 'self' blob: mediastream:; img-src 'self' data: blob:; ..."` 형식으로 표준 CSP 정책 추가
   - blob:/mediastream: 허용은 QR 스캐너(카메라) + QR SVG blob + PDF 다운로드 blob 모두 커버
   - dev/prod 프로필 분리 (dev는 unsafe-eval 허용, prod는 strict)
2. infra/secrets/*.sops.yaml (prod + lan):
   - `HANDOVER_TOKEN_SECRET: <32+ char random>` 추가 (openssl rand -base64 48)
   - docs/operations/secret-rotation.md에 handover secret 로테이션 절차 추가 (10분 TTL이라 rolling 안전)
3. apps/backend/.env.example: HANDOVER_TOKEN_SECRET 예시 + 최소 32자 주석
4. pre-commit gitleaks가 secret 실수 커밋 방지하는지 확인 (기존 infrastructure)

원칙 준수:
- 하드코딩 0: CSP directive는 nginx conf 한 곳
- 보안: Phase 3에서 설계한 JWT_SECRET 격리가 실제 프로덕션에 반영됨
- 워크플로우: 기존 sops 로테이션 절차 재사용

검증 (MUST):
- nginx -t 구문 검증
- curl로 CSP 헤더 확인 (`curl -I https://<stage>/` 응답)
- 로컬에서 HANDOVER_TOKEN_SECRET env 없이 기동 → BackendException 확인
- sops 암호화/복호화 round-trip 정상

의존성: 없음. 배포 직전 필수 (Phase 3 production 가동 precondition).
추정: Mode 1 / 5-6 파일 / ~2시간.
```

### ~~🟠 HIGH — QR Phase 1-3 Playwright E2E 시나리오 3종 (Mode 1)~~ ✅ 완료 (2026-04-18)

```
문제:
- apps/frontend/tests/e2e/features/equipment/qr/ 디렉토리 미존재 (confirmed)
- apps/frontend/tests/e2e/features/handover/ 디렉토리 미존재 (confirmed)
- Phase 1-3이 수동 검증만 수행 → 회귀 방지 자동화 0
- 특히 Phase 3 handover는 2-세션(lender/borrower) + 1회용 토큰 시나리오라 수동 검증 취약

조치:
1. tests/e2e/features/equipment/qr/phase1-mobile-landing.spec.ts (role-based fixtures):
   - 인증 상태 /e/SUW-E0001 → action sheet 렌더 + CTA 권한별 노출 (quality_manager=view만, test_engineer=반출 CTA)
   - 비인증 → /login?callbackUrl=%2Fe%2FSUW-E0001 리다이렉트 + 로그인 후 복귀
   - 잘못된 관리번호(/e/INVALID) → not-found.tsx 렌더
2. tests/e2e/features/equipment/qr/phase2-scanner-ncr.spec.ts:
   - /scan → 수동 입력 폼 (카메라는 E2E에서 mock 어려움) → parseManagementNumber → /e/:mgmt 이동
   - 벌크 PDF 트리거 → 다운로드 Blob 크기 스냅샷
3. tests/e2e/features/handover/phase3-handover.spec.ts (2-session):
   - lenderStorageState/borrowerStorageState 2개 session
   - lender: 체크아웃 상세 → "인수인계 QR" → 토큰 발급 응답 캡처 → URL 추출
   - borrower: /handover?token=... 직접 진입 → router.replace → /checkouts/:id/check 도달 확인
   - Replay 방어: 동일 토큰으로 borrower 재방문 → error UI(consumed) 표시 확인
   - TTL 방어: 만료 토큰 시뮬레이션 (jwt sign with past exp) → error UI(expired)

원칙 준수:
- SSOT: 기존 tests/e2e/shared/helpers 패턴 재사용 (storageState, role-based fixture)
- 하드코딩 0: FRONTEND_ROUTES 빌더 기반 URL
- 접근성: Playwright role-based locator (getByRole('button', {name: ...}))

검증 (MUST):
- pnpm --filter frontend test:e2e -- qr 3 spec 모두 PASS
- 로컬 + CI 양쪽 안정 실행
- storageState 병렬 isolation (lender/borrower workers)

의존성: QR Phase 1-3 배포 전 권장.
추정: Mode 1 / 3-5 파일 / ~3시간.
```

### ~~🟡 MEDIUM — Per-row 체크박스 + BulkActionBar 프리미티브 추출 (Mode 1)~~ ✅ 완료 (2026-04-18)

```
문제:
- EquipmentListContent.tsx에 현재 "현재 페이지 일괄" 버튼만 있음 (confirmed — BulkLabelPrintButton 직접 items 전달)
- EquipmentTable/EquipmentCardGrid에 Checkbox 컬럼 0건 (confirmed)
- useBulkSelection 훅은 이미 추출 완료 (hooks/use-bulk-selection.ts) — 사용처 1곳(EquipmentListContent) + row 단위 사용 없음
- 결과: 사용자가 필터링 외에 임의 장비 조합을 선택해서 라벨 인쇄 불가

조치 (범용 프리미티브 추출 + row 통합):
1. components/shared/BulkActionBar.tsx 신규:
   - props: { selectedCount, totalOnPage, onSelectAll, onClearAll, children }
   - "3건 선택됨 · 페이지 전체 선택" 인디케이터 + 액션 슬롯
   - 향후 체크아웃 일괄 승인, NC 일괄 종결 등 재사용 가능
2. components/shared/SelectableRowCheckbox.tsx 신규 (or 기존 Checkbox 확장):
   - 접근성 라벨, 키보드 토글, shift-click 범위 선택 (옵션)
3. EquipmentTable.tsx + EquipmentCardGrid.tsx (+ VirtualizedEquipmentList.tsx):
   - optional `bulkSelection?: BulkSelectionAPI<Equipment>` prop 추가
   - 있으면 체크박스 열/오버레이 렌더, 없으면 기존 동작 (회귀 0 보장)
4. EquipmentListContent.tsx:
   - useBulkSelection<Equipment>(items, e => String(e.id))
   - BulkActionBar + BulkLabelPrintButton(selectedItems) 교체

원칙 준수:
- SSOT: useBulkSelection 이미 범용 훅. BulkActionBar 추출로 재사용성 완결
- 워크플로우: QR 전용 아님 — 범용 list 프리미티브
- 접근성: shift-click 범위 선택, aria-live 선택 개수 공지
- 성능: Set 기반 O(1) 토글 유지

검증 (MUST):
- 체크박스 0 → BulkActionBar 숨김, 기존 동작 회귀 0
- 5건 선택 → BulkLabelPrintButton(items.length=5) 수신 확인
- 키보드 탭 순서 자연스러움 (axe-core Critical 0)
- EquipmentTable unit test + e2e 회귀 0

의존성: 없음. Phase 2.5로 계획된 작업.
추정: Mode 1 / 5-7 파일 / ~3시간.
```

### ~~🟡 MEDIUM — Intent URL 파라미터 일반화 + 타 모듈 확산 (Mode 2)~~ ✅ 완료 (2026-04-19)

```
문제:
- QUERY_INTENTS SSOT는 수립 완료 (packages/shared-constants/src/frontend-routes.ts:27-32) — ACTION + ACTIONS.CREATE
- 현재 사용처 NC 생성 1곳만 (confirmed: NonConformanceManagementClient.tsx:119)
- 다른 모듈(교정 계획/장비 요청/자체점검/중간점검)의 Create 페이지/다이얼로그는 모두 하드코딩 useState로 상태 관리 → 이메일 알림/대시보드 quick action 딥링크 불가

조치 (intent URL 패턴 확산):
1. QUERY_INTENTS 확장 (필요 시): ACTIONS.EDIT, ACTIONS.APPROVE, ACTIONS.SUBMIT 등 Linear/GitHub 컨벤션
2. 각 모듈 Create/Edit 페이지에 useSearchParams + QUERY_INTENTS 감지 + useState lazy init 적용:
   - calibration-plans/create/page.tsx
   - equipment-requests (존재 확인 후)
   - self-inspections create 인라인 폼
   - intermediate-inspections 동일
   - checkouts/create (이미 ?equipmentId= 프리필은 있음 — action intent로 확장 검토)
3. FRONTEND_ROUTES에 각 모듈 `*_CREATE(id?)` 빌더 추가 (EQUIPMENT.NON_CONFORMANCES_CREATE 패턴)
4. 이메일 알림 템플릿에 딥링크 URL 추가 (backend notifications/config/notification-registry.ts linkTemplate 확장)
5. 대시보드 quick action 카드에 기존 하드코딩된 URL을 FRONTEND_ROUTES 빌더로 교체
6. 사용 예시 문서화: docs/references/frontend-patterns.md에 Intent URL 섹션 추가

원칙 준수:
- SSOT: QUERY_INTENTS + FRONTEND_ROUTES 빌더만 통해 URL 조합
- 하드코딩 0: ?action=create 리터럴 0건 확인 (grep)
- 워크플로우: 기존 페이지 최소 침습 (useEffect → useState lazy init 패턴 재사용)
- 성능: URL 기반 상태는 SSR hydration 부담 0

검증 (MUST):
- 각 모듈 ?action=create 진입 → 해당 생성 폼 자동 오픈
- 브라우저 back으로 폼 닫기 (URL 기반이므로 히스토리 자연)
- 이메일 딥링크 스모크 테스트
- grep '?action=' 리터럴 0건 (빌더 경유)
- verify-i18n/verify-nextjs/verify-frontend-state PASS

의존성: 없음. 점진적 확산 가능 (모듈별 PR 분할).
추정: Mode 2 / 10-15 파일 / ~5시간.
```

### ~~🟡 MEDIUM — Handover 토큰 모델 → 범용 1회성 서명 토큰 프리미티브 추출 (Mode 2)~~ ✅ 완료 (2026-04-19)

```
문제:
- HandoverTokenService가 checkouts 모듈에 종속 (apps/backend/src/modules/checkouts/services/handover-token.service.ts)
- 승인 위임(delegation), 외부 제출 링크, 이메일 확인 링크 등 1회성 서명 토큰이 필요한 use case가 산재할 가능성 — 매번 재구현하면 보안 구멍
- 현재 JWT + Redis jti + 10분 TTL + HS256 패턴은 이미 완결 — 제네릭 추출 기회

조치 (common 모듈로 승격):
1. apps/backend/src/common/one-time-token/one-time-token.service.ts:
   - OneTimeTokenService<TPayload>.issue(payload, ttl, secret) / verify(token, secret)
   - jti 관리 + Redis 1회 소비 + 에러 코드 3종(INVALID/EXPIRED/CONSUMED) 제네릭화
2. apps/backend/src/common/one-time-token/error-codes.ts:
   - OneTimeTokenErrorCode enum (HandoverTokenInvalid 등을 제네릭 이름으로 alias)
3. HandoverTokenService: OneTimeTokenService 래퍼로 리팩토링 (purpose 도출 로직만 고유)
4. 향후 use case 검토:
   - 승인 위임 (approval delegate link — 승인권자가 휴가 시 대리인에게 1회성 위임)
   - 외부 교정기관 제출 링크 (캘리브레이션 인증서 업로드용 1회 URL)
   - 비밀번호 재설정 이메일 링크 (기존 구현 있는지 grep 후 통합 가능성 검토)
5. docs/references/backend-patterns.md에 OneTimeToken 패턴 섹션 추가

원칙 준수:
- SSOT: one-time-token 패턴이 단일 구현
- 보안: 각 use case가 secret을 별도 env로 (JWT_SECRET과 격리된 Phase 3 패턴 재사용)
- 워크플로우: 기존 handover 동작 회귀 0 (래퍼만 교체)

검증 (MUST):
- 기존 handover-token.service.spec.ts 모두 PASS (회귀 0)
- OneTimeTokenService 단위 테스트 신규 (발급/검증/재사용/만료)
- tsc --noEmit exit 0

의존성: Phase 3 배포 안정화 이후 권장 (급하지 않음).
추정: Mode 2 / 6-8 파일 / ~3시간.
```

### ~~🟡 MEDIUM — verify-qr-ssot + verify-handover-security 검증 스킬 신설 (Mode 1)~~ ✅ 완료 (2026-04-19)

```
문제:
- QR 관련 하드코딩(/e/, /handover, ?token=, QR_CONFIG 옵션 등)이 자동 감지되지 않음
- handover JWT secret 재사용(JWT_SECRET 혼용) / TTL 누락 / Redis jti 누락 같은 보안 안티패턴 자동 검증 스킬 없음
- 기존 verify-* 스킬 패턴이 있으나 QR/handover 전용 커버리지 부족

조치:
1. .claude/skills/verify-qr-ssot/SKILL.md:
   - Grep 패턴: /e/[SUW|UIW|PYT] 리터럴 URL 하드코딩 감지
   - QR_CONFIG 옵션(errorCorrectionLevel/margin/scale) 직접 지정 감지 (SSOT 미경유)
   - QR_ACTION_VALUES enum 우회 리터럴 감지
   - FRONTEND_ROUTES.HANDOVER/BY_MGMT/SCAN 미경유 URL 감지
2. .claude/skills/verify-handover-security/SKILL.md:
   - JWT secret 변수 이름 감지 (HANDOVER_TOKEN_SECRET vs JWT_SECRET 혼용 검출)
   - TTL 매직 넘버 감지 (HANDOVER_TOKEN_TTL_SECONDS SSOT 미사용)
   - Redis jti 패턴 누락 감지 (issue → verify → del 체인)
   - HttpStatus 매핑 검증 (INVALID=400, EXPIRED=401, CONSUMED=409)
3. verify-implementation 스킬에서 QR/handover 영역 탐지 시 신규 스킬 자동 호출 등록
4. 신규 스킬은 기존 verify-ssot/verify-hardcoding/verify-security 패턴 구조 미러링

원칙 준수:
- SSOT: 검증 룰이 스킬 md 파일 한 곳
- 하드코딩 감지: Grep 기반 빠른 실행
- 자동화: harness Evaluator가 자동 호출

검증 (MUST):
- 기존 Phase 1-3 코드에 스킬 적용 → 위반 0건 (회귀 베이스라인)
- 인위적 위반 코드 추가 → 스킬이 정확히 감지하는지 테스트

의존성: 없음. 신규 QR/handover 변경 시 자동 감지 확보.
추정: Mode 1 / 2-3 파일 (SKILL.md 중심) / ~2시간.
```

### ~~🟡 MEDIUM — PWA 완결 (아이콘 PNG + 서비스워커 + Install Prompt) (Mode 1)~~ ✅ 완료 (2026-04-19)

```
문제:
- public/manifest.json은 완성되었으나 public/icons/ 디렉토리 및 manifest-192.png/manifest-512.png 실제 파일 없음 (confirmed)
- 설치 시 "앱 아이콘 깨짐" 이슈 + Lighthouse PWA 감사 실패
- 서비스워커 미구현 → 오프라인 불가, 느린 네트워크에서 QR 스캔 후 랜딩 로딩 지연
- "홈 화면에 추가" 프롬프트 미구현

조치:
1. public/icons/ 생성:
   - manifest-192.png (192x192 PNG, UL Red 배경 + Wrench 아이콘)
   - manifest-512.png (512x512 동일 디자인)
   - apple-touch-icon.png (180x180, iOS)
   - maskable-icon-192.png (안전영역 고려한 maskable variant)
   - 디자인: 기존 UL 브랜드 컬러 + Wrench (DashboardShell 사이드바 로고 재사용)
2. manifest.json:
   - icons 배열 확장 (maskable purpose 추가)
   - screenshots 필드 (PWA 설치 프롬프트 미리보기)
   - categories: ['productivity', 'business']
3. next.config.js:
   - next-pwa 또는 Serwist 플러그인 도입 (Next.js 16 호환성 확인)
   - 또는 public/sw.js 수동 등록 (App Shell 캐시 + 오프라인 fallback 페이지)
4. components/pwa/InstallPrompt.tsx:
   - beforeinstallprompt 이벤트 캡처
   - 장비 상세 페이지 등에서 1회 노출 후 dismiss 기억(localStorage)
5. app/offline/page.tsx 신규 (네트워크 끊김 시 fallback)

원칙 준수:
- SSOT: PWA manifest는 이미 SSOT, 아이콘 파일만 추가
- 하드코딩 0: 서비스워커 캐시 키/버전 상수화
- 성능: 서비스워커 precaching 전략(App Shell만) + 런타임 NetworkFirst for API
- 접근성: install prompt는 키보드 접근 + dismiss 가능

검증 (MUST):
- Lighthouse PWA 감사 90점+
- 모바일 Chrome "홈 화면에 추가" 프롬프트 표시
- 오프라인 모드에서 /offline 페이지 렌더
- 기존 라우트 성능 회귀 0 (서비스워커 precaching 의도대로 동작)

의존성: QR Phase 1-3 아이콘 파일 부재 이슈 해결. PWA 풀 채택.
추정: Mode 1 / 6-8 파일 (+ 아이콘 에셋) / ~4시간.
```

### ~~🟢 LOW — Lighthouse/axe-core/번들 크기 배포 게이트 통합 (Mode 1)~~ ✅ 완료 (2026-04-20)

```
문제:
- Phase 1-3의 SHOULD 측정 항목들(Lighthouse LCP<2.5s, axe Critical 0, 번들 +300KB gz)이 수동 검증 대상 → 배포마다 드리프트 발생 가능
- CI에 측정 게이트 없음 (확인: .github/workflows에 lighthouse 키워드 0건 예상)

조치:
1. .github/workflows/performance-audit.yml:
   - PR에 대해 Lighthouse CI (treosh/lighthouse-ci-action) 실행
   - 주요 라우트(/dashboard, /equipment, /e/SUW-E0001, /scan, /handover) URL 리스트
   - 점수 임계값 failure 설정 (Performance 85+, Accessibility 95+, PWA 90+)
2. .github/workflows/accessibility-audit.yml:
   - axe-core @axe-core/cli로 동일 라우트 스캔
   - Critical 위반 0 강제
3. .github/workflows/bundle-size.yml:
   - next-bundle-analyzer 스냅샷 + size-limit로 route-level 한도 강제
   - dashboard 초기 chunk +10KB 허용, 전체 delta +300KB 허용
4. PR template에 측정 결과 링크 자동 comment
5. docs/operations/performance-budgets.md 신규 (한도 정의 + 예외 승인 절차)

원칙 준수:
- SSOT: performance-budgets.md가 임계값 단일 출처
- 워크플로우: 기존 CI 게이트 패턴 재사용 (quality-gate.yml)

검증 (MUST):
- 로컬에서 lighthouse/axe/size-limit 단독 실행 성공
- 의도적 회귀(대용량 import) 추가 → CI에서 실패 감지
- PR에 측정 결과 자동 코멘트

의존성: PWA 완결(이전 항목) 이후 Lighthouse PWA 점수 정확 측정 가능.
추정: Mode 1 / 3-5 workflow / ~3시간.
```

### ~~🟢 LOW — pre-commit self-audit 7항목 자동화 스크립트 (Mode 0)~~ ✅ 완료 (2026-04-18)

```
문제:
- feedback_pre_commit_self_audit.md의 7항목(SSOT 경유/하드코딩 0/eslint-disable 0/a11y/워크플로우 재사용/성능/검증)이 "내면화" 목표이지만 기계 검증 없음
- 현재 pre-commit은 lint-staged(lint+prettier) + sops 검증 + gitleaks만 수행 (confirmed)
- SSOT/하드코딩 감지는 수동 검토 의존

조치:
1. scripts/self-audit.mjs 신규:
   - 체크아이템 1: git diff --staged로 ?action= / /e/[A-Z] / /handover\? / /checkouts/.+\?scope= 리터럴 URL grep
   - 체크아이템 2: eslint-disable 주석 신규 추가 감지
   - 체크아이템 3: any 타입 신규 추가 감지 (useOptimisticMutation / DTO 제외 whitelist)
   - 체크아이템 4: QR_CONFIG/LABEL_CONFIG/FRONTEND_ROUTES 우회 grep
   - 체크아이템 5: staged에 role 리터럴 (session.user.role === 'admin' 등) grep
   - 체크아이템 6: React Query onSuccess에 setQueryData 감지
   - 체크아이템 7: 간단한 a11y 휴리스틱 (icon-only button without aria-label grep)
2. .husky/pre-commit:
   - lint-staged 다음에 `node scripts/self-audit.mjs --staged` 추가
   - 실패 시 commit 차단 + 체크리스트 출력
3. CI quality-gate.yml에도 동일 스크립트 추가 (local 우회 방지)
4. docs/references/self-audit.md 신규 (각 규칙의 의도 + 예외 승인 절차)

원칙 준수:
- SSOT: self-audit.mjs가 규칙 단일 출처
- 성능: staged 파일만 스캔 (전체 저장소 X)

검증 (MUST):
- 의도적 위반(하드코딩 URL 추가) → 스크립트가 감지 + commit 차단
- Phase 1-3 코드 (이미 통과) → 스크립트 실행 시 위반 0
- False positive 최소화 (주석/테스트 파일 제외)

의존성: 없음. 단독 실행 가능.
추정: Mode 0 / 2-3 파일 / ~1시간.
```

### ❓ 사용자 결정 필요 — 커밋 `7a6255d1` 메시지 귀속 오염 복구

```
배경:
- 커밋 7a6255d1 (이미 origin/main push됨)에 QR Phase 1 전체가 포함됐지만 메시지는 parallel session(history-card-qp1802)의 data-migration 작업을 설명
- 후속 커밋 084527da에 귀속 주석(exec-plan의 "⚠️ Git 커밋 귀속 주의" 섹션)으로 기록은 남김
- 기능/테스트/빌드 영향 0, git log 가독성만 영향

옵션:
A. **복구 포기 (권장)**: 현재 상태 유지. push된 커밋을 rewrite하려면 git rebase -i + force-push 필요 → 다른 개발자/CI 영향. 귀속 주석은 이미 기록됨.
B. **부분 복구**: 별도 git notes(`git notes add -m "Also includes QR Phase 1"`) 추가. 로컬 자동 보관되고 push는 `git push origin refs/notes/*`.
C. **전체 복구 (비권장)**: interactive rebase로 커밋 분리 + force push. 위험: destructive, 팀 협업 해칠 수 있음, parallel session history-card-qp1802도 이미 push됨.

질문: 어느 옵션으로 진행? 기본값은 A (status quo). B는 저비용 추가 기록.
```

> **완료된 항목은 [example-prompts-archive.md](./example-prompts-archive.md)로 분리 (2026-04-09 36차 정리).**
> 현재 파일은 활성(미해결) harness 프롬프트만 포함. 새 프롬프트는 활성 영역에 추가.

---

## 34차 후속 — wf20-infra-debt harness 결과 review-architecture tech debt (3건)

> **발견 배경 (2026-04-08, wf20-infra-debt harness PASS 직후 review-architecture)**:
> SelfInspectionTab.tsx 행 액션 aria-label SSOT 패턴 도입 후, 동일 도메인의 다른 컴포넌트에서
> divergence가 확인되었다. wf20-infra-debt harness contract의 SHOULD criteria로 분류되었던
> 항목 + producer/consumer scope 정합성 검증 중 발견된 항목을 등재.

### 🟢 LOW — sticky-header CSS 변수명 string literal 중복 (3 곳, 4번째 등장 시 상수화)

```
배경: wf20-infra-debt harness review-architecture 검증 결과:
'--sticky-header-height' CSS 변수가 producer 1곳 + consumer 2곳에 string literal 로 중복 박혀 있다:
1. Producer: apps/frontend/components/equipment/EquipmentDetailClient.tsx:96
   document.documentElement.style.setProperty('--sticky-header-height', ...)
2. Consumer (CSS): apps/frontend/lib/design-tokens/components/equipment.ts:809
   top-[var(--sticky-header-height,0px)]
3. Consumer (e2e): apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts:34
   getComputedStyle(documentElement).getPropertyValue('--sticky-header-height')

세 지점 모두 :root 스코프로 통일되어 silent 0 반환 리스크는 없으나, 4번째 consumer (예: 다른
sticky tab 컨테이너) 가 등장할 때 오타/스코프 불일치 가능성이 있다.

작업 (4번째 consumer 등장 시점에만 진행 — 현재는 over-engineering):
1. apps/frontend/lib/design-tokens/primitives/ 또는 shared-constants 에
   STICKY_HEADER_HEIGHT_VAR = '--sticky-header-height' 상수 추가
2. 3 곳 모두 import 로 교체
3. /verify-hardcoding 룰: CSS 변수명 string literal 2회+ 사용 시 상수화 권고 추가 (선택)

검증:
- pnpm tsc --noEmit exit 0
- grep "'--sticky-header-height'" apps/frontend → import 외 0 hit

⚠️ 현재는 트리거 조건 미달 (3 hit). 4번째 hit 발생 시 자동 승격.
```

