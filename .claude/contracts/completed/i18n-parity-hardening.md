# 스프린트 계약: i18n Parity Hardening

## 생성 시점

2026-04-28

## 슬러그

`i18n-parity-hardening`

## 연결

- 실행 계획: `.claude/exec-plans/active/2026-04-28-i18n-parity-hardening.md`
- 결과 보고서(생성 예정): `.claude/evaluations/i18n-parity-hardening.md`

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

각 기준은 **실행 명령**을 명시하며, 그 명령의 종료 코드 0(또는 명시된 산출 텍스트)을 기준으로 판정한다.

#### M1 — 루트 + 프론트엔드 TypeScript 컴파일 PASS

- **명령:** `pnpm tsc --noEmit`
- **PASS 조건:** exit 0, "error TS" 0건
- **근거:** Phase 1의 prop signature 변경이 모든 caller에 일관 적용됐는지 보장

#### M2 — 프론트엔드 프로덕션 빌드 PASS

- **명령:** `pnpm --filter frontend run build`
- **PASS 조건:** exit 0, `Failed to compile`/`MISSING_MESSAGE` 출력 없음
- **근거:** next-intl 빌드 타임 체크 + Phase 4의 husky 게이트가 빌드와 정합

#### M3 — 신규 호출지 검증 스크립트 PASS

- **명령:** `node scripts/check-i18n-call-sites.mjs --all`
- **PASS 조건:** exit 0, stderr에 `누락:` 라인 0건, stdout 마지막 라인이 통계 메시지(예: `✅ i18n call-sites: 3,5xx개 키 검사 — 누락 0건`)
- **근거:** Phase 3 신규 게이트의 자기 검증 — Phase 2의 키 복원이 호출지 전부를 커버

#### M4 — `MISSING_MESSAGE` 런타임 부재 (라우트 단위)

- **검증 방법:** Evaluator는 다음 두 라우트를 ko 로케일로 직접 렌더링하여 콘솔에 `MISSING_MESSAGE` 0건임을 확인.
  - `/checkouts` (NextStepPanel.tsx 표면 버그 발생 페이지)
  - `/equipment/<seed-equipment-uuid>/non-conformance` (NCManagementClient 38건 회귀 페이지)
- **명령(권장):** Phase 6 e2e가 추가됐다면 `pnpm --filter frontend run test:e2e -- tests/e2e/features/i18n/no-missing-message.spec.ts`
- **명령(폴백 — Phase 6 미적용 시):** dev 서버 띄우고 `playwright-test` MCP 또는 `mcp__playwright-test__browser_navigate` 후 `mcp__playwright-test__browser_console_messages`로 missing message 0건 확인
- **PASS 조건:** ko/en 둘 다 missing message 0건 + 본문 텍스트에 raw key 패턴(`/^[a-z][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+$/`) 노출 0건
- **시드 ID:** 검증 시 NC가 등록된 장비 시드 UUID 사용 — 시드 데이터에 따라 `seed.spec.ts`가 사용하는 ID 재사용

#### M5 — Pre-push hook이 호출지 검증 실행

- **명령:** `cat .husky/pre-push | grep -F "check-i18n-call-sites.mjs --all"`
- **PASS 조건:** 1 hit 이상
- **근거:** Phase 4 게이트 wiring 확인. 회귀 차단 보장

#### M6 — Pre-commit hook이 호출지 검증 실행

- **명령:** `cat .husky/pre-commit | grep -F "check-i18n-call-sites.mjs --changed"`
- **PASS 조건:** 1 hit 이상
- **근거:** Phase 4 — 빠른 피드백을 commit 시점에 제공

#### M7 — 사용자 가시 텍스트 하드코딩 0건 도입 (변경분 한정)

- **명령:**
  ```bash
  git diff origin/main...HEAD -- 'apps/frontend/**/*.{ts,tsx}' | \
    grep -E '^\+' | \
    grep -vE '^\+\+\+|^\+//|^\+\s*\*|^\+import|^\+export' | \
    grep -E '"[가-힣]+"|"[A-Z][a-z]+\s+[A-Za-z]+"' | \
    grep -vE 'data-testid|aria-label|className|style|messages/' | \
    head -20
  ```
- **PASS 조건:** 출력 0줄 (또는 출력이 있으나 모두 i18n 함수 호출 결과를 binding하는 라인이거나 컨벤션상 허용된 사이트)
- **근거:** Phase 1 prop 주입에서 fallback 한국어 문자열을 atom에 넣는 안티패턴 방지. 본 plan의 "비하드코딩" 영역 결정과 정합
- **주의:** 메시지 JSON(`messages/`)는 SSOT이므로 위 grep에서 제외됨

#### M8 — `any` 타입 도입 0건 (변경분 한정)

- **명령:**
  ```bash
  git diff origin/main...HEAD -- 'apps/frontend/**/*.{ts,tsx}' 'scripts/**/*.{mjs,ts}' | \
    grep -E '^\+' | \
    grep -E ':\s*any\b|<any>|as\s+any\b' | \
    grep -vE '^\+//|^\+\s*\*'
  ```
- **PASS 조건:** 출력 0줄
- **근거:** CLAUDE.md Rule 3 — TypeScript Strict

#### M9 — SSOT 존중 (locale/namespace 로컬 재정의 0건)

- **명령:**
  ```bash
  git diff origin/main...HEAD -- 'apps/frontend/**/*.{ts,tsx}' 'scripts/**/*.{mjs,ts}' | \
    grep -E '^\+' | \
    grep -E "type\s+(Locale|Namespace)\s*=|const\s+LOCALES\s*=\s*\[" | \
    grep -v 'SUPPORTED_LOCALES\|@equipment-management/schemas'
  ```
- **PASS 조건:** 출력 0줄 — locale 상수는 `@equipment-management/schemas`의 `SUPPORTED_LOCALES`/`DEFAULT_LOCALE`만 사용
- **근거:** CLAUDE.md Rule 0 — SSOT
- **예외:** 신규 스크립트 `check-i18n-call-sites.mjs`에서 `LOCALES = ['ko', 'en']`이 명시되어도 무방하나, 가능한 경우 `apps/frontend/lib/i18n/server.ts` 또는 schemas SSOT 재사용 권장 (단, 이는 Node 스크립트라 monorepo workspace import 제약 있음 — 명시 배열 허용. 기존 `check-i18n-keys.mjs`도 동일 패턴 사용 중)

#### M10 — Atom의 cross-cutting namespace 의존 부재 (`common`/`errors` 등)

- **정책 (frontend-patterns.md "Atom-level i18n 금지 원칙" 참조):**
  - atom은 **cross-cutting namespace** (`common`, `errors` 등 도메인-무관 라벨)에 의존 금지 — caller가 prop으로 주입
  - atom은 **자기 home domain namespace** (`checkouts.fsm`처럼 atom의 본질적 도메인) 호출 가능 — 단, JSDoc에 결합 명시 + frontend-patterns.md에 예외 등록 필수
  - 이는 "atom은 도메인 모르는 척" 위장이 자기-모순 회귀를 부르는 것을 막기 위함 (본 회귀의 표면 원인이 정확히 그 위장)
- **명령 (cross-cutting 의존 부재 검증, 코드 라인만):**
  ```bash
  # NextStepPanel이 'common', 'errors', 'navigation' 같은 cross-cutting ns를
  # 실제 binding 코드(`const x = useTranslations('cross-cut-ns')`)로 호출하지 않음을 검증.
  # 주석/JSDoc 안의 문자열 등장은 false positive로 제외 (라인 시작이 `*` 또는 `//`이면 무시).
  # home domain (checkouts.fsm)은 정책상 허용 → 매치 대상에서 제외.
  grep -nE "^[^*/]*\\b(?:const|let|var)\\s+\\w+\\s*=\\s*(?:await\\s+)?(?:useTranslations|getTranslations)\\s*\\(\\s*['\"](common|errors|navigation|notifications|auth)" apps/frontend/components/shared/NextStepPanel.tsx
  ```
- **PASS 조건:** 0 hit (cross-cutting ns binding 0건). JSDoc 주석/문자열 안 등장은 무관
- **부가 검증 (home domain 결합이 문서화되었는지):**
  ```bash
  grep -n "checkouts.fsm" apps/frontend/components/shared/NextStepPanel.tsx | head -5
  grep -nE "Atom-level i18n.*예외|home domain" docs/references/frontend-patterns.md
  ```
- **근거:** Phase 1 — common namespace 의존 제거(=회귀 표면 fix) + atom 결합 정책 SSOT 등록. Plan은 "constrain deliverables, not implementation"에 따라 결과(cross-cutting 의존 부재)를 측정. 호출 0건은 100+ 키 prop pump 강제로 caller 파괴적 — 시니어 결정상 부적절

#### M11 — non-conformances `management.*` 블록 복원 + parity

- **명령:**
  ```bash
  node -e "
  const ko = require('./apps/frontend/messages/ko/non-conformances.json');
  const en = require('./apps/frontend/messages/en/non-conformances.json');
  const koMgmt = ko.management;
  const enMgmt = en.management;
  if (!koMgmt || !enMgmt) { console.log('FAIL: management 블록 누락'); process.exit(1); }
  function flatten(o, p='') { const r=[]; for (const k in o) { const np=p?p+'.'+k:k; if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) r.push(...flatten(o[k], np)); else r.push(np); } return r; }
  const koKeys = flatten(koMgmt).sort();
  const enKeys = flatten(enMgmt).sort();
  if (JSON.stringify(koKeys) !== JSON.stringify(enKeys)) { console.log('FAIL: ko/en management.* 키 불일치'); process.exit(1); }
  console.log('PASS: management 블록 복원, ko/en parity 유지 (' + koKeys.length + ' 키)');
  "
  ```
- **PASS 조건:** stdout `PASS: management 블록 복원...`, exit 0
- **근거:** Phase 2 회귀 정리 검증

---

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

#### S1 — 호출지 검증 스크립트 실행 시간 ≤ 5초

- **명령:** `time node scripts/check-i18n-call-sites.mjs --all 2>&1 | tail -3`
- **PASS 조건:** real time ≤ 5.0s
- **실패 시 조치:** tech-debt-tracker.md에 "i18n call-sites check 성능 최적화 필요" 항목 추가

#### S2 — 정찰에서 발견된 67건 누락 키 모두 정리

- **명령:** `node scripts/check-i18n-call-sites.mjs --all` 의 stderr에 `누락:` 라인 0건
- **PASS 조건:** stderr에 `누락:` (broken key) 0줄. shadowed binding 정보성 WARN(`⚠️`)은 허용 — Step 16 Exceptions에 명시된 검증 한계
- **실패 시 조치:** 잔존 누락 키 tech-debt-tracker.md 기록

#### S3 — frontend-patterns.md 신규 섹션 3개 추가

- **명령 (regex-safe — backtick-fenced inline code 인식):**
  ```bash
  grep -cE "^### .*(Atom-level i18n|namespace SSOT|loading\\.tsx)" docs/references/frontend-patterns.md
  ```
- **PASS 조건:** count ≥ 3 (즉 새 섹션 헤딩 3개 모두 존재)
- **근거:** Phase 5 — design 원칙 SSOT 문서화. 백틱(`` `loading.tsx` ``)이 헤딩 안에 있어도 매치되도록 헤딩 prefix 기반 정규식 사용

#### S4 — verify-i18n Step 16 추가

- **명령:** `grep -n "Step 16" .claude/skills/verify-i18n/SKILL.md`
- **PASS 조건:** 1 hit 이상
- **근거:** Phase 3 — skill 문서 동기화

#### S5 — 라우트 단위 e2e smoke 추가

- **명령:** `ls apps/frontend/tests/e2e/features/i18n/no-missing-message.spec.ts`
- **PASS 조건:** 파일 존재
- **실행:** `pnpm --filter frontend run test:e2e -- tests/e2e/features/i18n/no-missing-message.spec.ts` PASS
- **실패 시 조치:** Phase 6은 권장이므로 미구현해도 차단 없음 — tech-debt에 기록

#### S6 — tech-debt-tracker.md 후속 항목 등록

- **명령:** `grep -nE "i18n-parity-hardening|useTranslation 단수형|shadowed.*binding" .claude/exec-plans/tech-debt-tracker.md`
- **PASS 조건:** 3 hit 이상 (3개 신규 항목)

---

## 적용 verify 스킬

변경 영역 기반 자동 선택. 본 작업에서는 다음 스킬이 의무 또는 권장:

- **의무:** `verify-i18n` (Step 1–16 전체)
- **의무:** `verify-hardcoding` (M7과 보완)
- **의무:** `verify-ssot` (M9와 보완)
- **권장:** `review-architecture` (Phase 5의 design 결정 검토)
- **권장:** `verify-implementation` (Phase 1의 atom prop 변경이 caller 전부에 일관됐는지)

---

## 종료 조건

- **MUST 11개 전체 PASS** → 성공 (loop 종료)
- **동일 MUST 항목 2회 연속 FAIL** → 설계 문제, 수동 개입 요청
- **3회 반복 초과** → 수동 개입 요청
- **SHOULD 실패** → 종료 조건에 영향 없음. tech-debt-tracker.md 기록

## 위험 / 차단 요인

- **NC 시드 데이터:** M4 검증에서 NC가 등록된 장비 시드 UUID가 필요. seed.spec.ts 또는 db:seed 결과의 known UUID 재사용 — Generator는 시드 데이터 확인 후 진행
- **caller 누락:** Phase 1에서 NextStepPanel caller를 빠뜨리면 M1(tsc)이 잡지만 빈 prop 전달은 누락 가능 → Generator는 caller 목록을 명시적 grep으로 enumerate
- **shadowed binding 87건:** 본 plan에서 SKIP 결정. 정적 검증 통과해도 런타임 누락 가능성 잔존 — tech-debt 등록(S6)으로 가시화

## 변경 대상 외 영역 (out of scope)

- 백엔드 (i18n 미사용)
- `lib/i18n/client.ts:useTranslation` 단수형 래퍼 마이그레이션 (별도 후속 작업, tech-debt만 등록)
- ESLint custom rule (`no-atom-i18n`, `no-shadow-i18n-binding`) 구현
- next-intl `getMessageFallback` API 활용 (별도 작업)
