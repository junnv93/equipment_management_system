# 스프린트 계약: zod-hub-should-s4-followups

## 생성 시점
2026-05-09T18:00:00+09:00

## Slug
zod-hub-should-s4-followups

## 모드
Mode 1 (Lightweight) — `zod-i18n-mapper-hub-closure` SHOULD S-4 후속 3건 통합 closure

## 변경 범위 (5-7 파일)
- `infra/monitoring/prometheus/alert.rules.yml` — `validation` 그룹 신설 (2 alerts)
- `apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts` — 신규 e2e spec (3 cases)
- `docs/adr/0008-backend-zod-error-i18n.md` — §4 closure note 갱신
- `.claude/exec-plans/tech-debt-tracker.md` — 3 항목 마킹 (Item 2 = SKIP-trigger-not-met)
- `.claude/exec-plans/tech-debt-tracker-archive.md` — batch 엔트리 추가
- `.claude/contracts/REGISTRY.md` — Active → 제거 (Step 7c)
- `.claude/contracts/zod-hub-should-s4-followups.md` → completed/ (Step 7a)

## 아키텍처 원칙
- **Item 1 (Prometheus alert)**: 기존 `infra/monitoring/prometheus/alert.rules.yml` 패턴 재사용 — 신규 그룹 `validation` + Korean annotations + warning/critical severity
- **Item 2 (ESLint custom rule)**: [SKIP-trigger-not-met] — `commit-pipeline-safety S-4` 정직 SKIP 패턴 답습. 트리거 4 조건 평가 후 tech-debt-tracker에 마커 + 사유 명시
- **Item 3 (e2e toast)**: NCDetailClient `rejectCorrection` 흐름 재사용 (`mapNonConformanceErrorToToast` hub 호출지) + `nc-rejection-flow.spec.ts` DB reset 패턴 차용 + page.route() 인터셉트로 Zod issues array 응답 mock + `expectToastVisible()` SSOT helper

## 성공 기준

### MUST — 실패 시 루프 재진입

#### Phase 1: Prometheus Alert Rule

- [ ] **M-1** `infra/monitoring/prometheus/alert.rules.yml` 에 `validation` 그룹 신설
  ```bash
  grep -c "^  - name: validation$" infra/monitoring/prometheus/alert.rules.yml
  # 기대: 1
  ```

- [ ] **M-2** 두 alert rule 정의 (`ZodValidationIssuesHighCount` warning + `ZodValidationIssuesPersistentSpike` critical)
  ```bash
  grep -cE "alert: ZodValidationIssues(HighCount|PersistentSpike)" infra/monitoring/prometheus/alert.rules.yml
  # 기대: 2
  ```

- [ ] **M-3** Counter 라벨 정합 — `zod_validation_issues_total{issue_count_bucket="11+"}` 사용
  ```bash
  grep -c 'zod_validation_issues_total{issue_count_bucket="11+"}' infra/monitoring/prometheus/alert.rules.yml
  # 기대: ≥ 2 (warning + critical 양쪽)
  ```

- [ ] **M-4** Korean annotations + severity labels 패턴 일치 (`infrastructure`/`application` 그룹과 동일 스타일)
  ```bash
  awk '/^  - name: validation$/,/^  - name:|^[A-Za-z]/' infra/monitoring/prometheus/alert.rules.yml | grep -cE "summary:|description:"
  # 기대: ≥ 4 (alert 2 × 2 annotation)
  awk '/^  - name: validation$/,/^  - name:|^[A-Za-z]/' infra/monitoring/prometheus/alert.rules.yml | grep -cE "severity: (warning|critical)"
  # 기대: ≥ 2 (warning 1 + critical 1)
  ```

#### Phase 2: e2e Toast Spec (Item 3)

- [ ] **M-5** spec 파일 존재 + auth fixture import
  ```bash
  ls apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  grep -c "from '../../shared/fixtures/auth.fixture'" apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  # 기대: 1
  ```

- [ ] **M-6** `expectToastVisible` SSOT helper 사용 (직접 li[role="status"] selector 금지)
  ```bash
  grep -c "expectToastVisible" apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  # 기대: ≥ 3
  grep -c "li\[role=\"status\"\]" apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  # 기대: 0 (helper 경유만)
  ```

- [ ] **M-7** page.route() Zod issues array 응답 mock (3 case 시나리오)
  ```bash
  # VALIDATION_ERROR literal — JSDoc 1 + helper body 1 (DRY 추출 패턴, 시나리오별 인라인 회피)
  grep -c "VALIDATION_ERROR" apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  # 기대: ≥ 1 (helper SSOT 패턴)
  # 시나리오 다양성은 issue code 차별화로 검증
  grep -cE "code: 'too_small'|code: 'invalid_format'|code: 'invalid_type'" apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  # 기대: ≥ 3 (3 case 시나리오 — too_small + invalid_format + invalid_type)
  ```

- [ ] **M-8** ko 토스트 i18n 변환 검증 — `errors.fields.*` 라벨 + `errors.validation.*` 메시지
  ```bash
  # ko 메시지 라벨 ("반려 사유"/"버전" 등) + 변환 텍스트 ("너무 작습니다"/"형식을 만족하지 않습니다") 매칭
  grep -cE "너무 작습니다|형식을 만족하지|형식이 올바르지 않습니다" apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  # 기대: ≥ 3 (3 case)
  ```

- [ ] **M-9** TEST_NC_IDS SSOT 사용 (하드코딩 UUID 금지)
  ```bash
  grep -c "TEST_NC_IDS" apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  # 기대: ≥ 1
  grep -cE "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}" apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  # 기대: 0 (UUID 인라인 금지)
  ```

- [ ] **M-10** DB reset 헬퍼 재사용 — `nc-rejection-flow.spec.ts` 패턴 차용으로 시드 멱등성 보장
  ```bash
  grep -c "non_conformances\|UPDATE.*corrected" apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts
  # 기대: ≥ 1 (resetNcForRejectionTest 차용)
  ```

#### Phase 3: ADR-0008 Closure Note

- [ ] **M-11** ADR-0008 §4 trigger condition #4 closure note 추가 — Prometheus AlertManager rule 등록 완료 명시
  ```bash
  grep -c "AlertManager rule\|alert.rules.yml\|ZodValidationIssues" docs/adr/0008-backend-zod-error-i18n.md
  # 기대: ≥ 1
  ```

#### Phase 4: tech-debt 라이프사이클

- [ ] **M-12** `2026-05-08 zod-hub S-4 후속` 섹션 closure 처리
  ```bash
  # alert + e2e 두 항목 [x] 마킹, ESLint 항목 [SKIP-trigger-not-met] 마킹
  grep -c "\[x\].*zod-validation-issues-alert-rule\|\[x\].*e2e-zod-fail-toast-verification" .claude/exec-plans/tech-debt-tracker.md
  # 기대: ≥ 0 (Step 7a sed 자동 정리 후 사라짐 — 통과)
  grep -c "SKIP-trigger-not-met.*zod-fallback-eslint-custom-rule" .claude/exec-plans/tech-debt-tracker.md
  # 기대: 1 (SKIP 항목은 archive 이동 안 함, tech-debt에 보존 + 마커)
  ```

- [ ] **M-13** archive batch entry 추가
  ```bash
  grep -c "zod-hub-should-s4-followups\|zod-hub S-4 후속" .claude/exec-plans/tech-debt-tracker-archive.md
  # 기대: ≥ 1
  ```

- [ ] **M-14** 빈 sprint 헤더 제거 (Step 7a 자동) — `2026-05-08 zod-i18n-mapper-hub-closure 후속` 섹션이 SKIP 1건만 남음
  ```bash
  awk '/^### 2026-05-08 zod-i18n-mapper-hub-closure 후속/,/^###|^$/' .claude/exec-plans/tech-debt-tracker.md | wc -l
  # 기대: ≥ 3 (헤더 + SKIP 1건 + blank line; 0 이면 헤더 누락 = FAIL)
  ```

### SHOULD — 실패 시 evaluator 노트 + tech-debt 등록

- [ ] **S-1** Prometheus alert expr `for` duration: warning 10m / critical 5m (지속 발생 패턴 반영)
- [ ] **S-2** 모든 e2e case 가 동일 mock route 패턴 + `route.continue()` non-PATCH 우회 (테스트 격리)
- [ ] **S-3** Item 2 SKIP justification 4 조건 평가 + 재검토 트리거 명시 (`commit-pipeline S-4` 형식 준수)

## 평가 절차

1. M-1~M-4 (Phase 1) — alert rule 검증
2. M-5~M-10 (Phase 2) — e2e spec 검증 (실행은 수동, contract 는 정적 grep)
3. M-11 (Phase 3) — ADR closure 검증
4. M-12~M-14 (Phase 4) — tech-debt 라이프사이클 검증
5. SHOULD 점검 → tech-debt-tracker.md SHOULD 후속 등록

## 트리거 평가 — Item 2 [SKIP-trigger-not-met] 근거

원본 트리거 (zod-hub-closure tech-debt):
> 신규 도메인 mapper 추가 빈도 높아지면 전환 검토. 트리거: 신규 도메인 mapper 추가 3회 이상.

본 sprint 평가 (2026-05-09):
1. **신규 도메인 mapper 추가 횟수 (2026-05-08~)**: 0건 (zod-i18n-mapper-hub-closure ratification 후 신규 도메인 mapper 추가 사례 0건) — **0/3 미충족** ❌
2. **ts-morph spec 회귀 검출 능력**: 17 도메인 100% 커버, jest 실행 < 1s — **충분** ✅
3. **ESLint custom rule 도입 비용**: TS AST 기반 rule + 단위 테스트 + plugin 등록 ≥ 100 LOC + 유지보수 부채 — **상당** ⚠️
4. **편집기 실시간 피드백 가치**: 신규 mapper 추가 시점에만 의미. 현 워크플로 (`pnpm test` 자동 실행) 와의 격차 < 5초 — **한계적** ⚠️

→ 트리거 미충족 (1/4) + over-engineering risk → SKIP 정직 처리. tech-debt-tracker 에 `[SKIP-trigger-not-met]` 마커 + 4 조건 평가 보존 → 향후 재검토 자동 발견.

참조: `commit-pipeline-safety S-4` (2026-05-06) `[SKIP-trigger-not-met]` 패턴.
