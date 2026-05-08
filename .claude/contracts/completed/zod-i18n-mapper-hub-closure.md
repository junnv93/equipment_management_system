# 스프린트 계약: zod-i18n-mapper-hub-closure

## 생성 시점
2026-05-08T15:00:00+09:00

## Slug
zod-i18n-mapper-hub-closure

## 모드
Mode 2 (Full) — backend-zod-error-i18n-ssot 후속 3 tech-debt 통합 closure

## 변경 범위
- frontend mapper: 12 파일 (`disposal / cables / calibration-factor / equipment-import / form-template / intermediate-inspection / notification / self-inspection / software-validation / team / test-software / user`)
- frontend spec: 1 신규 (`apps/frontend/lib/errors/__tests__/zod-fallback-coverage.test.ts`)
- frontend devDeps: 1 (`apps/frontend/package.json` — ts-morph 추가)
- backend: 2 (`apps/backend/src/common/metrics/metrics.service.ts` + `apps/backend/src/common/filters/error.filter.ts`)
- backend spec: 1 확장 (`apps/backend/src/common/filters/__tests__/error-filter-zod.spec.ts`)
- 문서: 2 (`.claude/skills/verify-zod/SKILL.md` + `docs/adr/0008-backend-zod-error-i18n.md`)

---

## 성공 기준

### MUST — 실패 시 루프 재진입

#### Phase 1: 12 도메인 mapper hub 통합

- [ ] **M-1** `pnpm tsc --noEmit` 에러 0
  ```bash
  pnpm tsc --noEmit 2>&1 | grep -c "error TS"
  # 기대: 0
  ```

- [ ] **M-2** `pnpm --filter frontend run lint` PASS (exit 0)

- [ ] **M-3** 12개 파일 모두 `extractValidationIssues` import 보유
  ```bash
  for f in disposal cables calibration-factor equipment-import form-template \
    intermediate-inspection notification self-inspection software-validation \
    team test-software user; do
    grep -l "extractValidationIssues" "apps/frontend/lib/errors/${f}-errors.ts" || echo "FAIL: ${f}"
  done
  # 기대: FAIL 줄 0개
  ```

- [ ] **M-4** 12개 파일 모두 `mapZodIssuesToToast` 호출 보유
  ```bash
  for f in disposal cables calibration-factor equipment-import form-template \
    intermediate-inspection notification self-inspection software-validation \
    team test-software user; do
    grep -l "mapZodIssuesToToast" "apps/frontend/lib/errors/${f}-errors.ts" || echo "FAIL: ${f}"
  done
  # 기대: FAIL 줄 0개
  ```

- [ ] **M-5** 신규 인라인 `extractValidationIssues` 정의 0건 (SSOT 재사용만)
  ```bash
  grep -rln "export function extractValidationIssues" apps/frontend/lib/errors/
  # 기대: extract-error.ts 1개 파일만
  ```

- [ ] **M-6** 자연 제외 3건에 hub 호출 부재 (잘못된 통합 회귀 차단)
  ```bash
  grep -l "mapZodIssuesToToast" \
    apps/frontend/lib/errors/cable-errors.ts \
    apps/frontend/lib/errors/document-errors.ts \
    apps/frontend/lib/errors/equipment-errors.ts 2>/dev/null
  # 기대: 빈 출력 (매치 없음)
  ```

#### Phase 2: ts-morph 정적 spec

- [ ] **M-7** spec 파일 존재
  ```bash
  ls apps/frontend/lib/errors/__tests__/zod-fallback-coverage.test.ts
  # 기대: 파일 존재
  ```

- [ ] **M-8** ts-morph frontend devDependency 등록
  ```bash
  node -e "const p=require('./apps/frontend/package.json'); process.exit(p.devDependencies?.['ts-morph'] ? 0 : 1)"
  # 기대: exit 0
  ```

- [ ] **M-9** spec PASS — 17개 도메인 (12 신규 + 5 기존) 모두 hub fallback 검증
  ```bash
  pnpm --filter frontend run test -- "zod-fallback-coverage"
  # 기대: PASS, 18 cases (17 도메인 + EXCLUSIONS 검증)
  ```

- [ ] **M-10** spec EXCLUSIONS set에 자연 제외 5건 명시 (cable/document/equipment/extract-error/zod-issue-mapper)
  ```bash
  grep -cE "cable-errors|document-errors|equipment-errors|extract-error|zod-issue-mapper" \
    apps/frontend/lib/errors/__tests__/zod-fallback-coverage.test.ts
  # 기대: ≥ 5
  ```

#### Phase 3: Backend telemetry

- [ ] **M-11** MetricsService Counter 등록 + method
  ```bash
  grep -c "zod_validation_issues_total" apps/backend/src/common/metrics/metrics.service.ts
  # 기대: ≥ 1 (Counter name 등록)
  grep -c "observeZodIssueCount" apps/backend/src/common/metrics/metrics.service.ts
  # 기대: ≥ 1 (method 정의)
  # 복합: 두 파일 합산 observeZodIssueCount 총 출현 ≥ 2 (metrics.service + error.filter)
  grep -rc "observeZodIssueCount" apps/backend/src/common/
  # 기대: metrics.service.ts와 error.filter.ts 모두 출력
  ```

- [ ] **M-12** Counter labels `domain_route` + `issue_count_bucket` 존재
  ```bash
  grep -E "domain_route|issue_count_bucket" apps/backend/src/common/metrics/metrics.service.ts | wc -l
  # 기대: ≥ 2
  ```

- [ ] **M-13** bucket 4-tier 경계 정의 (1/2-5/6-10/11+)
  ```bash
  # grep -o 는 각 매치를 별도 줄 출력 — Prettier 멀티라인 포맷에 안전
  grep -oE "'1'|'2-5'|'6-10'|'11\+'" apps/backend/src/common/metrics/metrics.service.ts | wc -l
  # 기대: ≥ 4 (bucket type union 2 + ternary 조건 2 = 4개 이상 occurrences)
  ```

- [ ] **M-14** GlobalExceptionFilter ZodError 분기에서 `observeZodIssueCount` 호출
  ```bash
  grep -c "observeZodIssueCount" apps/backend/src/common/filters/error.filter.ts
  # 기대: ≥ 1
  ```

- [ ] **M-15** MetricsService 주입 `@Optional()` 데코레이터 보호
  ```bash
  grep -B 1 "MetricsService" apps/backend/src/common/filters/error.filter.ts | grep -c "@Optional"
  # 기대: ≥ 1
  ```

- [ ] **M-16** backend spec 신규 케이스 포함 전체 PASS
  ```bash
  pnpm --filter backend run test -- "error-filter-zod"
  # 기대: PASS (7 tests: 기존 4 + MetricsService telemetry 2 + errorCodeToStatusCode 1)
  grep -c "observeZodIssueCount" apps/backend/src/common/filters/__tests__/error-filter-zod.spec.ts
  # 기대: ≥ 1
  ```

- [ ] **M-17** backend 전체 테스트 회귀 0
  ```bash
  pnpm --filter backend run test
  # 기대: exit 0
  ```

- [ ] **M-18** Layer 보존 — 본 sprint 신규 modules import 0건
  ```bash
  grep -E "from '\.\.\/.*modules\/" apps/backend/src/common/filters/error.filter.ts | grep -v "audit/audit.service" | wc -l
  # 기대: 0 (pre-existing AuditService 1건 제외, 본 sprint 신규 modules 의존 0건)
  grep -c "from '../metrics/metrics.service'" apps/backend/src/common/filters/error.filter.ts
  # 기대: ≥ 1 (common-internal import)
  ```

#### Phase 4: SKILL + ADR closure

- [ ] **M-19** verify-zod SKILL.md Step 22 임계값 ≥ 17 명시
  ```bash
  grep -cE "≥ 17|>= 17" .claude/skills/verify-zod/SKILL.md
  # 기대: ≥ 1
  ```

- [ ] **M-20** verify-zod SKILL.md Step 23 신설 (date suffix + ts-morph + 17 도메인)
  ```bash
  grep -c "^### Step 23" .claude/skills/verify-zod/SKILL.md
  # 기대: 1
  ```

- [ ] **M-21** ADR-0008 §4 closure note 추가
  ```bash
  grep -c "zod_validation_issues_total" docs/adr/0008-backend-zod-error-i18n.md
  # 기대: ≥ 1
  ```

### SHOULD — 실패 시 evaluator 노트 + tech-debt 등록

- [ ] **S-1** Phase 1 변형 패턴 2건 (`form-template`, `user`) 주석으로 변형 사유 명시
- [ ] **S-2** Phase 3 Counter 카디널리티 < 200 (50 라우트 × 4 bucket)
- [ ] **S-3** Phase 2 spec EXCLUSIONS 5건 사유 주석 명시
- [ ] **S-4** 후속 tech-debt 3건 (`alert rule` / `ESLint 마이그레이션` / `e2e toast`) tech-debt-tracker.md 등록

---

## 평가 절차

1. M-1 ~ M-6 (Phase 1) → Phase 2로 진행
2. M-7 ~ M-10 (Phase 2) → Phase 3으로 진행
3. M-11 ~ M-18 (Phase 3) → Phase 4로 진행
4. M-19 ~ M-21 (Phase 4) → 전체 통과 확인
5. SHOULD 점검 후 tech-debt-tracker.md 업데이트
