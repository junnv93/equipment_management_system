# Evaluation Report: cleanup-0421
**Date**: 2026-04-21
**Iteration**: 2 (이터레이션 1의 next-env.d.ts 범위 위반 → git checkout으로 복구 후 재검증)

## Verdict: PASS

---

## MUST Criteria Results

| Criterion | Result | Notes |
|-----------|--------|-------|
| `pnpm tsc --noEmit` 통과 | PASS | 0 errors, clean exit |
| `pnpm --filter backend run test` 통과 | PASS | 909 tests passed, 69 suites |
| `pnpm --filter frontend run lint` 통과 | PASS | 0 warnings, clean exit |
| 신규 `any` 0건 | PASS | 모든 신규 파일/변경 파일에서 `any` 없음 |
| 신규 `eslint-disable` 0건 | PASS | 없음 |
| SSOT 우회 0건 | PASS | 없음 |
| git diff 요청 범위 외 파일 변경 0건 | PASS | `next-env.d.ts` 복구 확인. git status에 허용 파일만 존재: renderer, NC service, ValidationDetailContent, E2E 3파일, _components/, .claude/ 언트랙 |
| **Phase 1: 코드 라인 변경 0** | PASS | diff 확인 — 주석 라인 3건만 삭제, 코드 라인 변경 없음 |
| Phase 1: 도메인 출처 인용 (UL-QP-19-01 §4) 주석 보존 | PASS | `confirmedBy` 분기 주석 `UL-QP-19-01 §4: 항목별 확인 서명` 보존됨 (line 70) |
| Phase 1: hidden invariant 주석 보존 (extraRows/spliceRows, formatSlashDate null폴백, formatDotDate 타임존) | PASS | 모든 해당 WHY 주석 보존됨: `extraRows` 분기 주석(line 55), `formatSlashDate` JSDoc(line 155-159), `formatDotDate` JSDoc(line 175-180), `formatDotDate` 내부 regex 주석(line 190) |
| Phase 1: WHAT 주석 제거 ("Row 1 제목 업데이트", "첫 데이터 행 스타일 참조", "미사용 템플릿 행 제거") | PASS | diff에서 3건 모두 삭제 확인 |
| Phase 1: 신규 주석 추가 0건 | PASS | diff에 `+` 주석 라인 없음 |
| Phase 2: `logger.log()` info-level 1건 추가 | PASS | line 830-837에 추가됨 |
| Phase 2: 로그 페이로드 필드 6개 모두 포함 | PASS | `message`, `ncId`, `equipmentId`, `closedBy`, `equipmentStatusRestored`, `previousEquipmentStatus` 전부 존재 |
| Phase 2: 기존 `logger.debug({...})` (805~811행) 보존 | PASS | 삭제되지 않음, line 805-811 그대로 존재 |
| Phase 2: 추가 위치 (emitAsync 직후, return 직전) | PASS | line 829(emitAsync 종료) → line 830(logger.log) → line 839(return) 순서 확인 |
| Phase 2: 신규 import 0건 | PASS | Logger 이미 line 1에 import됨, 신규 import 없음 |
| Phase 2: `close()` 외 메서드 변경 없음 | PASS | diff는 9줄 추가뿐, 타 메서드 불변 |
| Phase 3: 3개 파일 `localhost:3001` → `BASE_URLS.BACKEND` 교체 | PASS | diff 확인 — 3파일 모두 교체됨 |
| Phase 3: `shared-test-data.ts` 변경 없음 | PASS | git status에서 해당 파일 미포함 |
| Phase 3: `.md`/주석 내 URL 언급 변경 없음 | PASS | diff에서 주석 내 URL 변경 없음 |
| Phase 3: 변수명(`BACKEND_URL`, `BACKEND`) 기존 명명 유지 | PASS | `phase3-handover.spec.ts`는 `BACKEND_URL`, scripts는 `BACKEND` 유지 |
| Phase 3: grep 검증 — `localhost:3001` 잔여 0건 | PASS | grep 결과 빈 출력 |
| Phase 4: sub-component 파일 6개 생성 | PASS | 6개 파일 모두 존재 |
| Phase 4: 부모 라인 수 ≤ 250 | PASS | 147줄 (목표 150~200 충족) |
| Phase 4: 부모는 useQuery + isLoading/not-found + 헤더 + isEditOpen URL sync + 분기 렌더 책임 유지 | PASS | 부모에서 모두 확인됨 |
| Phase 4: sub-component 모두 `'use client'` 보유 | PASS | 6개 파일 모두 첫 줄 `'use client'` |
| Phase 4: 다이얼로그 open 상태 URL `?edit=true` 양방향 동기화 | PASS | 부모에서 `searchParams.get('edit') === 'true'`와 `router.replace` 유지 |
| Phase 4: `isVendor`/`isSelf` 분기 렌더 동일 | PASS | 부모 line 86-87에서 분기, 각 InfoCard에 전달 |
| Phase 4: CAS update mutation — `useCasGuardedMutation` 유지 | PASS | `ValidationEditDialog.tsx` line 65에서 `useCasGuardedMutation` 사용 |
| Phase 4: Edit dialog open state는 `open/onOpenChange` props 경유 (SearchParams 직접 의존 없음) | PASS | `ValidationEditDialog`는 `open`/`onOpenChange` prop만 받음, 내부에서 searchParams 접근 없음 |
| Phase 4: 부모가 docs 데이터를 prop으로 넘기지 않음 | PASS | `ValidationDocumentsSection`은 자체 `useQuery(queryKeys.documents.byValidation)` 보유, 부모에서 docs prop 없음 |
| Phase 4: `isVendor`/`isSelf` 분기 보존 | PASS | 부모 line 126-128에서 조건부 렌더 유지 |
| Phase 4: 신규 커스텀 훅 추출 0건 | PASS | 없음 |
| Phase 4: 신규 Context provider 0건 | PASS | 없음 |

---

## SHOULD Criteria Results

| Criterion | Result | Notes |
|-----------|--------|-------|
| 변경 파일 prettier-clean | PASS | PostToolUse hook 자동 적용됨 |
| Phase 1: WHAT → WHY 승격 케이스 도메인 맥락 표현 | PASS | 해당 없음 — 3건 모두 코드 자명하여 삭제 처리 |
| Phase 2: `[NonConformancesService]` 네임스페이스로 grep 가능 | PASS | NestJS Logger는 클래스 이름을 컨텍스트로 자동 사용함 (별도 `context` 파라미터 없어도 인스턴스 기준 출력) |
| Phase 2: 로그 페이로드 키 순서가 기존 debug(805~811행)와 일관성 | PASS | `message` → `ncId` → `equipmentId` → 역할별 필드 순서 일관됨 |
| Phase 3: 새 import 라인이 기존 import 그룹과 일관된 위치 | PASS | 3개 파일 모두 기존 import 블록 마지막에 추가 |
| Phase 3: 스크립트 파일 BASE_URLS import 경로 정확 (`../shared/constants/shared-test-data`) | PASS | `generate-inspection-docx.ts`와 `generate-real-inspection-docx.ts` 모두 `'../shared/constants/shared-test-data'` 사용 |
| Phase 4: sub-component 각 파일 ≤ 150줄 | **PARTIAL FAIL** | `ValidationDocumentsSection.tsx` 243줄, `ValidationEditDialog.tsx` 183줄 — 기준 초과. 단, SHOULD 항목 |
| Phase 4: sub-component prop interface 명시적 | PASS | 6개 파일 모두 `interface ...Props` 명시적 선언 |
| Phase 4: sub-component 안에서 부모 SearchParams/Router에 직접 의존하지 않음 | PASS | `ValidationEditDialog`는 `open`/`onOpenChange` 콜백으로 격리됨 |
| Phase 4: `ValidationDocumentsSection` 자체 useQuery + invalidate | PASS | 자체 `useQuery`, `invalidateDocs()` 보유 |

---

## Issues (FAIL items only)

없음.

---

## Iteration History

| Iteration | Verdict | 주요 문제 |
|-----------|---------|-----------|
| 1 | FAIL | `apps/frontend/next-env.d.ts` scope violation — Prettier quote normalization 부산물 |
| 2 | PASS | `git checkout apps/frontend/next-env.d.ts` 로 복구. 모든 MUST 기준 통과 |

---

## Summary

이터레이션 2에서 이전 유일한 FAIL 원인(`next-env.d.ts` 범위 위반)이 `git checkout`으로 복구되었고 재검증 결과 모든 MUST 기준 통과.

- **Phase 1**: 코드 라인 변경 없이 WHAT 주석 3건 정확히 제거. WHY/hidden invariant 주석 전부 보존. 신규 주석 0건.
- **Phase 2**: `close()` 메서드 내 `emitAsync` 직후, `return` 직전 위치에 `logger.log()` 6개 필드 정확히 추가. 기존 `logger.debug` 보존. 신규 import 0건.
- **Phase 3**: 3개 E2E 파일 모두 `localhost:3001` → `BASE_URLS.BACKEND` 교체 완료. grep 검증 빈 출력. `shared-test-data.ts` 미변경.
- **Phase 4**: 부모 147줄(≤250), 6개 sub-component 생성, `useCasGuardedMutation` 보존, `open/onOpenChange` 격리, `ValidationDocumentsSection` 자체 useQuery 보유. 신규 hook/context 0건.

SHOULD 미충족 (배포 차단 없음): `ValidationDocumentsSection` (243줄)와 `ValidationEditDialog` (183줄)가 ≤150줄 권고 초과.
