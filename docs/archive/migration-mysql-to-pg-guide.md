# MySQL에서 PostgreSQL로 마이그레이션 가이드

이 문서는 장비 관리 시스템의 데이터베이스를 MySQL에서 PostgreSQL로 마이그레이션하는 과정을 안내합니다.

## 마이그레이션 준비

### 사전 요구사항

1. PostgreSQL 서버 설치 (v12 이상 권장)
2. Node.js 18 이상 및 pnpm 패키지 매니저
3. 기존 MySQL 데이터베이스에 접근 권한
4. PostgreSQL 관리자 권한

### 환경 설정

1. PostgreSQL 데이터베이스 생성:

```sql
CREATE DATABASE equipment_management;
```

2. `.env` 파일의 데이터베이스 연결 정보 확인:

```
# MySQL 설정 (기존 데이터베이스)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=equipment_management

# PostgreSQL 설정 (새 데이터베이스)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=equipment_management
```

## 마이그레이션 실행 단계

### 1. 의존성 설치

프로젝트 루트 디렉토리에서:

```bash
pnpm install
```

### 2. 데이터 마이그레이션 실행

데이터 마이그레이션을 실행합니다:

```bash
pnpm run migrate
```

이 명령은 다음 작업을 수행합니다:

- MySQL 데이터베이스에서 데이터 추출
- PostgreSQL 스키마 생성
- PostgreSQL 데이터베이스로 데이터 이전

### 3. 백엔드 애플리케이션 재시작

마이그레이션 후 백엔드 애플리케이션을 재시작합니다:

```bash
cd apps/backend
pnpm run start:dev
```

### 4. 마이그레이션 검증

다음 단계를 통해 마이그레이션이 올바르게 완료되었는지 확인합니다:

1. 백엔드 API 엔드포인트가 정상적으로 작동하는지 확인
2. 프론트엔드 애플리케이션이 데이터를 올바르게 표시하는지 확인
3. 주요 기능이 정상적으로 작동하는지 테스트

## 마이그레이션 후 정리

모든 것이 정상적으로 작동하는 것을 확인한 후:

1. 필요한 경우 MySQL 데이터베이스 백업 생성
2. 백엔드 애플리케이션 설정이 PostgreSQL을 가리키는지 확인
3. 불필요한 마이그레이션 관련 파일 제거 (선택 사항)

## 문제 해결

### 마이그레이션 실패 시

1. 에러 로그 확인
2. 데이터베이스 연결 정보 및 권한 확인
3. 필요한 경우 다음 명령으로 PostgreSQL 스키마 직접 적용:

```bash
cd apps/backend
pnpm run db:push
```

### 데이터 불일치 문제

1. 데이터 일관성 검사 쿼리 실행
2. 필요한 경우 부분 마이그레이션 재실행

## 롤백 계획

마이그레이션에 문제가 발생하면 다음 단계를 따릅니다:

1. 백엔드 연결 설정을 MySQL로 되돌리기:
   - `apps/backend/.env` 파일에서 데이터베이스 연결 정보를 원래대로 변경

2. 애플리케이션 재시작:

```bash
cd apps/backend
pnpm run start:dev
```
