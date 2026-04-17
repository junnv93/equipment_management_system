/// <reference types="jest" />

import {
  getWorkerUniqueYear,
  SCHEMA_YEAR_MIN,
  SCHEMA_YEAR_MAX,
  JEST_WORKER_COUNT_MAX,
} from '../test-isolation';

describe('getWorkerUniqueYear', () => {
  const originalWorkerId = process.env.JEST_WORKER_ID;

  afterEach(() => {
    if (originalWorkerId === undefined) delete process.env.JEST_WORKER_ID;
    else process.env.JEST_WORKER_ID = originalWorkerId;
  });

  it('기본 옵션 — 스키마 범위 내 값 반환', () => {
    process.env.JEST_WORKER_ID = '1';
    const year = getWorkerUniqueYear();
    expect(year).toBeGreaterThanOrEqual(SCHEMA_YEAR_MIN);
    expect(year).toBeLessThanOrEqual(SCHEMA_YEAR_MAX);
  });

  it('maxDerivation 적용 시 year + derivation도 범위 내', () => {
    process.env.JEST_WORKER_ID = '1';
    const maxDerivation = 30;
    const year = getWorkerUniqueYear({ maxDerivation });
    expect(year + maxDerivation).toBeLessThanOrEqual(SCHEMA_YEAR_MAX);
  });

  it('worker 1~4 가 서로 다른 슬롯을 점유 (슬롯 겹침 없음)', () => {
    const slots = new Set<number>();
    for (let i = 1; i <= JEST_WORKER_COUNT_MAX; i++) {
      process.env.JEST_WORKER_ID = String(i);
      // 같은 maxDerivation으로 슬롯 계산이 결정적임
      const year = getWorkerUniqueYear({ maxDerivation: 30, workerCount: 4 });
      // 슬롯 인덱스 도출: (year - minYear) / slotSize
      const available = SCHEMA_YEAR_MAX - 30 - SCHEMA_YEAR_MIN + 1;
      const slotSize = Math.floor(available / 4);
      const slotIndex = Math.floor((year - SCHEMA_YEAR_MIN) / slotSize);
      slots.add(slotIndex);
    }
    expect(slots.size).toBe(JEST_WORKER_COUNT_MAX);
  });

  it('worker 1과 worker 5 (modulo) 는 같은 슬롯을 공유', () => {
    process.env.JEST_WORKER_ID = '1';
    const a = getWorkerUniqueYear({ maxDerivation: 30, workerCount: 4 });
    process.env.JEST_WORKER_ID = '5';
    const b = getWorkerUniqueYear({ maxDerivation: 30, workerCount: 4 });
    const available = SCHEMA_YEAR_MAX - 30 - SCHEMA_YEAR_MIN + 1;
    const slotSize = Math.floor(available / 4);
    expect(Math.floor((a - SCHEMA_YEAR_MIN) / slotSize)).toBe(
      Math.floor((b - SCHEMA_YEAR_MIN) / slotSize)
    );
  });

  it('JEST_WORKER_ID 없으면 기본 slot 0 사용 (CI 비정상 환경 대응)', () => {
    delete process.env.JEST_WORKER_ID;
    const year = getWorkerUniqueYear({ maxDerivation: 30, workerCount: 4 });
    expect(year).toBeGreaterThanOrEqual(SCHEMA_YEAR_MIN);
    const available = SCHEMA_YEAR_MAX - 30 - SCHEMA_YEAR_MIN + 1;
    const slotSize = Math.floor(available / 4);
    // slot 0 = [MIN_YEAR, MIN_YEAR + slotSize)
    expect(year).toBeLessThan(SCHEMA_YEAR_MIN + slotSize);
  });

  it('동일 worker 반복 호출은 서로 다른 값 가능성 (randomInt 기반)', () => {
    process.env.JEST_WORKER_ID = '1';
    const values = new Set<number>();
    for (let i = 0; i < 30; i++) {
      values.add(getWorkerUniqueYear({ maxDerivation: 30, workerCount: 4 }));
    }
    // 슬롯이 2개 이상 가능한 경우 (slotSize > 1), 30회 호출 중 2개 이상의 서로 다른 값 기대
    expect(values.size).toBeGreaterThan(1);
  });

  it('maxDerivation이 범위를 초과하면 명확한 에러', () => {
    expect(() => getWorkerUniqueYear({ maxDerivation: 1000 })).toThrow(
      /worker|부족/i
    );
  });

  it('maxDerivation 음수는 에러', () => {
    expect(() => getWorkerUniqueYear({ maxDerivation: -1 })).toThrow(/maxDerivation/);
  });

  it('workerCount 0 이하는 에러', () => {
    expect(() => getWorkerUniqueYear({ workerCount: 0 })).toThrow(/workerCount/);
  });
});
