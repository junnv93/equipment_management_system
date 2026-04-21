---
slug: tech-debt-batch-0421b
date: 2026-04-21
mode: 2
status: active
source: .claude/exec-plans/tech-debt-tracker.md
---

# Tech Debt Batch 0421b — Exec Plan

## Scope Summary

tech-debt-tracker.md 기준 Open 항목 중 **실행 가능한 것만** 선별하여 5개 Phase로 묶는다.
본 배치의 목표:

1. **Phase A (가장 큼, 아키텍처 수술)**: UL-QP-18-02 형 Data/Renderer/Layout 3-way 분리 패턴을 QP-18-06/07/08/10 양식에 확산 (QP-18-03/05/09는 이미 분리됨).
2. **Phase B**: UL-QP-18-02 이력카드 §5 섹션 유형 라벨 E2E 검증 추가 — 실 브라우저 다운로드 + DOCX 파싱.
3. **Phase C**: `EXPORT_QUERY_LIMITS.FULL_EXPORT` 스트리밍 옵션 분석 및 결정 (5,000+ 대비 실측 / 결정만).
4. **Phase D**: 보안·정책 감사 2건 — `equipment.controller.ts:472` 시스템관리자 직접 승인 경로 + `Permission.EXPORT_REPORTS` × `test_engineer` 정책 재확인. **분석·문서화만, 코드 변경 없음 / 정책 변경은 사용자 결정 대기**.
5. **Phase E**: 양식 교체 운영 runbook 작성 (`docs/operations/form-template-replacement.md`).

## Deferred Items (excluded from this plan)

| 항목 | 이유 |
|---|---|
| Phase K — 백업·DR (pg_dump cron + 복원 리허설) | 프로덕션 사용자 발생 시점. 현재 1인 개발. |
| Drizzle snapshot 재생성 | **TTY required** — harness 환경에서 `pnpm db:generate` 실행 불가. |
| 실제 브라우저 동선 수동 검증 (QR NC 업로드) | Manual verification — 본 배치는 자동화 가능 항목만. |
| 커밋 7a6255d1 메시지 귀속 복구 | 사용자 결정 대기 (A/B/C 답변 미수신). |
| CSP report 영속화 (DB/Loki + Grafana) | 운영 인프라 결정 선행 필요 (현재 개발 환경). |
| k6 부하 테스트 스크립트 생성 (sw-validation) | LOW 우선순위, 스크립트 자체가 별도 프로젝트급. |
| calibration-plan-exportability.ts 전용 verify | Tracker에 "불필요"로 결론난 항목. 정리만. |
| ZodSerializerInterceptor 글로벌 승격 | 조건 1·2 미충족 (D+4, 컨트롤러 1개). 2026-05-01 이후 재평가. |
| class-DTO 점진 마이그레이션 14개 | 트리거 3건 모두 미검출. 해당 모듈 작업 시 개별 처리. |

---

## Phase A: multi-form 3-way 분리 패턴 확산

### Goal

`form-template-export.service.ts` 내부에 **인라인으로 남아 있는** 양식 내보내기 로직을 UL-QP-18-01/03/05/09처럼 **양식별 Data + Renderer + Layout 3-way 파일 구조**로 분리한다. `form-template-export.service.ts`는 dispatcher만 유지.

### Current State (2026-04-21 실측)

| Form | 현재 위치 | 상태 |
|---|---|---|
| UL-QP-18-01 (Equipment Registry) | `modules/reports/services/equipment-registry-*` + `layouts/equipment-registry.layout.ts` | **완료** (기준) |
| UL-QP-18-03 (중간점검표) | `modules/intermediate-inspections/services/intermediate-inspection-*` + `.layout.ts` | **완료** |
| UL-QP-18-05 (자체점검표) | `modules/self-inspections/services/self-inspection-*` + `.layout.ts` | **완료** |
| UL-QP-18-06 (반·출입 확인서) | `form-template-export.service.ts` 인라인 | **Phase A 대상** |
| UL-QP-18-07 (SW 관리대장) | `form-template-export.service.ts` 인라인 | **Phase A 대상** |
| UL-QP-18-08 (Cable Path Loss) | `form-template-export.service.ts` 인라인 | **Phase A 대상** |
| UL-QP-18-09 (SW 유효성확인) | `modules/software-validations/services/software-validation-*` + `.layout.ts` | **완료** |
| UL-QP-18-10 (공용장비 사용/반납) | `form-template-export.service.ts` 인라인 | **Phase A 대상** |

→ **대상은 4종** (QP-18-06, 07, 08, 10).

### 설계 방침

각 대상 양식마다 다음 3개 파일을 신설:

1. **Layout SSOT 상수 파일** (순수 상수, DB/Nest 의존성 0)
2. **Export Data Service** (`@Injectable()`, DB 의존, EnforcedScope 수신)
3. **Renderer Service** (`@Injectable()`, 템플릿 버퍼만 의존, DB 호출 금지)

### 도메인 귀속 결정

| Form | 도메인 모듈 |
|---|---|
| UL-QP-18-06 (checkout) | `modules/checkouts/services/` |
| UL-QP-18-07 (test-software registry) | `modules/test-software/services/` |
| UL-QP-18-08 (cable path loss) | `modules/cables/services/` |
| UL-QP-18-10 (equipment-imports) | `modules/equipment-imports/services/` |

### 단계적 실행 (Mini-phases)

A-1. UL-QP-18-07 (가장 단순) — 패턴 정착용 first-mover.
A-2. UL-QP-18-06 (checkout + rental variant 2종)
A-3. UL-QP-18-08 (Cable Path Loss, 다중 시트)
A-4. UL-QP-18-10 (공용 장비 사용/반납)

### Success Criteria

| # | Criterion |
|---|---|
| A1 | dispatcher 함수별 body ≤ 15줄 (DB/ExcelJS/DocxTemplate 호출 0건) |
| A2 | 각 도메인에 layout.ts + export-data.service.ts + renderer.service.ts 존재 |
| A3 | 각 도메인 module.ts 등록 + reports.module.ts import |
| A4 | backend test + tsc + build PASS |
| A5 | 분리 전후 동일 파라미터 export 결과 동일 |
| A6 | 신규 코드 any 0건, eslint-disable 0건 |

---

## Phase B: history-card QP-18-02 E2E §5 섹션 라벨 검증

### Goal

`wf-history-card-export.spec.ts`에 §5 섹션 유형 라벨 검증 test block 추가.

### Files

- 수정: `apps/frontend/tests/e2e/workflows/wf-history-card-export.spec.ts`

### Success Criteria

| # | Criterion |
|---|---|
| B1 | §5 섹션 라벨 검증 test block 신규 추가 |
| B2 | 라벨 SSOT 경유 (`@equipment-management/schemas` import) |
| B3 | `pnpm --filter frontend run test:e2e -- wf-history-card-export` PASS |

---

## Phase C: EXPORT_QUERY_LIMITS 스트리밍 결정

### Goal

5,000+ 행 시 메모리 부담 실측 → Go/No-Go 판정 → 문서화.

### Deliverable

`docs/references/export-streaming-decision.md`

### Success Criteria

| # | Criterion |
|---|---|
| C1 | 파일 존재, 실측 수치(RSS/duration) 포함 |
| C2 | 명시적 Go/No-Go 판정 |

---

## Phase D: 보안·정책 감사 (분석만)

### D.1 equipment.controller.ts:472 시스템관리자 직접 승인 경로

조사 대상: `apps/backend/src/modules/equipment/equipment.controller.ts:441,472`

분석 항목:
1. LAB_MANAGER의 장비 수정 직접 승인 권한이 UL-QP-18 §5.2에 명시되는가?
2. Permission guard 중복 체크 여부
3. approvalStatus 필드 클라이언트 주입 가능성
4. Audit 로그 기록 여부

### D.2 Permission.EXPORT_REPORTS × test_engineer 정책

조사 대상: `packages/shared-constants/src/role-permissions.ts:74`

분석 항목:
1. test_engineer가 UL-QP-19-01 직접 수행 의도인가?
2. SiteScopeInterceptor 가 타 팀 데이터 노출 방지하는가?
3. 교정계획서 export 시험실무자 권한 적절성

### Success Criteria

| # | Criterion |
|---|---|
| D1 | findings 3항목 기재 (현재 상태/리스크/권고) |
| D2 | 코드·상수 변경 0건 |

---

## Phase E: 양식 교체 운영 Runbook

### Deliverable

`docs/operations/form-template-replacement.md` — 6개 필수 섹션 포함.

---

## Build Checklist

- [ ] A-1. UL-QP-18-07 3-way 분리 + 테스트 통과
- [ ] A-2. UL-QP-18-06 3-way 분리 + 테스트 통과
- [ ] A-3. UL-QP-18-08 3-way 분리 + 테스트 통과
- [ ] A-4. UL-QP-18-10 3-way 분리 + 테스트 통과
- [ ] B. history-card §5 E2E 테스트 추가 + PASS
- [ ] C. streaming decision 문서 작성
- [ ] D.1 equipment.controller.ts:472 findings 기재
- [ ] D.2 EXPORT_REPORTS × test_engineer findings 기재
- [ ] E. form-template-replacement.md 작성
- [ ] Final: tsc + build + test all pass

## Phase D Findings (populated during execution)

### D.1 Findings — equipment.controller.ts:472 시스템관리자 직접 승인 경로

**분석 대상**: `apps/backend/src/modules/equipment/equipment.controller.ts:441-477`

| 항목 | 현재 상태 | 리스크 | 권고 |
|---|---|---|---|
| 1. 역할 범위 | `isAdmin = userRoles.includes(UserRoleValues.LAB_MANAGER)` — 변수명 `isAdmin`이지만 실제로는 `lab_manager` 체크. `system_admin`/`quality_manager`는 해당 분기 진입 불가 | **낮음** — 변수명 혼란이 코드 가독성 저하시킬 수 있으나 동작은 의도대로. UL-QP-18 §5.2: 시험설비책임자(lab_manager)의 장비 등록·수정 승인 권한 명시됨 | 변수명 `isLabManager`로 개선 권고 (기능 변경 아님, 가독성) — 별도 PR |
| 2. Permission guard 중복 | `@RequirePermission(Permission.UPDATE_EQUIPMENT)`가 컨트롤러 수준에서 이미 적용. LAB_MANAGER 직접 분기 진입 전 권한 통과 보장됨 | **없음** — 이중 검증 구조로 우회 불가 | 유지 |
| 3. `approvalStatus` 클라이언트 주입 | `updateEquipmentDto.approvalStatus === ApprovalStatusEnum.enum.approved` — 클라이언트가 `approved`를 body에 주입 가능. 단, `isAdmin` 조건이 선행되어 LAB_MANAGER가 아닌 사용자는 해당 분기 도달 불가 | **낮음** — 일반 사용자가 `approved`를 주입해도 직접 승인 분기 진입 불가. 하지만 Zod 스키마에서 `approvalStatus` 필드를 UPDATE 요청에서 명시적으로 허용하는지 재검토 권고 | Zod DTO에서 `approvalStatus`를 `lab_manager` 전용 optional 필드로 분리하는 것 권고 — 별도 PR |
| 4. Audit 로그 | `markApprovalMeta(uuid, userId)` 호출 → `approvedBy`, `approvedAt` 기록. AuditInterceptor가 PATCH 이벤트 자동 캡처 | **없음** — 감사 추적 완전함 | 유지 |

**결론**: 현재 구현은 기능적으로 안전하나, 변수명 혼란과 DTO 필드 분리 개선이 권고됨. 코드 변경은 별도 PR에서 처리.

---

### D.2 Findings — Permission.EXPORT_REPORTS × test_engineer 정책

**분석 대상**: `packages/shared-constants/src/role-permissions.ts` test_engineer 블록 (line 74)

| 항목 | 현재 상태 | 리스크 | 권고 |
|---|---|---|---|
| 1. test_engineer UL-QP-19-01 직접 수행 의도 | `test_engineer` → `EXPORT_REPORTS` 포함. QP-19-01 교정계획서 export는 팀 스코프로 제한. 시험실무자가 자기 팀의 교정계획서를 직접 다운로드 가능 — 현장 실무 흐름과 일치 (교정 수행 전 계획 확인 목적) | **낮음** — 읽기 전용 export, 계획서 수정 권한 없음 | 유지. 의도된 정책 |
| 2. SiteScopeInterceptor 타 팀 데이터 노출 방지 | `test_engineer`는 `teamId` 스코프 적용 — `SiteScopeInterceptor`가 `enforcedScope.teamId`로 쿼리 제한. 타 팀의 교정계획서는 SELECT 단계에서 차단됨 | **없음** — 아키텍처 수준 격리 적용 | 유지 |
| 3. 교정계획서 export 시험실무자 권한 적절성 | UL-QP-18 §5.2: 시험실무자는 교정 대상 장비 담당자로서 교정계획 숙지 의무 있음. EXPORT_REPORTS는 열람·출력 목적 — 승인/수정 권한과 분리됨 | **없음** — 절차서와 부합 | 유지 |

**결론**: `test_engineer` + `EXPORT_REPORTS` 정책은 절차서 §5.2와 일치하며, SiteScopeInterceptor의 팀 격리로 데이터 노출 위험 없음. 정책 변경 불필요.
