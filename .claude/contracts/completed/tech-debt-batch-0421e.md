# Contract: tech-debt-batch-0421e

## Scope

Tech debt batch 0421e — 실행 가능한 MEDIUM/LOW 항목 3건 일괄 처리.

## Changes

1. `apps/backend/src/modules/security/security.controller.ts`
   - lineNumber를 `Math.min(Math.trunc(rawLine ?? 0), 2_147_483_647)` 로 클램프

2. `apps/frontend/components/auth/LoginPageContent.tsx`
   - L53 "or", L269 "로그인", L271 "계정으로 로그인하여 계속하세요" → next-intl 키로 교체

3. `apps/frontend/messages/ko/auth.json`
   - `tLogin('title')`, `tLogin('subtitle')`, `tLogin('or')` 키 추가

4. `apps/frontend/messages/en/auth.json`
   - 동일 키 영어 값 추가

5. `apps/backend/src/modules/security/__tests__/security.service.spec.ts`
   - L21 `mockDb as never` → `mockDb as unknown as AppDatabase`

## MUST Criteria (PASS 필수)

- [ ] `pnpm --filter backend run tsc --noEmit` — 0 errors
- [ ] `pnpm --filter frontend run tsc --noEmit` — 0 errors
- [ ] `pnpm --filter backend run test` — 기존 테스트 회귀 없음
- [ ] security.controller.ts: lineNumber 클램프 적용 확인 (grep)
- [ ] LoginPageContent.tsx: 하드코딩 한국어 문자열 0개 (grep)
- [ ] auth.json: title/subtitle/or 키 존재 확인 (grep)
- [ ] security.service.spec.ts: `as never` 제거 확인 (grep)

## SHOULD Criteria (PASS 권장)

- [ ] `pnpm --filter frontend run build` — 빌드 오류 없음
- [ ] `pnpm --filter backend run build` — 빌드 오류 없음
