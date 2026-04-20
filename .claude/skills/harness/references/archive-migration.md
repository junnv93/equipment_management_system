# Harness 완료 프롬프트 아카이브 — 데이터 마이그레이션

> 완료 처리된 프롬프트 섹션들. 최신 차수부터 역순 정렬.
> 전체 인덱스: [archive-index.md](./archive-index.md)

---

## ~~72차 신규 — 데이터 마이그레이션 도메인 종합 리뷰 (12건, 2026-04-16)~~ ✅ 전부 완료 (2026-04-17~19)

> **발견 배경 (2026-04-16)**: 데이터 마이그레이션 모듈 전면 리뷰 실시. DB 40개 테이블 중 5개만 커버하는 현황 + 아키텍처 수준 이슈 18건 발견. 3-agent 병렬 스캔(Backend deep/Frontend+missing domains/Infra+SSOT) + 추가 3-agent 심층 스캔(hardcoding+i18n/workflow+security/domain coverage) + 2차 검증(Read/Grep). FALSE POSITIVE 8건 제거(에러 코드·캐시 키·배치 크기·N+1·프론트엔드 i18n·FK 정합성·트랜잭션·동시 접근 — 모두 이미 적절히 구현됨 확인).
> 핵심 아키텍처 결정: Azure AD가 users/teams를 자동 프로비저닝 (auth.service.ts:232 upsert + :255 mapAzureGroupsToTeamAndLocation) → 별도 매핑 시트 불필요, DB 자동 조회 방식으로 FK 해석.

### 🔴 CRITICAL — 담당자·팀 FK 자동 해석 서비스 추가 (Mode 2)

```
문제:
- equipment-column-mapping.ts: teamId, managerId, deputyManagerId 매핑 엔트리 없음
- data-migration.service.ts:606-621: CUSTOM_HANDLED 미포함 → auto-mapping에서 데이터 자체가 없어 항상 NULL
- data-migration.service.ts:623-627: EQUIPMENT_COLUMNS.has(key) 체크 통과하지만 data에 값 없음
- 결과: 마이그레이션된 장비 전체의 teamId/managerId/deputyManagerId = NULL
- 영향: 팀 필터링, 담당자 조회, 사이트별 권한 검증 모두 불능

아키텍처 결정:
- Azure AD가 users 테이블 자동 프로비저닝 (auth.service.ts:232 upsert)
- 팀도 Azure AD 그룹(LST.SUW.RF)에서 자동 매핑 (auth.service.ts:255 mapAzureGroupsToTeamAndLocation)
- → 별도 매핑 시트 불필요. 엑셀 "담당자명/이메일" → DB users 테이블 조회로 UUID 획득
- → 팀은 장비의 site + classification에서 자동 결정 (기존 teamMapping 로직 재사용)

조치:
1. equipment-column-mapping.ts에 가상 해석 필드 4개 추가:
   - managerEmail: aliases ['담당자이메일', '담당자 이메일', 'Manager Email']
   - managerName: aliases ['담당자', '담당자명', 'Manager', 'Manager Name'] (이메일 없을 때 이름으로 폴백)
   - deputyManagerEmail: aliases ['부담당자이메일', 'Deputy Manager Email']
   - deputyManagerName: aliases ['부담당자', '부담당자명', 'Deputy Manager']
   — 이 필드들은 DB 컬럼이 아닌 "가상 해석 필드" → dbField를 managerEmail 등으로 설정
   — EQUIPMENT_COLUMNS에 없으므로 auto-mapping에서 무시됨 (의도적)

2. FkResolutionService 신규 (data-migration/services/fk-resolution.service.ts):
   - resolveUserByEmail(email: string): users.findByEmail → UUID | null
   - resolveUserByName(name: string, site?: Site): users WHERE name ILIKE → UUID | null (다수 시 warning + 첫 번째 반환)
   - resolveTeamBySiteAndClassification(site: Site, classificationCode: string): teams WHERE site AND classification → UUID | null
     (auth.service.ts:266-279 teamMapping 패턴 참조하되, DB 직접 조회로 구현 — 환경변수 불필요)
   - resolveBatch(rows: MigrationRowPreview[]): 배치 조회(WHERE IN) + resolved/unresolved 집계 반환
   — 의존성: UsersService (기존 findByEmail 재사용), TeamsService
   — data-migration.module.ts에 UsersModule, TeamsModule 의존 추가

3. data-migration.service.ts:
   - previewMultiSheet: 장비 시트 검증 후 FkResolutionService.resolveBatch(validRows) 호출
   - 해석 결과를 MigrationRowPreview.data에 주입: data.teamId, data.managerId, data.deputyManagerId
   - 미해석 항목은 warnings 배열에 추가: "담당자 'XXX'를 DB에서 찾을 수 없습니다" (error 아님 — NULL 허용 필드)
   - buildEntityFromRow: teamId/managerId/deputyManagerId를 CUSTOM_HANDLED에 추가하되, data에서 읽어 entity에 반영
   - teamId는 site(이미 매핑됨) + classificationCode(관리번호에서 파생, line 581-582)에서 자동 결정

4. MultiSheetPreviewResult 또는 SheetPreviewResult 타입에 fkResolutionSummary 추가:
   { resolved: { team: number, manager: number, deputyManager: number },
     unresolved: { team: number, manager: number, deputyManager: number } }

5. 프론트엔드 PreviewStep.tsx에 FK 해석 결과 표시:
   - 요약 Alert: "팀 32/32 해석, 담당자 28/32 해석, 미해석 4건" 등
   - 미해석 행에 warning 아이콘 + 툴팁
   - i18n (ko/en data-migration.json) 키 추가

6. generateTemplate (excel-parser.service.ts):
   - 장비 시트 헤더에 '담당자이메일', '담당자명', '부담당자이메일', '부담당자명' 컬럼 추가
   - 참고값 시트에 "담당자 매핑: 이메일 우선, 이름 폴백" 설명 추가

검증 (MUST — 전부 통과해야 완료):
- 이메일 "kim@ul.com" → DB users 매칭 → managerId UUID 설정 확인
- 이름 "김철수" + site "suwon" → DB users 매칭 → managerId UUID 설정 확인
- 미매칭 시 warning 생성 (error 아님) + managerId NULL (정상)
- site "suwon" + classificationCode "E" → teamId UUID 자동 해석 확인
- 기존 마이그레이션 (담당자 컬럼 없는 엑셀) → 퇴행 없음 (teamId/managerId 여전히 NULL이되 에러 없음)
- pnpm --filter backend run tsc --noEmit → exit 0
- pnpm --filter frontend run tsc --noEmit → exit 0
```

### 🔴 CRITICAL — 교정·수리 이력 중복 감지 키 확장 (Mode 0)

```
문제:
- data-migration.service.ts:827: 교정 중복 키 = `${equipmentId}:${calibrationDate.getTime()}`
  → 같은 장비가 같은 날 2개 다른 기관에서 교정받으면 후자가 false duplicate
- data-migration.service.ts:884: 수리 중복 키 = `${equipmentId}:${repairDate.getTime()}`
  → 같은 장비의 같은 날 서로 다른 수리 2건이면 후자가 false duplicate
- 사고 이력(data-migration.service.ts:943)은 (equipmentId, occurredAt, incidentType) 3-tuple → 적절

조치:
1. filterCalibrationDuplicates (data-migration.service.ts:810-862):
   - DB 쿼리(line 825 queryFn)에 calibrations.agencyName 컬럼 추가:
     `(ids) => tx.select({ equipmentId, calibrationDate, agencyName }).from(calibrations).where(inArray(...))`
   - existingKeys 키 변경: `${equipmentId}:${calibrationDate.getTime()}:${agencyName ?? ''}`
   - 신규 행 비교 키도 동일: `${equipmentId}:${date.getTime()}:${row.data.agencyName ?? ''}`
   - 에러 메시지 업데이트: "동일 날짜 + 동일 기관의 교정 기록이 존재합니다"

2. filterRepairDuplicates (data-migration.service.ts:868-918):
   - DB 쿼리에 repairHistory.repairDescription 컬럼 추가
   - existingKeys 키 변경: `${equipmentId}:${repairDate.getTime()}:${repairDescription ?? ''}`
   - 신규 행 비교 키도 동일
   - 에러 메시지 업데이트: "동일 날짜 + 동일 수리내용의 수리 기록이 존재합니다"

검증:
- 동일 equipmentId + 동일 날짜 + 다른 agencyName → 2건 모두 toInsert에 포함
- 동일 equipmentId + 동일 날짜 + 동일 agencyName → 1건만 toInsert, 1건 duplicate
- 수리도 동일 패턴 (repairDescription 기준) 검증
- pnpm --filter backend run tsc --noEmit → exit 0
- 기존 마이그레이션 테스트 통과
```

### 🟠 HIGH — 장비 컬럼 매핑 9건 + location 필드 NULL 버그 (Mode 1)

```
문제 A — 매핑 누락 9건:
  equipment.ts 스키마에 존재하나 equipment-column-mapping.ts에 매핑 없는 9개 필드:
  1. externalIdentifier (varchar) — 외부 장비 식별번호 (렌탈/공유 장비 추적)
  2. equipmentType (varchar) — 장비 유형 분류
  3. calibrationResult (varchar) — 교정 결과 텍스트
  4. correctionFactor (varchar) — 보정계수 값
  5. isShared (boolean) — 공용 장비 여부
  6. sharedSource (varchar) — 공용 출처 (external/safety_lab)
  7. owner (varchar) — 소유처 (공용 장비)
  8. usagePeriodStart (timestamp) — 사용 시작일
  9. usagePeriodEnd (timestamp) — 사용 종료일
  → Excel에 해당 컬럼이 있어도 "미인식 컬럼"으로 무시됨

문제 B — location NULL 버그:
  - data-migration.service.ts:620: location이 CUSTOM_HANDLED ("SSOT — equipment_location_history에서 파생")
  - 하지만 buildEntityFromRow에서 equipment.location 컬럼에 값을 설정하는 코드 없음
  - initialLocation은 location_history 테이블에만 기록 (line 293-304)
  - 장비 레코드 자체의 location = NULL → 장비 목록/상세 화면에서 위치 표시 불가

조치:
1. equipment-column-mapping.ts에 9개 ColumnMappingEntry 추가:
   { dbField: 'externalIdentifier', aliases: ['외부식별번호', '소유처번호', '외부번호', 'External ID', 'External Identifier'] }
   { dbField: 'equipmentType', aliases: ['장비유형', '장비타입', '유형', 'Equipment Type', 'Type'] }
   { dbField: 'calibrationResult', aliases: ['교정결과', '교정 결과', 'Calibration Result'] }
   { dbField: 'correctionFactor', aliases: ['보정계수', '보정 계수', 'Correction Factor'] }
   { dbField: 'isShared', aliases: ['공용여부', '공용', 'Shared', 'Is Shared'], transform: toBoolean }
   { dbField: 'sharedSource', aliases: ['공용출처', '공용 출처', 'Shared Source'] }
   { dbField: 'owner', aliases: ['소유처', '소유자', 'Owner'] }
   { dbField: 'usagePeriodStart', aliases: ['사용시작일', '사용 시작일', 'Usage Start', 'Usage Period Start'], transform: parseExcelDate }
   { dbField: 'usagePeriodEnd', aliases: ['사용종료일', '사용 종료일', 'Usage End', 'Usage Period End'], transform: parseExcelDate }

2. data-migration.service.ts buildEntityFromRow (line 589-630):
   - location CUSTOM_HANDLED 유지하되, initialLocation 값을 location에도 설정:
     entity['location'] = (data.initialLocation ?? data.location) as string | undefined;
   - SSOT 주석 업데이트: "location_history에서도 파생 + 장비 레코드에도 현재 위치로 설정"

3. excel-parser.service.ts generateTemplate: 신규 9개 컬럼 헤더를 장비 시트에 추가

검증:
- Excel '공용여부: 예' → isShared: true 매핑 확인
- Excel '사용시작일: 2024-01-01' → usagePeriodStart: Date 매핑 확인
- Excel '외부식별번호: EXT-001' → externalIdentifier: 'EXT-001' 매핑 확인
- buildEntityFromRow 결과에서 location = initialLocation 값 확인
- equipment INSERT 후 location 컬럼 NOT NULL (initialLocation이 있을 때)
- pnpm --filter backend run tsc --noEmit → exit 0
- 기존 마이그레이션 (신규 컬럼 없는 엑셀) → 퇴행 없음 (신규 필드 undefined → INSERT에서 생략)
```

### 🟠 HIGH — 마이그레이션 업로드 파일 정리(Cleanup) 추가 (Mode 0)

```
문제:
- data-migration.service.ts:95: savedFile = await this.fileUploadService.saveFile(file, 'data-migration')
- data-migration.service.ts:221: `void savedFile;` — 파일 참조 명시적 폐기, 삭제 로직 없음
- 세션 TTL(1시간) 경과 후에도 파일이 디스크/S3에 영구 잔존
- 대용량 Excel 반복 업로드 시 스토리지 누적 (10MB × N회)

조치:
1. data-migration.types.ts MultiSheetMigrationSession에 filePath?: string 필드 추가

2. data-migration.service.ts previewMultiSheet:
   - `void savedFile` 라인(221) 삭제
   - 세션 객체에 filePath 저장: session.filePath = savedFile.filePath (또는 savedFile.key)

3. data-migration.service.ts executeMultiSheet:
   - 트랜잭션 완료 후 (성공/실패 모두) finally 블록에서 파일 삭제:
     if (session.filePath) {
       try { await this.fileUploadService.deleteFile(session.filePath); }
       catch (e) { this.logger.warn('마이그레이션 파일 삭제 실패', e); }
     }
   - 삭제 실패는 warning 로그만 (비즈니스 로직 차단 금지)

4. getErrorReport 메서드: 에러 리포트 생성 후에는 파일 삭제하지 않음
   (Execute 전 에러 리포트 다운로드 가능 — Execute 완료 시 삭제)

검증:
- Preview → Execute 성공 → 파일 삭제 확인 (fileUploadService.deleteFile 호출 로그)
- Preview → Execute 실패 → finally에서 파일 삭제 시도 확인
- Preview만 하고 Execute 안 함 → 세션 TTL 만료 시 파일 잔존 (캐시 onExpire 미지원 → 수용)
- pnpm --filter backend run tsc --noEmit → exit 0
```

### 🟠 HIGH — Calibration completionDate 미설정 버그 (Mode 0)

```
문제:
- data-migration.service.ts:663: status = CalibrationStatusEnum.enum.completed 설정
- data-migration.service.ts:650-667: buildCalibrationValues에 completionDate 필드 없음
- calibrations.ts:52: completionDate (timestamp) 컬럼 존재
- 도메인 로직: status='completed'인 교정은 반드시 completionDate 필요
- 결과: 마이그레이션된 교정 기록이 "완료" 상태인데 completionDate = NULL → 쿼리/리포트 불일치

조치:
- data-migration.service.ts buildCalibrationValues (line 650-667)에 추가:
  completionDate: row.data.calibrationDate as Date,
  (교정 완료일 = 교정 실시일이 합리적 기본값 — 마이그레이션 데이터는 이미 완료된 교정)

- calibration-column-mapping.ts에 completionDate 매핑 추가 (선택적 오버라이드):
  { dbField: 'completionDate', aliases: ['교정완료일', '완료일', 'Completion Date'], transform: parseExcelDate }
  → Excel에 별도 완료일이 있으면 사용, 없으면 calibrationDate 폴백

검증:
- buildCalibrationValues 결과에 completionDate 포함 확인
- completionDate 매핑 없는 엑셀 → calibrationDate 값 사용
- completionDate 매핑 있는 엑셀 → 해당 값 사용
- pnpm --filter backend run tsc --noEmit → exit 0
```

### 🟠 HIGH — Excel 생성 하드코딩 전면 리팩토링 (Mode 1)

```
문제:
excel-parser.service.ts에 50+ 한국어 문자열 + 9개 ARGB 색상 매직 넘버가 인라인으로 하드코딩:

1. ARGB 색상 매직 넘버 (9건, 중복 사용):
   - line 297: 'FFFFFFFF' (white font)
   - line 298: 'FF1E3A5F' (dark navy header fill)
   - line 326: 'FFFEE2E2' (light red error fill)
   - line 330: 'FFFEF9C3' (light yellow duplicate fill)
   - line 336-339: 'FFE5E7EB' (gray border — 4회 반복)
   - line 372,376: 'FFFFFFFF', 'FF1D4ED8', 'FF2563EB' (template header — 중복)
   - line 495,499: 동일 색상 (applyHeaderStyle에서 재반복)

2. 한국어 시트명 하드코딩 (5건):
   - line 280: '에러 리포트'
   - line 357: '장비 등록'
   - line 405: '교정 이력'
   - line 432: '수리 이력'
   - line 455: '사고 이력'

3. 한국어 컬럼 헤더 하드코딩 (20+ 건):
   - line 286: ['행번호', '처리결과', '에러 상세', '관리번호', ...dataColumns]
   - line 409-416: ['관리번호 *', '교정일 *', '교정기관', ...]
   - line 435-440: ['관리번호 *', '수리일 *', '수리내용 *', ...]
   - line 458-462: ['관리번호 *', '발생일 *', '사고유형 *', ...]
   - line 477: ['필드명', '허용값']

4. 상태 라벨 한국어 (4건):
   - line 514: valid → '성공', error → '오류', duplicate → '중복', warning → '경고'

5. pageSetup 반복 (5건):
   - line 281,358,406,433,456: paperSize: 9, orientation: 'landscape' (동일 5회 반복)

6. data-migration.service.ts:301: '데이터 마이그레이션' 하드코딩 (location history notes)

조치:
1. constants/excel-styling.ts 신규:
   export const EXCEL_COLORS = {
     WHITE: 'FFFFFFFF', NAVY_HEADER: 'FF1E3A5F', ERROR_FILL: 'FFFEE2E2',
     DUPLICATE_FILL: 'FFFEF9C3', BORDER: 'FFE5E7EB',
     REQUIRED_HEADER: 'FF1D4ED8', OPTIONAL_HEADER: 'FF2563EB',
   } as const;
   export const EXCEL_PAGE_SETUP = { paperSize: 9, orientation: 'landscape' as const };

2. constants/excel-labels.ts 신규:
   export const EXCEL_LABELS = {
     ko: { sheets: { errorReport: '에러 리포트', equipment: '장비 등록', ... },
           statusLabels: { valid: '성공', error: '오류', ... },
           columns: { rowNumber: '행번호', result: '처리결과', ... } },
     en: { sheets: { errorReport: 'Error Report', equipment: 'Equipment', ... },
           statusLabels: { valid: 'Success', error: 'Error', ... },
           columns: { rowNumber: 'Row #', result: 'Result', ... } },
   };
   export const MIGRATION_NOTE = '데이터 마이그레이션';

3. excel-parser.service.ts: 모든 인라인 값 → EXCEL_COLORS, EXCEL_PAGE_SETUP, EXCEL_LABELS 참조
4. data-migration.service.ts:301: '데이터 마이그레이션' → MIGRATION_NOTE

검증:
- grep 'FF1E3A5F\|FFFEE2E2\|FFFEF9C3\|FFE5E7EB' excel-parser.service.ts → 0 hit
- grep "paperSize: 9" excel-parser.service.ts → 0 hit
- grep "'에러 리포트'\|'장비 등록'\|'교정 이력'" excel-parser.service.ts → 0 hit
- grep "'데이터 마이그레이션'" data-migration.service.ts → 0 hit
- pnpm --filter backend run tsc --noEmit → exit 0
```

### 🟡 MEDIUM — 상태/시트타입 문자열 리터럴 → enum SSOT (Mode 1)

```
문제:
- data-migration.service.ts 15+ 곳: 'equipment', 'calibration', 'repair', 'incident' 문자열 리터럴
  (line 104, 136, 141, 147, 260, 311, 324, 347, 362, 376, 388, 393, 417, 429, 434, 462)
- data-migration.service.ts 10+ 곳: 'valid', 'warning', 'error', 'duplicate' 문자열 리터럴
  (line 113, 159, 262, 264, 350, 352, 391, 393, 432, 434, 641-646, 834, 890)
- migration-validator.service.ts:99: new Set(['valid', 'warning']) 하드코딩
- packages/schemas/src/data-migration.ts: MigrationRowStatus 타입 존재하나 enum 값 상수는 미정의
- MigrationSheetType도 유니온 타입만 존재, 상수 미정의

조치:
1. packages/schemas/src/data-migration.ts에 상수 추가:
   export const MIGRATION_ROW_STATUS = {
     VALID: 'valid', ERROR: 'error', DUPLICATE: 'duplicate', WARNING: 'warning',
   } as const;
   export const MIGRATION_SHEET_TYPE = {
     EQUIPMENT: 'equipment', CALIBRATION: 'calibration', REPAIR: 'repair', INCIDENT: 'incident',
   } as const;
   export const INSERTABLE_STATUSES = new Set([
     MIGRATION_ROW_STATUS.VALID, MIGRATION_ROW_STATUS.WARNING,
   ]);

2. data-migration.service.ts: 모든 'equipment' → MIGRATION_SHEET_TYPE.EQUIPMENT 등으로 교체
   모든 'valid' → MIGRATION_ROW_STATUS.VALID 등으로 교체
   모든 status === 'valid' || status === 'warning' → INSERTABLE_STATUSES.has(status)

3. migration-validator.service.ts:99: 로컬 Set → INSERTABLE_STATUSES import

4. history-validator.service.ts: 동일 패턴 적용

검증:
- grep "'equipment'" data-migration.service.ts | grep -v import | grep -v comment → 0 hit
- grep "'valid'\|'warning'\|'error'\|'duplicate'" data-migration.service.ts | grep -v import → 0 hit
- pnpm --filter @equipment-management/schemas run tsc --noEmit → exit 0
- pnpm --filter backend run tsc --noEmit → exit 0
```

### 🟡 MEDIUM — SESSION_TTL SSOT + 세션 상태 머신 추가 (Mode 1)

```
문제 A — SESSION_TTL_MS 하드코딩:
  - data-migration.service.ts:47: const SESSION_TTL_MS = 3600 * 1000 (로컬 상수)
  - 동일 파일의 BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE는 shared-constants에 정의 → 패턴 불일치

문제 B — 세션 상태 머신 부재:
  - executeMultiSheet (line 231-494): 세션 조회 → 실행 → 삭제 (line 494)
  - 이중 실행 방지: 세션 삭제(line 494)에만 의존
  - 문제: HTTP 타임아웃으로 클라이언트가 재시도 시, 세션이 아직 캐시에 있으면 중복 실행 가능
  - 세션 상태 추적 없음 → 'preview' / 'executing' / 'completed' / 'failed' 구분 불가
  - 완료/실패 세션도 즉시 삭제 → 에러 리포트 접근 불가 (별도 캐시 필요)

조치:
1. packages/shared-constants/src/business-rules.ts에 추가:
   export const MIGRATION_SESSION_TTL_MS = 3600 * 1000; // 마이그레이션 세션 캐시 유효 시간

2. data-migration.service.ts: 로컬 SESSION_TTL_MS 삭제, MIGRATION_SESSION_TTL_MS import

3. data-migration.types.ts MultiSheetMigrationSession에 status 필드 추가:
   status: 'preview' | 'executing' | 'completed' | 'failed'

4. data-migration.service.ts previewMultiSheet:
   - 세션 생성 시 status = 'preview'

5. data-migration.service.ts executeMultiSheet:
   - 시작 시: session.status 확인
     - 'executing' → ConflictException("이미 실행 중인 세션입니다")
     - 'completed' → ConflictException("이미 완료된 세션입니다")
     - 'failed' → ConflictException("실패한 세션입니다. 새로 업로드하세요")
   - status = 'executing'으로 업데이트 후 캐시에 다시 저장 (CAS)
   - 성공 시: status = 'completed', 캐시 유지 (세션 삭제하지 않음 — 에러 리포트 접근용)
   - 실패 시: status = 'failed', 캐시 유지

6. getErrorReport: status 상관없이 세션 조회 가능 (기존 동작 유지)

검증:
- grep 'SESSION_TTL_MS' data-migration.service.ts → MIGRATION_SESSION_TTL_MS import만 (로컬 선언 0)
- 같은 sessionId 2회 Execute → 2번째 ConflictException (409)
- Execute 성공 후 에러 리포트 다운로드 → 정상 (세션 유지)
- pnpm --filter backend run tsc --noEmit → exit 0
```

### 🟡 MEDIUM — 이력 시트 관리번호 DB 검증 강화 (Mode 1)

```
문제:
- history-validator.service.ts:79-80:
  if (mgmtNum && validManagementNumbers.size > 0 && !validManagementNumbers.has(mgmtNum)) {
    warnings.push("관리번호가 장비 시트에 없습니다. DB에서 조회합니다.");
  }
- validManagementNumbers.size === 0이면 조건 자체가 false → 검증 완전 스킵
- 장비 시트 미업로드 시: validManagementNumbers = empty Set → 모든 이력 행이 검증 없이 통과
- Execute 단계(line 334-343)에서 DB 조회 → 미존재 시 generic "equipment not found" 에러
- UX 단절: Preview에서 경고 없이 통과 → Execute에서 실패

조치:
1. data-migration.service.ts previewMultiSheet: 이력 시트 처리 직전에:
   - 장비 시트가 없거나 equipmentMgmtNumbers가 비어있으면,
     이력 행들의 managementNumber를 수집 → DB에서 equipment.managementNumber 배치 조회
   - 조회 결과(DB에 있는 관리번호 Set)를 validManagementNumbers에 merge

2. history-validator.service.ts:79: validManagementNumbers.size > 0 조건 유지
   (service에서 DB 조회 결과를 미리 merge하므로, size > 0이 보장됨)

3. DB에 없는 관리번호는 error 처리 (warning 아님):
   code: MigrationErrorCode.EQUIPMENT_NOT_FOUND
   message: "관리번호 'XXX'에 해당하는 장비가 DB에 없습니다."
   → Execute에서의 generic 에러 대신 Preview에서 명시적 피드백

4. 아키텍처: DB 조회는 service 레벨에서 수행 → validator에 전달 (validator는 DB 무의존 유지)

검증:
- 장비 시트 없이 교정 이력만 업로드 → DB에 없는 관리번호 행: status='error' 확인
- 장비 시트 없이 교정 이력만 업로드 → DB에 있는 관리번호 행: status='valid' 확인
- 장비 시트 + 이력 시트 함께 업로드 → 기존 동작 유지 (퇴행 없음)
- pnpm --filter backend run tsc --noEmit → exit 0
```

### 🟡 MEDIUM — 마이그레이션 전용 권한 추가 (Mode 1)

```
문제:
- data-migration.controller.ts:56,97: @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
- MANAGE_SYSTEM_SETTINGS는 시스템 설정 변경 + 데이터 마이그레이션을 동시 커버
- 마이그레이션은 승인 워크플로우를 우회 (approvalStatus='approved' 하드코딩)
  → 높은 권한이 필요하지만, 시스템 설정 변경과는 별개의 책임
- 권한 세분화 원칙 위반 (Principle of Least Privilege)

조치:
1. packages/shared-constants/src/permissions.ts:
   - Permission 객체에 PERFORM_DATA_MIGRATION: 'perform_data_migration' 추가

2. packages/shared-constants/src/role-permissions.ts (또는 해당 매핑 파일):
   - SYSTEM_ADMIN에만 PERFORM_DATA_MIGRATION 부여
   - LAB_MANAGER에는 부여하지 않음 (실무자가 아닌 승인 역할만)
   - TECH_MANAGER, TEST_ENGINEER에도 부여하지 않음

3. data-migration.controller.ts:
   - line 56: @RequirePermissions(Permission.PERFORM_DATA_MIGRATION) 교체
   - line 97: @RequirePermissions(Permission.PERFORM_DATA_MIGRATION) 교체
   - template download (line 129): 동일 권한 적용

4. 프론트엔드:
   - 사이드바/메뉴에서 데이터 마이그레이션 항목의 권한 체크 업데이트
   - 기존 MANAGE_SYSTEM_SETTINGS → PERFORM_DATA_MIGRATION

검증:
- SYSTEM_ADMIN 로그인 → /admin/data-migration 접근 가능
- LAB_MANAGER 로그인 → /admin/data-migration → 403 Forbidden
- TECH_MANAGER 로그인 → /admin/data-migration → 403 Forbidden
- grep 'MANAGE_SYSTEM_SETTINGS' data-migration.controller.ts → 0 hit
- pnpm --filter backend run tsc --noEmit → exit 0
- pnpm --filter frontend run tsc --noEmit → exit 0
```

### 🟢 LOW — 에러 리포트 성공 행 포함 + 요약 시트 (Mode 0)

```
문제:
- data-migration.service.ts:533-536:
  for (const row of sheet.rows) {
    if (row.status === 'error' || row.status === 'duplicate') errorRows.push(row);
  }
  → 성공(valid/warning) 행은 에러 리포트에서 제외
- 관리자가 5000건 마이그레이션 후 "어떤 행이 성공했는지" 확인 불가
- 감사(audit) 관점에서 전체 결과 기록 필요

조치:
1. data-migration.service.ts getErrorReport:
   - 필터 조건 변경: 에러/중복뿐 아니라 모든 행 포함
   - 또는: 별도 "전체 결과 리포트" 엔드포인트 추가

2. excel-parser.service.ts generateErrorReport:
   - 첫 번째 시트로 "요약" 시트 추가:
     총 행수, 성공, 에러, 중복, 경고 건수 + 시트별 breakdown
   - 성공 행은 배경색 없음 (기존 에러/중복 색상 유지)
   - 파일명 변경: 'error-report' → 'migration-report' (성공 행 포함이므로)

3. 프론트엔드 use-data-migration.ts:
   - 다운로드 버튼 라벨 업데이트: "에러 리포트" → "마이그레이션 결과 리포트"
   - i18n 키 업데이트

검증:
- 마이그레이션 결과 리포트 다운로드 → 성공 행 포함 확인
- 요약 시트에 총 건수/성공/에러/중복/경고 표시 확인
- pnpm --filter backend run tsc --noEmit → exit 0
```

### 🟡 MEDIUM — 케이블·시험SW·교정계수·부적합 마이그레이션 도메인 추가 (Mode 2)

```
문제 — DB에 스키마+모듈이 존재하나 마이그레이션 미지원 4개 도메인:

1. cables (packages/db/src/schema/cables.ts):
   - RF 케이블 관리 (UL-QP-18-08)
   - 3개 테이블: cables, cable_loss_measurements, cable_loss_data_points
   - 대량 등록 필요: 관리번호, 길이, 커넥터타입, 주파수범위, 경로 손실 데이터
   - cables 모듈 존재: apps/backend/src/modules/cables/

2. test_software (packages/db/src/schema/test-software.ts):
   - 시험용 소프트웨어 P-number 레지스트리 (UL-QP-18-07)
   - 테이블: test_software, equipment_test_software (M:N junction)
   - 대량 등록 필요: P번호, 소프트웨어명, 버전, 시험분야, 제조사
   - test-software 모듈 존재: apps/backend/src/modules/test-software/

3. calibration_factors (packages/db/src/schema/calibration-factors.ts):
   - 교정 인자 (보정계수) 이력
   - 장비별 보정계수 기록 마이그레이션
   - calibration-factors 모듈 존재: apps/backend/src/modules/calibration-factors/

4. non_conformances (packages/db/src/schema/non-conformances.ts):
   - 부적합 관리 (규제 기록 — UL-QP-18 compliance)
   - FK: equipmentId(restrict), discoveredBy/correctedBy/closedBy(restrict → user)
   - status workflow: open → corrected → closed (또는 rejected)
   - 규제 기록이므로 이전 시스템 데이터 이관 필수
   - non-conformances 모듈 존재: apps/backend/src/modules/non-conformances/

마이그레이션 불필요 (검증 완료):
- equipment_imports: 런타임 워크플로우 (active import 이관 위험)
- equipment_requests / disposal_requests: 워크플로우 (approval chain 단절)
- audit_logs: 신규 시스템에서 새로 시작 (denormalized, entityId 불일치)
- documents: 바이너리 파일 → Excel 마이그레이션 부적합 (별도 파일 import 필요)
- calibration_plans: 연간 계획은 새로 수립 (완료된 계획만 필요 시 별도 논의)

조치:
1. packages/schemas/src/data-migration.ts:
   - MigrationSheetType 확장: | 'cable' | 'test_software' | 'calibration_factor' | 'non_conformance'
   - MIGRATION_SHEET_TYPE 상수에 4종 추가

2. 신규 column-mapping 파일 4개:
   - constants/cable-column-mapping.ts:
     managementNumber, name, length, connectorTypeA/B, frequencyRange, serialNumber, location, site, manufacturer 등
   - constants/test-software-column-mapping.ts:
     pNumber, name, softwareVersion, testField, manufacturer, softwareType, validationStatus 등
   - constants/calibration-factor-column-mapping.ts:
     equipmentManagementNumber, factorName, factorValue, unit, measuredDate, measuredBy, notes 등
   - constants/non-conformance-column-mapping.ts:
     equipmentManagementNumber, discoveryDate, cause, ncType, resolutionType, status, actionPlan 등

3. constants/sheet-config.ts SHEET_CONFIGS에 4개 SheetConfig 추가:
   - cable: namePatterns ['케이블', 'cable', 'RF케이블', 'Cable']
   - test_software: namePatterns ['시험SW', 'test software', '시험소프트웨어', 'P번호']
   - calibration_factor: namePatterns ['교정계수', '보정계수', 'calibration factor', 'correction factor']
   - non_conformance: namePatterns ['부적합', 'non-conformance', 'NC', '부적합사항']

4. data-migration.service.ts:
   - previewMultiSheet: 4개 신규 시트 타입 분기 추가
   - executeMultiSheet: 4개 도메인 INSERT 로직 + 중복 감지
   - buildCableValues, buildTestSoftwareValues, buildCalibrationFactorValues, buildNonConformanceValues 메서드
   - 캐시 무효화: cables, testSoftware, calibrationFactors, nonConformances 리스트 캐시
   - NC: discoveredBy는 P1 FkResolution 패턴 재사용 (이메일/이름 → userId)

5. excel-parser.service.ts generateTemplate: 4개 시트 추가

6. 프론트엔드 i18n (ko/en data-migration.json):
   - 신규 시트 라벨 + 컬럼 이름 키 추가

검증:
- Excel '케이블' 시트 → cable 타입 감지 + 매핑 + Preview 성공
- Excel 'P번호' 시트 → test_software 타입 감지 + Preview 성공
- Excel '부적합' 시트 → non_conformance 타입 감지 + Preview 성공
- 각 도메인 Execute → DB INSERT 확인
- MigrationSheetType 타입 확장 후 exhaustive switch 에러 0
- pnpm --filter backend run tsc --noEmit → exit 0
- pnpm --filter @equipment-management/schemas run tsc --noEmit → exit 0
- 기존 4개 시트 타입 마이그레이션 퇴행 없음
```

---
