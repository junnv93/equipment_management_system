/**
 * SystemHealthProvider DI 토큰 — common 레이어 SSOT 의 re-export.
 *
 * 본 sprint 초기에는 health-providers/ 내부 정의였으나, common/filters/error.filter.ts 가 5xx 캡처를 위해
 * 토큰을 import 해야 해서 common → modules 레이어 위반이 발생. 이를 해결하기 위해 SSOT 를
 * `apps/backend/src/common/system-health/contract.ts` 로 이동 + 본 파일은 dashboard 도메인 호환을 위한
 * re-export shim 으로 유지.
 *
 * 신규 dashboard 코드는 `common/system-health/contract` 를 직접 import 하는 것을 권장.
 */

export {
  STORAGE_HEALTH_PROVIDER,
  ASYNC_WORK_BACKLOG_PROVIDER,
  SYSTEM_ERROR_EVENT_PROVIDER,
} from '../../../common/system-health/contract';
