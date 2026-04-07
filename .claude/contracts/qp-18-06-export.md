# 스프린트 계약: QP-18-06 장비반출입확인서 DOCX Export

## 생성 시점
2026-04-07T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **TypeCheck (backend)**: `pnpm --filter backend exec tsc --noEmit` exit 0
- [ ] **Build (backend)**: `pnpm --filter backend run build` exit 0
- [ ] **Backend tests**: `pnpm --filter backend run test` exit 0 (회귀 0)
- [ ] **TypeCheck (frontend)**: `pnpm --filter frontend exec tsc --noEmit` exit 0
- [ ] **Catalog 플래그 활성**: `packages/shared-constants/src/form-catalog.ts` line ~74 영역에서
      `'UL-QP-18-06'` 항목의 `implemented: true`
      검증: `grep -n "UL-QP-18-06" packages/shared-constants/src/form-catalog.ts -A 7 | grep "implemented: true"` 가 1건 이상
- [ ] **exporters 맵 등록**: `apps/backend/src/modules/reports/form-template-export.service.ts`에서
      `'UL-QP-18-06'` 키가 exporters 객체 리터럴 내에 존재하고 `exportCheckout`을 호출
      검증: `grep -n "'UL-QP-18-06'" apps/backend/src/modules/reports/form-template-export.service.ts | grep -v "form-catalog"` 가 1건 이상,
      그리고 `grep -n "exportCheckout" apps/backend/src/modules/reports/form-template-export.service.ts` 가 ≥2건 (맵 + 메서드 정의)
- [ ] **exportCheckout 메서드 존재**: 동일 파일 내에 `private async exportCheckout(`을 포함하는 라인 1건 이상
- [ ] **DB 조인 4종 사용**: 동일 파일의 `exportCheckout` 본문이 다음 4개 식별자를 모두 참조
      - `checkouts`
      - `checkoutItems` (혹은 `checkout_items`) — 그리고 `sequenceNumber`와 `quantity` 컬럼 모두 SELECT/참조
      - `conditionChecks`
      - `users` 조회가 작성자(requester) 1건 + 승인자(approver) 1건 — 즉 `users`에 대한 select가 ≥2회
      검증: `grep -nE "checkouts|checkoutItems|conditionChecks|sequenceNumber|quantity" apps/backend/src/modules/reports/form-template-export.service.ts` 출력에 위 5개 키워드가 모두 포함
- [ ] **날짜 헬퍼 신설**: 동일 파일에 `formatQp1806Date` 라는 이름의 private 메서드가 존재하고
      `YYYY . MM . DD .` 포맷을 생성 (공백+점+공백 패턴, 마지막 점 포함)
      검증: `grep -n "formatQp1806Date" apps/backend/src/modules/reports/form-template-export.service.ts` ≥2건 (정의 + 호출)
- [ ] **신규 파일 생성 금지**: 본 작업은 기존 파일 수정만 수행. 새 `.ts` 파일이 추가되지 않아야 함
      검증: `git diff --name-status main...HEAD | grep '^A' | grep -v '\.claude/' | wc -l` == 0
- [ ] **서명 헬퍼 재사용**: `exportCheckout` 본문이 `insertDocxSignature(`를 호출하며,
      서명 미존재 fallback 인자로 `'(서명)'` 문자열을 전달
      검증: `grep -nE "insertDocxSignature\(" apps/backend/src/modules/reports/form-template-export.service.ts` 호출 수가
      변경 전 대비 ≥2건 증가했고, `grep -n "'(서명)'" apps/backend/src/modules/reports/form-template-export.service.ts` ≥1건
- [ ] **E2E 단언 전환**: `apps/frontend/tests/e2e/workflows/wf-20b-self-inspection-export.spec.ts` 의
      QP-18-06 호출 부분이 더 이상 `expect(resp.status()).toBe(501)`이 아니며,
      `expect(resp.status()).toBe(200)` + `wordprocessingml.document` content-type 단언을 포함
      검증:
      - `grep -n "toBe(501)" apps/frontend/tests/e2e/workflows/wf-20b-self-inspection-export.spec.ts` == 0건
      - `grep -nc "UL-QP-18-06" apps/frontend/tests/e2e/workflows/wf-20b-self-inspection-export.spec.ts` ≥1건
      - 같은 파일에 `wordprocessingml.document` 단언이 ≥2건 (Step 1 기존 + Step 2 신규)
- [ ] **권한/감사 비변경**: `reports.controller.ts`의 `exportFormTemplate` 핸들러는 수정되지 않음
      검증: `git diff main...HEAD -- apps/backend/src/modules/reports/reports.controller.ts | wc -l` == 0
- [ ] **CAS/cache 영향 없음 확인**: 본 변경은 read-only export이므로 `version` 필드/캐시 무효화 코드 추가 금지
      검증: 본 PR diff에 `CacheInvalidationHelper`, `version`, `eq(.*\.version` 신규 추가 0건

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] **review-architecture Critical 0건** (변경 영역 한정)
- [ ] **verify-ssot PASS** — `FORM_CATALOG`/`Permission` 등 SSOT import 사용
- [ ] **verify-sql-safety PASS** — N+1 없음 (item별 equipment 조회는 inArray 단일 쿼리로)
- [ ] **수술적 변경**: diff에 무관한 포맷팅/리팩터 0건 (`git diff --stat` 라인 수가 합리적 범위)
- [ ] **e2e 변경 spec 단독 실행 통과** (전체 e2e 강제 X)

### 적용 verify 스킬
변경 파일 경로 기반 자동 선택:
- `apps/backend/src/modules/reports/**` → verify-ssot, verify-sql-safety, verify-zod (해당 시), review-architecture
- `packages/shared-constants/**` → verify-ssot
- `apps/frontend/tests/e2e/**` → verify-e2e

## 종료 조건
- 필수 기준 전체 PASS → 성공, exec-plan을 `active/` → `completed/` 이동
- 동일 이슈 2회 연속 FAIL → 설계 문제, 수동 개입 요청
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — `.claude/exec-plans/tech-debt-tracker.md`에 기록
