-- PostgreSQL 초기화 스크립트
-- Docker 컨테이너 최초 실행 시 자동으로 실행됩니다.

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 개발 환경에서 필요한 경우 추가 설정
-- (Drizzle ORM이 스키마를 관리하므로 테이블 생성은 db:migrate로 수행)

-- 로그 출력
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL 초기화 완료: equipment_management 데이터베이스 준비됨';
END $$;
