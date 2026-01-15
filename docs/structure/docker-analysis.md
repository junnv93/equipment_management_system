# Docker 파일 분석

## 현재 Docker 설정 파일
1. `simple-backend.Dockerfile`
2. `docker/backend.Dockerfile`
3. `docker/frontend.Dockerfile`
4. `docker-compose.yml`
5. `docker-compose.prod.yml`

## 파일별 특징 및 문제점

### 1. simple-backend.Dockerfile
- **용도**: 간소화된 백엔드 Docker 설정
- **특징**: 
  - 매우 단순한 구성
  - 패키지 관리자로 npm 사용
  - 필요한 패키지만 직접 설치
- **문제점**:
  - workspace 의존성 처리 없음
  - 의존성 관리가 불완전함
  - `@nestjs/jwt`, `cookie-parser`, `compression` 등 필수 패키지만 설치

### 2. docker/backend.Dockerfile
- **용도**: 백엔드 Docker 설정
- **특징**:
  - workspace 프로토콜 처리를 위한 sed 명령어 사용
  - 누락된 패키지 추가 설치 (`@nestjs/jwt`, `cookie-parser`, `compression`, `prom-client`, `drizzle-zod`)
  - 직접 schemas 패키지 빌드 처리
- **문제점**:
  - sed 명령어를 통한 임시 해결책
  - 패키지 버전 관리가 어려움
  - 디버깅을 위한 임시 명령어 포함

### 3. docker/frontend.Dockerfile
- **용도**: 프론트엔드 Docker 설정
- **특징**:
  - workspace 프로토콜 처리를 위한 sed 명령어 사용
  - schemas 패키지 수동 복사
- **문제점**:
  - backend.Dockerfile과 동일한 문제 존재
  - 개발 모드로만 실행 가능

### 4. docker-compose.yml
- **용도**: 개발 환경 Docker Compose 설정
- **특징**:
  - PostgreSQL, Redis, Backend, Frontend 서비스 포함
  - simple-backend.Dockerfile 사용
- **문제점**:
  - 프로덕션용 설정과 불일치
  - 부분적인 서비스만 포함

### 5. docker-compose.prod.yml
- **용도**: 프로덕션 환경 Docker Compose 설정
- **특징**:
  - 모니터링 서비스(Prometheus, Grafana) 포함
  - 로깅 서비스(ELK) 포함
  - NGINX 및 Certbot 설정 포함
- **문제점**:
  - 너무 복잡하고 무거운 구성
  - 개발 환경 설정과 불일치
  - 의존성 문제 해결 방안 없음

## 단일화 및 표준화 방안

### 1. 표준 Dockerfile 작성
- `docker/backend.Dockerfile` - 백엔드 표준 Docker 설정
- `docker/frontend.Dockerfile` - 프론트엔드 표준 Docker 설정

### 2. 개발/프로덕션 환경 통합
- `docker-compose.yml` - 개발 환경 설정
- `docker-compose.prod.yml` - 프로덕션 환경 설정 (필수 서비스만 포함)
- `docker-compose.monitoring.yml` - 모니터링 서비스 설정 (선택적 사용)

### 3. 의존성 문제 해결
- 모노레포 빌드 프로세스 개선
- workspace 프로토콜 대신 로컬 패키지 빌드 및 참조
- 필수 패키지 명시적 정의 