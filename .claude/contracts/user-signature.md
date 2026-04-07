# 스프린트 계약: 전자서명 기능 (users 테이블 + 업로드 API)

## 생성 시점
2026-04-06T09:30:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm exec tsc --noEmit -p apps/backend/tsconfig.json` 에러 0
- [ ] `pnpm --filter @equipment-management/schemas run build` 성공
- [ ] `pnpm --filter @equipment-management/db run build` 성공
- [ ] `pnpm --filter backend run build` 성공
- [ ] `users` 테이블에 `signature_image_path` 컬럼 존재 (varchar, nullable)
- [ ] Drizzle migration 파일 생성 + 적용 (`drizzle-kit generate` → `migrate`)
- [ ] 서명 업로드 API 엔드포인트 존재 (PATCH or POST)
- [ ] `req.user.userId` 서버사이드 추출 (body에서 userId 받지 않기)
- [ ] 업로드 파일 검증: 이미지 타입만 허용 (png/jpeg), 크기 제한

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] `@AuditLog()` 데코레이터 적용
- [ ] 이력카드 내보내기(history-card.service.ts)에서 서명 이미지 활용 가능한 구조

### 적용 verify 스킬
- verify-auth (서버사이드 userId 추출)
- verify-zod (ZodValidationPipe)
- verify-ssot (import 경로)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
