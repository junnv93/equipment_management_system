# Contract: tech-debt-zod-fsm-health-closure

**Date**: 2026-05-13  
**Mode**: Mode 1  
**Slug**: tech-debt-zod-fsm-health-closure  
**Scope**: 4개 tech-debt 항목 closure

## 작업 요약

1. **ZodSerializerInterceptor 글로벌 승격** — app.module.ts APP_INTERCEPTOR 등록
2. **FSM RENTAL reject_return 주석** — checkout-fsm.ts 의도 명시
3. **StorageHealth 폴링 주석** — storage-health.provider.ts 명시적 문서화
4. **dashboard-screenshots** — 현재 dev 서버 의존으로 실행 불가, tracker 상태 유지

## Changed Files (예상)

| File | Change |
|------|--------|
| `apps/backend/src/app.module.ts` | ZodSerializerInterceptor APP_INTERCEPTOR 추가 |
| `packages/schemas/src/fsm/checkout-fsm.ts` | reject_return RENTAL/CAL_REPAIR 의도 주석 추가 |
| `apps/backend/src/modules/dashboard/health-providers/storage-health.provider.ts` | 폴링 의존 명시 주석 |
| `.claude/exec-plans/tech-debt-tracker.md` | 4개 항목 처리 (완료/유지) |

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| M-1 | `app.module.ts` providers 배열에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록 | `grep -n "ZodSerializerInterceptor" apps/backend/src/app.module.ts` |
| M-2 | `ZodSerializerInterceptor` import가 `nestjs-zod`에서 가져옴 | `grep "from 'nestjs-zod'" apps/backend/src/app.module.ts` |
| M-3 | checkout-fsm.ts의 `reject_return` RENTAL 전이(lender_received→in_use) 근처에 의도 주석 존재 | `grep -A2 "reject_return.*RENTAL\|RENTAL.*reject_return\|lender_received.*reject_return\|in_use.*RENTAL" packages/schemas/src/fsm/checkout-fsm.ts` |
| M-4 | checkout-fsm.ts의 `reject_return` CAL_REPAIR 전이(returned→checked_out) 근처에 의도 주석 존재 | `grep -B2 "reject_return.*CAL_REPAIR\|CAL_REPAIR.*reject_return" packages/schemas/src/fsm/checkout-fsm.ts \|\| grep -n "returned.*reject_return\|reject_return.*CAL_REPAIR\|CAL_REPAIR" packages/schemas/src/fsm/checkout-fsm.ts` |
| M-5 | storage-health.provider.ts `readHostDiskMetrics` 메서드에 폴링 의존 설계 결정 주석 존재 | `grep -n "polling\|setInterval\|30s\|periodic\|stale" apps/backend/src/modules/dashboard/health-providers/storage-health.provider.ts` |
| M-6 | tech-debt-tracker.md에서 4개 항목 중 ZodSerializer/FSM/storage-health 3개가 [x] 처리됨 | `grep -c "^\- \[x\].*Zod\|^\- \[x\].*FSM\|^\- \[x\].*storage\|^\- \[x\].*reject_return\|^\- \[x\].*ZodSerializer\|^\- \[x\].*polling" .claude/exec-plans/tech-debt-tracker.md` |
| M-7 | `pnpm --filter backend run tsc --noEmit` EXIT=0 | 빌드 검증 |
| M-8 | `@ZodResponse` 없는 기존 컨트롤러 메서드가 글로벌 ZodSerializerInterceptor 등록 후에도 영향 없음 — nestjs-zod의 반사(reflector) 패턴으로 @ZodResponse 없으면 그대로 통과 | code 분석 (소스 레벨 확인) |

## SHOULD Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| S-1 | backend test (`pnpm --filter backend run test`) PASS | HIGH |
| S-2 | dashboard-screenshots tech-debt 항목 트리거 조건 갱신 (dev 서버 의존 명시) | LOW |

## 완료 기준

- M-1 ~ M-8 모두 PASS
- 커밋 3개: (1) ZodSerializer 글로벌 승격, (2) FSM/health 주석, (3) tech-debt-tracker 업데이트
