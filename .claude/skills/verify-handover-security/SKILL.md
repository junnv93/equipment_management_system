---
name: verify-handover-security
description: Handover/OneTimeToken 보안 설정을 검증합니다. 시크릿 분리, jti nonce 소비, 토큰 TTL, 권한 가드, 프론트엔드 토큰 노출 여부.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 검사 항목]'
---

# Handover/OneTimeToken 보안 검증

## Purpose

QR 기반 인수인계 토큰의 보안 설정을 검증합니다:

1. **시크릿 분리** — `HANDOVER_TOKEN_SECRET`이 `JWT_SECRET`과 분리되어 있는지
2. **OneTimeTokenService 경유** — `HandoverTokenService`가 `OneTimeTokenService` 위임 구조인지
3. **jti nonce 소비** — Redis SET NX → DEL(1회) 패턴 유지 여부
4. **토큰 TTL** — `HANDOVER_TOKEN_TTL_SECONDS` SSOT 경유 (매직넘버 금지)
5. **권한 가드** — 토큰 발급 엔드포인트에 적절한 권한 체크 존재
6. **프론트엔드 토큰 노출** — 토큰이 DOM/localStorage/URL에 영속화되는지 여부
7. **dev-only 테스트 엔드포인트** — `forge-handover-token`이 NODE_ENV 가드 이중 적용인지

## When to Run

- Handover 토큰 발급/검증 로직 수정 후
- `OneTimeTokenService` 또는 `HandoverTokenService` 변경 후
- 새로운 1회용 토큰 기반 기능 추가 후
- 보안 감사 전

## Related Files

| File | Purpose |
|------|---------|
| `apps/backend/src/common/one-time-token/one-time-token.service.ts` | 범용 1회용 토큰 프리미티브 |
| `apps/backend/src/modules/checkouts/services/handover-token.service.ts` | Handover 토큰 도메인 래퍼 |
| `apps/backend/src/modules/checkouts/checkouts.controller.ts` | 토큰 발급/검증 엔드포인트 |
| `apps/backend/src/modules/auth/test-auth.controller.ts` | forge-handover-token (dev/test 전용) |
| `apps/frontend/components/checkouts/HandoverQRDisplay.tsx` | 프론트 QR 표시 컴포넌트 |
| `apps/frontend/app/(dashboard)/handover/page.tsx` | Handover 랜딩 페이지 |
| `packages/shared-constants/src/qr-url.ts` | `buildHandoverQRUrl` SSOT |
| `infra/secrets/*.sops.yaml` | HANDOVER_TOKEN_SECRET sops 암호화 확인 |

## Workflow

각 Step의 bash 명령어 상세: [references/step-details.md](references/step-details.md) 참조

### Step 1: 시크릿 분리 확인

**PASS:** `HandoverTokenService`가 `HANDOVER_TOKEN_SECRET` 별도 env 사용.
`JWT_SECRET` 재사용 없음. `secret.length >= 32` 검증 코드 존재.
**FAIL:** `JWT_SECRET` 그대로 사용하거나 하드코딩된 시크릿.

```bash
grep -n "HANDOVER_TOKEN_SECRET\|JWT_SECRET" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
grep -n "length < 32\|length >= 32" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
# env.example에 HANDOVER_TOKEN_SECRET 문서화 확인
grep "HANDOVER_TOKEN_SECRET" apps/backend/.env.example
```

### Step 2: OneTimeTokenService 위임 구조

**PASS:** `HandoverTokenService`가 `OneTimeTokenService<HandoverTokenData>` 인스턴스 소유.
`issue()`/`verify()` 직접 JWT/Redis 조작 없음.
**FAIL:** `jwtService.signAsync` 또는 `redisClient.del` 직접 호출.

```bash
grep -n "jwtService\|signAsync\|verifyAsync\|\.del(" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
grep -n "OneTimeTokenService" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
```

### Step 3: jti nonce 소비 패턴 (OneTimeTokenService)

**PASS:** `set(..., 'NX')` + `del()` 원자적 소비. `del()` 반환 0 → ConflictException.
**FAIL:** `del()` 반환값 무시, 또는 `get()` + `del()` 비원자적 분리.

```bash
grep -n "\.del\|\.set.*NX\|deleted === 0" \
  apps/backend/src/common/one-time-token/one-time-token.service.ts
```

### Step 4: 토큰 TTL SSOT 경유

**PASS:** `HANDOVER_TOKEN_TTL_SECONDS` 상수 경유 (10 * 60 = 600).
JWT exp + Redis EX 양쪽에 동일 상수 사용.
**FAIL:** `600`, `10 * 60` 매직넘버 인라인 사용.

```bash
grep -n "600\|10 \* 60\|expiresIn:" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts \
  apps/backend/src/common/one-time-token/one-time-token.service.ts
grep -n "HANDOVER_TOKEN_TTL_SECONDS" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
```

### Step 5: 토큰 발급 권한 가드

**PASS:** `POST /checkouts/:uuid/handover-token` → 신청자 또는 담당자만 발급 가능.
체크아웃 소유자/관련자 검증 코드 존재.
**FAIL:** `@Public()` 또는 권한 검증 없이 모든 인증 사용자 발급 허용.

```bash
grep -n -A 5 "handover-token" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts | head -40
```

### Step 6: 프론트엔드 토큰 영속화 금지

**PASS:** 토큰이 메모리(state/ref) 또는 URL query string에만 존재. QR 표시 후 폐기.
**FAIL:** `localStorage.setItem` / `sessionStorage.setItem` 또는 서버 state에 토큰 저장.

```bash
grep -rn "localStorage\|sessionStorage" \
  --include="*.ts" --include="*.tsx" \
  apps/frontend/components/checkouts/HandoverQRDisplay.tsx \
  apps/frontend/app/(dashboard)/handover/ 2>/dev/null
```

### Step 7: dev-only 테스트 엔드포인트 이중 가드

**PASS:** `forge-handover-token`이 (1) TestAuthController에서만 등록 + (2) NODE_ENV 런타임 체크 모두 적용.
**FAIL:** 프로덕션 빌드에서 접근 가능하거나 가드 하나만 적용.

```bash
grep -n -B 2 -A 10 "forge-handover-token" \
  apps/backend/src/modules/auth/test-auth.controller.ts
grep -n "NODE_ENV\|isProduction\|registerIf" \
  apps/backend/src/modules/auth/test-auth.controller.ts
```

## Output Format

```markdown
| #   | 검사                              | 상태      | 상세                                         |
| --- | --------------------------------- | --------- | -------------------------------------------- |
| 1   | HANDOVER_TOKEN_SECRET 분리        | PASS/FAIL | JWT_SECRET 재사용 여부, 길이 검증 존재 여부  |
| 2   | OneTimeTokenService 위임          | PASS/FAIL | 직접 JWT/Redis 조작 여부                     |
| 3   | jti nonce 소비 원자성             | PASS/FAIL | del() 반환값 검사 여부                       |
| 4   | TTL SSOT 경유                     | PASS/FAIL | 매직넘버 위치                                |
| 5   | 토큰 발급 권한 가드               | PASS/FAIL | 소유자 검증 코드 존재 여부                   |
| 6   | 토큰 프론트엔드 영속화 금지       | PASS/FAIL | localStorage/sessionStorage 사용 여부        |
| 7   | dev-only 테스트 엔드포인트 가드   | PASS/FAIL | NODE_ENV + TestAuthController 이중 가드      |
```

## Exceptions

1. **`one-time-token.service.ts` 내부** — jwtService 직접 사용 허용 (프리미티브 구현체)
2. **`handover-token.service.spec.ts`** — 테스트용 in-memory Redis mock, `jest.mock('ioredis')` 허용
3. **URL query string의 token 파라미터** — `/handover?token=...` URL은 일시적 전달 수단. 영속화가 아님
4. **TTL 상수 내부 정의** — `HANDOVER_TOKEN_TTL_SECONDS = 10 * 60` 원본 정의 파일에서는 매직넘버 허용
