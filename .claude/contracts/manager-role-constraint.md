---
slug: manager-role-constraint
created: 2026-04-09
mode: 1
---

# Contract: 운영 책임자 역할 제한 (SSOT 기반)

## MUST Criteria

1. `pnpm tsc --noEmit` 통과
2. Backend: managerId/deputyManagerId에 기술책임자(technical_manager) 미만 역할의 사용자를 할당하면 400 에러 반환
3. SSOT: 역할 제한 상수는 `packages/shared-constants`에서 정의, 하드코딩 없음
4. 크로스 사이트: 다른 사이트 사용자를 운영 책임자로 할당할 수 없음
5. 기존 E2E 테스트 통과 유지
6. 검증용 백엔드 E2E 테스트 포함

## SHOULD Criteria

1. 프론트엔드 매니저 드롭다운이 기술책임자 이상 + 같은 사이트로만 필터링
2. 에러 메시지가 사용자 친화적 (어떤 역할이 필요한지 명시)
