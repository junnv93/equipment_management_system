# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-08 (36차 — generate-prompts 전체 스캔, CRITICAL 1 + HIGH 6 + MEDIUM 3 신규 등재, 34차 stale 4건 정리)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

> **완료된 항목은 [example-prompts-archive.md](./example-prompts-archive.md)로 분리 (2026-04-09 36차 정리).**
> 현재 파일은 활성(미해결) harness 프롬프트만 포함. 새 프롬프트는 활성 영역에 추가.

---

## 36차 신규 — generate-prompts 3-agent 병렬 스캔 (10건)

> **발견 배경 (2026-04-08, 36차)**: aria-label SSOT 롤아웃(35차) 완료 후 example-prompts.md 상단 우선순위가 모두 stale로 확인되어 generate-prompts 스킬 실행. Backend/Frontend/Infra+Packages 3개 에이전트 병렬 스캔 + 2차 verify(Read/Grep) 통과한 항목만 등재. **#10 (Reports/Alerts URL SSOT) 의 Alerts 부분은 커밋 95534053 에서 별도 처리됨 — Reports 부분만 잔존.**

### 🟡 MEDIUM — Frontend Dockerfile build stage root 실행 + pnpm 중복 install

```
배경: apps/frontend/Dockerfile 의 build 스테이지(line 23-58)에서 `npm install -g pnpm`이
3개 스테이지에서 반복 실행되고, build 스테이지가 USER 직권 없이 root로 `npm run build`를
실행한다. production 스테이지(line 67-89)만 비-root로 전환. 또한 HEALTHCHECK 디렉티브가
production 스테이지에 부재. apps/backend/docker/Dockerfile 도 동일 패턴.

근본 해결:
1. multi-stage builder에서 deps 스테이지를 하나로 통합 → COPY --from=deps 로 재사용
2. build 스테이지에도 `USER node` 적용 (또는 별도 build user)
3. production 스테이지에 HEALTHCHECK 추가: `HEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1`
4. 동일 변경 backend Dockerfile에도 적용

영향 범위: apps/frontend/Dockerfile + apps/backend/docker/Dockerfile (2 파일). Mode 1.

검증:
- docker build 양 이미지 성공
- docker run 후 HEALTHCHECK status healthy 확인
- 이미지 크기 비교 (deps 통합 전/후)
```

### 🟡 MEDIUM — Backend Dockerfile layer caching 깨짐 (lockfile-only 레이어 무효화)

```
배경: apps/backend/docker/Dockerfile builder 스테이지에서 `pnpm install --frozen-lockfile`
(line 60) 직후 `COPY . .` (line 63) 가 실행되어 lockfile-only 레이어 캐싱 효과가 사라진다.
prod-deps 스테이지는 또다시 전체 install을 실행 → 같은 빌드에서 install 3회. CI 시간 손실.

근본 해결:
1. lockfile + package.json 만 먼저 COPY → install → 그 다음 COPY . . (표준 docker layer
   caching 패턴)
2. prod-deps 스테이지는 builder의 node_modules를 COPY --from 으로 재사용

영향 범위: apps/backend/docker/Dockerfile. Mode 0~1.

검증:
- docker build 시간 측정 (변경 전/후)
- 레이어 수 감소
```

## 34차 후속 — wf20-infra-debt harness 결과 review-architecture tech debt (3건)

> **발견 배경 (2026-04-08, wf20-infra-debt harness PASS 직후 review-architecture)**:
> SelfInspectionTab.tsx 행 액션 aria-label SSOT 패턴 도입 후, 동일 도메인의 다른 컴포넌트에서
> divergence가 확인되었다. wf20-infra-debt harness contract의 SHOULD criteria로 분류되었던
> 항목 + producer/consumer scope 정합성 검증 중 발견된 항목을 등재.

### 🟢 LOW — sticky-header CSS 변수명 string literal 중복 (3 곳, 4번째 등장 시 상수화)

```
배경: wf20-infra-debt harness review-architecture 검증 결과:
'--sticky-header-height' CSS 변수가 producer 1곳 + consumer 2곳에 string literal 로 중복 박혀 있다:
1. Producer: apps/frontend/components/equipment/EquipmentDetailClient.tsx:96
   document.documentElement.style.setProperty('--sticky-header-height', ...)
2. Consumer (CSS): apps/frontend/lib/design-tokens/components/equipment.ts:809
   top-[var(--sticky-header-height,0px)]
3. Consumer (e2e): apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts:34
   getComputedStyle(documentElement).getPropertyValue('--sticky-header-height')

세 지점 모두 :root 스코프로 통일되어 silent 0 반환 리스크는 없으나, 4번째 consumer (예: 다른
sticky tab 컨테이너) 가 등장할 때 오타/스코프 불일치 가능성이 있다.

작업 (4번째 consumer 등장 시점에만 진행 — 현재는 over-engineering):
1. apps/frontend/lib/design-tokens/primitives/ 또는 shared-constants 에
   STICKY_HEADER_HEIGHT_VAR = '--sticky-header-height' 상수 추가
2. 3 곳 모두 import 로 교체
3. /verify-hardcoding 룰: CSS 변수명 string literal 2회+ 사용 시 상수화 권고 추가 (선택)

검증:
- pnpm tsc --noEmit exit 0
- grep "'--sticky-header-height'" apps/frontend → import 외 0 hit

⚠️ 현재는 트리거 조건 미달 (3 hit). 4번째 hit 발생 시 자동 승격.
```

## 33차 신규 — review-architecture 후속 이슈 (3건)

### 🟢 LOW — global-setup 에러 로그 정밀화 (seed vs trigger-overdue 구분) (Mode 0)

```
apps/frontend/tests/e2e/global-setup.ts 의 외부 try/catch 가 seed 실패 + trigger-overdue
실패 둘 다 "❌ 시드 데이터 로딩/검증 실패" 메시지로 출력한다. 실제로는 trigger-overdue
가 throw 한 경우도 있어 디버깅 시 misleading.

작업:
1. trigger-overdue 블록을 별도 try/catch 로 분리 (여전히 outer throw 유지)
2. 각각 다른 error prefix 출력:
   - "❌ 시드 데이터 로딩/검증 실패" (seed 전용)
   - "❌ 교정 기한 초과 트리거 실패" (trigger-overdue 전용)
3. 두 경우 모두 수동 재현 명령을 함께 출력

검증:
- pnpm --filter frontend exec tsc --noEmit exit 0
- 두 에러 경로를 주석으로 설명 (향후 작업자 혼동 방지)
```

---

## 현재 미해결 프롬프트: 9건 (+ 사용자 결정 대기 1건) — 33차 신규 3건 포함 (상단 참조)

### 🟢 LOW — WF-25 spec D-day 배지 soft assertion 보강 (Mode 0)

```
apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts 는 현재
알림 → 장비 상세 → checkouts/create prefill 까지는 검증하지만, 장비 상세 페이지의
EquipmentStickyHeader calibrationStatus 배지 (D-7/D-30/기한 초과) 는 검증하지 않는다
(주석 8)번에 의도적 생략 명시).

본 cross-flow 가 "alerts 의 교정 임박 신호 → 장비 상세의 교정 강조 시각 신호" 일관성을
cover하려면 soft assertion 추가가 필요하다.

작업:
1. 장비 상세 페이지 진입 후, calibrationStatus 배지 locator 확인 (D-\d+ 또는 기한 초과)
2. `if (await badge.count() > 0) await expect(badge).toBeVisible()` 형태의 soft 검증 추가
3. 배지가 없는 경우(일반 상태)는 skip 하지 않고 통과 (soft 성격 유지)

검증:
- pnpm --filter frontend exec playwright test wf-25-alert-to-checkout --project=chromium 통과 유지
- tech-debt-tracker.md 해당 항목 해결 처리
```

## 31차 신규 — Export spec API-only 갭 + WF-21 후속 (4건)

> **갭 발견 배경 (2026-04-08, 31차)**: WF-21 cable path loss spec을 wf-19b/wf-20b 패턴 답습해 작성한 결과 API-only로 정착. 사용자 피드백: "테스트 후 어떤 UI가 검증되었는지 항상 설명해라"
> → 스캔 결과 wf-19b/wf-20b/wf-21 3개 export spec 모두 사용자가 누르는 "내보내기" 버튼 동선이 0건 검증된 상태. 패턴화된 회귀 위험.
> 또한 WF-21 자체의 케이블 등록 다이얼로그/측정 폼 다이얼로그도 미검증 (기존 spec은 백엔드 API만 호출).

### 🟡 MEDIUM — Export 다운로드 UX 검증 spec (wf-19b/20b/21 공통 갭)

```
3개 export spec (wf-19b-intermediate-inspection-export, wf-20b-self-inspection-export,
wf-21-cable-path-loss) 모두 page.request.get 으로 API 응답만 검증한다.
**사용자가 화면에서 클릭하는 "내보내기" 버튼 → 브라우저 다운로드 트리거** 동선은
0건 검증.

미검증 항목:
- 목록/상세 페이지의 "내보내기" 버튼/드롭다운 가시성
- 클릭 시 download 이벤트 발생 (page.waitForEvent('download'))
- Content-Disposition filename* UTF-8 인코딩이 OS에 도달했을 때 한국어 깨짐 없음
- 다운로드 진행 토스트/스피너
- 에러 시 (404/500) 사용자 피드백 토스트

작업:
1. apps/frontend/tests/e2e/workflows/wf-export-ui.spec.ts 신규 (3개 양식 통합 또는 spec 분리)
2. 시나리오 per 양식 (UL-QP-18-03 / UL-QP-18-05 / UL-QP-18-08):
   a. 데이터 prerequisite 확보 (API로 1건 생성 — 기존 helper 재사용)
   b. 해당 목록 페이지 (/equipment/[id] 또는 /cables) 진입
   c. "내보내기" 버튼 클릭 (getByRole('button', { name: /내보내기/ }))
   d. const downloadPromise = page.waitForEvent('download'); await button.click();
   e. const download = await downloadPromise;
   f. expect(download.suggestedFilename()).toMatch(/UL-QP-18-(03|05|08)/)
   g. 한국어 파일명 깨짐 검증 (filename에 한글 포함 시 정상 디코딩)
   h. 다운로드 path 저장 후 파일 크기 > 1KB
3. 회귀 보호: 기존 wf-19b/20b/21 export API spec은 그대로 유지

확인 필요:
- 각 페이지 컴포넌트의 export 트리거 위치
  (CableListContent.tsx, IntermediateInspectionTab.tsx, SelfInspectionTab.tsx)
- 버튼이 양식별 select dropdown인지 단일 버튼인지

검증:
- pnpm --filter frontend exec playwright test wf-export-ui --project=chromium exit 0
- 회귀: wf-19b/20b/21 통과 유지
- 다운로드 임시 디렉토리 정리 (test.afterAll)
```

### 🟡 MEDIUM — Export spec UI 갭 패턴 가드 (verify-* 스킬 보강)

```
배경: 31차에서 wf-19b/20b/21 3개 export spec이 모두 API-only로 정착한 패턴이 발견됨.
앞으로 추가될 export spec (UL-QP-18-04/06/07/09/11 등 미작성 양식)도 동일 함정에 빠질
위험. verify-e2e 또는 verify-workflows 스킬에 가드 추가 필요.

작업:
1. .claude/skills/verify-e2e/SKILL.md (또는 verify-workflows) 에 새 체크 추가:
   - "export 키워드 + page.request.get 만 사용하는 spec은 동일 양식의 UI 다운로드 spec
     동행 여부 확인" 룰
   - grep 패턴: spec 파일 내 'export/form/UL-QP-18' 등장 + 'waitForEvent("download")' 부재
     → WARN
2. 또는 manage-skills 워크플로로 신규 verify-export-ui-coverage 스킬 생성
3. tech-debt-tracker.md에 "Export UI 다운로드 동선 미검증 양식" 누적 트래킹 항목 추가

검증:
- /verify-e2e (또는 신규 스킬) 실행 시 wf-19b/20b/21 3건이 WARN으로 보고됨
- 위 'WF-21 UI 동선 검증 spec'과 'Export 다운로드 UX 검증 spec' 추가 후 WARN 0건
- 메타 변경이므로 tsc/test 영향 없음

선택: 단순 docs/development/E2E_PATTERNS.md 에 "export spec은 API + UI 다운로드 한 쌍으로
작성" 가이드라인 명시만 해도 가능 (스킬 보강 vs 문서화 — 사용자 결정 필요)
```

---

## 현재 미해결 프롬프트: 3건 (29차 이월 1건 + 30차 후속 2건)

> **30차 처리 (2026-04-08)**: #6 self-inspections CAS 통일 ✅ PASS, #7 Docker Node 20 LTS ✅ 완료, #8 setQueryData → false positive
> **30차 후속 등재**: review-architecture/verify-security에서 발견한 dormant code path + hardening gap 2건

### 🟡 MEDIUM — Dockerfile USER 미선언 (root 실행 hardening) (Mode 0)

```
30차 (2026-04-08) verify-security에서 발견 (pre-existing). 두 Dockerfile 모두 USER
디렉티브가 없어 모든 stage가 root로 실행된다. CIS Docker Benchmark 4.1 위반.

확인된 파일:
- docker/backend.Dockerfile (alpine, 5 stages: base/deps/development/builder/production)
- docker/frontend.Dockerfile (slim, 5 stages: base/deps/development/builder/production)

node:20-alpine은 기본 'node' user를 제공 (uid 1000). slim도 동일.

작업:
1. backend.Dockerfile production stage 끝부분에 USER node 추가
   - WORKDIR /app 소유권을 node:node로 chown (COPY --chown=node:node)
2. frontend.Dockerfile production stage 동일
3. development stage는 volume mount 권한 충돌 가능 — production만 적용 권장
4. CMD/ENTRYPOINT가 :80/:443 등 privileged port 사용 안 하는지 확인 (현재 3000/3001 → OK)

검증:
- docker compose -f docker-compose.prod.yml build (가능 시)
- docker run --rm -it <image> id → uid=1000(node) gid=1000(node)
- 컨테이너 내부에서 /app 쓰기 가능 (logs/uploads 디렉토리 권한)
- pnpm tsc --noEmit / test 무관 (Dockerfile만 변경)

선택: development stage도 USER node 시 docker-compose volume mount 시 host UID 매핑
필요 → 별도 작업으로 분리 가능
```

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

### SHOULD
- E2E CSS 셀렉터 → getByRole/getByText 전환 — pending-checks + create-equipment (2026-04-03, 10차)
- ReportsContent date-fns format → useDateFormatter 전환 (2026-04-03, 10차)

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
