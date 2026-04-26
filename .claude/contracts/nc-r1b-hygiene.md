---
slug: nc-r1b-hygiene
created: 2026-04-26
mode: 1
follows: [nc-r1a-critical-safety]
round: 2
---

# Contract: NC-R1b Hygiene — CSV Escape · 409 토스트 · useMemo deps · i18n cast 유틸

## Context

NC 코드 리뷰 Round-2 항목 #4, #5, #8, #10 대응.

**실행 전제**: `nc-r1a-critical-safety` 머지 완료 후 실행.

1. **CSV export 이스케이핑** — NonConformancesContent L175: `r.map((c) => `"${c}"`)`는 셀 값 내 `"` 미처리 → CSV 파괴. `=+-@` 시작 값은 Excel 공식 주입 가능. RFC 4180 준수 필요.
2. **useMemo(chip) deps에서 `t` 제거** — NonConformancesContent L450: `useMemo(() => ..., [nc, canCloseNC, t])`. `t` 함수는 next-intl 인스턴스로 매 렌더 새 참조 → memo가 매 렌더 깨짐 = no-op memoization. i18n-free 결과만 memo 대상으로 이동.
3. **409 전용 토스트** — NCDetailClient의 4 mutation 모두 동일 `statusChangeError` 메시지. 409(VERSION_CONFLICT)는 "다른 사람이 먼저 수정했습니다 — 새로고침 후 재시도"와 같은 actionable 메시지로 분리 필요.
4. **i18n cast 유틸** — `t(\`...\` as Parameters<typeof t>[0])` 패턴이 NCDetailClient, NonConformancesContent 등 여러 파일에 20곳 이상 분산. next-intl 타입 안전성을 깨는 cast를 한 곳에 집중하는 `getNCMessageKey()` 유틸 추출.

**사전 검증**: CSV 처리 라이브러리(papaparse 등) 없음 → 인라인 헬퍼 함수 추가. `lib/utils/` 내 기존 헬퍼 파일 확인 후 적절한 파일에 추가 또는 신규.

## Scope

- MOD or NEW: `apps/frontend/lib/utils/csv-utils.ts` (신규 권장) 또는 기존 유틸 파일
  - `sanitizeCsvCell(value: unknown): string` — `""` escape + `=+-@\t\r\n` 프리픽스 처리
- MOD: `apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx`
  - L175 CSV export 맵핑에서 `sanitizeCsvCell` 사용
  - L450 `useMemo(chip)` deps에서 `t` 제거 — i18n-free 값(guidance key, entry)만 memo, label은 inline `t()` 호출
- MOD: `apps/frontend/components/non-conformances/NCDetailClient.tsx`
  - 4 mutation의 `onError` 분기에서 `isConflictError(err)` 판정 후 409 전용 toast key 사용
- MOD or NEW: `apps/frontend/lib/i18n/get-nc-message-key.ts` 또는 유사 위치
  - `getNCMessageKey(key: string): Parameters<typeof t>[0]` 유틸 — cast 1개소로 집중
- MOD: `apps/frontend/components/non-conformances/NCDetailClient.tsx`
  - `t(... as Parameters<typeof t>[0])` → `t(getNCMessageKey(...))`
- MOD: `apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx`
  - 동일 cast 패턴 → 유틸 경유
- MOD: `apps/frontend/messages/en.json`
  - `nonConformances.toasts.versionConflict` 신규 키
- MOD: `apps/frontend/messages/ko.json`
  - 동일 키 한국어 번역

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | sanitizeCsvCell 헬퍼 존재 | `grep -rn "export function sanitizeCsvCell\|export const sanitizeCsvCell" apps/frontend/lib/` → ≥ 1 |
| M2 | `""` escape 포함 | `grep -A5 "sanitizeCsvCell" apps/frontend/lib/utils/csv-utils.ts \| grep '""'` → ≥ 1 hit |
| M3 | `=+-@` 프리픽스 처리 포함 | `grep -A10 "sanitizeCsvCell" apps/frontend/lib/utils/csv-utils.ts \| grep "=\|+\|-\|@\|prefix"` → ≥ 1 hit |
| M4 | NonConformancesContent CSV가 헬퍼 사용 | `grep -n "sanitizeCsvCell" apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx` → ≥ 1 |
| M5 | 헬퍼 단위 테스트 존재 | `grep -rn "sanitizeCsvCell" apps/frontend/__tests__/ apps/frontend/lib/ apps/frontend/tests/unit/ 2>/dev/null` → ≥ 1 test file |
| M6 | useMemo(chip) deps에서 `t` 제거 | `grep -A5 "deriveGuidance\|NC_WORKFLOW_GUIDANCE_TOKENS" apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx \| grep -c ", t\]"` → 0 |
| M7 | 409 분기 존재 | `grep -nE "isConflictError\|VERSION_CONFLICT\|409" apps/frontend/components/non-conformances/NCDetailClient.tsx` → ≥ 1 |
| M8 | versionConflict i18n 키 en.json | `grep -n "versionConflict" apps/frontend/messages/en.json` → ≥ 1 |
| M9 | versionConflict i18n 키 ko.json | `grep -n "versionConflict" apps/frontend/messages/ko.json` → ≥ 1 |
| M10 | getNCMessageKey (또는 동등 유틸) 존재 | `grep -rn "getNCMessageKey\|NCMessageKey" apps/frontend/lib/` → ≥ 1 |
| M11 | cast 직접 사용 제거 (NC 컴포넌트) | `! grep -rn "as Parameters<typeof t>\[0\]" apps/frontend/components/non-conformances/ apps/frontend/app/(dashboard)/non-conformances/` |
| M12 | tsc 통과 | `pnpm tsc --noEmit -p apps/frontend/tsconfig.json --skipLibCheck 2>&1 \| grep -v ".next/" \| grep -c "error"` → 0 |
| M13 | frontend unit test 통과 | `pnpm --filter frontend test --silent 2>&1 \| tail -5` → PASS |
| M14 | verify-i18n PASS | `/verify-i18n` 스킬 실행 — 신규 키 en/ko parity PASS |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | `sanitizeCsvCell` 단위 테스트에 줄바꿈(`\n`, `\r\n`) 포함 케이스 추가 |
| S2 | getNCMessageKey를 `lib/i18n/` 전용 디렉토리에 배치 (향후 범위 확대 대비) |
| S3 | ESLint `react-hooks/exhaustive-deps` — useMemo 변경 후 warning 0 확인 |
| S4 | NCDetailClient `guidance` useMemo deps 세분화 — `nc` 객체 전체 대신 `nc.status, nc.repairHistoryId, nc.calibrationId, nc.rejectionReason, nc.ncType`만 deps에 포함 (불필요 재계산 감소) |

## Domain Rules

- `sanitizeCsvCell`: `String(value).replace(/"/g, '""')` + `=+-@\t\r\n` 시작 시 `'` 프리픽스. 결과를 `"..."` 로 wrap.
- useMemo 수정: `{ key, entry } = useMemo(() => ({ key: deriveGuidance(...).key, entry: NC_WORKFLOW_GUIDANCE_TOKENS[...] }), [nc, canCloseNC])` 패턴. `entry.roleChip` 등 i18n-free 값만 memo. `t(entry.titleKey)` 같은 번역은 렌더 함수 인라인.
- 409 분기: `useCasGuardedMutation`이 자체적으로 409를 standard toast로 처리하는지 확인 후, 그렇지 않으면 `onError` 콜백에서 `isConflictError` 판정 → 409 전용 toast. 중복 처리 금지.
- cast 유틸: `getNCMessageKey(key: string) => key as Parameters<typeof t>[0]` — cast 자체는 유틸 안에 1개만 존재.

## Non-Goals

- CSV export를 서버사이드로 이전 (클라이언트 export 유지)
- papaparse 등 외부 라이브러리 추가 (인라인 헬퍼로 충분)
- getNCMessageKey를 generic i18n 유틸로 과잉 추상화
- 다른 페이지(calibration, equipment 등) cast 패턴 수정 — NC 범위만
