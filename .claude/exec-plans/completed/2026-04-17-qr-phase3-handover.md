# QR Phase 3 — Handover 서명 토큰 기반 인수인계 구현 계획

## 메타
- 생성: 2026-04-17T00:00:00+09:00
- 모드: Mode 2 (직접 설계 — Planner 생략)
- Slug: `qr-phase3-handover`
- 예상 변경: ~10 파일 (신규 5, 수정 5)
- 선행: Phase 1, 2 완료
- 소스 플랜: `/home/kmjkds/.claude/plans/qr-parallel-puppy.md` Phase 3 (사용자 승인)

## 설계 철학
사이트 간 대여(cross-site rental)의 대면 인수인계 순간 — 대여자 폰에 QR 표시 → 차용자 폰 스캔
→ 기존 condition-check 페이지로 자동 이동. **QR은 검증된 진입 경로만** 제공하고, condition
확인 워크플로우는 **100% 기존 `/checkouts/[id]/check` 재사용**.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 토큰 종류 | JWT (HS256) + Redis jti nonce | 표준 bearer token + 재사용 방지 일회성 (replay 방어) |
| TTL | 10분 | 대면 인수인계 현실 시간(즉시~수분) + replay window 최소화 |
| 권한 모델 | lender(requesterId) OR lab_manager | 토큰 발급 권한은 기존 체크아웃 data-scope 재사용 |
| 검증 endpoint | POST (not GET) | jti 소비(상태 변화)이므로 멱등성 X — POST 정석 |
| QR payload | `{appUrl}/handover?token={jwt}` | Phase 1 `FRONTEND_ROUTES.HANDOVER(token)` 빌더 재사용 |
| 검증 후 동작 | **기존 `/checkouts/{id}/check` 페이지로 redirect** | QR은 경로 원칙. condition-check UI 재정의 0 |
| "QR 표시" 진입점 | 기존 `CheckoutDetailClient`에 버튼 1개 추가 | 신규 페이지/라우트 추가 0. 기존 상세 페이지 확장만 |
| Secret 관리 | `HANDOVER_TOKEN_SECRET` env (env.validation.ts 필수) | 기존 TOKEN_BLACKLIST 패턴과 동일, sops 배포 |
| Redis 키 스키마 | `handover:jti:{jti}` | 기존 `refresh-token:` prefix 컨벤션과 일치 |
| 엔드포인트 경로 | `/checkouts/:uuid/handover-token` + `/checkouts/handover/verify` | 기존 checkouts 모듈 내부 — 새 모듈 생성 X |

## 구현 Phase

### Sub-Phase A: 백엔드 — HandoverTokenService + 2 엔드포인트

**변경 파일:**
1. `apps/backend/src/modules/checkouts/services/handover-token.service.ts` — **신규**
   - `issue(checkoutId, userId, purpose): Promise<{token, expiresAt, jti}>` — JWT sign + Redis SET jti
   - `verify(token): Promise<{checkoutId, purpose, jti}>` — JWT verify + Redis GET jti → DEL (1회 소비)
   - 실패 시 전용 에러 코드: `HANDOVER_TOKEN_INVALID`, `HANDOVER_TOKEN_EXPIRED`, `HANDOVER_TOKEN_CONSUMED`

2. `apps/backend/src/modules/checkouts/dto/handover-token.dto.ts` — **신규**
   - `HandoverTokenPurposeEnum` (z.enum) — borrower_receive / borrower_return / lender_receive 등
   - `VerifyHandoverTokenDto` — body shape

3. `apps/backend/src/modules/checkouts/checkouts.controller.ts` — **수정**
   - `@Post(':uuid/handover-token')` — 권한: 체크아웃 requesterId OR lab_manager. `@AuditLog`.
   - `@Post('handover/verify')` — body token → checkoutId 반환 + `@AuditLog`

4. `apps/backend/src/modules/checkouts/checkouts.module.ts` — **수정**
   - `HandoverTokenService` provider 등록

5. `apps/backend/src/config/env.validation.ts` — **수정**
   - `HANDOVER_TOKEN_SECRET: z.string().min(32)` 추가 (Zod)

### Sub-Phase B: 프론트엔드 API + /handover 페이지

**변경 파일:**
6. `packages/shared-constants/src/api-endpoints.ts` — **수정**
   - `CHECKOUTS.HANDOVER_TOKEN(id)` — POST 엔드포인트
   - `CHECKOUTS.HANDOVER_VERIFY` — POST 엔드포인트

7. `apps/frontend/lib/api/checkout-api.ts` — **수정**
   - `issueHandoverToken(checkoutId, purpose)`
   - `verifyHandoverToken(token)`

8. `apps/frontend/app/(dashboard)/handover/page.tsx` — **신규** Client Component
   - `?token=...` 읽기 → `verifyHandoverToken()` → 성공 시 `router.replace(FRONTEND_ROUTES.CHECKOUTS.CHECK(checkoutId))`
   - 실패 시 에러 UI (만료/재사용/무효 각 case 별 i18n)
   - **condition-check 폼 렌더 금지** — 기존 페이지로 redirect만

### Sub-Phase C: Handover QR 진입점 (대여자 측)

**변경 파일:**
9. `apps/frontend/components/checkouts/HandoverQRDisplay.tsx` — **신규**
   - props: `{ checkoutId, purpose, open, onOpenChange }`
   - 마운트 시 `issueHandoverToken()` 호출 → `buildHandoverQRUrl(token)` 으로 QR 생성
   - `qrcode` SSOT (`QR_CONFIG`) 재사용
   - 10분 카운트다운 + 재발급 버튼
   - Radix Dialog로 데스크톱/모바일 공용 (새 BottomSheet 컨테이너 도입 금지 — 버튼은 `CheckoutDetailClient`에 있는 기존 다이얼로그 컨벤션)

10. `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — **수정**
    - `checked_out`/`borrower_returned` 상태 + 사용자 권한 충족 시 "인수인계 QR 표시" 버튼 렌더
    - 버튼 → `<HandoverQRDisplay/>` 다이얼로그 오픈
    - 신규 UI/폼 없음 — 버튼 + 다이얼로그 마운트만 추가

11. `apps/frontend/messages/{ko,en}/qr.json` — **수정**
    - `handover` 섹션 추가 (buttonLabel, title, description, countdown, errors.*)

12. `packages/shared-constants/src/qr-url.ts` — **수정**
    - `buildHandoverQRUrl(token, appUrl)` + `parseHandoverQRUrl(url)` 신규

## 아키텍처 원칙 준수

| 원칙 | 적용 |
|---|---|
| **QR은 경로** | `/handover` 페이지는 verify + redirect만. condition-check UI 재정의 0건. |
| **SSOT** | FRONTEND_ROUTES.HANDOVER/CHECKS, QR_CONFIG, buildEquipmentQRUrl 패턴 재사용 |
| **비하드코딩** | JWT secret env, TTL 상수, 에러 코드 enum, URL 빌더 |
| **이벤트 기반** | condition-check 제출 시 기존 이벤트 체계 자동 동작 (변경 0) |
| **보안** | JWT 서명 + Redis jti nonce(1회 소비) + 10분 TTL + data-scope 권한 |
| **Backend 변경 최소** | 신규 엔드포인트 2개, 기존 API 변경 0, DB 스키마 변경 0 |
| **접근성** | QR 다이얼로그 role=dialog, aria-labelledby, 카운트다운 aria-live |

## 의사결정 로그

- **JWT vs UUID+Redis만**: JWT 선택. payload 자체가 self-describing(expiresAt 포함)이라 frontend에서 카운트다운 렌더 시 추가 API 호출 불필요. Redis는 재사용 방지 전용.
- **Verify endpoint POST vs GET**: POST 선택. jti 소비가 side-effect이므로 멱등성 X.
- **`/handover`가 직접 condition-check 폼 렌더 vs redirect**: redirect 선택. "QR은 경로" 원칙 순수 실현 + 기존 페이지의 검증된 UX(스테퍼/안내/비교 카드) 100% 재사용.
- **BottomSheet vs Dialog**: Dialog 선택. 대여자 측 QR 표시는 데스크톱/모바일 공용이 자연스럽고, 기존 CheckoutDetailClient의 다이얼로그 컨벤션과 일치.
- **신규 state 관리**: QR 표시 다이얼로그 open state만 `CheckoutDetailClient`에 추가. handover 고유 상태(토큰/만료)는 `HandoverQRDisplay` 내부 캡슐화.

## 검증 계획

- `pnpm tsc --noEmit` (root)
- `pnpm --filter backend run test` — 신규 handover-token 서비스 단위 테스트 (sign/verify/jti 재사용 거부/만료)
- `pnpm --filter frontend run test`
- `pnpm --filter frontend run build` — `/handover ◐` 라우트 확인
- `pnpm lint` warning 0
- **자체 감사 체크리스트 (feedback_pre_commit_self_audit.md)**:
  - SSOT 경유, 하드코딩 0, eslint-disable 0, a11y, 워크플로우 재사용, 성능, 검증
