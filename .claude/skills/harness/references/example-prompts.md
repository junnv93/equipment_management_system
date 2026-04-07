# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-08 (29차 — 시니어 dev/RF cert 시각 부채 스캔, 신규 4건 + 사용자 결정 1건)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

## 현재 미해결 프롬프트: 4건 (+ 사용자 결정 대기 1건)

### 🟠 HIGH — UL-QP-19-01 exporters map 누락 (런타임 NotImplementedException) (Mode 0)

```
packages/shared-constants/src/form-catalog.ts:121-129 에서 'UL-QP-19-01'이
implemented: true 로 마킹되어 있지만, apps/backend/src/modules/reports/form-template-export.service.ts:110-122
의 exporters Record에는 해당 키가 등록되어 있지 않다 (UL-QP-18-10이 마지막).

이 상태로는 사용자가 UL-QP-19-01 export 요청 시 controller가 isImplemented(formNumber) → true 로 통과한 뒤
exporters[formNumber]가 undefined → 런타임 NotImplementedException 또는 빈 응답으로 폴백된다.

옵션 A: UL-QP-19-01 exporter 구현 (procedure 원문 확인 후 — fabricate 금지)
옵션 B: form-catalog.ts에서 implemented: false 로 임시 강등 + tech-debt 트래커 등록

작업 전 사용자에게 어느 옵션인지 확인할 것. 도메인 데이터를 임의로 만들면 안 됨.

검증:
- pnpm --filter backend exec tsc --noEmit exit 0
- pnpm --filter backend run test exit 0
- 옵션 A: form-template-export.service.ts에 exportXxx 메서드 + exporters[formNumber] 등록
- 옵션 B: form-catalog.ts UL-QP-19-01 implemented: false, isImplemented() 테스트 추가
```

### 🟠 HIGH — self-inspections.service.ts CAS 중복 구현 (VersionedBaseService 미상속) (Mode 1)

```
apps/backend/src/modules/self-inspections/self-inspections.service.ts:25 가 VersionedBaseService를
상속하지 않고 수동으로 CAS를 구현하고 있다 (lines 185-192, 235, 295-302, 304-319).
다른 12개 서비스(checkouts, calibration, equipment, disposal 등)는 모두 base class의
updateWithVersion<T>() 헬퍼를 사용해 atomic check+update 한다.

현재 패턴의 문제:
1. 라인 185 pre-check + 라인 235 WHERE eq(version) 분리 → 두 단계 사이에 race window 존재
2. createVersionConflictException() 수동 throw — 다른 서비스와 에러 메시지/코드 divergence 위험
3. confirm() (라인 304-319)는 transaction으로 감싸지지 않음. checkout.approve(line 1821), calibration.approve(line 1188)는 transaction 사용

작업:
1. SelfInspectionsService extends VersionedBaseService 로 변경
2. update()/confirm()의 manual CAS를 this.updateWithVersion<EquipmentSelfInspection>(...) 호출로 교체
3. confirm()의 status update + items reload 를 this.db.transaction()으로 감싸기

CAS 의미는 변경 금지 — 동일한 동시성 보장이어야 함.

검증:
- pnpm --filter backend exec tsc --noEmit exit 0
- pnpm --filter backend run test -- --grep "self-inspection" exit 0
- grep "extends VersionedBaseService" self-inspections.service.ts → 1 hit
- grep "updateWithVersion" self-inspections.service.ts → 2+ hits
- 회귀 0 (전체 backend test)
```

### 🟠 HIGH — Docker base image Node 18 → Node 20 LTS 업그레이드 (Mode 0)

```
docker/backend.Dockerfile:1 (FROM node:18-alpine)
docker/frontend.Dockerfile:1 (FROM node:18-slim)

Node 18은 2025-04-30 EOL 도달함 (현재 2026-04-08 기준 1년 지남).
보안 패치 미수신 + 일부 의존성(예: 최신 NestJS/Next.js)이 Node 20+ engines 요구.

작업:
1. 두 Dockerfile FROM line만 node:20-alpine / node:20-slim 으로 변경
2. multi-stage 내 모든 stage 동일 변경 (base 외 builder/runner 등 grep 후 일괄)
3. package.json engines 필드에 "node": ">=20.0.0" 명시 (없는 경우 추가)

검증:
- grep "node:18" docker/ → 0 hit
- grep "node:20" docker/ → 2+ hit
- pnpm --filter backend run build exit 0 (로컬 호환성 확인)
- pnpm --filter frontend run build exit 0
- (선택) docker compose build 통과
```

### 🟡 MEDIUM — use-management-number-check.ts setQueryData 안티패턴 (Mode 0)

```
apps/frontend/hooks/use-management-number-check.ts:135 에서 queryClient.setQueryData(...)를
직접 호출한다. CLAUDE.md Rule "useOptimisticMutation의 onSuccess에서 setQueryData 호출 금지
(TData ≠ TCachedData 75%)" 위반 가능 지점이다.

use-optimistic-mutation.ts:38, 280 본인 파일이 이 안티패턴을 명시적으로 금지하고 있는데
별도 hook이 같은 패턴을 우회한다.

작업:
1. line 135 setQueryData가 TData/TCachedData 일치하는지 검사 (Read 후 타입 확인)
2. 일치하면: 인라인 주석으로 의도 명시 + 타입 가드 추가
3. 불일치하면: invalidateQueries(queryKeys.management.check(value))로 교체

검증:
- pnpm --filter frontend exec tsc --noEmit exit 0
- 변경 후 관리번호 중복 체크 동작 직접 테스트(또는 기존 unit test 회귀)
- grep "setQueryData" use-management-number-check.ts → 0 hit (교체한 경우) or 주석 포함 1 hit
```

---

## 사용자 결정 대기 (1건)

### ❓ UL-QP-18-02 이력카드 form-catalog 플래그 vs endpoint 불일치

**상황:**
- `packages/shared-constants/src/form-catalog.ts:44-49` → UL-QP-18-02 `implemented: false`
- `packages/shared-constants/src/api-endpoints.ts:34` → `EQUIPMENT.HISTORY_CARD` endpoint 정의됨
- `form-template-export.service.ts` exporters map에는 UL-QP-18-02 키 없음

**질문:** UL-QP-18-02 (이력카드)는 별도 history-card endpoint로 출력하는 게 정책인가, 아니면 통합 form-template-export 경로로 합쳐야 하는가?
- A안: history-card 전용 경로 유지 → form-catalog 주석에 "별도 endpoint" 명시 (현 상태 유지, 문서화만)
- B안: form-template-export로 통합 → exporter 추가 + implemented: true 변경
- C안: 둘 다 유지 (중복 OK, 사용자가 양쪽 모두 호출 가능)

도메인 절차서(UL-QP-18) 기준 의도 확인 필요.

---

## False Positives (29차, 2026-04-08 스캔)

| 항목 | Agent | 검증 결과 |
|---|---|---|
| calibrations/non_conformances/equipment_imports/software_validations에 version 컬럼 없음 | C | **FALSE** — 4개 모두 `version: integer('version').notNull().default(1)` 존재 |
| disposal.controller.ts review/approve에 @AuditLog 없음 | A | **FALSE** — review:108, approve:147에 존재 |
| use-optimistic-mutation.ts:227 setQueryData 위반 | B | **FALSE** — onMutate 내부 optimistic update 컨텍스트(허용 패턴), 금지된 건 onSuccess만 |
| useState로 searchInput 관리(SSOT 위반) | B | **FALSE** (의심) — debounce input local state는 URL push와 별개의 일반 패턴, 필터 자체는 URL이 여전히 SSOT |

---

<details>
<summary>✅ 아카이브 — 완료된 프롬프트 (28차 세션, 2026-04-05)</summary>

### ~~🟠 HIGH — WF-17/18 E2E: 팀 스코프 테스트 데이터 조정~~ ✅ 완료

> 28차 (2026-04-05). workflow-helpers.ts 버그 4건 수정: startCheckout/returnCheckout PATCH→POST,
> 기본 role TE→TM, correctNonConformance API 경로. 장비 FCC EMC/RF 팀으로 변경.
> WF-17 5/5 PASS, WF-18 4/4 PASS.

### ~~🟠 HIGH — WF-19 E2E: 중간점검표 3단계 승인 + 반려~~ ✅ 완료

> 26차 (2026-04-05). wf-19-intermediate-inspection-3step-approval.spec.ts 생성.
> 9/9 PASS: draft→submitted→reviewed→approved + 반려 흐름.
> TE 권한 추가 (UPDATE_CALIBRATION), 교정 시드 고정 UUID (CALIB_001~003).

### ~~🟡 MEDIUM — WF-20 E2E: 자체점검표 확인 + 잠금~~ ✅ 완료

> 26차 (2026-04-05). wf-20-self-inspection-confirmation.spec.ts 생성.
> 7/7 PASS: 생성→수정→확인→잠금(수정/삭제 400)→권한(TE confirm 403).
> API 직접 생성 방식 — 시드 무의존.

### ~~🟡 MEDIUM — TE 교정 권한 검토: 중간점검 작성 권한 갭~~ ✅ 완료

> 26차 (2026-04-05). TE에게 UPDATE_CALIBRATION 추가 (role-permissions.ts).
> 절차서 기준 TE가 중간점검 점검자.

### ~~🟠 HIGH — E2E 시드 데이터: 교정 UUID 시딩~~ ✅ 부분 완료

> 26차 (2026-04-05). calibrations.seed.ts에 CALIB_001~003 고정 UUID 부여.
> WF-19 교정 시드 의존성 해결. WF-17/18 팀 스코프는 별도 프롬프트.

### ~~🟠 HIGH — API_ENDPOINTS.INTERMEDIATE_INSPECTIONS 미정의~~ ✅ 완료

> 25차 (2026-04-05). api-endpoints.ts에 INTERMEDIATE_INSPECTIONS 섹션 7개 엔드포인트 추가.

### ~~🟢 LOW — auth.controller.ts login/refresh @AuditLog 미적용~~ ✅ 완료

> 25차 (2026-04-05). login에 @AuditLog create, refresh에 @AuditLog update 추가.

### ~~🟠 HIGH — Frontend Dockerfile pnpm 버전 불일치~~ ✅ 완료

> 25차 (2026-04-05). pnpm@10.7.0 → 10.7.1 통일 (3곳).

### ~~🟡 MEDIUM — 새 라우트 error.tsx / loading.tsx 누락~~ ✅ 완료

> 25차 (2026-04-05). software/create/ error.tsx + loading.tsx 추가.

### ~~🟡 MEDIUM — 유효성확인 방법 1 공급자 첨부파일 + 수정 UI~~ ✅ 완료

> 커밋 fa466d99 (2026-04-05). ValidationDetailContent.tsx에 문서 첨부파일 Card 추가.

### ~~🟠 HIGH — UL-QP-18 절차서 준수 갭 해소~~ ✅ 완료

> PR #109 (2026-04-05). Harness Mode 2, MUST 15/15 PASS.

### SHOULD
- E2E CSS 셀렉터 → getByRole/getByText 전환 — pending-checks + create-equipment (2026-04-03, 10차)
- ReportsContent date-fns format → useDateFormatter 전환 (2026-04-03, 10차)

### ~~🟡 MEDIUM — 소프트웨어 관리대장 페이지네이션 + manufacturer 필터~~ ✅ 완료
### ~~🟡 MEDIUM — P0043 중복 관리번호 UNIQUE 제거~~ ✅ 완료
### ~~🟡 MEDIUM — 유효성확인 방법 1 receivedBy/receivedDate~~ ✅ 부분 완료
### ~~🟡 MEDIUM — AlertsContent aria-label~~ ✅ 완료
### ~~🟡 MEDIUM — Notifications @AuditLog + VIEW 퍼미션~~ ✅ 완료
### ~~🟡 MEDIUM — error.tsx / loading.tsx 루트별~~ ✅ 대부분 완료
### ~~🟠 HIGH — CI trivy-action + copilot-setup-steps~~ ✅ 완료
### ~~🟠 HIGH — UL-QP-18-03 중간점검표~~ ✅ 완료
### ~~🟠 HIGH — UL-QP-18-08 Cable/Path Loss~~ ✅ 완료
### ~~🟠 HIGH — 승인 대시보드 QM 누락~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — test_software createdBy~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — calibration_plans FK~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 유효성 확인 상세 뷰 + 반려~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 유효성확인 DB 컬럼 + 품질승인~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 장비 상세 탭 통합~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 장비↔시험용SW M:N 링크~~ ✅ 완료 (이전 세션)
### ~~🔴 CRITICAL — 소프트웨어 도메인 재설계~~ ✅ 완료 (PR #104)
### ~~🔴 CRITICAL — 담당자(정/부) JOIN + 폼 필드~~ ✅ 완료 (이전 세션)
### ~~🔴 CRITICAL — UL-QP-18-09 방법 2 프론트엔드~~ ✅ 완료 (이전 세션)
### ~~🔴 CRITICAL — 유효성확인 첨부파일 인프라~~ ✅ 완료 (이전 세션)

</details>

<details>
<summary>❌ False Positives — 누적 (22~26차)</summary>

### cables/intermediate-inspections 전용 Permission 분리 필요
> 사용자 판단: TE가 장비/교정/케이블 전부 조회·작성하는 게 기본 권한. 교정 권한 재사용 유지. FALSE POSITIVE (설계 의도).

### docker-compose.prod.yml postgres depends_on condition 누락
> 검증 결과: `condition: service_healthy` 명시 확인. FALSE POSITIVE.

### SELF_INSPECTIONS CREATE endpoint 누락
> BY_EQUIPMENT이 POST/GET 겸용 RESTful 패턴. FALSE POSITIVE.

### Cable enum / SelfInspection enum 미사용
> 프론트엔드 3파일 + 백엔드 DTO 2파일에서 사용 확인. FALSE POSITIVE.

### self-inspections delete() 캐시 무효화 누락
> 서비스에 캐시 인프라 자체가 없음. FALSE POSITIVE.

### SW-validations update/revise userId 미추출
> 이미 @Request() _req 있음. FALSE POSITIVE.

### Dockerfile COPY / history-card XML / console.log / 하드코딩 / FK 인덱스
> 모두 이전 세션에서 이미 수정 완료. FALSE POSITIVE (스캔 시점 차이).

### intermediate-checks API 미구현 (22차)
> calibration.controller.ts에 구현 확인. FALSE POSITIVE.

### software-validations update() 캐시 무효화 (22차)
> service에서 호출 확인. FALSE POSITIVE.

</details>
