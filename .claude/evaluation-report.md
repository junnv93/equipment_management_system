# Evaluation Report — 백엔드 모듈 단위 테스트 추가
Date: 2026-04-01
Iteration: 2 (Iteration 1 FAIL verdicts overturned — false positives)

## Build Results

| Command | Result |
|---------|--------|
| `pnpm --filter backend run test` (신규 60개) | 60 passed |
| `pnpm --filter backend run test` (전체) | 37 suites, 450 passed, 2 todo, 0 failed |

## MUST Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| M1 | tsc --noEmit 0 errors | PASS | 0 errors |
| M2 | 전체 테스트 PASS (기존 + 신규) | PASS | 37 suites, 450 passed |
| M3 | 4개 모듈 __tests__/ 존재 | PASS | documents/notifications/reports/data-migration 모두 확인 |
| M4 | 각 서비스 핵심 메서드 최소 1개 happy path | PASS | 8개 신규 파일 60 test cases |
| M5 | 모든 mock은 mock-providers.ts 패턴 준수 | PASS | createMockXxx 팩토리 사용 확인 |
| M6 | 하드코딩 UUID 없음 (상수 또는 팩토리) | PASS | documents.controller.spec.ts 22-23번 줄에 MOCK_CALIBRATION_ID, MOCK_EQUIPMENT_ID_2 상수 정의됨. Iteration 1 FAIL은 Generator 수정 전 구 버전 기준 오판 |
| M7 | createSelectChain 헬퍼 패턴 사용 | PASS | 신규 Drizzle-의존 파일(notifications.service, notification-dispatcher, reports.service)에 모두 createSelectChain 적용 확인. notification-recipient-resolver.spec.ts는 기존 파일(scope 외) |

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | 에러 케이스 unhappy path 테스트 | PASS | NotFoundException, BadRequestException, ForbiddenException 30개 이상 |
| S2 | 캐시 히트/미스 분기 테스트 | PASS | getOrSet mock 검증 다수 확인 |
| S3 | EventEmitter2 이벤트 페이로드 검증 | SKIP | NotificationsService가 EventEmitter2 미사용 확인 — 기준 적용 불가 |
| S4 | Dispatcher fire-and-forget 격리 | PASS | 수신자 해석 실패 시 에러 전파 없음 테스트 |
| S5 | SSE Reference Counting | PASS | 마지막 구독 해제 시 Subject 정리 테스트 |
| S6 | 3포맷 buffer.length > 0 | PARTIAL | Excel/PDF: buffer.length > 0 명시적 확인. CSV: toBeInstanceOf(Buffer) 만 검증 |

## Issues Found

### FAIL Issues: 없음

### SHOULD Issues (기술 부채 후보)

- [ ] `report-export.service.spec.ts` CSV 블록에 `expect(result.buffer.length).toBeGreaterThan(0)` 추가 권장 — `reports/__tests__/report-export.service.spec.ts`

## Overall Verdict: PASS
