# Harness 아카이브 인덱스

> 도메인별 아카이브 파일 네비게이션. SSOT — 이 파일에서 섹션 위치를 조회하세요.

## 파일 구조

| 파일 | 도메인 | 섹션 수 |
|------|--------|---------|
| [archive-migration.md](./archive-migration.md) | 데이터 마이그레이션 | 1개 차수 (12건) |
| [archive-infra.md](./archive-infra.md) | E2E 인프라 / 테스트 / Legacy | 4개 차수 + Legacy 섹션들 |
| [archive-export.md](./archive-export.md) | 양식 Export / DOCX | 4개 차수 |
| [archive-design.md](./archive-design.md) | UI/UX 디자인 리뷰 | 3개 차수 |
| [archive-domain.md](./archive-domain.md) | 도메인 기능 (장비/점검/팀/SW) | 12개 차수 |

## 섹션 인덱스

| 차수/섹션명 | 파일 | 핵심 내용 |
|------------|------|----------|
| 78차 — 반출입 관리 페이지 디자인/IA 개선 (7건, 2026-04-21) | [archive-design.md](./archive-design.md) | primitives 2xs·MICRO_TYPO, EmptyState 3-variant, MiniProgress·RentalFlow 칩, 반입탭 독립페이지네이션, alertRing elevation, PageHeader onboardingHint, STAGGER_PRESETS |
| NC 디자인 리뷰 후속 (9건, 2026-04-21) | [archive-design.md](./archive-design.md) | terminal 색상버그, 스태거SSOT, i18n management.* 제거, aria 3건(aria-pressed/hidden/label), NC_DOCUMENTS 토큰, NC_ELEVATION 3단계, 온보딩 강화, 모바일 카드, NC_SPACING_TOKENS |
| 72차 — 데이터 마이그레이션 도메인 종합 리뷰 (12건) | [archive-migration.md](./archive-migration.md) | FK 자동 해석, 중복 감지 키 확장, 컬럼 매핑 9건, 파일 정리, completionDate 버그, Excel 하드코딩, enum SSOT, 세션 상태 머신, DB 검증, 권한 분리, 에러 리포트, 도메인 확장 |
| 71차 — 백엔드 E2E 테스트 인프라 근본 재설계 (1건) | [archive-infra.md](./archive-infra.md) | Redis 포트 불일치, admin 시드 부재, SSOT 미사용 3-Layer 해결 (e2e-env.ts + global-setup.ts + test-auth.ts) |
| 70차 — 3-agent 병렬 스캔 (4건) | [archive-domain.md](./archive-domain.md) | Promise.all 병렬화, QUERY_CONFIG spread, testSoftwareId 인덱스 |
| 68차 — 3-agent 병렬 스캔 (4건) | [archive-domain.md](./archive-domain.md) | QUERY_CONFIG.HISTORY 누락, audit/dashboard 하드코딩 SSOT, repair-history relations |
| 67차 — 3-agent 병렬 스캔 (2건) | [archive-domain.md](./archive-domain.md) | aria-label 접근성, docker-compose.prod.yml 이미지 태그 핀닝 |
| 62차 — 팀관리 페이지 성능 분석 스캔 (4건) | [archive-domain.md](./archive-domain.md) | teams.service.ts Promise.all, 복합 인덱스, CI turbo-cache, drizzle-zod 데드 임포트 |
| 61차 — 테스트 커버리지 + 의존성 감사 스캔 (4건) | [archive-infra.md](./archive-infra.md) | 5개 모듈 단위 테스트 부재, CI frontend jest, collectCoverageFrom, @typescript-eslint 버전 불일치 |
| 59차 — generate-prompts 3-agent 병렬 스캔 (5건) | [archive-domain.md](./archive-domain.md) | AuthProviders 메모리 누수, DocumentPreviewDialog blob URL, syncUser @AuditLog, incident_history 인덱스, CI SHA 핀닝 |
| 55차 — 54차 harness 중 발견 (1건) | [archive-domain.md](./archive-domain.md) | AuditLog.userRole SSOT 타입 불일치 |
| 54차 — generate-prompts 3-agent 병렬 스캔 (2건) | [archive-domain.md](./archive-domain.md) | E2E storageState 전환 미완, stale TODO 제거 |
| 52차 — generate-prompts 3-agent 병렬 스캔 (3건) | [archive-domain.md](./archive-domain.md) | NC repairHistoryId FK 불일치, deprecated 컬럼 정리, CI 중복 빌드 최적화 |
| 46차 — 시간복잡도 리뷰 결과 (5건) | [archive-domain.md](./archive-domain.md) | 배치 INSERT + chunkArray SSOT, QUERY_SAFETY_LIMITS, batchStatusUpdate O(n)→O(unique), DB WHERE push-down, Frontend Array.find → Map |
| 45차 — 3-agent 병렬 스캔 + 2차 검증 (3건) | [archive-domain.md](./archive-domain.md) | Frontend loose typing enum SSOT, approvals-api.ts unsafe cast 제거 |
| 41차 — 중간점검 폼 통합 후속 (3건) | [archive-domain.md](./archive-domain.md) | calibration-api.ts SSOT 타입, ResultSectionsPanel 레이스 컨디션, 1-step Export 검증 |
| 40차 — 중간점검 통합 워크플로우 UX 개선 | [archive-design.md](./archive-design.md) | 중간점검 폼 통합 리디자인, 12개 프리셋, 1-step UX |
| 39차 — 결과 섹션 아키텍처 리뷰 후속 (4건) | [archive-domain.md](./archive-domain.md) | ResultSectionsPanel 캐시/에러, rich_table UI, N+1 최적화, 접근성 |
| 38차 — QP-18 양식 export 템플릿 매핑 검증 (2건) | [archive-export.md](./archive-export.md) | QP-18-03 중간점검표 DOCX 매핑, QP-18-05 자체점검표 DOCX 매핑 |
| 36차 — generate-prompts 3-agent 병렬 스캔 | [archive-export.md](./archive-export.md) | Dockerfile build stage, layer caching |
| 33차 — review-architecture 후속 이슈 | [archive-export.md](./archive-export.md) | global-setup 에러 로그 정밀화 |
| 31차 — Export spec API-only 갭 + WF-21 후속 | [archive-export.md](./archive-export.md) | Export 다운로드 UX 검증, verify-* 스킬 보강 |
| Legacy — 미해결/완료 프롬프트 (29차 이전) | [archive-infra.md](./archive-infra.md) | WF-25 배지, Dockerfile hardening, CAS, Node 20, setQueryData, False Positives, 28차 완료 목록 |
