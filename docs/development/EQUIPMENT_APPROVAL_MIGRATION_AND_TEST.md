# 장비 승인 프로세스 마이그레이션 및 테스트 가이드

## 마이그레이션 파일

### 생성된 마이그레이션

- **파일**: `apps/backend/drizzle/0010_add_equipment_approval_system.sql`
- **내용**:
  1. Enum 타입 생성 (approval_status, request_type, attachment_type)
  2. equipment 테이블에 승인 관련 필드 추가
  3. equipment 테이블에 추가 필수 필드 추가
  4. equipment_requests 테이블 생성
  5. equipment_attachments 테이블 생성
  6. 인덱스 및 외래 키 제약 조건 추가

### 마이그레이션 실행 방법

#### 방법 1: 자동 마이그레이션 (권장)

```bash
cd apps/backend
pnpm db:migrate
```

#### 방법 2: 수동 마이그레이션 스크립트

```bash
cd apps/backend
npx ts-node scripts/run-migration-0010.ts
```

#### 방법 3: 직접 SQL 실행

```bash
psql -U postgres -d equipment_management -f apps/backend/drizzle/0010_add_equipment_approval_system.sql
```

### 마이그레이션 검증

마이그레이션이 성공적으로 적용되었는지 확인:

```sql
-- Enum 타입 확인
SELECT typname FROM pg_type WHERE typname IN ('approval_status', 'request_type', 'attachment_type');

-- 테이블 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('equipment_requests', 'equipment_attachments');

-- equipment 테이블 필드 확인
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'equipment'
AND column_name IN ('approval_status', 'requested_by', 'approved_by', 'equipment_type', 'calibration_result', 'correction_factor', 'intermediate_check_schedule', 'repair_history');
```

## 테스트 실행

### E2E 테스트 실행

```bash
cd apps/backend
pnpm test:e2e equipment-approval
```

### 전체 테스트 실행

```bash
cd apps/backend
pnpm test:e2e
```

### 테스트 커버리지 확인

```bash
cd apps/backend
pnpm test:e2e:cov
```

## 테스트 시나리오

### 1. 장비 등록 요청 프로세스

- ✅ 시험실무자가 장비 등록 요청 제출
- ✅ 시스템 관리자가 직접 승인 가능

### 2. 승인 대기 요청 목록 조회

- ✅ 기술책임자가 승인 대기 목록 조회
- ✅ 시험실무자는 조회 불가 (권한 없음)

### 3. 요청 승인/반려

- ✅ 기술책임자가 요청 승인
- ✅ 기술책임자가 요청 반려 (반려 사유 필수)

### 4. 파일 업로드

- ✅ 파일 업로드 성공
- ✅ 파일 크기 제한 검증 (10MB 초과 시 실패)
- ✅ 파일 형식 제한 검증 (허용되지 않은 형식 시 실패)

### 5. 장비 수정/삭제 요청

- ✅ 시험실무자가 수정 요청 제출
- ✅ 시험실무자가 삭제 요청 제출
- ✅ 시스템 관리자가 직접 처리 가능

### 6. 필수 필드 검증

- ✅ 필수 필드 누락 시 등록 실패
- ✅ 추가 필수 필드 포함 시 등록 성공

## 주의사항

### 데이터베이스 연결

- 테스트 실행 전 데이터베이스가 실행 중이어야 합니다
- 테스트용 데이터베이스는 별도로 구성하는 것을 권장합니다

### 환경 변수

테스트 실행 전 다음 환경 변수가 설정되어 있어야 합니다:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/equipment_management
UPLOAD_DIR=./test-uploads
JWT_SECRET=test-jwt-secret-key-for-e2e-tests-minimum-32-characters-long
NEXTAUTH_SECRET=test-nextauth-secret-key-for-e2e-tests-minimum-32-characters-long
```

### 테스트 데이터 정리

- 테스트는 자동으로 생성된 데이터를 정리합니다
- 테스트 실패 시 수동으로 정리해야 할 수 있습니다

## 문제 해결

### 마이그레이션 실패 시

1. 마이그레이션 파일의 SQL 문법 확인
2. 데이터베이스 연결 확인
3. 기존 테이블/컬럼 존재 여부 확인

### 테스트 실패 시

1. 데이터베이스 연결 확인
2. 테스트 사용자 인증 확인
3. 권한 설정 확인
4. 파일 업로드 디렉토리 권한 확인

## 다음 단계

1. ✅ 마이그레이션 파일 생성 완료
2. ✅ E2E 테스트 작성 완료
3. ⏳ 마이그레이션 실행 (데이터베이스 연결 필요)
4. ⏳ 테스트 실행 및 검증 (데이터베이스 연결 필요)

실제 데이터베이스가 준비되면 위의 명령어로 마이그레이션과 테스트를 실행할 수 있습니다.
