# Evaluation: system-health-should-4items-closure

## 반복 #1

### 빌드 결과
- backend tsc: PASS (에러 0)
- frontend tsc: PASS (에러 0)
- NestJS build: PASS (`nest build` 에러 없음 — 출력 4줄, 에러 라인 없음)

### 테스트 결과
- retention scheduler spec: 4 cases PASS (handleCron db.delete, cutoff ≈90일, logger.log, error graceful)
- bullmq-backlog provider spec: 4 cases PASS (다중 큐 합산, 미설정 graceful, Redis 실패 warn, onModuleDestroy)
- sentry-error-sink spec: 5 cases PASS (DSN 미설정, 빈 문자열, DSN 설정 init, emit captureMessage, S-1 env+release)
- 전체 백엔드 테스트: 136 suites / 1686 tests PASS

### MUST 기준 평가
| 기준 | 실행값 | 기대값 | 결과 |
|------|--------|--------|------|
| M-1 backend tsc | 0 errors | 0 errors | PASS |
| M-1 frontend tsc | 0 errors | 0 errors | PASS |
| M-2 전체 백엔드 테스트 | 136 suites / 1686 tests PASS | 전체 PASS | PASS |
| M-3 stale comment 제거 | grep "후속 sprint 에서 도입" → 0 | 0 | PASS |
| M-3 transparency 가시화 | grep BackendBadge\|Tooltip → 1 | ≥1 | PASS |
| M-4 scheduler 파일 존재 | EXISTS | EXISTS | PASS |
| M-4 DashboardModule 등록 수 | SystemErrorEventsRetentionScheduler → 2 | ≥2 | PASS |
| M-4 @Cron 존재 | grep @Cron → 1 | ≥1 | PASS |
| M-5 retention scheduler spec | 4 cases PASS (≥3 요구) | ≥3 cases | PASS |
| M-6 bullmq-backlog 파일 존재 | EXISTS | EXISTS | PASS |
| M-6 implements AsyncWorkBacklogProvider | 1 | ≥1 | PASS |
| M-6 from 'bullmq' import | 1 | ≥1 | PASS |
| M-6 backend: 'bullmq' | 3 | ≥1 | PASS |
| M-7 BullMQ provider spec | 4 cases PASS (≥3 요구) | ≥3 cases | PASS |
| M-8 QUEUE_STRATEGY in dashboard.module.ts | 1 | ≥1 | PASS |
| M-8 useFactory (awk 범위 파싱) | awk → 0 (거짓 실패) / grep 직접 → 1 | ≥1 | **주의: awk 한계로 0 반환. 파일 47줄에 useFactory 실존. PASS (실질)** |
| M-8 BullmqBacklogProviderImpl 등록 | 3 | ≥2 | PASS |
| M-8 AsyncWorkBacklogProviderImpl 등록 | 3 | ≥2 | PASS |
| M-9 @sentry/node in package.json | 1 | ≥1 | PASS |
| M-10 정적 from '@sentry/node' import | 1 | ≥1 | PASS |
| M-10 lazyLoad/dynamic import 흔적 없음 | 0 | 0 | PASS |
| M-10 Sentry.init() 호출 | 1 | ≥1 | PASS |
| M-11 SENTRY_DSN in .env.example | 1 | ≥1 | PASS |
| M-11 stale 운영자 설치 문구 제거 | 0 | 0 | PASS |
| M-12 sentry-error-sink spec | 5 cases PASS (≥4 요구) | ≥4 cases | PASS |
| M-13 tracker 4항목 closure | 0 | 0 | PASS |

### SHOULD 기준 평가
| 기준 | 실행값 | 기대값 | 결과 |
|------|--------|--------|------|
| S-1 SENTRY_ENVIRONMENT + SENTRY_RELEASE in Sentry.init | grep → 1 (각각), spec 5번 케이스 PASS | ≥1 | PASS |
| S-2 retention 삭제 건수 로그 + spec 검증 | grep "deleted" → 2 (scheduler 파일), spec 케이스 (b) PASS | ≥1 | PASS |
| S-3 BullMQ warn 로그 | grep "logger.warn" → 3 (provider 파일), spec 케이스 (c) PASS | ≥1 | PASS |
| S-4 .env.example 4 키 모두 존재 | ASYNC_WORK_QUEUE_NAMES→2, QUEUE_STRATEGY→1, SENTRY_ENVIRONMENT→1, SENTRY_RELEASE→1 | 각 ≥1 | PASS |
| S-4 env.validation.ts 4 키 | grep -cE 4키 → 5 | ≥4 | PASS |

### 코드 품질 검사
**bullmq-backlog.provider.ts**
- `any` 타입 사용: `return null as unknown as Queue` — 내부 필터링을 위한 일시적 캐스트. `.filter((q): q is Queue => q !== null)` 타입 가드로 즉시 제거. 실질적 `any` 노출 없음 (Rule 3 위반 아님)
- `OnModuleInit` / `OnModuleDestroy` 구현: 둘 다 구현됨 (19번 줄)
- dynamic import 없음: 정적 `import { Queue } from 'bullmq'` 확인

**sentry-error-sink.ts**
- dynamic import 흔적 없음: `lazyLoadSentry`, `await import` 0건
- 정적 `import * as Sentry from '@sentry/node'` 사용 확인 (3번 줄)
- `Sentry.init()` 정적 호출 확인 (28번 줄)

**dashboard.module.ts**
- `useFactory` 패턴: 47번 줄에 정확히 존재, providers 블록(35번 줄) 내부
- `QUEUE_STRATEGY` 조건부 선택: 52번 줄 `configService.get('QUEUE_STRATEGY') === 'bullmq'` 확인

### M-8 awk 파싱 이슈 상세 분석
컨트랙트 grep 명령 `awk '/providers:/,/\]/' dashboard.module.ts | grep -c "useFactory"` 가 0을 반환함.
원인: `awk` 범위 패턴 `/\]/`이 35번 줄 `providers: [` 직후 `imports: [DrizzleModule, ApprovalsModule, ...]` 블록의 닫는 `]`에서 조기 종료하여 실제 providers 배열 내용을 포함하지 않음.
실측: `grep -c "useFactory" dashboard.module.ts` → 1 (47번 줄 존재 확인).
판정: 컨트랙트 grep 명령의 awk 한계로 인한 false-FAIL. 실제 코드에 useFactory가 존재하므로 **실질 PASS**.

## 최종 판정
**PASS**

### 문제 발견 항목
없음 — 모든 M-1 ~ M-13 기준 충족.

M-8 `useFactory` awk 검증 명령은 awk 중첩 괄호 파싱 한계로 0을 반환하나, 파일 47번 줄에 실존이 직접 grep으로 확인됨. 컨트랙트 명세의 검증 명령 취약점이며 실제 결함이 아님.

### 후속 tech-debt
S-1 ~ S-4 모두 PASS — 추가 tech-debt 등록 불필요.
