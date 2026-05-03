# Zod Trim/Max System-Wide Residual 구현 계획

## 메타
- 생성: 2026-05-03T11:18:22+09:00
- 모드: Mode 2
- 예상 변경: 12~18개 파일

## 설계 철학
사용자 입력이 시스템 경계에 들어오는 DTO와 ingest validator에서 whitespace bypass와 unbounded text를 닫는다. 서버 생성 응답 shape, enum/date/query token, DB projection schema는 의미가 다르므로 이번 hardening 범위에서 제외한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| 대상 경계 | backend DTO + data-migration row validator | 외부 입력을 가장 먼저 정규화하는 계층 |
| 길이 SSOT | `VALIDATION_RULES` + `VM.string.*` | 기존 backend DTO 검증 규칙과 i18n 메시지 패턴 유지 |
| 필수 문자열 | `.trim().min(...).max(...)` | 공백만 입력 우회 차단과 DoS 방어를 한 체인에서 보장 |
| 선택 자유 텍스트 | `.trim().max(...)` | 값이 있을 때만 정규화하고 빈 값 허용 정책은 유지 |
| 제외 | query/date/uuid/enum/server response schema | 필터 토큰과 서버 생성값은 자유 텍스트 정책과 다름 |

## 구현 Phase
### Phase 1: 승인/코멘트 DTO 자유 텍스트 max 적용
**목표:** 승인 코멘트, 메모, 비고류 optional 텍스트에 `LONG_TEXT_MAX_LENGTH`를 적용한다.
**변경 파일:**
1. `apps/backend/src/modules/*/dto/*approve*.dto.ts` — 수정, optional comment류 hardening
2. `apps/backend/src/modules/calibration-plans/dto/approve-calibration-plan.dto.ts` — 수정, memo/reviewComment/legacy memo hardening
**검증:** focused DTO grep + backend type-check

### Phase 2: 필수 텍스트 `.trim()` symmetry
**목표:** `.min(N)` 필수 문자열이 trim 후 길이를 검사하게 만든다.
**변경 파일:**
1. `apps/backend/src/modules/equipment/dto/equipment-history.dto.ts` — 수정
2. `apps/backend/src/modules/equipment/dto/create-shared-equipment.dto.ts` — 수정
3. `apps/backend/src/modules/equipment/dto/repair-history.dto.ts` — 수정
4. `apps/backend/src/modules/calibration/dto/create-calibration.dto.ts` — 수정
5. `apps/backend/src/modules/calibration-factors/dto/create-calibration-factor.dto.ts` — 수정
6. `apps/backend/src/modules/intermediate-inspections/dto/*.dto.ts` — 수정
7. `apps/backend/src/modules/self-inspections/dto/*.dto.ts` — 수정
8. `apps/backend/src/modules/monitoring/dto/client-error.dto.ts` — 수정
9. `apps/backend/src/modules/checkouts/dto/handover-token.dto.ts` — 수정
**검증:** focused Jest boundary tests + verify-zod Step 12 grep

### Phase 3: data-migration ingest validator
**목표:** Excel/CSV ingestion row validator의 필수 텍스트와 장문 optional 텍스트를 backend 규칙에 맞게 정규화한다.
**변경 파일:**
1. `apps/backend/src/modules/data-migration/services/migration-validator.service.ts` — 수정
2. `apps/backend/src/modules/data-migration/services/history-validator.service.ts` — 수정
**검증:** focused data-migration validation tests 또는 type-check

### Phase 4: contract/evaluation/tracker 정리
**목표:** 완료 기준과 검증 결과를 repository record에 남긴다.
**변경 파일:**
1. `.claude/contracts/zod-trim-max-system-wide-residual.md` — 신규
2. `.claude/evaluations/zod-trim-max-system-wide-residual.md` — 신규
3. `.claude/exec-plans/tech-debt-tracker.md` — 완료 기록

## 전체 변경 파일 요약
### 신규 생성
| 파일 | 목적 |
|------|------|
| `.claude/exec-plans/active/2026-05-03-zod-trim-max-system-wide-residual.md` | 실행 계획 |
| `.claude/contracts/zod-trim-max-system-wide-residual.md` | 평가 계약 |

### 수정
| 파일 | 변경 의도 |
|------|----------|
| backend DTO/validator 파일 | 입력 경계의 trim/max defense-in-depth |
| focused spec 파일 | trim→reject/trim→accept/max boundary 회귀 차단 |
| tracker/registry | harness lifecycle 기록 |

## 의사결정 로그
- 2026-05-03T11:18:22+09:00 — schema package의 response/DB shape는 입력 검증 계층이 아니므로 제외.
- 2026-05-03T11:18:22+09:00 — query string 필터는 URL 토큰 의미가 있어 장문 자유 텍스트 max 정책과 분리.
