# Exec Plan: zod-i18n-mapper-hub-closure

## 메타
- 생성: 2026-05-08T15:00:00+09:00
- 모드: Mode 2 (Full)
- Slug: zod-i18n-mapper-hub-closure
- 예상 변경: frontend mapper 12 + frontend spec 1 (ts-morph) + frontend devDeps 1 + backend filter 1 + backend metrics 1 + backend spec 1 + SKILL 1 + ADR-0008 §4 patch 1 = 약 19개

## Summary

`backend-zod-error-i18n-ssot` (2026-05-08) sprint의 후속 3건 LOW tech-debt를 단일 harness로 closure:

1. **Item 1 (MEDIUM)** — 도메인 mapper 12개에 hub fallback (`extractValidationIssues` + `mapZodIssuesToToast`) 통합. 현재 5개(approval / calibration / calibration-plan / checkout / non-conformance)만 통합됨 → 17개 도메인 전수 적용.
2. **Item 2 (LOW)** — ts-morph 기반 정적 spec(`zod-fallback-coverage.spec.ts`)으로 hub fallback 호출 의무를 컴파일타임 회귀 차단. 신규 도메인 mapper 추가 시 자동 FAIL.
3. **Item 3 (LOW)** — `MetricsService.zod_validation_issues_total` Counter 신설 + GlobalExceptionFilter Zod 분기에서 `issues.length` 라벨 계측. ADR-0008 §4 운영 모니터링 closure.

**핵심 결정**: hub 통합은 *문구 추가형* surgical patch (3 라인 import + 4 라인 분기). 12개 파일 구조는 동일하므로 패턴 1:1 복제. ts-morph spec은 `lib/errors/*-errors.ts`를 glob 후 `mapXxxErrorToToast` 함수 본체에서 `mapZodIssuesToToast` 호출 여부를 검증 (callExpression depth-first). MetricsService 주입은 `@Optional() @Inject(MetricsService)` 패턴으로 기존 `SystemErrorEventProvider` 주입 형식 재사용.

## 설계 철학

ADR-0008 5-layer SSOT의 **Layer 4 closure 완결**:

- **Phase 1 (mapper hub 통합)** — Layer 4(frontend mapper)의 누락된 12개 도메인을 일괄 적용. ErrorCode 미매핑 시 Zod issues fallback이 빠지면 silent miss → backend가 issues를 정확히 보내도 frontend가 generic `error.message` 표시.
- **Phase 2 (ts-morph spec)** — 정적 분석으로 신규 mapper 회귀 차단. AST selector(`no-restricted-syntax`)는 "함수 본체 안에서 X를 호출해야 한다"는 flow 조건 표현 불가 → ts-morph로 함수 노드 → 본체 노드 → CallExpression 탐색.
- **Phase 3 (telemetry)** — ADR-0008 §Trigger Conditions for Reconsideration #4 ("다중 issue 응답 size 모니터링")의 운영 sink. issues 길이를 Prometheus Counter로 적재 → Grafana p95/max 추적 가능.

**SSOT 보존**:
- `extract-error.ts` + `zod-issue-mapper.ts` 신규 정의 0건 (재사용만).
- 도메인 이름 하드코딩 금지 — Phase 2 spec은 `glob('apps/frontend/lib/errors/*-errors.ts')` 동적 enum.
- Layer 보존 — `MetricsService`는 `common/metrics/`에 위치, `GlobalExceptionFilter`는 `common/filters/`에 위치. 둘 다 common layer 내부 → Layer 위반 없음. `@Optional()` 주입으로 spec mock 호환.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 통합 대상 12개 vs 15개 | **12개** (`disposal` / `cables` / `calibration-factor` / `equipment-import` / `form-template` / `intermediate-inspection` / `notification` / `self-inspection` / `software-validation` / `team` / `test-software` / `user`) | `cable-errors.ts`는 re-export shim, `document-errors.ts`는 t 함수 미사용 (download path), `equipment-errors.ts`는 mapper 함수 없음 (enum/class 인프라) → 3건 자연 제외 |
| Phase 2 spec 위치 | `apps/frontend/lib/errors/__tests__/zod-fallback-coverage.spec.ts` (jest + ts-morph) | 기존 `__tests__` 디렉토리 일관성. ts-morph는 frontend devDependencies로 신규 추가. backend `verify-e2e-actor-alignment.ts` 패턴 답습 |
| ts-morph project root | `apps/frontend/tsconfig.json` | jest jsdom 환경에서 frontend 전체 컴파일 단위 접근. `skipAddingFilesFromTsConfig: true` + 명시 glob `addSourceFilesAtPaths` 로 빠른 부팅 |
| Phase 3 Counter labels | `{ domain_route, issue_count_bucket }` | `domain_route`는 normalizeRoute 결과 (UUID/숫자 ID 마스킹). `issue_count_bucket`은 `'1' | '2-5' | '6-10' | '11+'` 4 bucket — 카디널리티 폭증 방지 |
| MetricsService 주입 방법 | `@Optional() @Inject(MetricsService)` | 기존 `SystemErrorEventProvider` 주입 패턴 1:1 답습. `@Optional()`로 spec mock 호환 — 기존 `error-filter-zod.spec.ts`는 1-arg 호출, backward compat 보장 |
| ts-morph → eslint 마이그레이션 | **불가 (ts-morph SSOT)** | ESLint flat `no-restricted-syntax`는 단일 노드 selector — "함수 X가 함수 Y를 호출해야 한다"는 flow 조건 표현 불가 |
| Phase 3 spec scope | backend filter spec 1 case 추가 | 별도 파일 아닌 기존 spec 확장 — blast radius 최소 |
| Counter vs Histogram | **Counter + bucket label** | issue 개수는 응답 별 1회 emit. Histogram은 buckets 사전 정의 + storage 부담. ADR-0008 §4 "size 모니터링"은 Counter + bucket으로 충족 |

## 구현 Phase

### Phase 1: 12개 도메인 mapper hub 통합 (MEDIUM)

**Canonical 통합 패턴** (checkout-errors.ts 기준):

```typescript
// import 추가 (파일 상단)
import { extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

// 함수 본체 — ErrorCode 매핑 return 직후, generic fallback 직전:
  if (errorCode && XXX_ERROR_I18N_KEYS[errorCode]) {
    return { title: t('errors.title'), description: t(...) };
  }

  // ADR-0008: ErrorCode 미매핑 시 Zod validation issues fallback
  if (extractValidationIssues(error)) {
    const zodToast = mapZodIssuesToToast(error, t);
    if (zodToast) return zodToast;
  }

  return { title: t('errors.title'), description: ... };
```

**변경 파일 (12개):**

1. `apps/frontend/lib/errors/disposal-errors.ts` — `mapDisposalErrorToToast` ErrorCode 매핑 return 직후 삽입
2. `apps/frontend/lib/errors/cables-errors.ts` — `mapCableErrorToToast` 동일
3. `apps/frontend/lib/errors/calibration-factor-errors.ts` — `mapCalibrationFactorErrorToToast` 동일
4. `apps/frontend/lib/errors/equipment-import-errors.ts` — `mapEquipmentImportErrorToToast` 동일
5. `apps/frontend/lib/errors/form-template-errors.ts` — **변형 패턴** (단일 return 구조): ErrorCode 미매핑 판별 후 zod fallback 삽입
6. `apps/frontend/lib/errors/intermediate-inspection-errors.ts` — `mapIntermediateInspectionErrorToToast` 동일
7. `apps/frontend/lib/errors/notification-errors.ts` — `mapNotificationErrorToToast` 동일
8. `apps/frontend/lib/errors/self-inspection-errors.ts` — `mapSelfInspectionErrorToToast` 동일
9. `apps/frontend/lib/errors/software-validation-errors.ts` — `mapSoftwareValidationErrorToToast` 동일
10. `apps/frontend/lib/errors/team-errors.ts` — `mapTeamErrorToToast` 동일
11. `apps/frontend/lib/errors/test-software-errors.ts` — `mapTestSoftwareErrorToToast` 동일
12. `apps/frontend/lib/errors/user-errors.ts` — **변형 패턴** (`mapBackendErrorCode` 헬퍼 경유): `i18nKey !== USER_ERROR_FALLBACK_I18N_KEY` 분기 return 직후 삽입

**자연 제외 (3개 — 코드 수정 금지)**:
- `cable-errors.ts` — re-export shim only (`export { mapCableErrorToToast } from './cables-errors'`)
- `document-errors.ts` — `mapDocumentFileErrorToToast(error, fallbackDescription)` 시그니처에 t 함수 없음 (download path 전용)
- `equipment-errors.ts` — `mapXxxErrorToToast` 함수 자체 없음 (enum/ApiError class 인프라)

**완료 기준:**
```bash
for f in disposal cables calibration-factor equipment-import form-template \
  intermediate-inspection notification self-inspection software-validation \
  team test-software user; do
  grep -l "mapZodIssuesToToast" "apps/frontend/lib/errors/${f}-errors.ts" || echo "FAIL: ${f}"
done
```

### Phase 2: ts-morph 정적 spec

**변경 파일:**

1. `apps/frontend/package.json` — `devDependencies`에 `"ts-morph": "^23.0.0"` 추가
2. `apps/frontend/lib/errors/__tests__/zod-fallback-coverage.spec.ts` — 신규

**spec 핵심 로직:**

```typescript
import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

const ERRORS_DIR = path.resolve(__dirname, '..');
const EXCLUSIONS = new Set([
  'cable-errors.ts',      // re-export shim only
  'document-errors.ts',   // download path, no t function
  'equipment-errors.ts',  // enum/class infra, no mapXxxErrorToToast
  'extract-error.ts',     // hub itself
  'zod-issue-mapper.ts',  // hub itself
]);

const errorFiles = fs
  .readdirSync(ERRORS_DIR)
  .filter((f) => f.endsWith('-errors.ts') && !EXCLUSIONS.has(f));

describe('도메인 mapper hub fallback 정적 검증 (ADR-0008 Layer 4)', () => {
  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, '../../../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });
  project.addSourceFilesAtPaths(errorFiles.map((f) => path.join(ERRORS_DIR, f)));

  test.each(errorFiles.map((f) => [f, path.join(ERRORS_DIR, f)]))(
    '%s — mapXxxErrorToToast must call extractValidationIssues + mapZodIssuesToToast',
    (filename, filepath) => {
      const sf = project.getSourceFileOrThrow(filepath);
      const fns = sf
        .getFunctions()
        .filter((fn) => /^map[A-Z][A-Za-z]*ErrorToToast$/.test(fn.getName() ?? '') && fn.isExported())
        .filter((fn) => fn.getParameters().length === 2); // (error: unknown, t: TranslationFunction)

      expect(fns.length).toBeGreaterThanOrEqual(1);

      const targetFn = fns[0];
      const calls = targetFn
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .map((c) => c.getExpression().getText());

      expect(calls).toContain('extractValidationIssues');
      expect(calls).toContain('mapZodIssuesToToast');
    }
  );
});
```

### Phase 3: Backend Telemetry

**변경 파일:**

1. `apps/backend/src/common/metrics/metrics.service.ts` — `zodValidationIssuesCounter: Counter` + `observeZodIssueCount` + `bucketIssueCount`
2. `apps/backend/src/common/filters/error.filter.ts` — 생성자 3번째 `@Optional() @Inject(MetricsService)` 추가 + ZodError 분기에서 `observeZodIssueCount` 호출
3. `apps/backend/src/common/filters/__tests__/error-filter-zod.spec.ts` — `mockMetrics` mock + 신규 케이스 추가

**Counter 정의:**
```typescript
this.zodValidationIssuesCounter = new Counter({
  name: 'zod_validation_issues_total',
  help: 'Total Zod validation issues emitted per response, bucketed by issue count (ADR-0008 §4).',
  labelNames: ['domain_route', 'issue_count_bucket'],
  registers: [this.registry],
});

observeZodIssueCount(domainRoute: string, issueCount: number): void {
  const bucket = issueCount <= 1 ? '1' : issueCount <= 5 ? '2-5' : issueCount <= 10 ? '6-10' : '11+';
  this.zodValidationIssuesCounter.inc({ domain_route: domainRoute, issue_count_bucket: bucket });
}
```

**filter 주입 패턴:**
```typescript
constructor(
  private readonly auditService: AuditService,
  @Optional() @Inject(SYSTEM_ERROR_EVENT_PROVIDER)
  private readonly systemErrorEventProvider?: SystemErrorEventProvider,
  @Optional() @Inject(MetricsService)
  private readonly metricsService?: MetricsService,
) {}
```

### Phase 4: SKILL + ADR closure

**변경 파일:**

1. `.claude/skills/verify-zod/SKILL.md` — Step 22 임계값 ≥ 17 정정 + Step 23 신설
2. `docs/adr/0008-backend-zod-error-i18n.md` — §4 closure note 추가

## 배포 순서

1. Phase 1 → commit `feat(errors): 12 도메인 mapper hub fallback 통합 (ADR-0008 Layer 4)`
2. Phase 2 → commit `test(errors): ts-morph zod-fallback-coverage 정적 spec (ADR-0008)`
3. Phase 3 → commit `feat(monitoring): zod_validation_issues_total Counter (ADR-0008 §4)`
4. Phase 4 → commit `docs(skill): verify-zod Step 23 + ADR-0008 §4 closure`

## 후속 tech-debt (분리 등록 대상)

- **alert rule**: Grafana `zod_validation_issues_total{issue_count_bucket="11+"}` rate alert (ops scope)
- **ESLint custom rule 마이그레이션**: ts-morph spec → TypeScript ESLint plugin 자체 작성 (blast radius 미정)
- **e2e Zod fail → toast e2e**: backend Zod fail response → frontend toast 표시 e2e 1 케이스 (equipment-import 후보)
