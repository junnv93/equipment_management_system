# 스프린트 계약: terror-s1-hook-spec

## 생성 시점
2026-05-09T10:00:00+09:00

## Slug
terror-s1-hook-spec

## 모드
Mode 2 (Full) — `tech-debt-tracker.md` 미해결 2 항목 단일 harness closure

## 변경 범위
- i18n JSON: 8 파일 (`messages/{ko,en}/{disposal,notifications,teams,users}.json` — `errors.genericError` 키 *추가*)
- frontend hook spec: 1 신규 (`apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts`)
- 문서: 1 (`.claude/exec-plans/tech-debt-tracker.md` 두 항목 `[x]` 체크)

**기존 코드 수정**: 0건 (mapper / hook 본체 / 다른 도메인 i18n 모두 변경 금지)

---

## 성공 기준

### MUST — 실패 시 루프 재진입

#### Phase 1: i18n `errors.genericError` 8 파일 추가

- [ ] **M-1** `pnpm tsc --noEmit` 에러 0
  ```bash
  pnpm tsc --noEmit 2>&1 | grep -c "error TS"
  # 기대: 0
  ```

- [ ] **M-2** `pnpm --filter frontend run lint` PASS (exit 0)

- [ ] **M-3** 8 파일 모두 `errors.genericError` 키 존재 + 도메인별 SSOT 톤 일치
  ```bash
  node -e "
  const exp = [
    ['ko','disposal','처리 중 오류가 발생했습니다. 다시 시도하세요.'],
    ['en','disposal','An error occurred. Please try again.'],
    ['ko','notifications','요청을 처리하는 중 오류가 발생했습니다.'],
    ['en','notifications','An error occurred while processing the request.'],
    ['ko','teams','요청을 처리하는 중 오류가 발생했습니다.'],
    ['en','teams','An error occurred while processing the request.'],
    ['ko','users','요청을 처리하는 중 오류가 발생했습니다.'],
    ['en','users','An error occurred while processing the request.'],
  ];
  let pass = true;
  for (const [loc, ns, want] of exp) {
    const j = require(\`./apps/frontend/messages/\${loc}/\${ns}.json\`);
    if (j.errors?.genericError !== want) { console.log('FAIL', loc, ns, JSON.stringify(j.errors?.genericError)); pass = false; }
  }
  if (pass) console.log('PASS: 8 files');
  "
  # 기대: PASS: 8 files
  ```

- [ ] **M-4** 8 파일 모두 `errors.title` 기존 값 변경 0건 (기존 키 보존 회귀 차단)
  ```bash
  node -e "
  const fs = require('fs');
  const before = {
    'ko/disposal':'처리 실패','en/disposal':'Action Failed',
    'ko/notifications':'오류','en/notifications':'Error',
    'ko/teams':'오류','en/teams':'Error',
    'ko/users':'오류','en/users':'Error',
  };
  let pass = true;
  for (const [k, v] of Object.entries(before)) {
    const j = JSON.parse(fs.readFileSync(\`apps/frontend/messages/\${k}.json\`, 'utf8'));
    if (j.errors?.title !== v) { console.log('FAIL', k, j.errors?.title); pass = false; }
  }
  if (pass) console.log('PASS: errors.title 8 파일 보존');
  "
  # 기대: PASS
  ```

- [ ] **M-5** 다른 도메인 i18n JSON 변경 0건 (blast radius 차단)
  ```bash
  git diff --name-only apps/frontend/messages/ | sort -u
  # 기대 출력 (정확히 8 파일):
  #   apps/frontend/messages/en/disposal.json
  #   apps/frontend/messages/en/notifications.json
  #   apps/frontend/messages/en/teams.json
  #   apps/frontend/messages/en/users.json
  #   apps/frontend/messages/ko/disposal.json
  #   apps/frontend/messages/ko/notifications.json
  #   apps/frontend/messages/ko/teams.json
  #   apps/frontend/messages/ko/users.json
  ```

- [ ] **M-6** mapper 파일 수정 0건 (`disposal-errors.ts` / `notification-errors.ts` / `team-errors.ts` / `user-errors.ts`)
  ```bash
  git diff --name-only apps/frontend/lib/errors/ | grep -E "(disposal|notification|team|user)-errors\.ts"
  # 기대: 빈 출력
  ```

#### Phase 2: hook spec 신설

- [ ] **M-7** spec 파일 존재
  ```bash
  ls apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts
  # 기대: 파일 존재
  ```

- [ ] **M-8** spec 이 두 export 모두 import (시그니처 회귀 차단)
  ```bash
  grep -c "useEquipmentCalibrations\b\|useEquipmentCalibrationHistory\b" \
    apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts
  # 기대: ≥ 4 (각 이름 import 1회 + 사용 ≥ 1회씩)
  ```

- [ ] **M-9** spec 이 `queryKeys` SSOT 사용 (인라인 array 정의 0건)
  ```bash
  grep -c "queryKeys.calibrations" apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts
  # 기대: ≥ 2 (byEquipment + historyList 인용)
  grep -E "queryKey:\s*\[" apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts | wc -l
  # 기대: 0 (인라인 array literal queryKey 정의 금지 — SSOT 함수 호출만 허용)
  ```

- [ ] **M-10** spec 이 `calibrationApi` default export mock 사용 (`__esModule: true`)
  ```bash
  grep -c "__esModule:\s*true" apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts
  # 기대: ≥ 1
  grep -c "@/lib/api/calibration-api" apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts
  # 기대: ≥ 1
  ```

- [ ] **M-11** spec PASS — 신규 케이스 ≥ 6 개
  ```bash
  pnpm --filter frontend run test -- "use-equipment-calibrations" 2>&1 | tail -20
  # 기대: PASS, "Tests:" 라인에 ≥ 6 passed (export 2 + useEquipmentCalibrations api/queryKey/enabled 3 + useEquipmentCalibrationHistory api/queryKey/enabled 3)
  ```

- [ ] **M-12** spec 이 `enabled: false` 가드 검증 케이스 포함 (빈 문자열 equipmentId)
  ```bash
  grep -E "enabled|equipmentId.*''|\\.not\\.toHaveBeenCalled" \
    apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts | wc -l
  # 기대: ≥ 2 (두 variant 모두 enabled 가드 검증)
  ```

- [ ] **M-13** hook 본체(`apps/frontend/hooks/use-equipment-calibrations.ts`) 수정 0건
  ```bash
  git diff --name-only apps/frontend/hooks/use-equipment-calibrations.ts
  # 기대: 빈 출력
  ```

#### Phase 3: verify-i18n Step 20 회귀 차단

- [ ] **M-14** Step 20 PASS — 4 mapper namespace × 2 locale × 2 baseline key = 16 검증
  ```bash
  node -e "
  const fs = require('fs');
  const MAPPER_NS = [
    ['apps/frontend/lib/errors/disposal-errors.ts', 'disposal'],
    ['apps/frontend/lib/errors/notification-errors.ts', 'notifications'],
    ['apps/frontend/lib/errors/team-errors.ts', 'teams'],
    ['apps/frontend/lib/errors/user-errors.ts', 'users'],
  ];
  const BASELINE = ['errors.title', 'errors.genericError'];
  function get(o,p){return p.split('.').reduce((x,k)=>x?.[k],o);}
  let pass = true;
  for (const [, ns] of MAPPER_NS) {
    for (const loc of ['ko','en']) {
      const j = JSON.parse(fs.readFileSync(\`apps/frontend/messages/\${loc}/\${ns}.json\`,'utf8'));
      for (const k of BASELINE) {
        if (!get(j,k)) { console.log('FAIL', loc, ns, k); pass = false; }
      }
    }
  }
  if (pass) console.log('PASS');
  "
  # 기대: PASS
  ```

- [ ] **M-15** verify-i18n Step 1+2 회귀 0 (en/ko 키 쌍 일치 — 본 sprint 변경이 다른 도메인 영향 없음)
  ```bash
  # Step 2: 8 변경 파일에서 en/ko 키 구조 동일성
  for ns in disposal notifications teams users; do
    diff <(node -e "console.log(JSON.stringify(Object.keys(require('./apps/frontend/messages/ko/${ns}.json').errors).sort()))") \
         <(node -e "console.log(JSON.stringify(Object.keys(require('./apps/frontend/messages/en/${ns}.json').errors).sort()))") \
      || echo "FAIL: ${ns} errors 블록 ko/en 키 불일치"
  done
  # 기대: FAIL 줄 0개
  ```

#### tracker / 문서

- [ ] **M-16** tech-debt-tracker.md 두 항목 `[x]` 체크
  ```bash
  grep -E "^\s*-\s+\[x\].*errors\.genericError baseline key 추가" \
    .claude/exec-plans/tech-debt-tracker.md | wc -l
  # 기대: ≥ 1
  grep -E "^\s*-\s+\[x\].*use-equipment-calibrations-hook-spec" \
    .claude/exec-plans/tech-debt-tracker.md | wc -l
  # 기대: ≥ 1
  ```

- [ ] **M-17** 두 tracker 항목 본문에 본 sprint slug `terror-s1-hook-spec` 인용
  ```bash
  grep -c "terror-s1-hook-spec" .claude/exec-plans/tech-debt-tracker.md
  # 기대: ≥ 2
  ```

---

### SHOULD — 가능하면 충족 (실패 시 tech-debt 등록)

- [ ] **S-1** spec 이 `useEquipmentCalibrationHistory` 의 `pageSize` 옵션 분기를 별도 케이스로 검증
  ```bash
  grep -c "pageSize" apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts
  # 기대: ≥ 2 (옵션 미지정 / 옵션 지정 두 케이스)
  ```

- [ ] **S-2** spec describe 블록이 두 variant 분리
  ```bash
  grep -c "describe(" apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts
  # 기대: ≥ 2
  ```

- [ ] **S-3** verify-i18n Step 5 (ICU 변수 쌍) 영향 0 — `errors.genericError` 값에 `{var}` 플레이스홀더 미포함
  ```bash
  node -e "
  const files = ['ko/disposal','en/disposal','ko/notifications','en/notifications','ko/teams','en/teams','ko/users','en/users'];
  let pass = true;
  for (const f of files) {
    const v = require(\`./apps/frontend/messages/\${f}.json\`).errors?.genericError ?? '';
    if (/\{[^}]+\}/.test(v)) { console.log('FAIL', f, '— ICU placeholder 발견:', v); pass = false; }
  }
  if (pass) console.log('PASS: ICU placeholder 없음 8 파일');
  "
  # 기대: PASS
  ```

- [ ] **S-4** spec 의 `getQueryData` 검증 케이스가 `queryKeys.calibrations.byEquipment(...)` / `historyList(...)` 함수 호출 결과를 직접 인용 (cache key SSOT 결빙)
  ```bash
  grep -E "queryClient\.getQueryData|queryClient\.setQueryData" \
    apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts | wc -l
  # 기대: ≥ 2 (두 variant 각각 cache hit 검증)
  ```

---

### EXT — 외부 검증 (옵션)

- [ ] **E-1** 4 mapper 가 향후 `t('errors.genericError')` 호출하도록 본체 수정 — *본 sprint Out of Scope* — Phase 3 회귀 차단 완료 후 별도 sprint trigger 등록 (mapper fallback `error.message` → `t('errors.genericError')` 거동 변경)

- [ ] **E-2** 다른 도메인 mapper(`approvals`, `audit` 등) 가 향후 `t('errors.title')` 도입 시 verify-i18n Step 20 자동 FAIL — 이미 Step 20 스크립트가 mapper 추가 즉시 baseline key 강제

---

## Out of Scope

- mapper 본체 거동 변경 (`error.message` → `t('errors.genericError')`)
- 다른 도메인 i18n JSON 변경
- hook 본체 수정 (`use-equipment-calibrations.ts`)
- 다른 hook 의 spec 신설 (`useEquipment` 등)
- `filters` useMemo 구현 detail 검증
- backend metrics / GlobalExceptionFilter 변경
