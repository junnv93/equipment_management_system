# Contract — e2e-72-fixes

**Date**: 2026-04-17
**Mode**: Mode 1 (Lightweight Harness)
**Slug**: e2e-72-fixes
**Scope**: 72차 잔여 E2E 3개 스위트 수정 (calibration-plans 403, non-conformances workflow, equipment-approval file upload)

---

## 배경

이전 세션 (72차) 데이터 마이그레이션 개선 12건 + 완전성 보강 3건 완료 후, E2E 테스트 3개 스위트가 여전히 실패 중. 68차 pending 4건(QUERY_CONFIG, audit SSOT, dashboard days, repair-history relations)은 재검증 결과 이미 완료 상태로 확인됨 — 회귀 없음.

### 실제 테스트 실패 원인 (jest 출력 확인)

| 스위트 | 실패 테스트 | 원인 |
|---|---|---|
| `calibration-plans` | 8건 (POST/GET 거의 전체) | 403 Forbidden — `technical_manager` 사용자의 `team_id`가 null인 상태에서 `CALIBRATION_PLAN_DATA_SCOPE: { type: 'team' }` + `failLoud: true` → 스코프 interceptor 거부 |
| `non-conformances` | 3건 | ① `/rentals` 404 (엔드포인트 없음) ② `repairDescription` 6자 (`.min(10)` 위반) ③ NC close 후 equipment status 복원 실패 |
| `equipment-approval` | 3건 (파일 업로드) | `equipmentId` 누락 — 엔드포인트가 `equipmentId/calibrationId/requestId/...` 중 최소 하나 필수 |

### 근본원인 (아키텍처 관점)

`test-fixtures.ts seedTestUsers`가 users INSERT에 `team_id`를 포함하지 않음. 이는 FK 관계를 건너뛴 **결함 있는 테스트 fixture**. calibration-plans/disposal/intermediate-check 등 team-scoped 기능은 모두 이 패턴에 의존.

---

## MUST Criteria (루프 차단 기준)

### 빌드/타입
| ID | 기준 | 검증 |
|---|---|---|
| M-1 | `pnpm tsc --noEmit` exit 0 (전체) | `pnpm tsc --noEmit` |
| M-2 | 변경된 파일 관련 lint 오류 없음 | `pnpm --filter backend run lint` |

### E2E 테스트 통과
| ID | 기준 | 검증 |
|---|---|---|
| M-3 | `calibration-plans.e2e-spec.ts` 전체 PASS | jest |
| M-4 | `non-conformances.e2e-spec.ts` 전체 PASS | jest |
| M-5 | `equipment-approval.e2e-spec.ts` 전체 PASS | jest |
| M-6 | 기타 E2E 테스트 회귀 없음 | backend test suite 전체 |

### SSOT / 아키텍처 준수
| ID | 기준 | 검증 |
|---|---|---|
| M-7 | `TEAM_PLACEHOLDER_ID` 하드코딩 금지, uuid-constants에서 import | grep `'00000000-0000-0000-0000-000000000099'` hit는 uuid-constants.ts만 |
| M-8 | `TEST_USER_DETAILS`에 teamId 필드 존재 | grep |
| M-9 | `seedTestUsers`에서 teams INSERT 선행 (FK 의존성 준수) | 코드 검토 |
| M-10 | `/rentals` endpoint 호출 0건 (테스트 파일 전체) | grep `/rentals` in apps/backend/test → 0 hit |
| M-11 | `DEFAULT_EQUIPMENT`에 `teamId` 포함 (team-scoped 필터 fixture 보강) | grep test-fixtures.ts |
| M-12 | non-conformances.service.ts `close()` 메서드에서 `NC_CLOSED` 이벤트가 `await emitAsync` 사용 (read-after-write 일관성) | grep |

## SHOULD Criteria (기술부채 기록)

| ID | 기준 |
|---|---|
| S-1 | repair-history auto-correct 플로우에서 equipment 캐시 invalidation 문서화 |
| S-2 | E2E fixture 전반의 FK 의존성 문서 (test-fixtures.ts에 comment) |

---

## 구현 범위

### Phase 1: fixture 아키텍처 수정
- `test-auth.ts`: `TEST_USER_DETAILS` 각 항목에 `teamId` 추가 (`TEAM_PLACEHOLDER_ID` 참조)
- `test-fixtures.ts`:
  - `TEAM_PLACEHOLDER_ID` import
  - `seedTestTeam()` helper 추가 (ON CONFLICT DO NOTHING)
  - `seedTestUsers()` 개선: teams 선행 INSERT + users의 `team_id` 포함
  - 기존 시그니처 호환성 유지 (`Promise<postgres.Sql>` 반환)

### Phase 2: non-conformances e2e 수정
- Line 316 `/rentals` → `/checkouts` (with `equipmentIds`, `type`, `reason`)
- Line 510 `repairDescription`: '첫 번째 수리' → '첫 번째 수리 완료 기록' (min 10자 준수)
- Line 601-625 NC close 후 equipment status 검증 — 필요 시 짧은 대기 또는 cache-bust

### Phase 3: equipment-approval e2e 수정
- 파일 업로드 3개 테스트에 `.field('equipmentId', ...)` 추가
- describe 블록 상단에 공유 equipment 생성 (DRY)

---

## Non-goals

- 68차 pending 4건 — 이미 완료 (regression 검증만)
- 72차 데이터 마이그레이션 코드 변경 — 이미 완료
- 백엔드 로직 변경 — 테스트만 수정 (단, NC close 캐시 이슈가 백엔드 버그로 판명되면 별도 논의)
