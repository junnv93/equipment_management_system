# Contract: 백엔드 모듈 단위 테스트 추가

## 생성 시점
2026-04-01

## Context
테스트가 없던 4개 백엔드 모듈(data-migration, documents, notifications, reports)에
단위 테스트 스위트를 추가한다.

## MUST Criteria (모두 PASS해야 함)
- [ ] pnpm --filter backend run tsc --noEmit → 에러 0
- [ ] pnpm --filter backend run test → 전체 PASS (기존 + 신규)
- [ ] 4개 모듈 각각 __tests__/ 디렉토리 존재
- [ ] 각 서비스의 핵심 메서드마다 최소 1개 테스트 (happy path)
- [ ] 모든 mock은 기존 mock-providers.ts 패턴 준수 또는 확장
- [ ] 하드코딩된 UUID/문자열 없음 (상수 또는 팩토리 사용)
- [ ] Drizzle mock은 createSelectChain 헬퍼 패턴 사용 (calibration.service.spec.ts 참조)

## SHOULD Criteria (실패해도 루프 차단 안 함)
- [ ] 에러 케이스 테스트 (unhappy path) — NotFoundException, BadRequestException, ForbiddenException
- [ ] 캐시 히트/미스 분기 테스트 (getOrSet 두 경로)
- [ ] EventEmitter2 이벤트 페이로드 검증
- [ ] NotificationDispatcher fire-and-forget 격리 검증 (수신자 해석 실패 시 전파 없음)
- [ ] NotificationSseService Reference Counting 검증 (마지막 구독 해제 시 Subject 정리)
- [ ] ReportExportService 세 포맷(excel/csv/pdf) 모두 buffer.length > 0 확인

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
