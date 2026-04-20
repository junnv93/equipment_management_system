---
name: manage-skills
description: Analyzes session changes to detect missing verification skills. Dynamically discovers existing skills, creates new skills or updates existing ones, and manages CLAUDE.md skill references. Use when adding new patterns/modules that may need verification coverage, or when maintaining skill consistency. 스킬 관리, 검증 스킬 누락 탐지, CLAUDE.md 업데이트.
disable-model-invocation: false
argument-hint: '[선택사항: 특정 스킬 이름 또는 집중할 영역]'
---

# 세션 기반 스킬 유지보수

## 목적

현재 세션에서 변경된 내용을 분석하여 검증 스킬의 드리프트를 탐지하고 수정합니다:

1. **커버리지 누락** — 어떤 verify 스킬에서도 참조하지 않는 변경된 파일
2. **유효하지 않은 참조** — 삭제/이동된 파일을 참조하는 스킬
3. **누락된 검사** — 새로운 패턴/규칙
4. **오래된 값** — 더 이상 일치하지 않는 설정값/탐지 명령어

## 실행 시점

- 새로운 패턴이나 규칙을 도입한 후
- PR 전 verify 스킬 커버리지 확인
- 검증 실행 시 예상 이슈를 놓쳤을 때
- 주기적 코드베이스 정렬

## 등록된 검증 스킬

| 스킬                    | 설명                                   | 커버 파일 패턴                                                         |
| ----------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `verify-cas`            | CAS(Optimistic Locking) 패턴 검증      | `apps/backend/src/modules/**/*.service.ts`, `*/dto/**/*.dto.ts`       |
| `verify-auth`           | 서버 사이드 인증/인가 + 라우트 선언 순서 검증 | `apps/backend/src/**/*.controller.ts`, `*/dto/**/*.dto.ts`            |
| `verify-zod`            | Zod 검증 패턴 검증                     | `*/dto/**/*.dto.ts`, `apps/backend/src/common/pipes/*.ts`             |
| `verify-ssot`           | SSOT 임포트 패턴 검증                  | `apps/backend/src/**/*.ts`, `apps/frontend/**/*.ts(x)`                |
| `verify-hardcoding`     | SSOT 하드코딩 탐지                     | `apps/frontend/lib/api/**`, `apps/backend/src/**/*.service.ts`        |
| `verify-frontend-state` | 프론트엔드 상태 관리 패턴 검증         | `apps/frontend/components/**`, `apps/frontend/hooks/**`               |
| `verify-nextjs`         | Next.js 16 패턴 검증                   | `apps/frontend/app/**/page.tsx`, `layout.tsx`, `error.tsx`            |
| `verify-filters`        | URL-driven 필터 SSOT 패턴 검증         | `*-filter-utils.ts`, `use-*-filters.ts`, `page.tsx`                  |
| `verify-design-tokens`  | Design Token 3-Layer 아키텍처 검증     | `lib/design-tokens/**`, `apps/frontend/components/**`                 |
| `verify-security`       | 보안 설정 검증                         | `helmet-config.ts`, `next.config.js`, `**/*.controller.ts`           |
| `verify-i18n`           | i18n 번역 + routeMap↔navigation.json + audit SSOT enum 동기화 검증 | `apps/frontend/messages/{en,ko}/*.json`, `lib/navigation/route-metadata.ts`, `packages/schemas/src/enums/audit.ts` |
| `verify-sql-safety`     | SQL 안전성 검증                        | `apps/backend/src/modules/**/*.service.ts`                             |
| `verify-e2e`            | E2E 테스트 패턴 검증                   | `tests/e2e/**/*.spec.ts`, `tests/e2e/shared/**`, `global-setup.ts`    |
| `verify-seed-integrity` | 시드 인프라 3자 SSOT 삼각형 정합성     | `database/seed-data/**/*.seed.ts`, `seed-test-new.ts`, `verification.ts` |
| `verify-workflows`      | 크리티컬 워크플로우 E2E 커버리지 검증  | `docs/workflows/critical-workflows.md`, `tests/e2e/workflows/**/*.spec.ts` |
| `verify-cache-events`   | 이벤트 기반 캐시 무효화 아키텍처 검증  | `cache-event.registry.ts`, `cache-event-listener.ts`, `cache-invalidation.helper.ts`, `cache-patterns.ts` |
| `verify-handover-security` | QR 기반 인수인계 토큰 보안 검증 — 시크릿 분리, jti 소비, TTL SSOT | `HandoverTokenService`, `OneTimeTokenService`, handover 컨트롤러 |
| `verify-qr-ssot`        | QR URL/설정/액션 SSOT 경유 검증 — 인라인 URL·경로 하드코딩 탐지 | `qr-url.ts`, `qr-config.ts`, `qr-access.ts`, QR 관련 서비스/컴포넌트 |

## 워크플로우

### Step 1: 세션 변경사항 분석

git diff/log로 변경 파일 수집, 디렉토리 기준 그룹화.

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 1

### Step 2: 등록된 스킬과 변경 파일 매핑

스킬 테이블의 패턴과 대조하여 파일→스킬 매핑 구축. UNCOVERED 파일 식별.

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 2

### Step 3: 영향받은 스킬의 커버리지 갭 분석

누락 파일 참조, 오래된 탐지 명령어, 새 패턴, 삭제된 파일, 변경된 값 점검.

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 3

### Step 4: CREATE vs UPDATE 결정

- 기존 스킬 도메인 관련 → UPDATE
- 3+ 관련 파일이 공통 규칙 공유 → CREATE
- 그 외 → 면제

`AskUserQuestion`으로 확인.

### Step 5: 기존 스킬 업데이트

추가/수정만 (기존 검사 제거 금지). Related Files, 탐지 명령어, 워크플로우 단계 추가.

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 5

### Step 6: 새 스킬 생성

1. 패턴 이해 → 2. 이름 확인 (`verify-` 접두사, kebab-case) → 3. SKILL.md 생성 → 4. 연관 파일 업데이트 (manage-skills, verify-implementation, CLAUDE.md)

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 6

### Step 7: 검증

SKILL.md 재읽기, 마크다운 형식, 파일 참조, 탐지 명령어 드라이런, 테이블 동기화.

### Step 8: 요약 보고서

분석 파일 수, 업데이트/생성 스킬, 영향없는 스킬, 미커버 변경사항 출력.

## Related Files

| File | Purpose |
|------|---------|
| `.claude/skills/verify-implementation/SKILL.md` | 통합 검증 스킬 (실행 대상 목록 관리) |
| `.claude/skills/manage-skills/SKILL.md` | 이 파일 (등록된 검증 스킬 목록 관리) |
| `CLAUDE.md` | 프로젝트 지침 (Skills 섹션 관리) |

## 예외사항

1. **Lock 파일 및 생성된 파일** — 스킬 커버리지 불필요
2. **일회성 설정 변경** — 버전 범프 등 새 스킬 불필요
3. **문서 파일** — 코드 패턴이 아님
4. **테스트 픽스처 파일** — 프로덕션 코드 아님
5. **영향받지 않은 스킬** — 검토 불필요
6. **CLAUDE.md 자체** — 문서 업데이트
7. **벤더/서드파티 코드** — 외부 규칙
8. **CI/CD 설정** — 인프라, 검증 스킬 불필요
