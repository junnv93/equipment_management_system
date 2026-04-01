# Exec Plan: 백엔드 모듈 단위 테스트 추가
Date: 2026-04-01
Status: active
Slug: backend-module-tests

## Context

### 기존 테스트 패턴 (SSOT)
- 기준 파일: `apps/backend/src/modules/calibration/__tests__/calibration.service.spec.ts`
- Drizzle mock 패턴: `createSelectChain(finalValue)` 헬퍼 — select/from/where/leftJoin/innerJoin/orderBy/limit/offset/insert/values/returning/update/set 메서드 체인을 jest.fn()으로 구성하고, 체인 자체를 `then`을 가진 thenable로 만들어 마지막 메서드가 where/offset인 경우를 처리
- DI mock 패턴: `{ provide: 'DRIZZLE_INSTANCE', useValue: mockDb }` + `mock-providers.ts`의 팩토리 함수
- 모든 테스트는 `Test.createTestingModule({ providers: [...] }).compile()` 방식
- 하드코딩 ID 금지: `MOCK_XXX_ROW` 상수 객체 + 팩토리 함수 사용
- 모든 async 에러 검증은 `await expect(...).rejects.toThrow(XxxException)` 패턴

### 현재 테스트 누락 현황
- `data-migration` 모듈: `__tests__/` 디렉토리 전무
- `documents` 모듈: `__tests__/` 디렉토리 전무 (DocumentService는 `common/file-upload/`에 위치)
- `notifications` 모듈: `services/__tests__/`에 email 3종만 있음; NotificationsService, NotificationDispatcher, NotificationSseService, NotificationTemplateService 미테스트
- `reports` 모듈: `__tests__/` 디렉토리 전무

### 의존성 특이사항
- `DataMigrationService`는 `FileUploadService`, `EquipmentHistoryService`, `ExcelParserService`, `MigrationValidatorService`, `HistoryValidatorService`, `CacheInvalidationHelper`, `SimpleCacheService`, `DRIZZLE_INSTANCE` 8개 의존성을 가짐
- `NotificationDispatcher`는 9개 의존성 (db, recipientResolver, preferencesService, templateService, emailService, emailTemplateService, cacheService, sseService, settingsService)
- `NotificationSseService`는 DB 의존성 없음 — 순수 Subject 기반 인메모리 서비스
- `MigrationValidatorService`는 `DRIZZLE_INSTANCE` 단독 의존
- `HistoryValidatorService`는 의존성 없음 (순수 Zod 검증)
- `ReportsService`는 `DRIZZLE_INSTANCE` + `SimpleCacheService` 2개 의존
- `ReportExportService`는 의존성 없음 (순수 ExcelJS/PDFKit 변환)

---

## Phase 1: 공통 테스트 인프라 보강

### 파일: `apps/backend/src/common/testing/mock-providers.ts` (기존 파일 확장)

달성해야 할 것:
- `createMockFileUploadService()` 팩토리 추가 — `saveFile`, `readFile`, `deleteFile` mock 메서드 포함
- `createMockEquipmentHistoryService()` 팩토리 추가 — `createLocationHistoryInternal` mock 메서드 포함
- `createMockStorageProvider()` 팩토리 추가 — `supportsPresignedUrl`, `getPresignedDownloadUrl`, `uploadFile`, `deleteFile` mock 메서드 포함
- `createMockDocumentService()` 팩토리 추가 — `createDocument`, `findByEquipmentId`, `findByCalibrationId`, `findByRequestId`, `findAllByEquipmentId`, `findByIdAnyStatus`, `verifyIntegrity`, `deleteDocument`, `createRevision`, `getRevisionHistory` mock 메서드 포함
- `createMockSettingsService()` 팩토리 추가 — `getSystemSettings`가 기본값 notificationRetentionDays 포함 객체 반환
- `createMockNotificationSseService()` 팩토리 추가 — `pushToUser`, `pushToUsers`, `broadcastApprovalChanged`, `createStream`, `getActiveConnectionCount`, `disconnectUser` mock 메서드 포함
- `createMockNotificationDispatcher()` 팩토리 추가 — `dispatch` mock 메서드 포함
- `createMockNotificationTemplateService()` 팩토리 추가 — `buildNotification`, `render` mock 메서드 포함
- `createMockNotificationPreferencesService()` 팩토리 추가 — `filterEnabledUsers`, `filterEmailEnabledUsers` mock 메서드 포함
- `createMockNotificationRecipientResolver()` 팩토리 추가 — `resolve` mock 메서드 포함
- `createMockExcelParserService()` 팩토리 추가 — `parseBuffer`, `parseMultiSheetBuffer`, `mapRows`, `generateErrorReport`, `generateTemplate` mock 메서드 포함
- `createMockMigrationValidatorService()` 팩토리 추가 — `validateBatch`, `filterValidRows` mock 메서드 포함

---

## Phase 2: data-migration 테스트

### 파일: `apps/backend/src/modules/data-migration/__tests__/history-validator.service.spec.ts`

달성해야 할 것:
- `HistoryValidatorService` 단독 인스턴스화 (의존성 없음)
- `validateCalibrationBatch()`: 유효 행 → status='valid', 필수 필드 누락 → status='error', validManagementNumbers에 없는 관리번호 → status='error'
- `validateRepairBatch()`: 유효 행 → status='valid', repairDescription 누락 → status='error'
- `validateIncidentBatch()`: 유효 행 → status='valid', incidentType enum 외 값 → status='error'
- 각 검증 메서드의 반환 배열 길이가 입력 배열 길이와 일치하는지 확인

### 파일: `apps/backend/src/modules/data-migration/__tests__/migration-validator.service.spec.ts`

달성해야 할 것:
- `MigrationValidatorService` + `{ provide: 'DRIZZLE_INSTANCE', useValue: mockDb }` 조합 테스트
- `validateBatch()`: Drizzle DB에서 관리번호 중복 조회 결과가 빈 배열이면 해당 행 status='valid'
- `validateBatch()`: DB에서 관리번호 중복 발견 시 status='duplicate'
- `validateBatch()`: Zod 검증 실패 시 status='error' + errors 배열 비어있지 않음
- `validateBatch()` autoGenerateManagementNumber=true 옵션: 관리번호 없는 행에 자동 생성 확인
- `filterValidRows()`: status='valid' 또는 'warning' 행만 반환

### 파일: `apps/backend/src/modules/data-migration/__tests__/data-migration.service.spec.ts`

달성해야 할 것:
- `DataMigrationService` + 8개 의존성 모두 mock으로 제공
- `preview()`: `ExcelParserService.parseBuffer` + `mapRows` 호출 확인, `MigrationValidatorService.validateBatch` 호출 확인, sessionId가 UUID 형식임을 확인, `cacheService.set`으로 세션 저장 확인
- `execute()`: 세션 없을 시 `NotFoundException` 발생
- `execute()`: 다른 userId 세션 실행 시 `ForbiddenException` 발생
- `execute()`: validRows=0이면 createdCount=0 반환
- `execute()`: db.transaction 호출 + 완료 후 `cacheInvalidationHelper.invalidateEquipmentLists` 호출 확인
- `getErrorReport()`: 단일시트 세션 캐시 히트 시 `excelParserService.generateErrorReport` 호출 확인
- `getErrorReport()`: 세션 없을 시 `NotFoundException` 발생
- `getTemplate()`: `excelParserService.generateTemplate` 호출 확인

---

## Phase 3: documents 테스트

### 파일: `apps/backend/src/modules/documents/__tests__/documents.controller.spec.ts`

달성해야 할 것:
- `DocumentsController` + `DocumentService` mock + `FileUploadService` mock + `IStorageProvider` mock 조합
- `uploadDocument()`: file 없을 시 `BadRequestException` 발생
- `uploadDocument()`: 유효하지 않은 documentType 시 `BadRequestException` 발생
- `uploadDocument()`: 정상 호출 시 `documentService.createDocument` 호출 확인 + 반환 객체 구조 확인
- `list()`: equipmentId + calibrationId 모두 없으면 빈 배열 반환
- `list()`: 유효하지 않은 UUID 형식 equipmentId → `BadRequestException` 발생
- `list()`: calibrationId 제공 시 `documentService.findByCalibrationId` 호출 확인
- `list()`: equipmentId + includeCalibrations=true 시 `documentService.findAllByEquipmentId` 호출 확인
- `download()`: storageProvider.supportsPresignedUrl()=true 시 presignedUrl JSON 반환 확인
- `download()`: local 드라이버(supportsPresignedUrl=false) 시 buffer 스트림 반환 확인
- `deleteDocument()`: `documentService.deleteDocument` 호출 확인 + 메시지 반환
- `createRevision()`: file 없을 시 `BadRequestException` 발생
- `createRevision()`: 정상 호출 시 `documentService.createRevision` 호출 확인

---

## Phase 4: notifications 테스트

### 파일: `apps/backend/src/modules/notifications/__tests__/notifications.service.spec.ts`

달성해야 할 것:
- `NotificationsService` + `DRIZZLE_INSTANCE` mock + `SimpleCacheService` mock 조합
- `findAllForUser()`: count 쿼리 + data 쿼리 2회 Drizzle 호출 확인, 반환 객체에 items/total/page/pageSize/totalPages 포함
- `countUnread()`: `cacheService.getOrSet` 호출 확인 (캐시 미스 시 DB 쿼리 실행)
- `findOne()`: 결과 없을 시 `NotFoundException` 발생
- `markAsRead()`: DB update 결과 없을 시 `NotFoundException` 발생
- `markAsRead()`: 정상 업데이트 후 `cacheService.delete` 호출 확인 (unread 캐시 무효화)
- `markAllAsRead()`: `{ success: true, count: N }` 형태 반환 확인
- `remove()`: 결과 없을 시 `NotFoundException` 발생
- `createBatch()`: 빈 배열 입력 시 빈 배열 반환 (DB 호출 없음)
- `createSystemNotification()`: insert 호출 확인 + isSystemWide=true 확인

### 파일: `apps/backend/src/modules/notifications/__tests__/notification-dispatcher.spec.ts`

달성해야 할 것:
- `NotificationDispatcher` + 9개 의존성 모두 mock 조합
- `dispatch()`: 미등록 이벤트명 → 조기 반환, DB/SSE 호출 없음
- `dispatch()`: recipientResolver.resolve가 빈 배열 반환 → 알림 생성 없음
- `dispatch()`: preferencesService.filterEnabledUsers가 빈 배열 반환 → DB insert 없음
- `dispatch()`: 정상 flow — DB insert 호출 확인 + cacheService.delete(unread캐시) 호출 확인 + sseService.pushToUser 호출 확인
- `dispatch()`: config.emailStrategy='immediate' 시 emailService.sendMail 호출 확인 (이메일 활성 사용자 있을 때)
- `dispatch()`: recipientResolver.resolve 예외 발생 → 전체 오류 전파 없이 조기 반환 (fire-and-forget 격리)

### 파일: `apps/backend/src/modules/notifications/__tests__/notification-sse.service.spec.ts`

달성해야 할 것:
- `NotificationSseService` 단독 인스턴스화 (의존성 없음)
- `createStream()`: 동일 userId 두 번 호출 시 동일 Subject 공유 (connections 맵 크기=1)
- `pushToUser()`: 활성 Subject가 있으면 Subject.next 호출되어 Observable에 값 도달
- `pushToUser()`: 연결 없는 userId → 예외 없이 무시
- `getActiveConnectionCount()`: createStream 후 증가 + disconnectUser 후 감소
- `disconnectUser()`: Subject.complete 호출 + connections 맵에서 제거
- `broadcastApprovalChanged()`: 연결된 모든 userId의 Subject.next가 approval-changed 센티넬 포함 payload로 호출됨
- `onModuleDestroy()`: clearInterval 호출 + 모든 Subject.complete 호출 확인

### 파일: `apps/backend/src/modules/notifications/__tests__/notification-template.service.spec.ts`

달성해야 할 것:
- `NotificationTemplateService` 단독 인스턴스화
- `render()`: `{{변수명}}` 패턴 치환 정확성 확인
- `render()`: 변수 값이 undefined이면 빈 문자열로 치환
- `buildNotification()`: NOTIFICATION_REGISTRY에 등록된 이벤트명으로 호출 시 title/content/category/priority 올바르게 반환
- `buildNotification()`: 미등록 이벤트명 → `Error` throw

---

## Phase 5: reports 테스트

### 파일: `apps/backend/src/modules/reports/__tests__/report-export.service.spec.ts`

달성해야 할 것:
- `ReportExportService` 단독 인스턴스화 (의존성 없음)
- `generate(data, 'excel')`: 반환 mimeType이 xlsx MIME 타입, buffer.length > 0, filename이 `.xlsx`로 끝남
- `generate(data, 'csv')`: 반환 mimeType이 text/csv, buffer가 UTF-8 문자열로 디코딩 가능, filename이 `.csv`로 끝남
- `generate(data, 'pdf')`: 반환 mimeType이 application/pdf, buffer.length > 0, filename이 `.pdf`로 끝남
- title의 공백이 언더스코어로 치환되어 filename에 반영됨
- rows가 빈 배열이어도 정상 생성 (컬럼 헤더만 포함)

### 파일: `apps/backend/src/modules/reports/__tests__/reports.service.spec.ts`

달성해야 할 것:
- `ReportsService` + `DRIZZLE_INSTANCE` mock + `SimpleCacheService` mock 조합
- `getEquipmentUsage()`: `cacheService.getOrSet` 호출 확인 (캐시 미스 시 DB 집계 쿼리 실행)
- `getEquipmentUsage()`: scope.type='none' 조건 시 Drizzle sql`FALSE` 조건이 적용된 쿼리 호출
- `getEquipmentUsage()`: 반환 객체에 timeframe/totalUsageHours/totalEquipmentCount/departmentDistribution/topEquipment/monthlyTrend 필드 존재
- `getCalibrationStatus()`: 반환 객체에 summary/status/calibrationTrend 필드 존재
- `getCheckoutStatistics()`: 반환 객체에 timeframe/totalCheckouts/avgDuration 등 필드 존재
- scope.type='team' 조건: equipmentTable.teamId에 eq 조건이 포함된 쿼리 호출
- scope.type='site' 조건: equipmentTable.site에 eq 조건이 포함된 쿼리 호출

---

## Verification Commands

### Phase 1 검증
```bash
pnpm --filter backend run tsc --noEmit
```

### Phase 2 검증
```bash
pnpm --filter backend run test -- --testPathPattern="data-migration"
```

### Phase 3 검증
```bash
pnpm --filter backend run test -- --testPathPattern="documents"
```

### Phase 4 검증
```bash
pnpm --filter backend run test -- --testPathPattern="notifications"
```

### Phase 5 검증
```bash
pnpm --filter backend run test -- --testPathPattern="reports"
```

### 전체 회귀 검증
```bash
pnpm --filter backend run test
pnpm --filter backend run tsc --noEmit
```
