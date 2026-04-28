# 다음 세션 핸드오프 — Dashboard Redesign Phase E + 매칭 검증 (2026-04-29 예정)

## 컨텍스트

이번 세션(2026-04-28)에서 `c:/Users/kmjkd/Downloads/_ _ _standalone_.html` 5 역할 React 목업 + `C:\Users\kmjkd\Downloads\개발 명세서.md` v1.0+v1.1 (38 issues)의 1:1 구현 + 6개 architecture-level 개선(SSOT 통합, i18n 마이그레이션, dual-mode CheckoutCard, backend stub 제거, RoleGate 시뮬레이션, 카드별 ErrorBoundary)을 완료했다.

추가로 세션 마무리 단계에서 verify-implementation + review-architecture + manage-skills 3개 agent 병렬 검증을 거치며 Critical/Warning/Info 이슈를 일괄 fix했다.

**완료 검증 (2026-04-28 끝)**:
- frontend `tsc --noEmit`: 0 errors
- backend `tsc --noEmit`: 0 errors
- shared-constants 빌드: 0 errors
- frontend `eslint`: 13건 deprecated 에러 (모두 pre-existing, HEAD에서도 동일 발생 — 이번 세션 작업과 무관)
- single-shot Evaluator agent: critical 5 + minor 3 발견 → 모두 fix
- verify-implementation: P0×1, P1×4, P2×5 → P0+P1 모두 fix, P2 일부 fix + tracker 등록
- review-architecture: SHOULD-FIX 3건(SSOT 우회 / 캐시 누락 / dual-mode 부호 역전) → 모두 fix
- manage-skills: P1 skill 업데이트 2건(verify-ssot Step 35, verify-design-tokens Step 43) → 적용 완료, P2 4건은 다음 세션 등록

**verify/review/manage-skills 산출 리포트**:
- `.claude/evaluations/dashboard-redesign-verify-implementation-final.md`
- `.claude/evaluations/dashboard-redesign-architecture-review.md`
- `.claude/evaluations/dashboard-redesign-manage-skills.md`

**미완료 (의도적 deferred)**:
1. **Phase E ESLint 커스텀 룰 3종** (DASH-221, P2)
2. **HTML/명세서 매칭 정밀 검증** (시각 1:1 대조)
3. **Playwright dashboard-screenshots.spec.ts 실측**
4. **tech-debt-tracker 잔여 항목** (`tech-debt-tracker.md` 끝부분 "2026-04-28 dashboard-redesign-residual" + "2026-04-28 manage-skills P2" 섹션 참조)
   - pre-existing dday deprecation 13건 (4-tier 마이그레이션 Sprint 트리거)
   - dashboard scope Zod enum 검증 누락
   - dashboard.service ConfigService 미경유 (process.env 직접 접근)
   - kpi-status-grid 280px 인라인 토큰화
   - SystemHealth React Query monitoring 폴링 미적용
   - manage-skills P2 skill 업데이트 4건 (verify-ssot Step 36 / verify-frontend-state Step 21·24 / verify-design-tokens Step 43 보강)

---

## 다음 세션 작업 1 — Phase E: ESLint 커스텀 룰 3종 (P2)

### 목표

명세서 §A.20.1 기준 3개 룰 구현. 단순 `no-restricted-syntax` config로 처리 가능한 것은 그렇게, 더 정교한 검사가 필요한 것은 `eslint-plugin` 자체 구축.

### 룰 명세

#### Rule 1: `no-hardcoded-colors`

**목적**: hex 색상 직접 사용 금지 (디자인 토큰 강제).

**구현 옵션 A — `no-restricted-syntax` (간단, 권장)**:
```js
// apps/frontend/eslint.config.mjs
{
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
        message: 'Hex colors prohibited. Use design tokens (lib/design-tokens) or Tailwind brand-* classes.',
      },
    ],
  },
}
```

**예외 처리**: `lib/design-tokens/**`, `app/globals.css`는 토큰 정의 자체이므로 `overrides`로 제외.

#### Rule 2: `dashboard-i18n-required`

**목적**: dashboard 디렉토리의 JSX text node에서 한글 발견 시 경고 → t() 강제.

**구현**:
```js
{
  files: ['apps/frontend/components/dashboard/**/*.tsx'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXText[value=/[\\uAC00-\\uD7A3]/]',
        message: 'Korean text in dashboard JSX. Use useTranslations() with key under messages/{ko,en}/dashboard.json.',
      },
    ],
  },
}
```

**예외**: 컴포넌트 prop의 default value는 별도 처리 (현재는 컴포넌트 작성자가 i18n 키로 강제).

#### Rule 3: `no-direct-dday-tone`

**목적**: D-day 톤 클래스(`text-overdue`, `bg-urgent` 등)를 `resolveDdayTone()` 거치지 않고 직접 사용 시 에러.

**구현**:
```js
{
  files: ['apps/frontend/**/*.tsx', 'apps/frontend/**/*.ts'],
  ignores: ['apps/frontend/lib/design-tokens/components/dday-tone.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/(text|bg|border)-(overdue|urgent|soon|normal)\\b/]',
        message: 'Direct DDay tone class prohibited. Use resolveDdayTone() and DDAY_TONE_CLASSES from @/lib/design-tokens.',
      },
    ],
  },
}
```

### 작업 단계 (예상 0.5d)

1. `apps/frontend/eslint.config.mjs` 읽기 — flat config 구조 파악
2. 위 3개 룰을 `rules.no-restricted-syntax` 배열에 추가 (또는 별도 override block)
3. 토큰 정의 파일은 ignores로 제외
4. `pnpm --filter frontend lint` 실행 → 기존 코드 위반 0건 확인
5. 위반이 있으면 수동 fix or 적절한 disable 주석 추가
6. tsc + lint 통과 확인

### 위험 요소

- 기존 코드(out-of-scope 파일들)에 위반이 있으면 lint가 깨짐 → 그 경우 룰 도입 전 광범위 cleanup 필요. 또는 룰을 `warn` 레벨로 낮춰 점진적 도입.

---

## 다음 세션 작업 2 — HTML/명세서 매칭 정밀 검증

### 목표

이번 세션에서 명세서 v1.0+v1.1 38 issues + standalone HTML 5 역할별 React mockup 1:1 구현을 주장했지만, 실제 브라우저 렌더링 + 명세서 모든 디테일 매칭 여부는 시각 검증 미완료.

### 검증 항목 (체크리스트)

#### 시각 1:1 — standalone HTML과 비교
HTML 추출 본은 `/tmp/bundle_out/` 에 있음 (이전 세션에서 추출). 다음 세션에서는 `node /tmp/extract_bundle.mjs` 재실행 필요.

대조 절차:
1. `node /tmp/extract_bundle.mjs`로 5 JSX 컴포넌트 재추출
2. 5 역할별로 `/dashboard` 라우트를 Playwright로 1440×900 뷰포트 스냅샷
3. JSX 목업과 nav-by-nav 비교:
   - **Sidebar** (01-shared-atoms.jsx): "EQ" 마크 + 운영(7)/관리(4)/시스템(1) + active 좌측 3px 컬러바
   - **Topbar**: 🔍 검색 + ⌘K + 대시보드 crumb + ☼/🔔/avatar
   - **Welcome (5종)**: greeting + role-tag (indigo/teal/purple/amber/slate) + qa-bar 4 actions
   - **AlertBanner**: critical/scheduled 분리 + pills + "보기 →"
   - **KpiHero**: 56px + bar 35% + "0 ~ 35% 가용"
   - **KpiCell**: gauge tone (warn/danger/ok) + foot
   - **CalibrationDdayList**: 4 톤 — 시드에 D+45/D+10/D-6/D+90 등 실제 노출 확인
   - **PendingApprovalCard priority list**: heavy + default + muted (통합 row)
   - **CheckoutCard tabs**: 반납 예정 N / 기한 초과 N
   - **TeamEquipmentDistribution**: systemAdmin 시 6+ 행 + "+N팀 더보기" + 빨강 범례
   - **MiniCalendar**: 7-col + today(navy bg) + 4 dot 범례
   - **ReviewPendingHero**: 가로 hero + 보라 아이콘 + 검토 시작 button + 처리율 색상
   - **MyQuickSummary**: 3 행 + 게이지
   - **SystemHealthCard**: activeUsers/dbMs/storage/queue 4 메트릭 + 24h 오류 푸터

#### 명세서 §별 항목별 검증

| 섹션 | 검증 항목 | 상태 |
|---|---|---|
| §1.1 | dday tone (overdue/urgent/soon/normal) | ✅ shared-constants SSOT |
| §1.2 | distBar tone | ✅ |
| §2.1 | EmptyState neutral/success/error | ✅ |
| §2.2 | DDayTag border-l 3px + font-mono | ✅ |
| §2.3 | PriorityRow heavy/default/muted | ✅ |
| §3.1 | Sidebar EQ + active accent | ⚠️ 시각 검증 필요 (DashboardShell 수정 흐름 확인) |
| §3.2 | KPI 가동률 neutral + warn gauge + 목표 60% | ✅ AP-1 fix |
| §3.3 | PendingApproval priority list | ✅ |
| §3.4 | MyCheckoutCard → CheckoutCard scope='me' | ✅ |
| §3.5 | CalibrationDdayList DDayTag | ✅ |
| §3.6 | TeamEquipmentDistribution 강조 | ✅ |
| §3.7 | DashboardRow3 items-stretch | ⚠️ DashboardRow3.tsx의 grid 클래스에 items-stretch 적용 여부 재확인 |
| §3.8 | dashboard-config systemAdmin Row3 재구성 | ✅ |
| §3.9 | SystemHealthCard 4 메트릭 + 게이지 + footer | ✅ AP-1, AP-5 |
| §3.10 | 디버그 위젯 제거 | ⚠️ 별도 Issue 위젯이 production에서 안 보이는지 확인 |
| §4.1~4.5 | 역할별 grid-cols | ✅ DASHBOARD_GRID 토큰 |
| §5.1~5.3 | 반응형 768/1024 | ⚠️ Playwright 4 뷰포트 회귀 |
| §6.1~6.4 | 접근성 ARIA + skip nav + 대비 + reflow | ⚠️ axe-core 자동 검증 권장 |
| §7.1~7.2 | API 엔드포인트 + 캐싱 | ✅ |
| §A.1.1 | Topbar truncate + Tooltip | ✅ |
| §A.1.2 | Welcome displayName + 시간대 인사 | ✅ |
| §A.2.1 | AlertBanner pill 정렬 + role | ✅ |
| §A.3.1 | MiniCalendar 범례 가독성 | ⚠️ 12px / 8px dot 적용 여부 시각 확인 |
| §A.4.1 | MyQuickSummaryCard | ✅ AP-3 i18n |
| §A.5.1 | RecentActivities 역할별 탭 | ✅ |
| §A.6.1 | TeamEquipmentDistribution scope/6행 | ✅ |
| §A.7.1 | CheckoutCard 단일 컴포넌트 | ✅ AP-4 dual-mode |
| §A.8.1 | PriorityRow 임계값 5 + 통합 row | ✅ |
| §A.9.1 | Skip nav 2종 | ⚠️ "사이드바 탐색 건너뛰기" 두 번째 skip-link 존재 여부 확인 |
| §A.10.1 | EmptyState CTA 매핑 | ✅ |
| §A.11.1 | 다크모드 토큰 + 대비 | ⚠️ Storybook/Playwright dark snapshot 회귀 |
| §A.12.1 | "총 N건" 동적 계산 | ✅ |
| §A.13.1 | processingRate 공식 | ✅ AP-1 SSOT |
| §A.14.1 | dday "정상" 톤 사용처 | ✅ |
| §A.15.1~4 | 모션 stagger + reduce-motion | ✅ DASHBOARD_ENTRANCE 토큰 |
| §A.16.1 | i18n 키 + locale 포매터 | ✅ |
| §A.17.1~3 | 로딩/에러/오프라인 | ✅ Skeleton 7 + ErrorBoundary + OfflineBanner |
| §A.18.1~3 | Print + CSV export | ❌ 미구현 (P2 deferred) |
| §A.19.1~3 | 권한 가드 + RoleGate + simulate | ✅ |
| §A.20.1 | ESLint 커스텀 룰 | ❌ 다음 세션 (Phase E) |
| §A.20.2 | atomic 폴더 정리 | ✅ |

⚠️ 표시는 Playwright/시각 회귀로만 검증 가능 — 정적 검증 불가.

### 작업 단계 (예상 1d)

1. `apps/frontend/tests/e2e/dashboard-screenshots.spec.ts` (이미 untracked로 존재) 검토 + 보강
2. 5 역할 × 4 뷰포트(1440/1280/1024/768) = 20 baseline 캡처
3. 다크모드 5 역할 추가 캡처
4. axe-core a11y 자동 검증
5. ⚠️ 항목들 1:1 매칭 — 차이점 발견 시 surgical fix 또는 tech-debt-tracker 등록
6. §A.18 (Print/CSV)은 deferred 결정 유지 → tracker 명시

### 우선순위

P0: 시각 1:1 매칭 차이 (특히 §3.1 EQ 마크, §3.7 items-stretch, §3.10 디버그 위젯)
P1: 다크모드 + a11y
P2: §A.18 (별도 sprint)

---

## 다음 세션 작업 3 — tech-debt-tracker 잔여 (3건)

이번 세션에서 등록된 항목 (`tech-debt-tracker.md` 끝부분):

1. **system-health-queue-size-impl** — BullMQ 도입 시 실측 연결 필요. 트리거: 큐 인프라 도입 sprint.
2. **system-health-error-source-table** — 진정한 시스템 에러 카운트는 별도 `error_logs` 또는 Sentry 통합. 현재 audit_logs `reject`/`cancel` proxy 사용. 트리거: 운영 모니터링 정비 sprint.
3. **dashboard-storage-capacity-env** — `DASHBOARD_STORAGE_CAPACITY_BYTES` env 운영 환경별 설정. 트리거: 프로덕션 배포 체크리스트.

이 3건은 인프라 의존성으로 다음 세션에서 직접 해결 불가. 등록만 유지.

---

## 다음 세션 시작 시 체크리스트

```bash
# 1. 다른 PC에서도 컨텍스트 회복
git fetch origin
git status  # 미커밋 변경 없는지

# 2. DB 리셋 (PC 이동 후 메모리 따라)
pnpm --filter backend run db:reset

# 3. 개발 서버 (Phase E ESLint 룰 검증 시 필요)
pnpm dev

# 4. 이번 세션 마무리 시 만든 리포트들 검토
ls -la .claude/evaluations/dashboard-redesign-*.md

# 5. 작업 시작
# Option A: Phase E (ESLint 룰)
# Option B: HTML/명세서 매칭 검증 (Playwright)
# 두 작업 모두 다음 세션에 예정 — 우선순위는 사용자 결정
```

## 권장 시작 멘트

> "이번 세션은 dashboard redesign Phase E ESLint 룰 + HTML/명세서 매칭 검증으로 시작한다. 먼저 `.claude/evaluations/dashboard-redesign-verify-implementation-final.md`와 `dashboard-redesign-architecture-review.md`를 읽고 잔여 이슈를 파악한 뒤, Phase E ESLint 룰 3종(no-hardcoded-colors / dashboard-i18n-required / no-direct-dday-tone) 도입부터 진행한다. ESLint 룰이 통과하면 Playwright dashboard-screenshots.spec.ts로 5 역할 × 4 뷰포트 시각 회귀 베이스라인을 캡처해 standalone HTML과 1:1 매칭 여부를 정밀 검증한다."

## 핵심 SSOT 위치 (다음 세션에 자주 참조)

- 임계값 SSOT: `packages/shared-constants/src/dashboard-thresholds.ts`
- 디자인 토큰: `apps/frontend/lib/design-tokens/components/{dashboard,dday-tone}.ts`
- 역할별 layout: `apps/frontend/lib/config/dashboard-config.ts`
- i18n 키: `apps/frontend/messages/{ko,en}/dashboard.json`
- 백엔드 응답 DTO: `apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts`
- 신규 컴포넌트: `apps/frontend/components/dashboard/{atoms,cards,skeletons}/`
