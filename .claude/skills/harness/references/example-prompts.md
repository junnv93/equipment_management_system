# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-05 (28차 — WF-17~20 전체 PASS, 미해결 0건)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

## 현재 미해결 프롬프트: 0건

> 모든 프롬프트 해결 완료. tech-debt-tracker에 잔여 7건은 별도 관리.

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
