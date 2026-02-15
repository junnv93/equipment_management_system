#!/bin/bash

# 스크립트가 있는 디렉토리의 상위(프로젝트 루트) 디렉토리로 이동
cd "$(dirname "$0")/.." || exit

echo "🔍 ShadCN UI 필수 의존성 설치 중..."
pnpm --filter frontend add @radix-ui/react-slot class-variance-authority clsx tailwind-merge

echo "🛠️ 기본 ShadCN UI 컴포넌트 추가 중..."
cd apps/frontend || exit

# 기본 컴포넌트 설치
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table

echo "✅ ShadCN UI 설정이 완료되었습니다!" 