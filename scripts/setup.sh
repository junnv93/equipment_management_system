#!/bin/bash

# 설정 스크립트
echo "장비 관리 시스템 초기 설정을 시작합니다..."

# 의존성 설치
echo "의존성 설치 중..."
pnpm install

# 데이터베이스 마이그레이션
echo "데이터베이스 마이그레이션 실행 중..."
pnpm migrate

# 빌드
echo "애플리케이션 빌드 중..."
pnpm build:all

echo "설정이 완료되었습니다!"
echo "개발 서버를 시작하려면 'pnpm dev' 명령을 실행하세요." 