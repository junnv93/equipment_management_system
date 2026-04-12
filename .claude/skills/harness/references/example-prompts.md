# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-12 (45차 — 기존 프롬프트 전수 STALE 확인 + 3-agent 병렬 스캔 재실행)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

## 37차 정리 (2026-04-09) — Dockerfile hardening 실빌드 검증

`docker build --target production` 실측으로 36차/30차/29차에 등재됐던 **Docker 관련 4건 전부 stale 확인 → 아카이브**. 동시에 fresh 빌드에서만 드러나는 **실제 근본 버그 2건** 발견 + root-cause 수정(tracker `Frontend/Backend Dockerfile hardening 검증` 참조):

1. `preinstall` 훅이 참조하는 `scripts/check-no-stale-lockfiles.mjs` 가 deps 레이어에 COPY 되지 않아 fresh 빌드가 `MODULE_NOT_FOUND` 로 실패 → 단일 파일 COPY 추가 (manifest 캐시 재사용률 유지).
2. `prod-deps` 스테이지의 `pnpm install --prod` 가 husky(devDep) `prepare` 훅에서 `sh: husky: not found` → `--ignore-scripts` 로 전환 (`--frozen-lockfile` 이 lockfile 무결성을 이미 보장해 preinstall 검증 중복 제거).

교훈: "정적 구조만 확인된 hardening 체크리스트" 는 실제 `docker build` 1회로 모두 검증되어야 한다. 이후 Dockerfile 변경은 CI 또는 로컬에서 fresh 빌드 실행을 필수 절차로 삼을 것.

---

> **완료된 항목은 [example-prompts-archive.md](./example-prompts-archive.md)로 분리 (2026-04-09 36차 정리).**
> 현재 파일은 활성(미해결) harness 프롬프트만 포함. 새 프롬프트는 활성 영역에 추가.

---

## 36차 신규 — generate-prompts 3-agent 병렬 스캔 (10건)

> **발견 배경 (2026-04-08, 36차)**: aria-label SSOT 롤아웃(35차) 완료 후 example-prompts.md 상단 우선순위가 모두 stale로 확인되어 generate-prompts 스킬 실행. Backend/Frontend/Infra+Packages 3개 에이전트 병렬 스캔 + 2차 verify(Read/Grep) 통과한 항목만 등재. **#10 (Reports/Alerts URL SSOT) 의 Alerts 부분은 커밋 95534053 에서 별도 처리됨 — Reports 부분만 잔존.**

### ~~🟡 MEDIUM — Frontend Dockerfile build stage root 실행 + pnpm 중복 install~~ ✅ 아카이브 (37차, 2026-04-09)

> 실빌드 확인: USER node / deps 스테이지 통합 / HEALTHCHECK `/api/health` + `wget` / tini ENTRYPOINT 양쪽 Dockerfile 모두 이미 적용. `docker build --target production -t ems-frontend:verify .` 성공, 컨테이너 내 `id = uid=1000(node)` 확인. 37차 루트 수정(scripts COPY + `--ignore-scripts`) 까지 포함. 아카이브로 이동.

### ~~🟡 MEDIUM — Backend Dockerfile layer caching 깨짐 (lockfile-only 레이어 무효화)~~ ✅ 아카이브 (37차, 2026-04-09)

> 실빌드 확인: backend/frontend 모두 lockfile-only 레이어 + 별도 prod-deps 스테이지(alpine) 이미 적용. 2차 빌드 캐시 hit: backend 30 / frontend 14 단계 전부 CACHED (≤3s). 아카이브로 이동.

## 45차 신규 — 3-agent 병렬 스캔 + 2차 검증 (3건)

> **발견 배경 (2026-04-12, 45차)**: 기존 활성 프롬프트 5건 전수 STALE 확인 후, Backend/Frontend/Infra 3-agent 병렬 스캔 재실행.
> 2차 검증(Read/Grep)으로 FALSE POSITIVE 필터: .env 시크릿 노출(비추적), NC N+1(단일 호출), inspection FK(설계 의도) 등 제거.
> 검증 통과한 신규 이슈 3건 등재.

### 🟡 MEDIUM — Frontend loose typing: `status: string` / `role: string` → SSOT enum 적용 (Mode 1)

```
verify-ssot 위반: 10+ 컴포넌트에서 status/role 파라미터가 string으로 선언됨.
@equipment-management/schemas의 SSOT enum 타입을 사용해야 함.

확인된 위치 (status: string):
1. components/checkouts/CheckoutStatusBadge.tsx:17
2. components/checkouts/CheckoutGroupCard.tsx:50 (RentalFlowInline)
3. components/equipment/VirtualizedEquipmentList.tsx:36
4. components/equipment/EquipmentTable.tsx:83
5. components/equipment/EquipmentStickyHeader.tsx:89
6. components/equipment/CalibrationHistorySection.tsx:49
7. components/equipment/NonConformanceBanner.tsx:12
8. components/monitoring/MonitoringDashboardClient.tsx:74,95,139

확인된 위치 (role: string):
9. components/teams/TeamDetail.tsx:27
10. components/auth/DevLoginButtons.tsx:33
11. components/dashboard/WelcomeHeader.tsx:31
12. components/audit-logs/AuditTimelineFeed.tsx:125

작업:
1. 각 컴포넌트의 status 파라미터 → EquipmentStatus | CheckoutStatus 등 적절한 enum import
2. role 파라미터 → UserRole (from @equipment-management/schemas)
3. MonitoringDashboardClient의 3개 함수 → 적절한 status enum 또는 union type
4. CalibrationHistorySection → CalibrationStatus
5. NonConformanceBanner → NonConformanceStatus

검증:
- pnpm tsc --noEmit exit 0 (타입 불일치 시 컴파일 에러로 잡힘)
- grep 'status: string' apps/frontend/components → 0 hit (test 파일 제외)
- grep 'role: string' apps/frontend/components → 0 hit
- /verify-ssot PASS
```

### 🟡 MEDIUM — approvals-api.ts unsafe cast 제거: relation 타입 확장 (Mode 1)

```
approvals-api.ts에서 백엔드 joined relation 접근 시 `as unknown as Record<string, unknown>`
unsafe cast를 4곳에서 사용. 백엔드 API 응답 타입에 relation 필드가 누락되어 발생.

확인된 위치:
1. approvals-api.ts:988 — calibration.registeredByUser (Record cast)
2. approvals-api.ts:1097 — nc.corrector (Record cast)
3. approvals-api.ts:1100 — nc.discoverer (Record cast)
4. approvals-api.ts:1295 — item.requester (Record cast)

추가 확인된 unsafe cast (동일 패턴):
5. settings/notifications/NotificationsContent.tsx:114,118,129 — preferences cast

근본 원인:
- 백엔드 응답 타입(Calibration, NonConformance, EquipmentImport)에 join된 user/team relation 타입 미정의
- 프론트엔드 인터페이스가 백엔드 실제 응답 shape를 반영하지 않음

작업:
1. 프론트엔드 타입 확장: CalibrationWithRelations, NCWithRelations 등 relation 포함 인터페이스 정의
   (또는 기존 인터페이스에 optional relation 필드 추가)
2. approvals-api.ts: unsafe cast → 타입 가드 또는 optional chaining으로 교체
3. NotificationsContent.tsx: NotificationPreferences 타입 정의 + cast 제거
4. SSOT: relation 타입은 백엔드 select join 구조와 1:1 매핑

검증:
- pnpm tsc --noEmit exit 0
- grep 'as unknown as Record' apps/frontend/lib/api/approvals-api.ts → 0 hit
- grep 'as unknown as' apps/frontend/app/.*/NotificationsContent.tsx → 0 hit
```

### 🟢 LOW — notification scheduler partial failure 내성 강화 (Mode 0)

```
calibration-overdue-scheduler.ts:302-320에서 장비별 알림 전송 시
unique constraint 중복(23505)은 건너뛰지만, 그 외 에러 발생 시 전체 배치가 중단됨.

확인된 위치:
- modules/notifications/schedulers/calibration-overdue-scheduler.ts:302-320

작업:
1. 개별 장비 알림 전송을 Promise.allSettled() 또는 try-catch per-item으로 래핑
2. 실패한 장비 목록을 로그에 기록 (일부 성공 + 부분 실패 허용)
3. 전체 배치 실패가 아닌 개별 실패로 격리

검증:
- pnpm tsc --noEmit exit 0
- 백엔드 유닛 테스트 PASS
```

---

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

### ~~🟢 LOW — global-setup 에러 로그 정밀화~~ ✅ STALE (2026-04-09 38차 세션)

> 검증: `global-setup.ts:93-115` seed try/catch 와 `:121-152` trigger-overdue try/catch 가 이미 분리되어 있고, 각각 `"❌ 시드 데이터 로딩/검증 실패"` / `"❌ 교정 기한 초과 트리거 실패"` prefix + 수동 재현 명령(`pnpm ... seed-test-new.ts` / `curl -X POST ...`)을 출력한다. 주석(L90-91, L117-119)도 의도 설명 완료. 프롬프트 작성 시점 이후 이미 반영됨.

---

## 현재 미해결 프롬프트: 9건 (+ 사용자 결정 대기 1건) — 33차 신규 3건 포함 (상단 참조)

### ~~🟢 LOW — WF-25 spec D-day 배지 soft assertion~~ ✅ STALE (2026-04-09 38차 세션)

> 검증: `wf-25-alert-to-checkout.spec.ts:65-72` 에 `page.getByLabel(/^교정 상태:/)` soft assertion 이미 적용. 배지 부재 시(일반 상태) count=0 → 통과 (soft 성격 유지), 존재 시 visible 단언. aria-label SSOT 패턴(35차 롤아웃)으로 i18n 의존도 최소화. 프롬프트 작성 시점 이후 반영됨.

## 31차 신규 — Export spec API-only 갭 + WF-21 후속 (4건)

> **갭 발견 배경 (2026-04-08, 31차)**: WF-21 cable path loss spec을 wf-19b/wf-20b 패턴 답습해 작성한 결과 API-only로 정착. 사용자 피드백: "테스트 후 어떤 UI가 검증되었는지 항상 설명해라"
> → 스캔 결과 wf-19b/wf-20b/wf-21 3개 export spec 모두 사용자가 누르는 "내보내기" 버튼 동선이 0건 검증된 상태. 패턴화된 회귀 위험.
> 또한 WF-21 자체의 케이블 등록 다이얼로그/측정 폼 다이얼로그도 미검증 (기존 spec은 백엔드 API만 호출).

### ~~🟡 MEDIUM — Export 다운로드 UX 검증 spec (wf-19b/20b/21 공통 갭)~~ ✅ STALE (2026-04-12 45차 세션)

> 검증: `wf-export-ui-download.spec.ts` — 8개 양식(QP-18-01/03/05/06/07/08/09/10) 브라우저 다운로드 UX 검증 완료. `expectFileDownload` SSOT 헬퍼(`download-helpers.ts`)로 통합. waitForEvent('download') + filename pattern + RFC 5987 인코딩 검증 포함. API 회귀 테스트(wf-19b/20b/21)도 병행 유지.

### ~~🟡 MEDIUM — Export spec UI 갭 패턴 가드 (verify-* 스킬 보강)~~ ✅ 해결 (2026-04-09 38차 세션)

> 선택지 A 채택: `verify-e2e` Step 5b 에 allow-list 마커(`// @api-only: <사유>`) 룰 추가. 기존 35차 grep 가드에 marker 필터 단계 추가 + 2026-04-09 부분 해결 현황(wf-export-ui-download.spec.ts + expectFileDownload SSOT helper) 과 미커버 양식(QP-18-03/05/06/10 backend-only, QP-18-09 validation fixture) 명시. 의도된 API-only spec 은 마커로 명시적 opt-out, 미커버 양식은 silent drop 방지.

<details><summary>원문 (참고용)</summary>

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

</details>

---

## 현재 미해결 프롬프트: 2건 (29차 이월 1건 + 30차 후속 1건)

> **30차 처리 (2026-04-08)**: #6 self-inspections CAS 통일 ✅ PASS, #7 Docker Node 20 LTS ✅ 완료, #8 setQueryData → false positive
> **2026-04-09 harness 세션**: self-inspections CAS HIGH 항목 stale 재확인 (이미 완료 상태) → 비활성화. use-management-number-check.ts setQueryData MEDIUM 항목은 `fetchQuery`로 전환 완료 (commit 6de70a67).
> **30차 후속 등재**: review-architecture/verify-security에서 발견한 dormant code path + hardening gap 2건

### ~~🟡 MEDIUM — Dockerfile USER 미선언 (root 실행 hardening)~~ ✅ 아카이브 (37차, 2026-04-09)

> 실빌드 확인: backend/frontend production 스테이지 모두 `USER node` + `COPY --chown=node:node` + tini ENTRYPOINT 이미 적용. `docker run --entrypoint sh ems-*:verify -c 'id'` → `uid=1000(node) gid=1000(node)` 양쪽 확인. CIS Docker Benchmark 4.1 충족.

### ~~🟠 HIGH — UL-QP-19-01 exporters map 누락~~ ✅ STALE 아카이브 (2026-04-09 harness 세션)

> 검증 결과: form-catalog.ts 의 UL-QP-19-01 은 `dedicatedEndpoint: true` 로 마킹되어 있고, `form-template-export.service.ts:106-111` 의 `isFormDedicatedEndpoint()` 가드가 exporters 맵 lookup **이전에** `USE_DEDICATED_ENDPOINT` 를 throw 한다. 전용 exporter 는 `calibration-plans-export.service.ts` + `calibration-plans.controller.ts:364` (`GET /api/calibration-plans/export`) 로 실존하며 `FormTemplateService.getTemplateBuffer('UL-QP-19-01')` 로 실제 xlsx 를 생성한다. 프롬프트가 주장한 런타임 NotImplementedException 경로는 재현 불가. UL-QP-18-02 history-card 와 동일한 "전용 엔드포인트" 패턴 — SSOT/책임분리 모두 정상.

### ~~🟠 HIGH — self-inspections.service.ts CAS 중복 구현~~ ✅ STALE (2026-04-09 harness 세션 검증)

> 현 시점 확인: self-inspections.service.ts:25 이미 `extends VersionedBaseService`, update()/confirm() 모두 `updateWithVersion<EquipmentSelfInspection>` + `db.transaction()` 적용 완료. 30차 처리 기록과 일치. 활성 리스트에서 제거.

### ~~🟠 HIGH — Docker base image Node 18 → Node 20 LTS~~ ✅ 아카이브 (37차, 2026-04-09)

> 현재 상태: backend `FROM node:20-bullseye AS base` + `node:20-alpine AS prod-deps/production` / frontend `FROM node:20-alpine AS base`. Node 18 잔존 0건. 37차 실빌드 성공으로 런타임 호환성까지 확인.

### ~~🟡 MEDIUM — use-management-number-check.ts setQueryData 안티패턴~~ ✅ 완료 아카이브 (2026-04-09 38차 세션)

> 검증: commit `6de70a67` 에서 이미 `fetchQuery` 로 전환 완료. 현재 파일(L121-129)은 `queryClient.fetchQuery` 를 사용하며 `useQuery` 와 동일한 `queryKey` + `staleTime` + `gcTime` 을 공유해 SSOT 유지. `grep setQueryData use-management-number-check.ts` → 0 hit. 안티패턴 없음.

---

## 사용자 결정 대기 (0건)

### ~~❓ UL-QP-18-02 이력카드 form-catalog 플래그 vs endpoint 불일치~~ ✅ 해결 (2026-04-09 38차 세션)

> **결정**: UL-QP-19-01 연간교정계획서와 동일한 dedicated-endpoint 패턴으로 통일 (A안 + SSOT 정합화).
>
> **근본 원인**: `implemented` 플래그가 "통합 export 엔드포인트 구현 여부"와 "양식 export 기능 존재 여부" 두 의미로 혼동 사용됨. 두 dedicated 양식(UL-QP-18-02, UL-QP-19-01) 간 플래그 상태 불일치가 SSOT 거짓 정보의 원인.
>
> **변경 (form-catalog.ts)**:
> 1. `UL-QP-18-02.implemented: false → true` (전용 엔드포인트 `GET /api/equipment/:uuid/history-card` 실존 — `HistoryCardService` + `equipment-history.controller.ts:56`)
> 2. `FormCatalogEntry.implemented` / `.dedicatedEndpoint` JSDoc 에 불변식 명시
> 3. 모듈 로드 시 invariant 체크 추가: `dedicatedEndpoint: true && implemented !== true → throw` — 향후 새 dedicated 양식 추가 시 동일 실수 자동 차단
>
> **영향**:
> - 런타임 export 경로: 변화 없음 (`form-template-export.service.ts:106` `isFormDedicatedEndpoint` 가드가 `isFormImplemented` 체크보다 먼저 발동)
> - 목록 API (`GET /form-templates` → `FormTemplateListItem.implemented`): 이력카드가 정확히 "구현됨"으로 노출 (종전 거짓 정보 제거)
> - 백엔드/프론트엔드/shared-constants tsc `--noEmit` 통과
>
> **검증**: `pnpm --filter {backend,frontend,shared-constants} exec tsc --noEmit` 3건 PASS. invariant 위반 throw 없음 = 카탈로그 정합성 확인.

---

## 38차 신규 — QP-18 양식 export 템플릿 매핑 검증 (2건)

> **발견 배경 (2026-04-09, 38차)**: QP-18-02 이력카드 검증 과정에서 XML 마커 불일치(4개 이력 섹션 삽입 실패), DATA_START_ROW 오류(QP-19-01), 날짜 형식/폰트/파일명 등 다수 이슈 발견 및 수정. 동일 패턴의 잠재적 이슈가 QP-18-03(중간점검표), QP-18-05(자체점검표)에도 존재할 수 있음. 양식 템플릿 파일을 기준으로 코드 매핑의 정확성을 검증하는 프롬프트.

### ~~🟡 MEDIUM — QP-18-03 중간점검표 DOCX 템플릿 ↔ 코드 매핑 검증~~ ✅ 완료 (2026-04-10 39차)

> 검증: 9개 실제 완성 문서(E0001~E0350)와 대조. wf-19c E2E 테스트 9/9 통과. DocxTemplate에 appendParagraph/appendTable/appendImage/appendRichTable 추가. renderResultSections로 동적 콘텐츠 Export 지원. 프론트엔드 ResultSectionsPanel UI 구현.

### ~~원문 (참고용)~~

```
QP-18-02 이력카드 검증에서 발견된 패턴:
- XML 텍스트 마커가 태그로 분리되어 검색 실패 (silent)
- DocxTemplate.setDataRows가 기존 빈 행을 복제 vs 새 행 삽입 차이로 서식 깨짐
- 날짜 형식/폰트가 양식 원본과 불일치

QP-18-03 중간점검표 동일 검증 필요:
1. v1.docx 템플릿 파일을 node로 파싱하여 실제 테이블/셀/텍스트 구조 확인
2. form-template-export.service.ts의 exportIntermediateInspection (line 316~500)의
   setCellValue/setDataRows 호출이 템플릿 셀 위치와 정확히 일치하는지 대조
3. 시드 데이터로 실제 export 실행 → DOCX 파싱 → 모든 필드 값이 올바른 위치에 있는지 검증
4. 날짜 형식, 폰트, 판정 라벨(합격/불합격), 서명 이미지 삽입 정상 동작 확인

작업:
- 템플릿 구조 파악 (node PizZip으로 XML 분석)
- 코드 매핑 대조표 작성
- 불일치 발견 시 수정 (양식이 기준, 코드를 양식에 맞춤)
- Playwright E2E 테스트: 장비상세 → 중간점검 탭 → 내보내기 → DOCX 내용 검증

검증:
- pnpm tsc --noEmit exit 0
- Backend E2E: DOCX 파싱 기반 필드별 검증
- Playwright E2E: 브라우저 다운로드 + DOCX 내용 검증
```

### ~~🟡 MEDIUM — QP-18-05 자체점검표 DOCX 템플릿 ↔ 코드 매핑 검증~~ ✅ 완료 (2026-04-10 39차)

> 검증: QP-18-03과 동일하게 E2E 테스트 + 실제 문서 대조 완료. 자체점검 결과 섹션 CRUD, Export 동적 렌더링, SelfInspectionTab 통합 모두 정상.

### ~~원문 (참고용)~~

```
QP-18-05 자체점검표 검증 (QP-18-03과 동일 패턴):
1. v1.docx 템플릿 파일 구조 확인 (3개 테이블: 장비정보+점검항목, 특기사항, 결재)
2. form-template-export.service.ts의 exportSelfInspection (line 506~701)의
   setCellValue/setDataRows 호출이 템플릿과 일치하는지 대조
3. 특히 주의:
   - 동적 점검항목 vs 레거시 fallback (4항목) 분기가 정상 동작하는지
   - specialNotes JSONB 파싱이 다양한 데이터 shape에서 안전한지
   - 비교정기기일 때 교정유효기간이 'N/A'로 정확히 표시되는지
4. 시드 데이터로 실제 export → DOCX 내용 검증

작업:
- 템플릿 구조 파악
- 코드 매핑 대조
- 불일치 수정 (양식 기준)
- E2E 테스트 작성

검증:
- pnpm tsc --noEmit exit 0
- Backend E2E + Playwright E2E 통과
```

---

## 40차 신규 — 중간점검 통합 워크플로우 UX 개선 (Mode 2)

> **발견 배경 (2026-04-10, 40차)**: 9개 실제 완성 문서(E0001~E0350) 분석 결과,
> 점검 항목·측정 장비·결과 섹션이 현재 2단계 UX(생성 → 목록 펼침)로 분리되어 있음.
> 실무자가 한 화면에서 점검 전체를 완료할 수 없는 UX 갭. 또한 점검주기/교정유효기간은
> 장비 마스터 데이터에서 자동 적용 가능하고, 점검 항목은 9개 문서에서 반복되는 패턴이
> 프리셋으로 제공 가능.

### ~~🟠 HIGH — 중간점검 폼 통합 리디자인 (InspectionFormDialog → 통합 워크플로우)~~ ✅ 완료 (2026-04-10 41차)

> 검증: Mode 2 harness 실행. 1-step UX 구현 (inspection + resultSections 동시 생성).
> 12개 프리셋 (9개 실제 문서 기반), 장비 마스터 prefill (중간점검 주기, 교정유효기간 기간 표시),
> InlineResultSectionsEditor 통합, classification 교정기기 고정, "측정 결과 데이터" 리네이밍.
> E2E 5/5 통과. tsc + build + backend test 559 전체 PASS.

### 원문 (참고용)

```
현재 문제:
1. 점검 생성(InspectionFormDialog) → 목록으로 돌아감 → 행 펼침 → 결과 섹션 추가
   = 2단계 UX, 사용자가 점검 완료까지 왕복해야 함
2. 점검주기/교정유효기간을 수동 입력해야 함 (장비 마스터에 이미 있는 데이터)
3. 점검 항목을 매번 수동 입력 (9/9 문서에서 "외관 검사"가 반복됨)

실제 문서 분석 결과 (C:\...\새 폴더, 9개 완성 문서):

■ 점검 항목 프리셋 (9개 문서에서 추출):
  - [9/9] 외관 검사 — 기준: 마모 상태 확인
  - RF 입력 검사 — 기준: S/G Level ±1 dB
  - DC 전압 출력 특성 검사 — 기준: Output 대비 0.1V
  - 출력 특성 점검 — 기준: 제조사 선언 오차범위 이내
  - VSWR 특성 — 기준: SWR < 2.0
  - OBW 특성 검사 — 기준: 99% BW
  - 정합 특성 검사 — 기준: VSWR < 1.2
  - 신호 경로 특성 검사
  - RF 출력 검사 — 기준: CW Level ±1 dB
  - 장비 내부 자체 점검 프로그램

■ 자동 적용 가능 필드:
  - 점검주기: equipment.inspectionCycle 또는 calibrations 테이블
  - 교정유효기간: calibrations.validUntil에서 계산
  - 분류: equipment.calibrationRequired → 교정기기/비교정기기
  - 관리팀/장비위치/모델명: equipment 마스터

작업 (Mode 2 — 15+ 파일, 폼 구조 변경):

Phase 1: 점검 항목 프리셋 SSOT
  - packages/shared-constants/src/inspection-presets.ts (신규)
    DEFAULT_INSPECTION_ITEMS: { checkItem, checkCriteria }[]
    장비 분류별 기본 항목 매핑 (RF, DC, 패시브, OTA 등)
  - 프론트엔드: 프리셋 Select + 커스텀 입력 토글

Phase 2: InspectionFormDialog 통합 리디자인
  - 자동 적용 필드: 점검주기, 교정유효기간, 분류를 장비/교정 데이터에서 prefill
    (수동 오버라이드 가능하되 기본값 자동 설정)
  - 점검 항목: 프리셋 선택 + 직접 입력 모드 전환
    프리셋 선택 시 checkItem + checkCriteria 자동 채움
  - 결과 섹션: 폼 하단에 ResultSectionsPanel 인라인 통합
    (현재 목록 펼침 → 폼 내부로 이동)
  - 측정 장비: 기존 장비 검색 Select 유지 (시스템에 등록된 장비에서 선택)

Phase 3: 점검 항목별 결과 입력 UX
  - 점검 항목마다:
    a. checkResult: 텍스트 입력 (간단한 결과)
    b. detailedResult: 접을 수 있는 상세 영역 (멀티라인)
    c. 사진/그래프 첨부: 인라인 업로드 (기존 items/:itemId/photos API 재사용)
    d. judgment: pass/fail Select
  - 결과 섹션(data_table, photo 등): 항목 아래 또는 폼 하단에 통합

Phase 4: 워크플로우 연결
  - 생성 시 결과 섹션까지 한 번에 저장 (2단계 → 1단계)
  - 편집 시에도 결과 섹션 인라인 표시

검증:
- pnpm tsc --noEmit + frontend/backend build PASS
- E2E: 점검 생성 → 프리셋 항목 선택 → 결과 데이터 입력 → Export → DOCX 검증
- 기존 wf-19c 테스트 회귀 없음
- 9개 실제 문서 패턴 재현 가능 확인
```

---

## 41차 신규 — 중간점검 폼 통합 후속 verify/review 이슈 (3건)

> **발견 배경 (2026-04-10, 41차)**: 중간점검 폼 통합 리디자인 완료 후 verify-implementation + review-architecture 실행 결과. 이번 변경 범위 외 기존 코드의 SSOT 위반 3건 확인.

### ~~🟡 MEDIUM — calibration-api.ts SSOT 타입 강화 (sectionType, inspectionType)~~ ✅ 완료 (2026-04-12 42차 harness Batch A1)

> InspectionType SSOT (packages/schemas/src/enums/inspection-result-section.ts) 를 calibration-api.ts / ResultSectionsPanel.tsx / ResultSectionFormDialog.tsx / form-template-export.service.ts 모두에 적용. 'intermediate' | 'self' 리터럴 유니온 재정의 0건. sectionType 은 이미 SSOT 사용 중이라 교체 불필요 확인.

<details><summary>원문</summary>

```
verify-ssot 발견:
1. ResultSection.sectionType: string → InspectionResultSectionType
2. ResultSection.inspectionType: 'intermediate' | 'self' → InspectionType
3. CreateResultSectionDto.sectionType: string → InspectionResultSectionType
4. ResultSectionsPanelProps.inspectionType: 'intermediate' | 'self' → InspectionType

모두 packages/schemas에 SSOT 타입이 이미 존재하지만 프론트엔드에서 string
또는 리터럴 유니언으로 재정의. CLAUDE.md Rule 0 위반.

작업:
1. calibration-api.ts: import { InspectionResultSectionType, InspectionType }
2. ResultSection/CreateResultSectionDto 인터페이스 타입 교체
3. ResultSectionsPanel/InlineResultSectionsEditor props 타입 교체

검증:
- pnpm tsc --noEmit exit 0
- /verify-ssot PASS
```

</details>

### ~~🟡 MEDIUM — ResultSectionsPanel handleMove 레이스 컨디션~~ ✅ 완료 (2026-04-12 42차 harness Batch A2)

> 근본 해결: 백엔드에 `PATCH /result-sections/reorder` 엔드포인트 신설 (full-order 배열, 단일 tx 안에서 0..N-1 재할당). 프론트 handleMove 를 reorderMutation.mutate 단일 호출로 교체. A안/B안/C안 모두 기각하고 full-order 방식 채택 (pairwise swap 보다 확장성 + 원자성 우수).

<details><summary>원문</summary>

```
verify-implementation 발견 (ResultSectionsPanel.tsx:104-119):
두 번의 순차 mutateAsync 사이에 첫 번째 PATCH 성공 시 onSuccess →
invalidate() → 리스트 refetch → 동일 sortOrder 중간 상태 UI 노출.

수정 방안 (택 1):
A. 백엔드에 swap 전용 엔드포인트 추가 (단일 트랜잭션)
B. 프론트에서 두 호출 사이 invalidate 억제 (optimistic update)
C. 두 호출을 Promise.all로 병렬 처리 (서버 사이드 정합성 확인)

검증:
- 빠른 연속 클릭 시 sortOrder 깨짐 없음
- 첫 번째만 성공/두 번째 실패 시 복구 동작 확인
```

</details>

### ~~🟢 LOW — QP-18-03 Export에 1-step 결과 섹션 반영 검증~~ ✅ STALE (2026-04-12 45차 세션)

> 검증: `wf-19c-one-step-export.spec.ts` (commit 943206fd) — 1-step 폼으로 inspection + 3개 resultSections(title, data_table, text) 생성 → QP-18-03 DOCX Export → 결과 섹션 데이터 존재 확인. 기존 wf-19c 회귀 테스트 병행 유지.

---

## 39차 신규 — 결과 섹션 아키텍처 리뷰 후속 (4건)

> **발견 배경 (2026-04-10, 39차)**: feat/inspection-result-sections 브랜치 review-architecture + verify-implementation 실행 결과. Critical 2건(Fragment key, mutation race)은 즉시 수정. 나머지 후속 작업 등재.

### ~~🟠 HIGH — ResultSectionsPanel 캐시/에러 처리 강화 (Mode 1)~~ ✅ 완료 (2026-04-12 42차 harness Batch A2)

> ResultSectionsService 에 SimpleCacheService 주입 + create/update/delete/reorder 후 부모 IntermediateInspectionsService 캐시(`CACHE_KEY_PREFIXES.CALIBRATION + 'inspections:'` prefix) 무효화. self-inspections 는 cache 인프라 부재로 early return + 주석. ResultSectionsPanel 에 `QUERY_CONFIG.RESULT_SECTIONS` staleTime 도입 + isConflictError 분기로 409 → `toasts.conflict` 한/영 번역 + 강제 재조회. parent intermediate detail queryKey invalidate 포함. ko/en conflict 메시지 추가.

<details><summary>원문</summary>

```
review-architecture 발견 (BE-C2 + FE-W3 + FE-W4):
1. 결과 섹션 mutation 시 부모 점검 캐시 미무효화
   - result-sections.service.ts: create/update/delete 후 parent inspection cache invalidate 없음
   - ResultSectionsPanel.tsx: invalidateQueries가 결과 섹션 queryKey만 타겟
2. CAS conflict (409) 에러 미처리 — 제네릭 toast만 표시
3. staleTime/gcTime 미설정 — 매 mount마다 refetch

작업:
1. ResultSectionsPanel: invalidate 시 부모 queryKey도 포함
   queryClient.invalidateQueries({ queryKey: queryKeys.intermediateInspections.detail(inspectionId) })
2. mutation onError에 isConflictError 분기 추가
3. useQuery에 QUERY_CONFIG 또는 staleTime 적용
4. query-config.ts에 RESULT_SECTIONS config 엔트리 추가

검증: pnpm tsc --noEmit + frontend build PASS
```

</details>

### ~~🟡 MEDIUM — rich_table 프론트엔드 폼 UI 구현 (Mode 1)~~ ✅ STALE (2026-04-12 45차 세션)

> 검증: 전체 스택 구현 완료. (1) ResultSectionFormDialog.tsx:40-41 — SECTION_TYPE_OPTIONS에 'table' 포함, L44-52 frontend↔backend 매핑, (2) VisualTableEditor.tsx — 텍스트/이미지 셀 편집 + 붙여넣기 + 열/행 관리, (3) ResultSectionPreview.tsx:88-132 — rich_table 렌더링 + DocumentImage, (4) Backend CRUD + Export appendRichTable + Zod 검증 + i18n 완비.

### ~~🟡 MEDIUM — ResultSectionsPanel N+1 쿼리 최적화 (Mode 1)~~ ✅ 완료 (2026-04-12 42차 harness Batch A3)

> FE: SelfInspectionTab 에 `expandedId` state + ChevronRight/Down 토글 버튼(aria-expanded + i18n) 추가, `{isExpanded && <ResultSectionsPanel}` 조건부 렌더로 N+1 제거. BE: `renderResultSections` 를 documentId 선수집 → `inArray(documents.id, ids)` batch SELECT → `Promise.allSettled(storage.download)` 병렬 다운로드 → `Map<id, {buffer, ext}>` 조회로 리팩토링. 두 컨트롤러의 CSV upload FileInterceptor 에 `FILE_UPLOAD_LIMITS.CSV_MAX_FILE_SIZE = 1MB` 적용.

<details><summary>원문</summary>

```
FE-W5: SelfInspectionTab에서 모든 점검 카드에 ResultSectionsPanel을 무조건 렌더링.
각 패널이 독립 useQuery를 실행하여 N개 점검 × 1 API 호출 = N+1 문제.

BE-W2: renderResultSections에서 photo/rich_table 이미지 로딩이 sequential.
문서 ID를 미리 수집 → batch WHERE IN 쿼리 + Promise.all 다운로드로 최적화 가능.

작업:
1. SelfInspectionTab: ResultSectionsPanel을 펼치기 토글 뒤에 조건부 렌더 (lazy)
2. renderResultSections: 이미지 documentId 선수집 → batch 조회
3. CSV 업로드 fileSize 제한 추가 (1MB)

검증: pnpm tsc --noEmit + backend build + backend test PASS
```

</details>

### ~~🟢 LOW — ResultSectionsPanel 접근성 + 타입 안전성 개선 (Mode 0)~~ ✅ STALE (2026-04-12 45차 세션)

> 검증: 3건 모두 42차 harness Batch A2/A3에서 이미 수정 완료. (1) ResultSectionsPanel.tsx:216-247 — moveUp/moveDown/editSection/deleteSection aria-label 적용, (2) result-sections.service.ts:100 — `Partial<NewInspectionResultSection>` 사용 중, (3) inspection-result-sections.ts:74 — updatedBy 컬럼 + 인덱스 + JSDoc 완비.

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
