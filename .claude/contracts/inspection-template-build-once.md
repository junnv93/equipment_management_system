# Contract — Inspection Template Build-Once Workflow (Phase 1B/1C/1D)

> **Slug**: `inspection-template-build-once`
> **Mode**: 2 (Full Harness)
> **Created**: 2026-05-01
> **Plan**: `.claude/exec-plans/active/2026-05-01-inspection-template-backend.md`
> **Owner**: kmjkds
> **Branch policy**: main 직접 작업 (35차 결정)

---

## 0. 작업 범위

UL-QP-18 §6.6 (중간점검) + §6.7 (자체점검) 워크플로의 prefill 안정성을 LIMS 업계 표준(LabWare / Veeva Vault / Beamex CMX) 수준으로 끌어올린다.

| 영역 | Phase 매핑 | 결과물 |
|------|-----------|--------|
| Template Snapshot DB | 1B-A | `inspection_form_templates` 테이블, packages/inspection-utils 신규 |
| Backend 모듈 | 1B-B | inspection-form-templates module + CAS + 권한 + Audit + Cache Event |
| Backfill | 1B-C | scripts/backfill-inspection-templates.ts (idempotent + dry-run) |
| Soft Fork UX | 1B-D, 1B-E | DialogHeader version badge + SoftForkDialog (3-radio) |
| Template Gallery | 1B-F | 첫 점검 시 비슷한 장비 매칭 |
| i18n + E2E | 1B-G | ko/en parity + Playwright + 회귀 검증 |

---

## 1. MUST 기준 (전부 통과해야 PASS)

### M-1. SSOT 준수 (Rule 0)

- **M-1.1** `extractStructureFromInspection`, `diffStructures`는 `packages/inspection-utils`에서 단일 export. `apps/frontend/lib/inspection/template-utils.ts`는 re-export만 (또는 삭제 후 직접 import).
  - 검증: `grep -r "extractStructureFromInspection" --include="*.ts" --include="*.tsx" apps/` 결과의 모든 import가 `@equipment-management/inspection-utils` 또는 frontend re-export 파사드를 경유.
- **M-1.2** `Permission.MANAGE_INSPECTION_TEMPLATE`는 `packages/shared-constants/src/permissions.ts` 단일 정의. backend/frontend 모두 import.
- **M-1.3** `INSPECTION_TEMPLATE_UPDATED` cache event는 `apps/backend/src/common/cache/cache-events.ts` (또는 SSOT 파일) 단일 정의.
- **M-1.4** `forkChoice` 유니언 타입(`'this_only' | 'apply_forward' | 'cancel'`)은 `packages/schemas` 또는 `packages/inspection-utils` 단일 정의. backend DTO + frontend SoftForkDialog 모두 import.

### M-2. 하드코딩 0 (verify-hardcoding)

- **M-2.1** API 경로: `/api/equipment/:id/inspection-template/latest`, `/api/equipment/:id/inspection-template`, `/api/inspection-templates/gallery` 모두 `API_ENDPOINTS.INSPECTION_TEMPLATE.*`로 SSOT 등록.
- **M-2.2** 쿼리 키: `queryKeys.inspectionTemplate.{latest, gallery, ...}` 위계로 `lib/api/query-config.ts`에 등록. 인라인 string array 사용 금지.
- **M-2.3** i18n 카피 인라인 금지 — `intermediateInspection.template.*`, `intermediateInspection.softFork.*`, `intermediateInspection.gallery.*` (selfInspection 동일) 모든 카피는 i18n 키 경유.
- **M-2.4** Design token: version badge 색/weight, gallery card 색, soft fork dialog 색 모두 brand semantic token 사용 — Tailwind 임의 색(`bg-blue-500` 등) 0건.

### M-3. CAS / Optimistic Locking (Rule 1 cas-patterns.md)

- **M-3.1** `inspection_form_templates`의 동시 수정은 `(equipmentId, inspectionType, version)` unique constraint로 충돌 보장. 충돌 시 `ConflictException(409)` 반환.
- **M-3.2** Frontend SoftForkDialog는 409 수신 시 사용자에게 "다른 사용자가 먼저 수정했습니다" 메시지 + 새로고침 유도. silent fail 금지.
- **M-3.3** Detail 캐시 invalidate: 409 발생 시 `useCasGuardedMutation` 패턴 사용 (memory: stale cache 방지).

### M-4. Server-Side User Extraction (Rule 2 보안)

- **M-4.1** Template auto-create는 시스템 권한(서비스 내부 호출). 명시 수정(POST)은 `req.user.userId`로 추출, body의 userId 절대 신뢰 금지.
- **M-4.2** Audit log의 `actorUserId`는 JWT에서 추출, body 신뢰 금지.

### M-5. TypeScript Strict (Rule 3 any 금지)

- **M-5.1** `tsc --noEmit` PASS — backend + frontend + packages 전체.
- **M-5.2** `structure: jsonb` 컬럼은 Zod 스키마(`InspectionStructureSchema`)로 검증. `as any` 사용 0건.
- **M-5.3** SoftForkDialog `forkChoice` discriminated union 사용 — 'cancel' 케이스는 별도 분기 (제출 안 함).

### M-6. Next.js 16 Patterns (Rule 4)

- **M-6.1** 신규 페이지/API route 추가 시 params는 Promise 패턴.
- **M-6.2** Frontend 신규 hook은 `'use client'` 명시. server-only 코드는 server 경계 준수.

### M-7. 권한 (RBAC)

- **M-7.1** `Permission.MANAGE_INSPECTION_TEMPLATE`는 admin role에만 부여 (verify-roles 통과).
- **M-7.2** Gallery 조회는 모든 인증 사용자 허용 (`@Public()` 금지, 인증 가드 통과 + 별도 권한 체크 없음).
- **M-7.3** PermissionsGuard는 글로벌 APP_GUARD 패턴 (default DENY, 기존 verify-auth 표준).

### M-8. Audit Log (UL-QP-18 §7.5 양식 통제 준수)

- **M-8.1** `inspection_template.create` (auto-create), `inspection_template.update` (admin), `inspection_template.version_up` (apply_forward) 3개 액션 모두 audit_logs 기록.
- **M-8.2** entity_type=`inspection_form_template`, entity_id=template UUID, diff에 structure 변경(added/removed/type-changed sections) 포함.
- **M-8.3** `actorUserId` JWT 추출 + `actorName` 비정규화 (memory: notifications FK 정책과 동일).

### M-9. Cache Event (verify-cache-events)

- **M-9.1** `INSPECTION_TEMPLATE_UPDATED` event는 service에서 `emitAsync` 패턴 (verify-cache-events Step 1).
- **M-9.2** Listener는 Promise 반환 (verify-cache-events Step 2).
- **M-9.3** Listener는 `apps/backend/src/common/cache/inspection-cache.listener.ts` (또는 기존 listener 확장) 단일 위치.
- **M-9.4** Frontend는 cache invalidate 후 React Query refetch (queryKeys.inspectionTemplate.latest invalidate).

### M-10. Backfill (Idempotent + Transaction)

- **M-10.1** `backfill-inspection-templates.ts`는 `--dry-run` 플래그로 변경 미리 보기 (write 0건).
- **M-10.2** 재실행 시 변경 0건 (idempotent) — 이미 template 존재하는 (equipmentId, inspectionType)은 skip.
- **M-10.3** 트랜잭션 wrap — 실패 시 rollback. 부분 성공 상태 0건.
- **M-10.4** Production 적용 가이드: `docs/operations/inspection-template-backfill.md` 또는 plan 본문에 명시.

### M-11. i18n parity (verify-i18n)

- **M-11.1** `ko.json`과 `en.json`의 `intermediateInspection.template.*`, `intermediateInspection.softFork.*`, `intermediateInspection.gallery.*` 키 set 100% 일치.
- **M-11.2** `selfInspection.template.*`, `selfInspection.softFork.*`, `selfInspection.gallery.*` 동일 위계로 ko/en parity.
- **M-11.3** 어떤 카피도 한국어 하드코딩 (e.g. `<p>다음부터도 적용</p>`) 형태로 컴포넌트에 인라인 0건.

### M-12. 접근성 (WCAG 2.2 AA)

- **M-12.1** SoftForkDialog는 focus trap + ESC 닫기 + role="dialog" + aria-labelledby/describedby.
- **M-12.2** RadioGroup은 role="radiogroup" + aria-labelledby. 라디오 버튼은 키보드 화살표 탐색 지원.
- **M-12.3** Version badge는 SR text 포함 (`aria-label="현재 양식 버전 v3, 2026-05-01 작성, 김철수"`).
- **M-12.4** Gallery 카드는 button 또는 link semantic, aria-label에 매칭 이유 포함.
- **M-12.5** axe scan 0 violations (Phase 1B-G에서 검증).

### M-13. 빌드 + 테스트

- **M-13.1** `pnpm tsc --noEmit` PASS (root + backend + frontend + packages).
- **M-13.2** `pnpm --filter backend run test` PASS (unit + integration).
- **M-13.3** `pnpm --filter backend run test:e2e -- inspection-form-templates` PASS.
- **M-13.4** `pnpm --filter frontend run test` PASS (RTL + Vitest).
- **M-13.5** `pnpm --filter frontend run test:e2e -- template` PASS (Playwright).
- **M-13.6** `pnpm --filter backend run db:generate` 결과 commit. migration 파일 git에 추가.
- **M-13.7** `pnpm --filter backend run db:migrate` PASS (local DB 적용 확인).

### M-14. 워크플로 — Build-Once 보장

- **M-14.1** 신규 점검 작성 시 prefill source는 *template* (latestInspection 아님). `useLatestTemplate` hook 단독 의존.
- **M-14.2** 직전 점검이 *반려*인 경우에도 template prefill 유지 (regression 방지) — Playwright E2E 검증.
- **M-14.3** 표 구조 변경 → 제출 직전 SoftForkDialog 노출 → 사용자 선택 → 반영. 자동 적용 금지.
- **M-14.4** 첫 점검 + template 부재 + gallery 결과 ≥1 → TemplateGallery 자동 노출. localStorage skip 플래그 존중.

---

## 2. SHOULD 기준 (실패 시 tech-debt-tracker 등록, 루프 차단 X)

### S-1. 성능

- **S-1.1** Template fetch는 React Query staleTime=5min (latest는 자주 안 바뀜).
- **S-1.2** Gallery 쿼리는 server-side cache 60s (Redis 또는 in-memory) — frequent same-modelName 호출 대비.
- **S-1.3** `diffStructures`는 pure function + memo (큰 structure에서 매 렌더 호출 시 부담).

### S-2. 관측성 (analytics SSOT — `lib/analytics/track.ts`)

- **S-2.1** `inspection_template_created`, `inspection_template_versioned`, `soft_fork_decided`, `gallery_used` 4개 이벤트 분석 dispatch (PII 미포함).
- **S-2.2** Backend logger.log에 templateId/version/action/actorUserId 일관 기록.

### S-3. UX

- **S-3.1** SoftForkDialog의 diff visualization은 "추가됨 N개 / 삭제됨 N개 / 변경됨 N개" 요약 + 자세히 보기 토글.
- **S-3.2** Gallery 카드의 "사용 횟수" + "마지막 사용" 메타 노출.
- **S-3.3** Version badge 클릭 시 history 모달 (이전 버전 목록).

### S-4. Feature Flag / Rollback

- **S-4.1** `INSPECTION_TEMPLATE_ENABLED` feature flag로 gradual rollout (기본 true, 문제 발생 시 false → latestInspection prefill로 즉시 fallback).
- **S-4.2** Backfill은 일부 equipment 대상 dry-run → 검증 → 전체 적용 단계적 흐름 권고.

### S-5. 문서화

- **S-5.1** `docs/development/INSPECTION_TEMPLATES.md` 작성 — workflow 다이어그램, fork choice semantics, gallery matching 우선순위.
- **S-5.2** UL-QP-18 절차서와의 매핑 명시 — §6.6/§6.7 + §7.5 양식 통제.

---

## 3. Phase별 PASS Gate (각 Phase 종료 시 검증)

### Phase 1B-A: SSOT 이전 + DB schema + migration

| Gate | 명령 | 통과 기준 |
|------|------|----------|
| G-A.1 | `pnpm tsc --noEmit` | PASS (전체) |
| G-A.2 | `pnpm --filter backend run db:generate` | migration 파일 생성 |
| G-A.3 | `pnpm --filter backend run db:migrate` | local DB 적용 |
| G-A.4 | `grep -r "extractStructureFromInspection" --include="*.ts*" apps/` | import 경로가 `@equipment-management/inspection-utils` (또는 re-export 파사드) 일관 |
| G-A.5 | frontend RTL test (template-utils) | 기존 27 tests PASS 유지 |

### Phase 1B-B: Backend Core

| Gate | 명령 | 통과 기준 |
|------|------|----------|
| G-B.1 | `pnpm --filter backend run tsc --noEmit` | PASS |
| G-B.2 | `pnpm --filter backend run test inspection-form-templates` | unit + integration PASS |
| G-B.3 | `pnpm --filter backend run lint` | 0 errors |
| G-B.4 | `grep -r "INSPECTION_TEMPLATE_UPDATED" apps/backend/src/` | service emit + listener 양쪽 매칭 |
| G-B.5 | Permission.MANAGE_INSPECTION_TEMPLATE 신설 검증 | shared-constants + role-permission-matrix 동시 등록 |

### Phase 1B-C: Backfill

| Gate | 명령 | 통과 기준 |
|------|------|----------|
| G-C.1 | `pnpm --filter backend exec ts-node scripts/backfill-inspection-templates.ts --dry-run` | "would create N templates" 출력 + write 0 |
| G-C.2 | 1차 실제 실행 후 재실행 | "0 templates created (idempotent)" |
| G-C.3 | DB 무결성 | 모든 (equipmentId, inspectionType) pair는 0 또는 1개 current template (supersededBy IS NULL AND deletedAt IS NULL) |

### Phase 1B-D: Frontend 1B (DialogHeader version badge)

| Gate | 명령 | 통과 기준 |
|------|------|----------|
| G-D.1 | `pnpm --filter frontend run tsc --noEmit` | PASS |
| G-D.2 | RTL test (use-inspection-template) | new tests PASS |
| G-D.3 | `grep -r "latestInspection" apps/frontend/components/inspection*/` | prefill source가 template로 전환됨 (latestInspection 직접 의존 0건) |
| G-D.4 | a11y axe scan (DialogHeader) | 0 violations |

### Phase 1B-E: Frontend 1C (SoftForkDialog)

| Gate | 명령 | 통과 기준 |
|------|------|----------|
| G-E.1 | RTL test (SoftForkDialog) | 3-radio + cancel + 409 흐름 모두 PASS |
| G-E.2 | a11y (focus trap + radio keyboard nav) | manual + axe |
| G-E.3 | i18n parity (softFork.*) | ko/en 키 set 100% 일치 |

### Phase 1B-F: Frontend 1D (TemplateGallery)

| Gate | 명령 | 통과 기준 |
|------|------|----------|
| G-F.1 | RTL test (TemplateGallery) | 카드 grid + skip 플래그 + 매칭 chip PASS |
| G-F.2 | a11y (button semantic + aria-label) | axe 0 violations |
| G-F.3 | localStorage skip 플래그 SSR-safe | server render 시 throw 0건 |

### Phase 1B-G: 통합 + 회귀

| Gate | 명령 | 통과 기준 |
|------|------|----------|
| G-G.1 | `pnpm --filter frontend run test:e2e -- template` | Playwright PASS (gallery 자동 노출, soft fork 3옵션, 직전 반려 회귀) |
| G-G.2 | i18n parity (ko vs en 전체 template/softFork/gallery 키) | diff 0 |
| G-G.3 | verify-implementation 전체 PASS | verify-ssot, verify-hardcoding, verify-cas, verify-cache-events, verify-i18n, verify-frontend-state, verify-design-tokens, verify-a11y |
| G-G.4 | review-architecture | PASS |

---

## 4. Out of Scope

다음은 본 contract 범위 외 — 향후 후속 작업:

- TipTap rich text editor 통합 (Phase 2 LIMS 표준)
- Univer table editor 통합 (Phase 2)
- Template gallery cross-tenant sharing (multi-tenant 전환 시)
- Template 서명 + 잠금 (electronic signature — UL-QP-18 §7.5 strict 모드)

---

## 5. 검증 산출물 (Generator → Evaluator 인계)

각 Phase 완료 시 Generator는 다음을 evaluator에게 인계:

1. 변경 파일 리스트 + 라인 수
2. tsc/test/lint 결과 (PASS/FAIL + 오류 라인)
3. 명시적 SSOT 경유 grep 결과 (M-1, M-2)
4. CAS 시나리오 e2e 결과 (M-3)
5. i18n parity diff (M-11)

Evaluator는 본 contract의 M-* / S-* 기준에 대해 PASS/FAIL 판정 후 `.claude/evaluations/inspection-template-build-once.md` 작성.

---

## 6. 충돌 시 진실의 원천

1. 코드 실측 (현재 repo 실제 파일)
2. `.claude/exec-plans/active/2026-05-01-inspection-template-backend.md` (Plan)
3. 본 contract 파일
4. CCM `CLAUDE_CODE_MISSION.md`
5. UL-QP-18 절차서

상위 source가 하위와 다르면 상위를 따른다.
