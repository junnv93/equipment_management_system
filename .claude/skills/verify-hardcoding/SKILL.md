---
name: verify-hardcoding
description: SSOT 소스가 존재하는 값의 하드코딩을 탐지합니다. API 경로, queryKeys, 환경변수, 캐시 키, 토큰 TTL, 페이지 옵션 등. 기능 구현 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 검사 항목]'
---

# 하드코딩 값 탐지

## Purpose

SSOT 소스(중앙 상수, 유틸리티, 팩토리)가 존재하는 값이 하드코딩되어 있는지 탐지합니다:

1. **API 경로** — `API_ENDPOINTS` 대신 문자열 직접 사용
2. **queryKeys** — `queryKeys` 팩토리 대신 배열 직접 생성
3. **환경변수** — `API_BASE_URL` 대신 `process.env` 직접 접근
4. **서비스 반환 타입** — `Promise<unknown>` 안티패턴
5. **토큰 TTL** — `shared-constants` 대신 매직 넘버
6. **상수** — SITE_VALUES, PAGE_SIZE_OPTIONS, CACHE_KEY_PREFIXES 등
7. **ErrorCode 매핑** — 백엔드 ↔ 프론트엔드 에러 코드 매핑 완전성
8. **DTO→Entity 매핑** — `getTableColumns()` 대신 필드 목록 하드코딩
9. **CSS easing** — `ease-[cubic-bezier(...)]` 대신 CSS 변수/TRANSITION_PRESETS
10. **페이지네이션 매직넘버** — `.limit(20)` 대신 SSOT 상수

> **임포트 소스 검증은 `/verify-ssot`에서 수행합니다.**

## When to Run

- 새로운 API 클라이언트 함수를 추가한 후
- 캐시 키를 사용하는 서비스를 추가/수정한 후
- 환경변수를 참조하는 코드를 추가한 후
- 프론트엔드 목록/검색 기능을 구현한 후

## Related Files

| File | Purpose |
|---|---|
| `apps/frontend/lib/api/query-config.ts` | queryKeys 팩토리 |
| `apps/frontend/lib/config/api-config.ts` | SSOT API_BASE_URL |
| `apps/frontend/lib/config/pagination.ts` | PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE |
| `apps/frontend/lib/errors/equipment-errors.ts` | ErrorCode ↔ EquipmentErrorCode 매핑 |
| `apps/backend/src/common/cache/cache-key-prefixes.ts` | CACHE_KEY_PREFIXES SSOT |
| `apps/backend/src/modules/equipment/utils/request-data-codec.ts` | requestData 코덱 |
| `packages/shared-constants/src/auth-token.ts` | 토큰 TTL SSOT |
| `packages/shared-constants/src/business-rules.ts` | 비즈니스 규칙 상수 SSOT |
| `packages/shared-constants/src/pagination.ts` | 페이지네이션 상수 SSOT |
| `packages/schemas/src/validation/messages.ts` | VM SSOT |
| `apps/frontend/lib/api/utils/response-transformers.ts` | unwrapResponseData SSOT |
| `apps/backend/src/common/base/versioned-base.service.ts` | VERSION_CONFLICT_MESSAGE SSOT |
| `packages/shared-constants/src/form-catalog.ts` | FORM_CATALOG SSOT (양식 번호, 이름, 보존기간) |
| `apps/frontend/lib/utils/file-url.ts` | fetchStorageFileUrl — FILES.SERVE + arraybuffer 분기 |
| `apps/frontend/components/shared/StorageImage.tsx` | StorageImage — queryKeys.storageFiles SSOT 사용 |
| `packages/shared-constants/src/api-endpoints.ts` | FILES.SERVE SSOT (`/api/files`) |
| `packages/shared-constants/src/qr-config.ts` | QR_CONFIG/LABEL_CONFIG/getLabelCellDimensions SSOT (QR 생성 + 라벨 PDF 레이아웃) |

## Workflow

각 Step의 bash 명령어, 코드 예시: [references/step-details.md](references/step-details.md) 참조

### Step 1: 하드코딩된 API 경로

**PASS:** API 클라이언트에서 `API_ENDPOINTS` 외 경로 0개. **FAIL:** 문자열 직접 사용.

### Step 2: queryKeys 팩토리 사용

**PASS:** 모든 queryKey가 `queryKeys` 팩토리 사용. **FAIL:** `queryKey: ['equipment', 'detail']` 하드코딩.

### Step 3: Promise<unknown> 반환 타입

**PASS:** public 서비스 메서드에 `Promise<unknown>` 0개. **FAIL:** 타입 명시 필요.

### Step 4: 환경변수 직접 참조 + (4b) E2E Backend URL

**PASS:** `api-config.ts`/`tests/e2e` 제외 `process.env.NEXT_PUBLIC_API_URL` 0개.

### Step 5: 토큰 TTL 하드코딩

**PASS:** auth 파일에 `15m`, `7d`, 계산식 하드코딩 0개. SSOT: `packages/shared-constants/src/auth-token.ts`.

### Step 6-7: SITE_VALUES / PAGE_SIZE_OPTIONS 로컬 재정의

**PASS:** SSOT 파일 외 직접 선언 0개.

### Step 8: CACHE_KEY_PREFIXES SSOT

**PASS:** 서비스/헬퍼에서 하드코딩 캐시 키 프리픽스 0개.

### Step 9: APPROVAL_KPI 임계값 + (9b) 리포트 상수

**PASS:** SSOT 파일 외 직접 선언 0개. 매직넘버 직접 사용 0개.

### Step 10: ErrorCode ↔ 프론트엔드 매핑

**PASS:** `ErrorCode` 주요 값이 `mapBackendErrorCode`에 매핑됨.

### Step 11: DTO→Entity 동적 매핑

**PASS:** `getTableColumns()` 기반. **FAIL:** 하드코딩 필드 배열.

### Step 12: requestData 코덱

**PASS:** `equipment-approval.service.ts`에 `JSON.parse/stringify` 직접 호출 0개.

### Step 13: DTO 검증 메시지 VM SSOT + (13b) Test User Email

**PASS:** DTO에 하드코딩 한국어 메시지 0개. E2E에 이메일 리터럴 0개.

### Step 14: CALIBRATION_THRESHOLDS

**PASS:** 교정 임계값(30, 7) 매직넘버 0개. SSOT: `CALIBRATION_THRESHOLDS.*`.

### Step 15: VERSION_CONFLICT SSOT

**PASS:** `createVersionConflictException()` 헬퍼 사용. 인라인 ConflictException 0개.

### Step 16: CSS easing 하드코딩

**PASS:** `ease-[cubic-bezier(...)]` 0개. `ease-[var(--ease-*)]` 또는 TRANSITION_PRESETS 사용.

### Step 17: 페이지네이션 매직넘버

**PASS:** `.limit(숫자)` 0개 (`.limit(1)` 제외). SSOT 상수 사용.

### Step 18: unwrapResponseData SSOT

**PASS:** 3개 API 클라이언트 모두 `unwrapResponseData` 사용. `return response.data` 직접 반환 0개.

### Step 19: FORM_CATALOG 양식 번호 SSOT

**PASS:** 양식 번호(`UL-QP-18-XX`, `UL-QP-19-XX`)가 `FORM_CATALOG` 상수로 참조. **FAIL:** 문자열 직접 사용.

### Step 21: QR/라벨 설정 하드코딩

`packages/shared-constants/src/qr-config.ts`가 QR 코드 생성 및 라벨 PDF 레이아웃의 SSOT. 인라인 매직넘버 금지.

```bash
# generate-label-pdf.ts/worker.ts 에서 QR_CONFIG/LABEL_CONFIG 미경유 매직넘버 직접 할당 탐지
# SSOT-destructured 변수(cell., pdf.)를 통한 접근은 정상이므로 제외
grep -n "errorCorrectionLevel\s*[:=]\s*['\"]" \
  apps/frontend/lib/qr/generate-label-pdf.ts \
  apps/frontend/lib/qr/generate-label-pdf.worker.ts \
  2>/dev/null \
  | grep -v "QR_CONFIG\|LABEL_CONFIG\|qr-config"
grep -n "qrSizeMm\s*[:=]\s*[0-9]\|cols\s*[:=]\s*[0-9]\|rows\s*[:=]\s*[0-9]\|pageWidthMm\s*[:=]\s*[0-9]\|maxBatch\s*[:=]\s*[0-9]\|qrForegroundColor\s*[:=]\s*['\"\`]\|qrBackgroundColor\s*[:=]\s*['\"\`]\|cellBackgroundColor\s*[:=]\s*['\"\`]\|qrModuleOverlapPx\s*[:=]\s*[0-9]\|mgmtMinFontPt\s*[:=]\s*[0-9]\|nameMinFontPt\s*[:=]\s*[0-9]\|serialMinFontPt\s*[:=]\s*[0-9]\|nameMaxLines\s*[:=]\s*[0-9]\|lineHeightRatio\s*[:=]\s*[0-9]\|mgmtFontPt\s*[:=]\s*[0-9]\|nameFontPt\s*[:=]\s*[0-9]\|serialFontPt\s*[:=]\s*[0-9]\|fieldLabelFontPt\s*[:=]\s*[0-9]" \
  apps/frontend/lib/qr/generate-label-pdf.ts \
  apps/frontend/lib/qr/generate-label-pdf.worker.ts \
  2>/dev/null \
  | grep -v "QR_CONFIG\|LABEL_CONFIG\|qr-config\|// \|* "
```

**PASS:** 빈 출력. **FAIL:** `errorCorrectionLevel: 'H'`, `cols: 3`, `qrSizeMm: 25`, `mgmtMinFontPt: 8`, `nameMaxLines: 2` 등 하드코딩 리터럴 할당.

**예외**: `qr-config.ts` 자체, SSOT에서 destructure한 변수를 통한 속성 접근(`cell.qrSizeMm`, `pdf.cols`)은 SSOT-compliant.

### Step 20: 파일 확장자/MIME 타입 SSOT

**탐지 명령어:**
```bash
rg "\.xlsx|\.docx" apps/frontend/lib/api/ --type ts -n | grep -v "node_modules\|\.d\.ts" | grep -v "import\|require\|Content-Type"
```

**PASS:** 파일 확장자(`.xlsx`, `.docx`)가 서버 Content-Disposition 또는 FORM_CATALOG 기반으로 결정됨. **FAIL:** 프론트엔드에서 확장자 배열(`XLSX_FORMS = [...]` 등) 하드코딩하여 서버 반환 형식과 불일치 발생 가능.

## Output Format

```markdown
| #   | 검사                          | 상태      | 상세                                   |
| --- | ----------------------------- | --------- | -------------------------------------- |
| 1   | 하드코딩 API 경로             | PASS/FAIL | 하드코딩 위치 목록                     |
| 2   | queryKeys 팩토리              | PASS/FAIL | 하드코딩 queryKey 위치                 |
| 3   | Promise<unknown> 반환 타입    | PASS/FAIL | unknown 반환 위치                      |
| 4   | 환경변수 직접 참조            | PASS/FAIL | 직접 참조 위치                         |
| 4b  | E2E Backend URL SSOT          | PASS/FAIL | 직접 env 참조 파일                     |
| 5   | 토큰 TTL 하드코딩             | PASS/FAIL | 하드코딩 위치                          |
| 6   | SITE_VALUES 로컬 재정의       | PASS/FAIL | 로컬 선언 위치                         |
| 7   | PAGE_SIZE_OPTIONS 로컬 재정의 | PASS/FAIL | 직접 선언 위치                         |
| 8   | CACHE_KEY_PREFIXES SSOT       | PASS/FAIL | 하드코딩 캐시 키 위치                  |
| 9   | APPROVAL_KPI 임계값           | PASS/FAIL | 하드코딩 임계값 위치                   |
| 10  | ErrorCode↔프론트엔드 매핑    | PASS/FAIL | 누락된 매핑 목록                       |
| 11  | DTO→Entity 동적 매핑          | PASS/FAIL | 하드코딩 필드 목록 위치                |
| 12  | requestData 코덱              | PASS/FAIL | 직접 JSON.parse 위치                   |
| 13  | DTO 검증 메시지 VM SSOT       | PASS/FAIL | 하드코딩 한국어 메시지 위치            |
| 13b | Test User Email SSOT          | PASS/FAIL | 하드코딩 이메일 위치                   |
| 14  | CALIBRATION_THRESHOLDS        | PASS/FAIL | 매직넘버 위치                          |
| 15  | VERSION_CONFLICT 일관성       | PASS/FAIL | SSOT 불일치 서비스                     |
| 16  | CSS easing 하드코딩           | PASS/FAIL | ease-[cubic-bezier] 위치               |
| 17  | 페이지네이션 매직넘버         | PASS/FAIL | .limit(숫자) 위치                      |
| 18  | unwrapResponseData SSOT       | PASS/FAIL | 인라인 래핑 해제 위치                  |
| 19  | FORM_CATALOG 양식 번호 SSOT   | PASS/FAIL | 하드코딩 양식 번호 위치                |
| 20  | 파일 확장자/MIME 타입 SSOT    | PASS/FAIL | 하드코딩 확장자 배열 위치              |
```

## Exceptions

1. **프론트엔드 UI 표시용 옵션 객체** — `SITE_OPTIONS` 등 레이블+값 쌍은 로컬 정의 허용
2. **테스트 파일의 날짜 오프셋 계산** — E2E/단위 테스트 날짜 계산은 토큰 TTL과 무관
3. **`shared-test-data.ts`의 `BACKEND` URL** — E2E 테스트용 URL SSOT
4. **`Promise<unknown>` private 헬퍼** — 클래스 내부 전용은 면제
5. **response DTO의 ApiResponse 재사용** — 응답 타입 정의에서 래핑 정상
6. **`primitives.ts`의 JSDoc 주석** — easing SSOT 정의 문서 면제
7. **`.limit(1)` 단일 레코드 조회** — 페이지네이션이 아닌 단건 조회 면제
8. **백엔드 서비스 서버사이드 역할 레이블** — `audit.service.ts formatLogMessage()` 및 `reports.service.ts` 보고서 행 생성에서 `AuditLogUserRole` 특수값(`'system'`, `'unknown'`)에 대한 `'시스템'`, `'알 수 없음'` 한국어 레이블 직접 사용은 허용. 백엔드 텍스트 생성 전용이며 브라우저 i18n 시스템을 경유할 수 없음. `USER_ROLE_LABELS`가 커버하지 않는 특수값이므로 인라인 처리가 정상 설계.
