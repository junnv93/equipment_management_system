---
slug: monitoring-dashboard
created: 2026-04-02
mode: 2
---

# 스프린트 계약: 시스템 모니터링 대시보드

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm tsc --noEmit` (monorepo 전체) 에러 0
- [ ] 모니터링 API 클라이언트가 4개 엔드포인트 통합: metrics, status, http-stats, cache-stats (API_ENDPOINTS.MONITORING SSOT 사용)
- [ ] 응답 타입 인터페이스가 monitoring.controller.ts 반환 타입과 일치
- [ ] TanStack Query: queryKeys.monitoring 팩토리 등록, QUERY_CONFIG.MONITORING에 PERIODIC 전략 (5분 refetchInterval)
- [ ] 권한: page.tsx에서 getServerAuthSession() + UserRoleValues.SYSTEM_ADMIN 비교 → redirect (system_admin 전용)
- [ ] FRONTEND_ROUTES.ADMIN.MONITORING 라우트 상수 shared-constants에 등록
- [ ] 사이드바 모니터링 링크 (nav-config.ts, Permission.MANAGE_SYSTEM_SETTINGS 필터링)
- [ ] i18n: ko/en navigation.json에 adminMonitoring 키 존재
- [ ] 대시보드에 최소 4개 데이터 섹션: 시스템 리소스(CPU/메모리), 서비스 건강 상태, HTTP 통계, 캐시 성능
- [ ] loading.tsx, error.tsx 파일 존재 (기존 admin 패턴)
- [ ] verify-implementation 전체 PASS

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록

- [ ] review-architecture Critical 이슈 0개
- [ ] 에러 격리: 하나의 API 실패가 다른 섹션 렌더링 차단하지 않음
- [ ] 반응형 그리드: 모바일(1열) / 태블릿(2열) / 데스크톱(3열 이상)
- [ ] isSimulated 플래그 true인 데이터에 시뮬레이션 표시
- [ ] playwright-e2e: /admin/monitoring 렌더링 확인

### 적용 verify 스킬

- verify-ssot: API_ENDPOINTS, Permission, FRONTEND_ROUTES import 경로
- verify-frontend-state: TanStack Query 사용, useState 금지
- verify-nextjs: Server Component 패턴
- verify-hardcoding: API 경로, queryKeys, refetchInterval 하드코딩
- verify-i18n: ko/en 키 일치
- verify-design-tokens: 디자인 토큰 사용

## 종료 조건

- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입)
- 3회 반복 초과 → 수동 개입
- SHOULD 실패는 tech-debt-tracker.md에 기록
