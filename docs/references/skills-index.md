# Custom Claude Code Skills Index

> **CLAUDE.md에서 분리 (2026-04-09 엔트로피 정리).** 상세 사용법은 `.claude/skills/<name>/SKILL.md` 참조.

## 도메인 가이드

- **equipment-management** — UL-QP-18 equipment management domain guide (CRUD, calibration, checkout, non-conformance, approval workflows)
- **nextjs-16** — Next.js 16 App Router reference (params Promise, PageProps, useActionState, Server Components)
- **identifier-policy** — 도메인 ID 생성 SSOT (`docs/references/identifier-policy.md`): IdentifierService 진입점, 4개 도메인 헬퍼, ulid/nanoid 미선택 트레이드오프, 신규 ID 추가 절차, 정적+install+CI 5단 가드

## Verify Skills (정적 패턴 검증)

- **verify-auth** — 서버사이드 인증 (req.user.userId, @RequirePermissions, @AuditLog)
- **verify-zod** — Zod validation (ZodValidationPipe, controller pipe, query DTO consistency, ZodResponse ↔ ZodSerializerInterceptor pairing, 2xx-only ZodResponse). Step 14: Pipe DTO 통과 필드 ↔ service 호출 인자 매핑 silent loss 차단 (`_paramName` underscore prefix lint-bypass 정적 검출, escape hatch `// allowed:`). Step 19: CAS DTO/서비스 검증 — VersionedBaseService 상속, versionedSchema, updateWithVersion, onVersionConflict 훅 (2026-05-03 verify-cas 흡수)
- **verify-ssot** — SSOT import source (package imports, no local redefinitions, lucide-react). Step 44: Supply-Chain SSOT — raw uuid import 금지 (IdentifierService 경유) + pnpm.overrides caret 잠금 (`>=` 패턴 0건)
- **verify-hardcoding** — 하드코딩 탐지 (API paths, queryKeys, env, cache keys, token TTL, ErrorCode, Korean UI)
- **verify-frontend-state** — TanStack Query (no onSuccess setQueryData, dynamic imports). Step 39·40: 프론트엔드 mutation version 전달 + useCasGuardedMutation + 2-step Dialog AP-4 confirm 진입 전 version 재조회 (2026-05-03 verify-cas 흡수)
- **verify-click-feedback** — Click-Feedback 5-Layer (FEEDBACK_KEYS SSOT, loading.tsx a11y I3, 409 retry, useDebouncedSearch/useAutoSave/useExportAction 패턴, motion-safe:animate-spin)
- **verify-nextjs** — Next.js 16 패턴 (await params, useActionState, Server Components)
- **verify-design-tokens** — Design Token 3-Layer (no transition-all, focus-visible, import paths)
- **verify-security** — OWASP Top 10 (access control, injection, CSP, auth, logging, SSRF)
- **verify-i18n** — i18n 일관성 (en/ko key matching, empty translations, Zod hardcoded)
- **verify-sql-safety** — SQL 안전성 (LIKE escaping, N+1, COUNT(DISTINCT) fan-out, RBAC INNER JOIN)
- **verify-e2e** — E2E 테스트 패턴 + 아키텍처 커버리지 (auth fixtures, locator, CAS 복구, cache invalidation, site scope, global-setup). Step 23/24/25는 `pnpm --filter backend run verify:e2e-actors` (ts-morph 정적 분석)으로 승격 — pre-push hook 자동 실행. Step 28: 워크플로우 커버리지 (WF-01~WF-35 + WF-AP, 역할/상태 전이/serial/DB 리셋, 2026-05-03 verify-workflows 흡수)
- **verify-seed-integrity** — Seed 3-way SSOT triangle (seed-test-new wiring + Phase 0 truncate + verification.ts checkCount)
- **verify-filters** — URL-driven filter SSOT (filter-utils, hooks, page.tsx server parsing)
- **verify-handover-qr** — QR + Handover 통합 (2026-05-03 verify-qr-ssot + verify-handover-security 통합). Section A: QR URL/설정/액션 SSOT(qr-url.ts/qr-config.ts/qr-access.ts), Section B: OneTimeToken 보안(시크릿 분리, jti nonce 소비, TTL SSOT, 권한 가드, 토큰 영속화 금지, dev 엔드포인트 이중 가드)
- **verify-bulk-action-bar** — BulkActionBar 패턴 SSOT (count chip aria-live, role=toolbar, Esc clear, indeterminate Radix, focus management, IME guard). 도메인 무관 generic 컴포넌트(`components/common/BulkActionBar.tsx`)와 도메인 wrapper(`components/approvals/BulkActionBar.tsx`) 분리 검증. 일괄 작업 UI 변경 시 트리거
- **verify-routing-origin** — Same-Origin Reverse-Proxy(ADR-0006) 정합. 4 레이어 동기화(api-routing.ts SSOT / next.config.js / nginx lan.conf+template / proxy.ts), env 절대 URL 잠입, BACKEND ∩ NEXTAUTH disjoint, SW NetworkOnly /api/\* 룰
- **verify-implementation** — 통합 실행 (모든 verify-\* 순차 실행 + 결합 리포트)

## Review Skills (심층 분석)

- **review-architecture** — 아키텍처 수준 (cross-layer tracing, CAS coherence, cache invalidation, 패턴 일관성)
- **review-design** — 디자인 품질 + 와이어프레임 (10 anti-patterns, 접근성, 다크모드, progressive disclosure)

## Workflow Orchestrators

- **generate-prompts** — 코드베이스 스캔 → verify → harness 프롬프트 생성, auto-archive, false positive filtering
- **git-commit** — 변경 분석 → conventional commit 메시지 생성 + main 직접/브랜치+PR 자동 판단
- **manage-skills** — 스킬 유지보수 (커버리지 갭 분석, 생성/업데이트, CLAUDE.md 관리)
- **playwright-e2e** — E2E 워크플로우 (plan→generate→execute→heal→report, 순차 에이전트, auth.fixture)
- **harness** — 3-Agent orchestrator (Planner→Generator→Evaluator, auto mode 0/1/2, contract 기반, max 3 retry, load-bearing)
- **ultrareview-advisor** (스크립트) — `scripts/ultrareview-advisor.mjs` Go/No-Go 판정 (review-learnings.md + CLAUDE.md SSOT 파생), `scripts/ultrareview-preflight.mjs` pre-upload secret gate (.gitleaks.toml)
