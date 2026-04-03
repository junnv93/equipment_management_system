# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-03 (10차 — 잔여 SHOULD 2건 해소)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용.

---

## 현재 미해결 프롬프트: 0건

모든 프롬프트가 해결되었습니다.

---

## 📦 완료 항목 아카이브

<details>
<summary>완료된 항목 (35건)</summary>

### HIGH
- CI unit-test Turbo 캐시 추가 (2026-04-02)
- checkoutItems FK onDelete restrict 추가 (2026-04-02)
- monitoring execFile 전환 (2026-04-02)
- 프론트엔드 하드코딩 한국어 i18n 전환 — commit d6c8c0cd
- Equipment approvalStatus 인덱스 추가 — commit d6c8c0cd

### MEDIUM
- 아이콘 버튼 aria-label 누락 5건 해소 (2026-04-02, 8차)
- i18n fallback 키 미등록 해소 — messages 등록 + fallback 제거 (2026-04-02, 8차)
- PendingChecks 기능 완성 — 백엔드 API + 필터 URL SSOT + 반출입 헤더 배지 (2026-04-02)
- AlertsContent activeTab URL SSOT 전환 (2026-04-02)
- softwareType TODO 해소 — equipment.softwareType 쿼리 연결 (2026-04-02)
- userPreferences Drizzle relations() 정의 추가 (2026-04-02)
- 미사용 Permission enum 5건 정리 — PR #92
- CI pnpm install 캐시 최적화 — PR #92
- FK ON DELETE 정책 cascade→restrict 통일 — PR #92
- 부적합 수리 워크플로우 E2E FIXME 해소 — commit 3f93f3e3

### SHOULD
- E2E CSS 셀렉터 → getByRole/getByText 전환 — pending-checks + create-equipment (2026-04-03, 10차)
- ReportsContent date-fns format → useDateFormatter 전환 (2026-04-03, 10차)

### LOW
- FK onDelete 정책 명시 누락 ~10건 해소 — user FK restrict 명시 (2026-04-02, 8차)
- .env.example DB 풀 변수 미문서화 해소 (2026-04-02, 8차)
- NCDetailClient 뒤로가기 버튼 aria-label 추가 (2026-04-02)
- i18n Phase 3 유틸리티 TODO 정리 — 이미 구현 완료 확인 (2026-04-02)
- 교정 필터 E2E 테스트 — PR #85에서 중복 삭제
- i18n 에러 메시지 Phase 3 구현 — PR #85
- 폐기 취소 확인 다이얼로그 — commit d6c8c0cd

### 복합
- 모니터링 대시보드 프론트엔드 — PR #88
- 테스트 커버리지 확대 — PR #96

### 이전 세션
- SSE 엔드포인트 권한 강화, 부적합 관리 권한 버그(PR #79),
  모니터링 cache-stats(PR #77), softwareType 스키마(PR #82),
  누락 loading.tsx, DB 인덱스, 미커밋 테스트, documents relations,
  E2E CI auth.setup(PR #83), CodeQL(PR #74)

</details>

<details>
<summary>거짓 양성 (14건)</summary>

- 교정계획 @AuditLog 누락 — 전부 적용됨
- auth.service.ts 빈 catch — 의도적 fail-open
- 누락된 error.tsx — 부모 cascading boundary 커버
- @AuditLog decorator 순서 — 기능 무관
- error.tsx/loading.tsx 26건 — 실제 존재
- Turbo cache key — 내부 해싱이 감지
- system-settings 인덱스 — 소규모 테이블
- preferences @AuditLog — 비즈니스 감사 대상 아님
- (8차) 미사용 Permission 4건 — 컨트롤러에서 모두 사용 중 확인
- (8차) Notifications @AuditLog — 읽음 표시는 비즈니스 감사 대상 아님
- (8차) 아이콘 버튼 38건 누락 주장 — 실제 누락 5건만 확인 (나머지 sr-only/aria-label 존재)
- (8차) CI 빌드 중복 — 별도 GitHub Actions job은 파일시스템 격리 (불가피)
- (8차) audit-logs relations() 누락 — write-only append 테이블, eager loading 불필요
- (8차) API endpoint 불일치 — 실제 라우트와 매칭 확인

</details>
