/**
 * SystemHealth Provider 타입 — common 레이어 SSOT 의 re-export.
 *
 * SSOT 위치: `apps/backend/src/common/system-health/contract.ts`
 *
 * 본 파일은 dashboard 도메인 호환을 위한 re-export shim. 신규 코드는
 * `common/system-health/contract` 를 직접 import 권장.
 */

export type {
  StorageHealthSnapshot,
  StorageHealthProvider,
  AsyncWorkBacklogSnapshot,
  AsyncWorkBacklogProvider,
  SystemErrorEventInput,
  SystemErrorEventCount,
  SystemErrorEventProvider,
} from '../../../common/system-health/contract';
