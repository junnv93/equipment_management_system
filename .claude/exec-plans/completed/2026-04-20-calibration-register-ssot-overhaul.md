# 교정 기록 등록 아키텍처 재정비 구현 계획

## 메타
- 생성: 2026-04-20T00:00:00+09:00
- 모드: Mode 2
- 예상 변경: Phase 0 6개 파일, Phase 1 5개 파일, Phase 2~7 추후 세션

## 설계 철학
교정 기록 생성 전체 스택(생성/재제출/링크/감사)을 SSOT·원자성·이벤트분리·감사 일관성 원칙으로 재구성하여, 성적서 파일 누락 + 두 진입점 비대칭 + dual-write + 캐시 이벤트 혼재 등의 구조적 부채를 한 번에 해소한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| createCalibrationFormSchema 위치 | `apps/frontend/lib/schemas/` | z.instanceof(File)는 브라우저 전용 — packages/schemas는 백엔드도 import하므로 분리 필수 |
| multipart API 방식 | FilesInterceptor + JSON payload field | NestJS 기존 document upload 패턴 재사용, ACID 보장 |
| certificatePath deprecation | 4단계 점진적 (backfill→hybrid read→write stop→drop) | 0-downtime + 롤백 가능 |
| CACHE_EVENTS vs NOTIFICATION_EVENTS | 분리 — CACHE: 캐시 전용, NOTIFICATION: 알림 전용 | cache-events.ts:5-9 정책 준수 |
| calibration_plan_items FK | actualCalibrationId on delete set null | 계획↔실적 추적 완결성 |

## 구현 Phase

### Phase 0: SSOT 스키마/상수 선확장 (non-breaking)
**목표:** 이후 Phase에서 공유 타입으로 컴파일되도록 SSOT 기반 타입 선확장. UI/API 무변경.

**변경 파일:**
1. `apps/frontend/lib/schemas/calibration-form-schema.ts` — 신규: 프론트 전용 form schema (z.instanceof(File) 포함)
2. `apps/frontend/lib/errors/calibration-errors.ts` — 신규: 교정 에러 코드 enum + i18n 매핑
3. `apps/frontend/lib/api/query-config.ts` — 수정: documents.byCalibration(id) 추가
4. `apps/frontend/lib/api/cache-invalidation.ts` — 수정: invalidateAfterCreate에 calibrations.all + approvals.countsAll + notifications.all 추가

**검증:** `pnpm --filter frontend tsc --noEmit` + `pnpm --filter frontend run lint`

### Phase 1: 백엔드 단일 원자 multipart API
**목표:** `POST /calibration`을 multipart로 전환하고 `createWithDocuments` 원자 트랜잭션 서비스 메서드 추가.

**변경 파일:**
1. `apps/backend/src/modules/calibration/calibration.controller.ts` — 수정: @UseInterceptors(FilesInterceptor) + @Body('payload') + @AuditLog 통합
2. `apps/backend/src/modules/calibration/calibration.service.ts` — 수정: createWithDocuments 신규 메서드 (db.transaction 포함)
3. `apps/backend/src/modules/calibration/dto/create-calibration.dto.ts` — 수정: certificatePath 제거
4. `apps/backend/src/common/cache/cache-events.ts` — 수정: CALIBRATION_CREATED/UPDATED/CERTIFICATE_UPLOADED/CERTIFICATE_REVISED 추가
5. `apps/backend/src/common/cache/cache-event.registry.ts` — 수정: 신규 CACHE_EVENTS 핸들러 등록

**검증:** `pnpm --filter backend tsc --noEmit` + `pnpm --filter backend run test` + `pnpm --filter backend run lint`

### Phase 2~7
별도 harness 세션에서 실행. 상세: `.claude/plans/http-localhost-3000-calibration-register-playful-sketch.md`

## 전체 변경 파일 요약 (Phase 0+1)
### 신규 생성
| 파일 | 목적 |
|------|------|
| `apps/frontend/lib/schemas/calibration-form-schema.ts` | 프론트 전용 form schema SSOT |
| `apps/frontend/lib/errors/calibration-errors.ts` | 교정 에러 코드 + i18n 매핑 |

### 수정
| 파일 | 변경 의도 |
|------|----------|
| `apps/frontend/lib/api/query-config.ts` | documents.byCalibration 쿼리 키 추가 |
| `apps/frontend/lib/api/cache-invalidation.ts` | invalidateAfterCreate 누락 키 추가 |
| `apps/backend/src/modules/calibration/calibration.controller.ts` | multipart API + Throttle |
| `apps/backend/src/modules/calibration/calibration.service.ts` | createWithDocuments 원자 메서드 |
| `apps/backend/src/modules/calibration/dto/create-calibration.dto.ts` | certificatePath 제거 |
| `apps/backend/src/common/cache/cache-events.ts` | CALIBRATION 캐시 이벤트 분리 |
| `apps/backend/src/common/cache/cache-event.registry.ts` | 신규 이벤트 핸들러 등록 |

## 의사결정 로그
- 2026-04-20: createCalibrationFormSchema을 packages/schemas가 아닌 frontend lib/schemas에 배치 — z.instanceof(File) 브라우저 전용 제약
- 2026-04-20: invalidateAfterCreate에 calibrations.all prefix 추가로 summary/overdue 개별 키 불필요
- 2026-04-20: Phase 0은 non-breaking (기존 UI 호출 부분 무변경) — Phase 1과 Phase 3 사이 tsc 통과 보장
