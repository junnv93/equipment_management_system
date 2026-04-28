# Custom Claude Code Skills Index

> **CLAUDE.md에서 분리 (2026-04-09 엔트로피 정리).** 상세 사용법은 `.claude/skills/<name>/SKILL.md` 참조.

## 도메인 가이드

- **equipment-management** — UL-QP-18 equipment management domain guide (CRUD, calibration, checkout, non-conformance, approval workflows)
- **nextjs-16** — Next.js 16 App Router reference (params Promise, PageProps, useActionState, Server Components)
- **identifier-policy** — 도메인 ID 생성 SSOT (`docs/references/identifier-policy.md`): IdentifierService 진입점, 4개 도메인 헬퍼, ulid/nanoid 미선택 트레이드오프, 신규 ID 추가 절차, 정적+install+CI 5단 가드

## Verify Skills (정적 패턴 검증)

- **verify-cas** — CAS/Optimistic Locking (version, VersionedBaseService, cache invalidation on 409)
- **verify-auth** — 서버사이드 인증 (req.user.userId, @RequirePermissions, @AuditLog)
- **verify-zod** — Zod validation (ZodValidationPipe, controller pipe, query DTO consistency, ZodResponse ↔ ZodSerializerInterceptor pairing, 2xx-only ZodResponse). Step 14: Pipe DTO 통과 필드 ↔ service 호출 인자 매핑 silent loss 차단 (`_paramName` underscore prefix lint-bypass 정적 검출, escape hatch `// allowed:`)
- **verify-ssot** — SSOT import source (package imports, no local redefinitions, lucide-react). Step 44: Supply-Chain SSOT — raw uuid import 금지 (IdentifierService 경유) + pnpm.overrides caret 잠금 (`>=` 패턴 0건)
- **verify-hardcoding** — 하드코딩 탐지 (API paths, queryKeys, env, cache keys, token TTL, ErrorCode, Korean UI)
- **verify-frontend-state** — TanStack Query (no onSuccess setQueryData, dynamic imports)
- **verify-click-feedback** — Click-Feedback 5-Layer (FEEDBACK_KEYS SSOT, loading.tsx a11y I3, 409 retry, useDebouncedSearch/useAutoSave/useExportAction 패턴, motion-safe:animate-spin)
- **verify-nextjs** — Next.js 16 패턴 (await params, useActionState, Server Components)
- **verify-design-tokens** — Design Token 3-Layer (no transition-all, focus-visible, import paths)
- **verify-security** — OWASP Top 10 (access control, injection, CSP, auth, logging, SSRF)
- **verify-i18n** — i18n 일관성 (en/ko key matching, empty translations, Zod hardcoded)
- **verify-sql-safety** — SQL 안전성 (LIKE escaping, N+1, COUNT(DISTINCT) fan-out, RBAC INNER JOIN)
- **verify-e2e** — E2E 테스트 패턴 + 아키텍처 커버리지 (auth fixtures, locator, CAS 복구, cache invalidation, site scope, global-setup)
- **verify-seed-integrity** — Seed 3-way SSOT triangle (seed-test-new wiring + Phase 0 truncate + verification.ts checkCount)
- **verify-workflows** — Cross-feature workflow E2E coverage (WF-01~WF-16, 역할, 상태 전이)
- **verify-filters** — URL-driven filter SSOT (filter-utils, hooks, page.tsx server parsing)
- **verify-qr-ssot** — QR URL 빌더/파서·설정·액션이 SSOT(qr-url.ts, qr-config.ts, qr-access.ts) 경유하는지 검증
- **verify-handover-security** — Handover/OneTimeToken 보안 (시크릿 분리, jti nonce 소비, TTL SSOT, 권한 가드, 토큰 영속화 금지)
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
