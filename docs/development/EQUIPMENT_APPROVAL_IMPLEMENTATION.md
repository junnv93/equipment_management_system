# 장비 등록/수정/삭제 승인 프로세스 구현 완료 보고서

## 개요

프롬프트 3의 요구사항에 따라 장비 등록/수정/삭제 승인 프로세스(2단계)를 구현했습니다.

## 구현 완료 사항

### 1. 데이터베이스 스키마 확장 ✅

#### equipment 테이블 확장

- `approvalStatus`: 승인 상태 (pending_approval, approved, rejected)
- `requestedBy`: 요청자 ID
- `approvedBy`: 승인자 ID
- `equipmentType`: 장비 타입
- `calibrationResult`: 교정 결과
- `correctionFactor`: 보정계수
- `intermediateCheckSchedule`: 중간점검일정
- `repairHistory`: 장비 수리 내역

#### equipment-requests 테이블 생성

- 요청 이력을 관리하는 테이블
- 요청 타입: create, update, delete
- 승인 상태 및 반려 사유 저장
- 요청 데이터를 JSON으로 저장

#### equipment-attachments 테이블 생성

- 파일 첨부 정보를 관리하는 테이블
- 파일 타입: inspection_report (검수보고서), history_card (이력카드), other
- 파일 메타데이터 저장 (파일명, 크기, MIME 타입 등)

### 2. Zod 스키마 업데이트 ✅

- `equipment-request.ts`: 요청 스키마 추가
- `equipment-attachment.ts`: 첨부 파일 스키마 추가
- `equipment.ts`: 승인 관련 필드 및 추가 필수 필드 확장

### 3. 백엔드 서비스 구현 ✅

#### FileUploadService

- 파일 업로드 및 저장 로직
- 파일 유효성 검사 (크기, MIME 타입)
- 파일 삭제 및 읽기 기능

#### EquipmentApprovalService

- `createEquipmentRequest`: 장비 등록 요청 생성
- `updateEquipmentRequest`: 장비 수정 요청 생성
- `deleteEquipmentRequest`: 장비 삭제 요청 생성
- `findPendingRequests`: 승인 대기 요청 목록 조회
- `findRequestByUuid`: 요청 상세 조회
- `approveRequest`: 요청 승인
- `rejectRequest`: 요청 반려 (반려 사유 필수)

### 4. 컨트롤러 확장 ✅

#### EquipmentController

- `POST /equipment`: 장비 등록 요청 (파일 업로드 지원)
- `PATCH /equipment/:uuid`: 장비 수정 요청 (파일 업로드 지원)
- `DELETE /equipment/:uuid`: 장비 삭제 요청
- `GET /equipment/requests/pending`: 승인 대기 요청 목록 조회
- `GET /equipment/requests/:requestUuid`: 요청 상세 조회
- `POST /equipment/requests/:requestUuid/approve`: 요청 승인
- `POST /equipment/requests/:requestUuid/reject`: 요청 반려
- `POST /equipment/attachments`: 파일 업로드

### 5. 권한 추가 ✅

- `APPROVE_EQUIPMENT`: 장비 승인 권한
- `REJECT_EQUIPMENT`: 장비 반려 권한
- `VIEW_EQUIPMENT_REQUESTS`: 장비 요청 목록 조회 권한

## 승인 프로세스 흐름

### 시험실무자 (test_operator)

1. 장비 등록/수정/삭제 요청 제출
2. 상태: `pending_approval`
3. 파일 첨부 가능 (이력카드, 검수보고서)

### 기술책임자 (technical_manager) 또는 관리자 (site_admin)

1. 승인 대기 목록 조회
2. 요청 상세 확인 (첨부 파일 포함)
3. 승인 또는 반려 처리
   - 승인: 장비가 실제로 생성/수정/삭제됨
   - 반려: 반려 사유 필수 입력

### 시스템 관리자 (site_admin)

- 직접 승인 가능 (승인 프로세스 우회)
- `approvalStatus: 'approved'`로 설정 시 즉시 처리

## 파일 업로드 제약사항

- **파일 크기 제한**: 10MB
- **허용 파일 형식**:
  - PDF: `application/pdf`
  - 이미지: `image/jpeg`, `image/png`, `image/gif`
  - 문서: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - 스프레드시트: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

## 프론트엔드 구현 완료 ✅

### 파일 업로드 컴포넌트

- `components/shared/FileUpload.tsx`: 재사용 가능한 파일 업로드 컴포넌트
  - 드래그 앤 드롭 지원
  - 파일 크기 및 형식 검증
  - 파일 미리보기 (이미지)
  - 파일 삭제 기능

### EquipmentForm 확장

- 추가 필수 필드 추가:
  - `equipmentType`: 장비 타입
  - `calibrationResult`: 교정 결과
  - `correctionFactor`: 보정계수
  - `intermediateCheckSchedule`: 중간점검일정
  - `repairHistory`: 장비 수리 내역
- 파일 업로드 필드 추가
  - 신규 등록: 검수보고서 첨부
  - 기존 수정: 이력카드 첨부

### 페이지 업데이트

- `app/equipment/create/page.tsx`: 파일 업로드 지원 추가
- `app/equipment/[id]/edit/page.tsx`: 파일 업로드 지원 추가
- `app/admin/equipment-approvals/page.tsx`: 승인 관리 페이지 생성
  - 승인 대기 요청 목록 조회
  - 요청 상세 조회
  - 승인/반려 처리
  - 반려 사유 입력 다이얼로그

### API 클라이언트 확장

- `lib/api/equipment-api.ts`에 승인 관련 함수 추가:
  - `getPendingRequests`: 승인 대기 요청 목록 조회
  - `getRequestByUuid`: 요청 상세 조회
  - `approveRequest`: 요청 승인
  - `rejectRequest`: 요청 반려
  - `uploadAttachment`: 파일 업로드
- `createEquipment`, `updateEquipment`에 파일 업로드 지원 추가

### 훅 업데이트

- `hooks/use-equipment.ts`:
  - `useCreateEquipment`: 파일 업로드 지원 추가
  - `useUpdateEquipment`: 파일 업로드 지원 추가
  - 승인 요청 시 적절한 메시지 표시

## 남은 작업

### 데이터베이스 마이그레이션 필요

1. Drizzle 마이그레이션 파일 생성
   ```bash
   cd apps/backend
   pnpm db:generate
   pnpm db:migrate
   ```
2. 마이그레이션 내용:
   - `equipment-requests` 테이블 생성
   - `equipment-attachments` 테이블 생성
   - `equipment` 테이블에 추가 필드 마이그레이션:
     - `approval_status`, `requested_by`, `approved_by`
     - `equipment_type`, `calibration_result`, `correction_factor`
     - `intermediate_check_schedule`, `repair_history`

### 테스트 작성 필요

1. 승인 프로세스 E2E 테스트 (`apps/backend/test/equipment-approval.e2e-spec.ts`)
   - 요청 생성 테스트
   - 승인 프로세스 테스트
   - 반려 프로세스 테스트
2. 파일 업로드 테스트
   - 파일 크기 검증 테스트
   - 파일 형식 검증 테스트
   - 파일 저장 테스트
3. 필수 필드 검증 테스트

## 참고 사항

- 파일 저장은 현재 로컬 파일 시스템을 사용합니다. 프로덕션 환경에서는 Azure Blob Storage 등 외부 스토리지로 마이그레이션 권장
- 첨부 파일을 데이터베이스에 저장하는 로직은 TODO로 남겨두었습니다. `EquipmentAttachmentService`를 추가로 구현해야 합니다.
