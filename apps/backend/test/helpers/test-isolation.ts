/**
 * 테스트 격리 유틸리티 — worker-격리 유니크 값 생성.
 *
 * Jest E2E는 여러 worker 프로세스에서 병렬 실행되므로, 스펙 파일이 정적 상수를
 * 사용하면 worker 간 또는 재실행 간 충돌 발생 가능. 이 헬퍼는:
 *  1) `process.env.JEST_WORKER_ID` (1~N) 로 worker별 슬롯 격리
 *  2) `crypto.randomInt`로 재실행 간 고유값 생성
 *  3) 스키마 허용 범위 + 파생값 헤드룸을 보장
 *
 * 모든 E2E 스펙이 연도/숫자 ID 격리가 필요할 때 이 모듈을 재사용해야 한다.
 */

import { randomInt } from 'node:crypto';

/** 스키마 허용 연도 범위. packages/schemas의 year validator와 동기화. */
export const SCHEMA_YEAR_MIN = 2020;
export const SCHEMA_YEAR_MAX = 2100;

/** Jest workers 상한. package.json 또는 jest config의 `maxWorkers` 와 일치시킨다. */
export const JEST_WORKER_COUNT_MAX = 4;

export interface WorkerUniqueYearOptions {
  /** 허용 최소 연도. 기본: 스키마 범위 하한. */
  minYear?: number;
  /** 허용 최대 연도. 기본: 스키마 범위 상한. */
  maxYear?: number;
  /**
   * 스펙 파일이 base year에서 얼마나 큰 offset을 파생시키는지.
   * 예: 테스트가 `TEST_YEAR + 50`까지 사용하면 50을 전달.
   * 기본 0. maxYear - maxDerivation 이 반환값의 상한이 된다.
   */
  maxDerivation?: number;
  /**
   * 병렬 실행될 worker 수 상한. 슬롯 분할에 사용. 기본 JEST_WORKER_COUNT_MAX.
   */
  workerCount?: number;
}

/**
 * 현재 worker가 다른 worker와 충돌하지 않는 유니크 연도를 반환.
 *
 * 내부 동작:
 *   - 유효 범위 = [minYear, maxYear - maxDerivation]
 *   - 슬롯 크기 = floor(유효 범위 / workerCount)
 *   - 각 worker는 자기 슬롯 안에서 randomInt로 base year 샘플링
 *
 * 호출자는 반환값 + maxDerivation 까지 모두 [minYear, maxYear] 범위임을 보장받는다.
 *
 * @throws 유효 범위가 workerCount보다 작아 슬롯 분할 불가한 경우.
 */
export function getWorkerUniqueYear(opts: WorkerUniqueYearOptions = {}): number {
  const minYear = opts.minYear ?? SCHEMA_YEAR_MIN;
  const maxYear = opts.maxYear ?? SCHEMA_YEAR_MAX;
  const maxDerivation = opts.maxDerivation ?? 0;
  const workerCount = opts.workerCount ?? JEST_WORKER_COUNT_MAX;

  if (maxDerivation < 0) {
    throw new Error(`getWorkerUniqueYear: maxDerivation must be >= 0, got ${maxDerivation}`);
  }
  if (workerCount < 1) {
    throw new Error(`getWorkerUniqueYear: workerCount must be >= 1, got ${workerCount}`);
  }

  const upperBound = maxYear - maxDerivation;
  const available = upperBound - minYear + 1;
  if (available < workerCount) {
    throw new Error(
      `getWorkerUniqueYear: 유효 범위 [${minYear}, ${upperBound}] (${available}년) 가 ` +
        `worker ${workerCount}개를 담기에 부족합니다. ` +
        `maxDerivation(${maxDerivation}) 축소 또는 범위 확장 필요.`
    );
  }

  const slotSize = Math.floor(available / workerCount);
  const workerIdRaw = Number(process.env.JEST_WORKER_ID ?? '1');
  // workerCount를 초과하는 JEST_WORKER_ID가 올 수 있으므로 modulo 적용.
  const workerSlot = ((workerIdRaw - 1) % workerCount + workerCount) % workerCount;
  const workerOffset = workerSlot * slotSize;
  const randomOffset = randomInt(0, slotSize);

  return minYear + workerOffset + randomOffset;
}
