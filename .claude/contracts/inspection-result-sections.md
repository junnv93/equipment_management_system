# 스프린트 계약: 점검 결과 섹션 동적 콘텐츠

## 생성 시점
2026-04-10T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] verify-implementation 전체 PASS (변경 영역 기반 스킬 자동 선택)
- [ ] DB 스키마의 inspectionResultSections 테이블이 정상 정의되어 있음
- [ ] SSOT: InspectionResultSectionType enum이 @equipment-management/schemas에서 export됨
- [ ] DocxTemplate에 appendParagraph, appendTable, appendImage 메서드 존재
- [ ] 중간점검/자체점검 컨트롤러에 result-sections CRUD 엔드포인트 존재
- [ ] Export 파이프라인에서 동적 섹션 렌더링 로직이 호출됨

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] CSV 파싱에 엣지 케이스 방어가 충분함
- [ ] 보안: userId는 서버에서 추출 (Rule 2)

### 적용 verify 스킬
- verify-ssot (SSOT 준수)
- verify-zod (Zod 파이프라인)
- verify-auth (권한/인증)
- verify-implementation (전체)
- verify-cas (CAS — 해당 시)
- verify-security (보안)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
