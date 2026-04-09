# Tech Debt Round 3 구현 계획

## 메타
- 생성: 2026-04-09T00:00:00+09:00
- 모드: Mode 2
- 예상 변경: 8개 파일

## 설계 철학
equipment-imports 도메인의 CAS 원자성 완결(TOCTOU 제거 + cancel 롤백), 프론트엔드 상태 드리프트 수정, 에러 핸들링 사일런트 스왈로우 제거, seed/CLAUDE.md 엔트로피 정리. 모든 변경은 이미 검증된 패턴(CasPrecondition, onReturnCompleted 콜백)을 동일 도메인 내 미적용 지점에 확장하는 수술적 적용.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| initiateReturn TOCTOU 해결 방식 | CasPrecondition 패턴 (approve/reject와 동일) | 동일 서비스 내 bc7565cb 커밋에서 검증 완료된 패턴 |
| cancel 롤백 콜백 위치 | checkouts.service cancel() 내 onReturnCanceled 호출 | approve-return 경로의 onReturnCompleted 패턴과 대칭 |
| 새 콜백 메서드명 | onReturnCanceled | onReturnCompleted와 대칭적 네이밍 |
| ValidationDetailContent edit 상태 관리 | searchParams 직접 파생 (useState 제거) | CLAUDE.md Rule: URL params가 SSOT |
| form-data-parser 빈 catch 처리 | Logger.warn + BadRequestException re-throw | silent swallow 제거, GlobalExceptionFilter가 최종 처리 |
| Phase C (DB FK Sweep) | SKIP — 이미 완료됨 | schema 4개 파일 모두 .references() 적용 + 0006 마이그레이션 완료 |
| CLAUDE.md 분리 대상 | PostToolUse Hook, Behavioral Guidelines, Production Checklist → docs/references/ | ~128줄 분리 → ~292줄 잔여 (300줄 임계값 이하) |

## 구현 Phase

### Phase A: CAS 원자화 + cancel 롤백 (equipment-imports 도메인 완결)
**목표:** initiateReturn의 TOCTOU 제거, auto-checkout cancel 시 import 상태 롤백 콜백 구현
**변경 파일:**
1. `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` — 수정: initiateReturn에 CasPrecondition 적용 + onReturnCanceled 추가
2. `apps/backend/src/modules/checkouts/checkouts.service.ts` — 수정: cancel()에 RETURN_TO_VENDOR purpose 취소 시 롤백 콜백 호출
3. `apps/frontend/tests/e2e/features/checkouts/suite-27-*/s27-*.spec.ts` — 수정: S27-07 stricten + S27-08 fixme 제거
**검증:** `pnpm --filter backend run tsc --noEmit` + `pnpm --filter backend run test`

### Phase B: 프론트엔드 상태관리 + 에러 핸들링
**목표:** URL↔state 드리프트 제거, silent error swallow 제거
**변경 파일:**
1. `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/ValidationDetailContent.tsx` — 수정: isEditOpen useState → searchParams 직접 파생
2. `apps/backend/src/modules/equipment/interceptors/form-data-parser.interceptor.ts` — 수정: 빈 catch → Logger.warn + re-throw
**검증:** `pnpm tsc --noEmit` (all) + `pnpm --filter backend run build` + `pnpm --filter frontend run build`

### Phase C: DB FK Sweep — SKIP (이미 완료)

### Phase D: Seed 정리 + CLAUDE.md 엔트로피
**목표:** 오표기 수정, CLAUDE.md 300줄 이하로 압축
**변경 파일:**
1. `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts` — 수정: L44 주석 보정
2. `CLAUDE.md` — 수정: 3개 섹션 분리, 참조 링크만 남김
3. `docs/references/behavioral-guidelines.md` — 신규
4. `docs/references/production-checklist.md` — 신규
5. `docs/references/post-tool-use-hook.md` — 신규
**검증:** CLAUDE.md 줄 수 < 300

## 전체 변경 파일 요약
### 신규 생성
| 파일 | 목적 |
|------|------|
| `docs/references/behavioral-guidelines.md` | CLAUDE.md에서 분리한 행동 원칙 |
| `docs/references/production-checklist.md` | CLAUDE.md에서 분리한 프로덕션 체크리스트 |
| `docs/references/post-tool-use-hook.md` | CLAUDE.md에서 분리한 PostToolUse 주의사항 |

### 수정
| 파일 | 변경 의도 |
|------|-----------|
| `equipment-imports.service.ts` | initiateReturn CasPrecondition + onReturnCanceled |
| `checkouts.service.ts` | cancel() 내 import 롤백 콜백 |
| `s27-*.spec.ts` | S27-07 stricten + S27-08 구현 |
| `ValidationDetailContent.tsx` | useState → searchParams 파생 |
| `form-data-parser.interceptor.ts` | silent swallow 제거 |
| `shared-test-data.ts` | 주석 보정 |
| `CLAUDE.md` | 엔트로피 분리 |

## 의사결정 로그
- Phase C (DB FK Sweep) 스키마 + 마이그레이션 확인 결과 이미 완료 → SKIP
- TRANSMITTER_UIW_W: seed 데이터 자체는 정확, 주석만 보정
- CLAUDE.md 분리: ~128줄 분리 → ~292줄 잔여
