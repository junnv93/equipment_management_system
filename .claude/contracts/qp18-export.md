# 스프린트 계약: QP-18 양식 내보내기 (4 Phase)

## 생성 시점
2026-04-06T10:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm exec tsc --noEmit` (backend) 에러 0
- [ ] `pnpm exec tsc --noEmit` (frontend) 기존 에러만 (software/page.js)
- [ ] `pnpm --filter backend run build` 성공
- [ ] Phase 1: 장비 등록 폼에 deputyManagerId select 존재
- [ ] Phase 1: 장비 상세 페이지에 부담당자 이름 표시
- [ ] Phase 1: backend create/update DTO에 deputyManagerId 포함
- [ ] Phase 2: history-card.service.ts가 실제 docx 템플릿 사용
- [ ] Phase 2: 이력카드에 부담당자, 서명 이미지 데이터 포함
- [ ] Phase 3: 관리대장 Excel 내보내기 16컬럼 매핑
- [ ] Phase 3: 실제 xlsx 템플릿 사용
- [ ] Phase 4: 장비 목록 페이지에 관리대장 내보내기 버튼 존재
- [ ] `req.user.userId` 서버사이드 추출 (신규 엔드포인트)
- [ ] verify-ssot PASS (import 경로)
- [ ] verify-i18n PASS (ko/en 키 일치)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록
- [ ] review-architecture Critical 이슈 0개
- [ ] `@AuditLog()` 데코레이터 (내보내기 엔드포인트)
- [ ] 이력카드 6개 섹션 전체 포함 (위치변동, 유지보수, 사고/수리 이력)

### 적용 verify 스킬
- verify-auth, verify-ssot, verify-zod, verify-i18n, verify-hardcoding

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
