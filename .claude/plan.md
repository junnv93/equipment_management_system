# 문서 관리 시스템 (Document Management) 구현 계획

## 설계 철학

기존 파일 관리의 파편화(calibrations.certificatePath + equipment_attachments)를 **통합 documents 테이블**로 일원화하여, 다운로드/해시/버전관리/Presigned URL 로직을 SSOT로 구현합니다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|---|---|---|
| DB 설계 | **통합 `documents` 테이블** | 다운로드/해시/버전관리 로직이 문서 유형 무관하게 동일. 중복 로직 제거 |
| 마이그레이션 | **equipment_attachments + certificatePath 모두 이전** | 기존 테이블을 deprecated 처리 후 점진적 제거. 이중 관리 부담 조기 해소 |
| Presigned URL | **업로드: 서버 프록시 유지 / 다운로드: Presigned URL** | 업로드 시 서버에서 해시 계산·검증이 필수. pending 상태 관리 불필요. 다운로드만 S3 직접 전달 |
| FileUploadService | **common 모듈로 승격** | equipment 모듈 종속 제거. 모든 모듈에서 DI 가능 |

## 구현 Phase (6단계)

---

### Phase 1: FileUploadService를 common으로 이동

**목표:** 파일 업로드 서비스의 모듈 종속 제거

**변경 파일:**
1. `apps/backend/src/common/file-upload/file-upload.service.ts` — 새 위치 (이동)
2. `apps/backend/src/common/file-upload/file-upload.module.ts` — 새 `@Global()` 모듈
3. `apps/backend/src/modules/equipment/equipment.module.ts` — FileUploadService provider/export 제거
4. `apps/backend/src/modules/calibration/calibration.controller.ts` — import 경로 변경
5. `apps/backend/src/modules/equipment/services/equipment-attachment.service.ts` — import 경로 변경
6. `apps/backend/src/app.module.ts` — FileUploadModule import 추가

**검증:** `pnpm --filter backend run tsc --noEmit`

---

### Phase 2: documents 테이블 + SHA-256 해시 + DocumentType SSOT

**목표:** 통합 문서 테이블 생성, 파일 해시 저장 인프라

**2-1. SSOT 타입 정의**

`packages/schemas/src/document.ts` (신규):
```typescript
export const DOCUMENT_TYPE_VALUES = [
  'calibration_certificate',  // 교정성적서
  'raw_data',                 // 원시 데이터 (엑셀 등)
  'inspection_report',        // 검수보고서
  'history_card',             // 이력카드
  'other',                    // 기타
] as const;

export const DOCUMENT_STATUS_VALUES = [
  'active',     // 활성 (최신 버전)
  'superseded', // 대체됨 (이전 버전)
  'deleted',    // 논리 삭제
] as const;
```

`packages/schemas/src/index.ts` — export 추가

**2-2. DB 스키마**

`packages/db/src/schema/documents.ts` (신규):
```
documents
├── id                  uuid PK
├── equipment_id        uuid FK → equipment (nullable, onDelete: cascade)
├── calibration_id      uuid FK → calibrations (nullable, onDelete: cascade)
├── request_id          uuid FK → equipment_requests (nullable, onDelete: cascade)
├── document_type       varchar(50) NOT NULL  -- SSOT: DOCUMENT_TYPE_VALUES
├── status              varchar(20) NOT NULL DEFAULT 'active'  -- SSOT: DOCUMENT_STATUS_VALUES
├── file_name           varchar(255) NOT NULL  -- UUID 기반 저장 파일명
├── original_file_name  varchar(255) NOT NULL  -- 사용자 원본 파일명
├── file_path           text NOT NULL          -- 스토리지 키
├── file_size           bigint NOT NULL
├── mime_type           varchar(100) NOT NULL
├── file_hash           varchar(64)            -- SHA-256 hex (신규 업로드 필수)
├── revision_number     integer NOT NULL DEFAULT 1
├── parent_document_id  uuid FK → documents (nullable, self-ref)
├── description         text
├── uploaded_by         uuid FK → users (nullable, onDelete: set null)
├── uploaded_at         timestamp NOT NULL DEFAULT now()
├── created_at          timestamp NOT NULL DEFAULT now()
├── updated_at          timestamp NOT NULL DEFAULT now()
```

인덱스:
- `documents_equipment_id_idx` (equipment_id)
- `documents_calibration_id_idx` (calibration_id)
- `documents_request_id_idx` (request_id)
- `documents_document_type_idx` (document_type)
- `documents_parent_document_id_idx` (parent_document_id)
- `documents_calibration_type_idx` (calibration_id, document_type)  -- 교정별 문서 유형 조회
- `documents_status_idx` (status) WHERE status = 'active'  -- 활성 문서 빠른 조회

**2-3. FileUploadService에 SHA-256 해시 추가**

`saveFile()` 반환값에 `fileHash: string` 추가:
```typescript
const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
```

**2-4. DocumentService (신규)**

`apps/backend/src/common/file-upload/document.service.ts`:
- `createDocument(file, options)` — 파일 저장 + 해시 계산 + DB INSERT
- `findById(id)` — 단일 조회
- `findByCalibrationId(calibrationId, type?)` — 교정별 문서 목록
- `findByEquipmentId(equipmentId, type?)` — 장비별 문서 목록
- `deleteDocument(id)` — 논리 삭제 (status → 'deleted')
- `verifyIntegrity(id)` — SHA-256 비교

**검증:** `pnpm --filter backend run tsc --noEmit`, 마이그레이션 SQL 실행

---

### Phase 3: 교정성적서 1:N 확장 + 데이터 마이그레이션

**목표:** calibrations.certificatePath → documents 테이블 전환, 복수 파일 지원

**3-1. 마이그레이션 SQL**

```sql
-- 기존 certificatePath → documents 테이블로 이전
INSERT INTO documents (calibration_id, document_type, file_name, original_file_name,
                       file_path, file_size, mime_type, status, uploaded_at)
SELECT c.id, 'calibration_certificate',
       split_part(c.certificate_path, '/', array_length(string_to_array(c.certificate_path, '/'), 1)),
       split_part(c.certificate_path, '/', array_length(string_to_array(c.certificate_path, '/'), 1)),
       c.certificate_path, 0, 'application/pdf', 'active', c.created_at
FROM calibrations c
WHERE c.certificate_path IS NOT NULL AND c.certificate_path != '';

-- equipment_attachments → documents 테이블로 이전
INSERT INTO documents (equipment_id, request_id, document_type, file_name, original_file_name,
                       file_path, file_size, mime_type, description, status, uploaded_at)
SELECT ea.equipment_id, ea.request_id,
       ea.attachment_type::text,  -- pgEnum → varchar
       ea.file_name, ea.original_file_name,
       ea.file_path, ea.file_size, ea.mime_type, ea.description, 'active', ea.uploaded_at
FROM equipment_attachments ea;

-- calibrations.certificate_path는 deprecated 처리 (즉시 삭제하지 않음)
COMMENT ON COLUMN calibrations.certificate_path IS 'DEPRECATED: Use documents table';
```

**3-2. API 엔드포인트 변경**

`POST /api/calibration/:uuid/documents` — 복수 파일 업로드 (성적서 PDF + 원시데이터 xlsx)
`GET /api/calibration/:uuid/documents` — 교정별 문서 목록
`DELETE /api/documents/:id` — 문서 삭제

`API_ENDPOINTS` 추가:
```typescript
CALIBRATIONS: {
  ...existing,
  DOCUMENTS: (id: string) => `/api/calibration/${id}/documents`,
}
DOCUMENTS: {
  BASE: '/api/documents',
  DETAIL: (id: string) => `/api/documents/${id}`,
  DOWNLOAD: (id: string) => `/api/documents/${id}/download`,
  VERIFY: (id: string) => `/api/documents/${id}/verify`,
  REVISIONS: (id: string) => `/api/documents/${id}/revisions`,
}
```

**3-3. 백엔드 CalibrationController 변경**

- 기존 `POST :uuid/certificate` → deprecated 처리 (하위 호환 유지)
- 신규 `POST :uuid/documents` → DocumentService 사용, 복수 파일 + documentType 배열
- `GET :uuid/documents` → DocumentService.findByCalibrationId()

**3-4. EquipmentAttachmentService → DocumentService 위임**

EquipmentAttachmentService 내부 구현을 DocumentService로 위임하되, 외부 인터페이스 유지 (점진적 전환).

**3-5. 프론트엔드**

- `lib/api/document-api.ts` (신규) — 통합 문서 API 클라이언트
- `calibration-api.ts` — `uploadDocuments()`, `getDocuments()` 추가
- `CalibrationHistoryTab.tsx` — 복수 문서 표시 (성적서 + 원시데이터)
- `queryKeys` — `documents` 키 팩토리 추가

**검증:** tsc --noEmit, 마이그레이션, 교정 상세 페이지에서 복수 파일 업로드/조회

---

### Phase 4: 파일 다운로드 API

**목표:** 범용 다운로드 엔드포인트 + 무결성 검증

**4-1. DocumentsModule (신규)**

`apps/backend/src/modules/documents/`
- `documents.module.ts`
- `documents.controller.ts`

**4-2. 엔드포인트**

```
GET /api/documents/:id/download
  Auth: 소유 엔티티 기반 동적 권한 검증
        - equipment_id 있으면 → Permission.VIEW_EQUIPMENT
        - calibration_id 있으면 → Permission.VIEW_CALIBRATIONS
  Response: binary stream + Content-Disposition + X-File-Hash
  @SkipResponseTransform() — 바이너리 응답
  @AuditLog({ action: 'download', entityType: 'document' })

GET /api/documents/:id/verify
  Auth: 동일
  Response: { valid: boolean, expectedHash: string, actualHash: string }
```

**4-3. 프론트엔드**

- `CalibrationHistoryTab.tsx` — `<a href={certificatePath}>` → 다운로드 API 링크로 변경
- `AttachmentsTab.tsx` — 실제 데이터 표시 + 다운로드 버튼 구현
- `document-api.ts` — `downloadDocument()`, `verifyDocument()` 추가

**검증:** 교정성적서 다운로드, 장비 첨부파일 다운로드, 해시 검증 API 호출

---

### Phase 5: 문서 버전 관리

**목표:** 같은 문서의 개정 이력 추적

**5-1. DB** — Phase 2에서 이미 `revision_number`, `parent_document_id`, `status` 컬럼 포함

**5-2. DocumentService 메서드 추가**

```typescript
createRevision(parentDocumentId, file, uploadedBy, description):
  1. parentDoc = findById(parentDocumentId)
  2. db.transaction:
     a. UPDATE documents SET status = 'superseded' WHERE id = parentDocumentId
     b. INSERT documents (parent_document_id, revision_number = parent + 1, status = 'active', ...)
  3. return newDocument

getRevisionHistory(documentId):
  1. CTE로 parent_document_id 체인 재귀 추적
  2. revision_number DESC 정렬 반환
```

**5-3. 엔드포인트**

```
POST /api/documents/:id/revisions — 새 개정판 업로드
GET /api/documents/:id/revisions — 개정 이력 조회
```

**5-4. 프론트엔드**

- 문서 목록에서 revision_number > 1이면 "개정 이력" 버튼 표시
- 개정 이력 다이얼로그 — 버전 목록 + 각 버전 다운로드
- "개정판 업로드" 버튼 — 기존 문서 ID 기반

**검증:** 개정판 업로드 → 이전 버전 superseded 확인 → 이력 조회

---

### Phase 6: Presigned URL (다운로드 전용)

**목표:** S3 드라이버 사용 시 다운로드 성능 최적화

**6-1. 의존성 설치**

```bash
pnpm --filter backend add @aws-sdk/s3-request-presigner
```

**6-2. IStorageProvider 인터페이스 확장**

```typescript
interface IStorageProvider {
  // 기존 유지
  ensureContainer(): Promise<void>;
  upload(key: string, body: Buffer, contentType: string): Promise<void>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  // 신규
  supportsPresignedUrl(): boolean;
  getPresignedDownloadUrl?(key: string, originalFileName: string, expiresIn?: number): Promise<string>;
}
```

**6-3. 구현체**

- `LocalStorageProvider`: `supportsPresignedUrl() → false`
- `S3StorageProvider`: `supportsPresignedUrl() → true`, `getPresignedDownloadUrl()` 구현

**6-4. 다운로드 엔드포인트 분기**

`DocumentsController.download()`:
```
if (storageProvider.supportsPresignedUrl()) {
  const url = await storageProvider.getPresignedDownloadUrl(doc.filePath, doc.originalFileName);
  return res.redirect(url);  // 302 리다이렉트
} else {
  // 기존 서버 프록시 다운로드
  const buffer = await fileUploadService.readFile(doc.filePath);
  res.send(buffer);
}
```

**6-5. 프론트엔드** — 변경 없음 (서버가 자동으로 리다이렉트 처리)

**검증:** S3 환경에서 다운로드 시 presigned URL 리다이렉트 확인

---

## 전체 변경 파일 요약

### 신규 생성
| 파일 | 목적 |
|---|---|
| `packages/schemas/src/document.ts` | DocumentType, DocumentStatus SSOT |
| `packages/db/src/schema/documents.ts` | documents 테이블 스키마 |
| `apps/backend/src/common/file-upload/file-upload.module.ts` | Global 파일 업로드 모듈 |
| `apps/backend/src/common/file-upload/document.service.ts` | 통합 문서 서비스 |
| `apps/backend/src/modules/documents/documents.module.ts` | 문서 모듈 |
| `apps/backend/src/modules/documents/documents.controller.ts` | 다운로드/검증/버전 엔드포인트 |
| `apps/backend/drizzle/manual/YYYYMMDD_create_documents_table.sql` | 마이그레이션 |
| `apps/frontend/lib/api/document-api.ts` | 프론트엔드 문서 API 클라이언트 |

### 수정
| 파일 | 변경 내용 |
|---|---|
| `packages/schemas/src/index.ts` | document export 추가 |
| `packages/db/src/schema/index.ts` | documents export 추가 |
| `packages/shared-constants/src/api-endpoints.ts` | DOCUMENTS 엔드포인트 그룹 추가 |
| `apps/backend/src/common/storage/storage.interface.ts` | presigned URL 메서드 추가 |
| `apps/backend/src/common/storage/s3-storage.provider.ts` | presigned 구현 |
| `apps/backend/src/common/storage/local-storage.provider.ts` | supportsPresignedUrl() false |
| `apps/backend/src/common/file-upload/file-upload.service.ts` | SHA-256 해시 추가 + common 이동 |
| `apps/backend/src/modules/equipment/equipment.module.ts` | FileUploadService 제거 |
| `apps/backend/src/modules/calibration/calibration.controller.ts` | 복수 문서 업로드 엔드포인트 |
| `apps/backend/src/app.module.ts` | FileUploadModule, DocumentsModule import |
| `apps/frontend/lib/api/calibration-api.ts` | uploadDocuments, getDocuments |
| `apps/frontend/lib/api/query-config.ts` | documents queryKeys |
| `apps/frontend/components/equipment/CalibrationHistoryTab.tsx` | 다운로드 링크 + 복수 문서 |
| `apps/frontend/components/equipment/AttachmentsTab.tsx` | 실제 데이터 표시 구현 |

### Deprecated (추후 제거)
| 대상 | 시점 |
|---|---|
| `calibrations.certificate_path` 컬럼 | 3개월 후 DROP |
| `equipment_attachments` 테이블 | 전체 전환 완료 후 DROP |
| `POST /api/calibration/:uuid/certificate` | 프론트엔드 전환 완료 후 제거 |
