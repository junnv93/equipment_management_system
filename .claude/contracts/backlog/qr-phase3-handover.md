# 스프린트 계약: QR Phase 3 — Handover 서명 토큰

## Slug
`qr-phase3-handover`

## 범위
대여자 인수인계 QR 발급 + 차용자 스캔 → 기존 condition-check 페이지 redirect.
Backend 신규 엔드포인트 2개 (토큰 발급/검증) + Frontend /handover 중계 페이지.
**condition-check 로직 재정의 금지** (기존 `/checkouts/[id]/check` 100% 재사용).

## 성공 기준

### 필수 (MUST)

**전체 품질 게이트:**
- [ ] M-1: `pnpm tsc --noEmit` exit 0
- [ ] M-2: `pnpm --filter backend build + test` PASS (신규 handover-token 단위 테스트 포함)
- [ ] M-3: `pnpm --filter frontend build + test` PASS (/handover ◐ PPR)
- [ ] M-4: `pnpm lint` warning 0
- [ ] M-5: 신규 `any` 타입 0건
- [ ] M-6: eslint-disable 주석 0건

**Sub-Phase A — 백엔드 handover 토큰:**
- [ ] M-A1: `HandoverTokenService` 신규 존재. `issue()` + `verify()` 메서드.
- [ ] M-A2: JWT HS256 서명 + `HANDOVER_TOKEN_SECRET` env 사용 (별도 secret, JWT_SECRET 재사용 금지)
- [ ] M-A3: Redis jti 저장 (`handover:jti:{jti}` 키, TTL=10분). `verify` 성공 시 DEL (1회 소비).
- [ ] M-A4: 토큰 재사용 시 `HANDOVER_TOKEN_CONSUMED` 에러 코드.
- [ ] M-A5: 만료 시 `HANDOVER_TOKEN_EXPIRED`.
- [ ] M-A6: 서명 불일치/포맷 오류 시 `HANDOVER_TOKEN_INVALID`.
- [ ] M-A7: `POST /checkouts/:uuid/handover-token` — 권한은 requesterId OR approverId OR lab_manager.
- [ ] M-A8: `POST /checkouts/handover/verify` — body: {token}, 응답: {checkoutId, purpose}.
- [ ] M-A9: 양쪽 엔드포인트 `@AuditLog` 데코레이터.
- [ ] M-A10: `env.validation.ts`에 `HANDOVER_TOKEN_SECRET: z.string().min(32)` 추가.
- [ ] M-A11: `handover-token.service.spec.ts` 단위 테스트 (sign→verify 성공, jti 재사용 거부, 만료 에러, 서명 불일치 에러).

**Sub-Phase B — 프론트엔드:**
- [ ] M-B1: `API_ENDPOINTS.CHECKOUTS.HANDOVER_TOKEN(id)` + `HANDOVER_VERIFY` 추가
- [ ] M-B2: `checkoutApi.issueHandoverToken(id, purpose)` + `verifyHandoverToken(token)` 신규 함수
- [ ] M-B3: `/handover/page.tsx` Client Component: `?token=` 읽기 → verify → `router.replace(FRONTEND_ROUTES.CHECKOUTS.CHECK(checkoutId))`
- [ ] M-B4: `/handover` 페이지에 condition-check 폼 렌더 **0건** (워크플로우 재정의 금지)
- [ ] M-B5: 에러 case별 i18n 메시지 (만료/재사용/무효/서버오류)
- [ ] M-B6: `packages/shared-constants/src/qr-url.ts`에 `buildHandoverQRUrl(token, appUrl)` + `parseHandoverQRUrl(url)` 추가

**Sub-Phase C — QR 표시 진입점:**
- [ ] M-C1: `HandoverQRDisplay.tsx` 신규 (Radix Dialog 재사용, 새 컨테이너 X)
- [ ] M-C2: 마운트 시 `issueHandoverToken` 자동 호출 → `buildHandoverQRUrl` → QR SVG
- [ ] M-C3: 만료 카운트다운 + 재발급 버튼, `aria-live` 알림
- [ ] M-C4: `CheckoutDetailClient`에 "인수인계 QR 표시" 버튼 추가 (상태 + 권한 조건부 렌더)
- [ ] M-C5: 신규 condition-check 폼/시트 렌더 **0건**
- [ ] M-C6: i18n `qr.handover.*` 섹션 (ko/en 완전 매칭)

**SSOT/하드코딩:**
- [ ] M-S1: `FRONTEND_ROUTES.HANDOVER(token)` 빌더 재사용 (Phase 1 등록분)
- [ ] M-S2: `FRONTEND_ROUTES.CHECKOUTS.CHECK(id)` 재사용 (redirect 시)
- [ ] M-S3: `QR_CONFIG` SSOT 재사용 (H-level errorCorrection)
- [ ] M-S4: TTL 10분 = 600초 상수화 (매직 넘버 금지)
- [ ] M-S5: 에러 코드는 packages/schemas errors enum 확장 또는 로컬 enum SSOT
- [ ] M-S6: JWT payload 인터페이스 타입화

**자체 감사 체크리스트:**
- [ ] 하드코딩 URL/문자열 0건
- [ ] eslint-disable 0건
- [ ] `any` 타입 0건
- [ ] 접근성: Dialog role, aria-live, focus trap
- [ ] QR은 경로 원칙 — condition-check UI 재정의 0건

### 권장 (SHOULD)
- S-1: `review-architecture` Critical 0
- S-2: Playwright `phase3-handover.spec.ts` — 2 세션 시나리오 (lender 발급, borrower 스캔, 재사용 거부)
- S-3: 손으로 QR 스캔 → redirect 확인

## 종료 조건
- MUST 전체 PASS → 성공
- 동일 MUST 2회 연속 FAIL → 수동 개입
- SHOULD 실패 → tech-debt 기록
