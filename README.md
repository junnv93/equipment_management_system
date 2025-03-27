# 장비 관리 시스템: MySQL에서 PostgreSQL로 마이그레이션

이 프로젝트는 기존 MySQL 데이터베이스를 사용하던 장비 관리 시스템을 PostgreSQL로 마이그레이션하는 과정을 안내합니다.

## 개요

- MySQL에서 PostgreSQL로 데이터 마이그레이션
- Drizzle ORM을 사용한 데이터베이스 스키마 마이그레이션
- 백엔드 애플리케이션 설정 변경

## 사전 요구사항

- Node.js 18 이상
- pnpm 패키지 매니저
- MySQL 서버 (원본 데이터)
- PostgreSQL 서버 (대상 데이터베이스)
- TypeScript 지원

## 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/your-org/equipment-management.git
cd equipment-management
```

2. 의존성 설치
```bash
pnpm install
```

3. 환경 변수 설정
`.env` 파일을 수정하여 MySQL 및 PostgreSQL 연결 정보를 입력합니다.
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

## 마이그레이션 실행

다음 명령어로 마이그레이션을 실행합니다:

```bash
pnpm run migrate
```

이 명령은 다음 작업을 수행합니다:
1. MySQL 데이터베이스에서 데이터 추출
2. PostgreSQL 스키마 생성
3. PostgreSQL 데이터베이스로 데이터 이전
4. 검증 및 로그 기록

## 마이그레이션 후 단계

1. 백엔드 애플리케이션 설정 업데이트
- `apps/backend/.env` 파일의 데이터베이스 연결 정보 변경

2. 애플리케이션 재시작
```bash
pnpm run dev
```

## 문제 해결

마이그레이션 중 문제가 발생하면 다음을 확인하세요:

1. 데이터베이스 연결 정보가 올바른지 확인
2. MySQL 및 PostgreSQL 서버가 실행 중인지 확인
3. 로그에서 구체적인 오류 메시지 확인

## 라이선스

이 프로젝트는 ISC 라이선스를 따릅니다. 