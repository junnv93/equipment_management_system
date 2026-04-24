# Evaluation: bundle-gate (PR-11 번들 크기 측정 게이트)

**평가일**: 2026-04-24
**평가자**: QA Agent (skeptical)
**계약**: `.claude/contracts/bundle-gate.md`

---

## MUST 기준 평가

### M1: `node scripts/measure-bundle.mjs --help` → exit 0

**PASS**

실행 결과 exit 0, 도움말 출력 정상.
사용법·측정값·경고 임계값·관련 스크립트 모두 포함.

---

### M2: `--no-build` 옵션 — `.next/` 없으면 안내 메시지 후 exit 1

**PASS**

- `.next/app-path-routes-manifest.json` 존재 시: 12개 checkouts 라우트 측정 후 exit 0.
- 매니페스트 파일 제거 후 테스트: `❌ .next/app-path-routes-manifest.json 없음 — 빌드를 먼저 실행하세요` 출력 후 exit 1.

계약에서 요구하는 "결과 없으면 안내 메시지 후 exit 1" 동작 충족.

---

### M3: `pnpm --filter frontend exec tsc --noEmit` PASS

**PASS**

오류 없이 exit 0. 스크립트 자체가 `.mjs`이므로 TypeScript 검사 대상 아님 (계약과 일치).

---

### M4: `bundle-baseline.json` 포맷 — `{ version, date, routes: [{ route, firstLoadKb, sizeKb }] }`

**FAIL**

계약 명세 포맷과 실제 구현 포맷 불일치:

| 항목 | 계약 명세 | 실제 구현 |
|------|-----------|-----------|
| 최상위 키 | `version`, `date` | `generatedAt`, `tolerancePct`, `note` |
| `version` 키 | 필수 | **존재하지 않음** |
| `date` 키 | 필수 | **존재하지 않음** (`generatedAt`으로 대체) |
| `routes` 타입 | 배열 `[{ route, firstLoadKb, sizeKb }]` | **딕셔너리** `{ [route]: firstLoadKb }` |
| `sizeKb` 필드 | 필수 | **존재하지 않음** |

실제 저장 포맷:
```json
{
  "generatedAt": "2026-04-24",
  "tolerancePct": 5,
  "routes": {
    "/checkouts/[id]/check": 0.5869140625
  }
}
```

계약 명세 포맷:
```json
{
  "version": "...",
  "date": "...",
  "routes": [{ "route": "/checkouts/[id]/check", "firstLoadKb": 0.59, "sizeKb": 0.59 }]
}
```

**부분 완화 가능성**: 계약의 검증 방법이 "JSON.parse 가능 여부"로만 명시되어 있고, 실제 포맷은 `check-bundle-size.mjs`와 호환성을 유지한다. 그러나 계약 MUST 기준에 포맷이 명시적으로 지정되어 있으므로 **부분 점수는 없다.** FAIL.

---

### M5: `package.json`에 `"measure:bundle"` 스크립트 추가

**PASS**

루트 `package.json`에 `"measure:bundle": "node scripts/measure-bundle.mjs"` 존재.

---

### M6: `node scripts/self-audit.mjs --all` exit 0 유지

**PASS**

`✅ self-audit (all): 위반 없음 — 1819개 파일 검사 완료`, exit 0.

---

## SHOULD 기준 평가

### S1: checkouts 관련 라우트를 Next.js 빌드 stdout에서 자동 식별

**PASS**

두 경로 모두 구현:
- 빌드 모드: `line.toLowerCase().includes('checkout')` 필터링 후 정규식 파싱
- `--no-build` 모드: `app-path-routes-manifest.json`에서 `route.toLowerCase().includes('checkout')` 필터링

실제 매니페스트에서 12개 checkouts 라우트 정확히 식별 확인.

---

### S2: 8 kB (gzipped 기준) 초과 시 ⚠️ 경고 출력

**PASS**

`INCREASE_THRESHOLD_KB = 8` 상수 정의, `--compare` 모드에서 임계값 초과 시 `⚠️` 출력 후 exit 1.
단, 경고는 **증가분** 8 kB 기준 (절댓값 아님) — 계약이 "증가 시" 기준인지 "절댓값" 기준인지 모호하나, 스크립트 설계 의도(`경고 임계값: 8 kB 증가 시`)와 일치.

---

### S3: `--compare` 옵션으로 baseline 대비 증가분 출력

**PASS**

`--compare` 플래그 구현됨. `compareWithBaseline()` 함수에서 각 라우트별 현재/baseline/증가분 테이블 출력.

---

### S4: `scripts/bundle-baseline.json`이 `.gitignore`에 추가되지 않음

**PASS**

`.gitignore`에 `bundle-baseline` 항목 없음. 버전 관리 대상으로 유지.

---

## 추가 발견 사항 (계약 범위 외)

### 이슈 1: `--no-build` 모드와 빌드 모드의 측정값 단위 불일치

- **빌드 모드**: Next.js stdout의 `First Load JS` (공유 청크 포함 전체 번들, ~108 kB 수준)
- **--no-build 모드**: `server/app/**/*.js` gzip (서버 전용 페이지 청크만, ~0.55 kB 수준)

두 모드가 같은 `baseline.routes[route]`에 저장되므로, 빌드 모드로 저장된 baseline을 `--no-build` 모드로 비교하면 200배 이상 차이가 발생하여 무조건 경고가 트리거된다. **반대로도 마찬가지.** 계약 범위 내 기준은 없으나, 실용적 defect임.

### 이슈 2: 빌드 모드에서 `--compare` 사용 시 빌드 실행 후 baseline 갱신 없음

`--compare` 플래그와 기본 모드의 차이:
- 기본 모드: `saveBaseline(routes)` 호출
- `--compare` 모드: `compareWithBaseline(routes)` 호출만 (baseline 갱신 없음)

이는 의도된 동작으로 보이지만, 첫 실행 시 `--compare`를 사용하면 baseline이 없으므로 "baseline 없음 → 현재 측정값을 baseline으로 저장"으로 폴백. 문서화 미흡.

---

## 종합 판정

| 기준 | 결과 |
|------|------|
| M1 | ✅ PASS |
| M2 | ✅ PASS |
| M3 | ✅ PASS |
| M4 | ❌ FAIL |
| M5 | ✅ PASS |
| M6 | ✅ PASS |
| S1 | ✅ PASS |
| S2 | ✅ PASS |
| S3 | ✅ PASS |
| S4 | ✅ PASS |

**전체 판정: FAIL** (M4 실패로 커밋 불가)

---

## 수정 지침 (M4 수정)

계약 명세 포맷으로 `bundle-baseline.json`을 변경하거나, 계약을 실제 포맷(check-bundle-size.mjs 호환 포맷)으로 갱신해야 한다. 두 가지 중 하나:

**옵션 A: 계약 포맷 준수 (비권장 — check-bundle-size.mjs와 호환성 파괴)**

`saveBaseline()`을 아래 포맷으로 변경:
```json
{
  "version": "1",
  "date": "2026-04-24",
  "routes": [
    { "route": "/checkouts/[id]/check", "firstLoadKb": 0.59, "sizeKb": 0.59 }
  ]
}
```

이 경우 `check-bundle-size.mjs`도 같은 포맷으로 수정 필요.

**옵션 B: 계약 M4 명세 수정 (권장 — 실제 구현과 check-bundle-size.mjs 호환성 유지)**

`bundle-gate.md` M4를 실제 공유 포맷으로 수정:
```
{ generatedAt, tolerancePct, routes: { [route]: firstLoadKb } }
```

**권장**: 옵션 B. 실제 구현이 `check-bundle-size.mjs`와 포맷을 공유하고 있으며, 이것이 더 실용적인 설계임. 계약 명세가 구현보다 먼저 잘못 작성된 것으로 판단.
