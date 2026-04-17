import { calculateAspectFitDimensions } from '../docx-xml-helper';

const CELL_WIDTH = 4_588_510; // 12.75cm (UL-QP-18-02 사진 셀)
const MAX_HEIGHT = 3_600_000; // 10cm
const MIN_HEIGHT = 1_080_000; // 3cm

describe('calculateAspectFitDimensions', () => {
  it('4:3 원본 (표준 카메라) → 가로는 셀 폭, 세로는 비율 유지', () => {
    const { cx, cy } = calculateAspectFitDimensions(1600, 1200, CELL_WIDTH, MAX_HEIGHT, MIN_HEIGHT);
    expect(cx).toBe(CELL_WIDTH);
    // 4:3 → cy = CELL_WIDTH * 3/4 = 3,441,382.5 → rounded
    expect(cy).toBe(Math.round(CELL_WIDTH * (1200 / 1600)));
  });

  it('16:9 원본 (넓은 카메라) → 가로 셀 폭 유지, 세로 더 작음 (정상 범위)', () => {
    const { cx, cy } = calculateAspectFitDimensions(1920, 1080, CELL_WIDTH, MAX_HEIGHT, MIN_HEIGHT);
    expect(cx).toBe(CELL_WIDTH);
    expect(cy).toBe(Math.round(CELL_WIDTH * (1080 / 1920)));
    expect(cy).toBeGreaterThan(MIN_HEIGHT);
    expect(cy).toBeLessThan(MAX_HEIGHT);
  });

  it('3:4 세로 사진 → 세로 상한 초과 시 세로 고정하고 가로 축소', () => {
    // 3:4 비율 원본이 cellWidth에 들어가면 세로가 MAX_HEIGHT 초과
    const { cx, cy } = calculateAspectFitDimensions(1200, 1600, CELL_WIDTH, MAX_HEIGHT, MIN_HEIGHT);
    expect(cy).toBe(MAX_HEIGHT);
    expect(cx).toBe(Math.round(MAX_HEIGHT * (1200 / 1600))); // 가로 축소
    expect(cx).toBeLessThan(CELL_WIDTH);
    // 비율 보존 확인 (1% 오차 허용 — 반올림)
    expect(cx / cy).toBeCloseTo(1200 / 1600, 2);
  });

  it('1:1 정사각 사진 → 세로 상한 초과 시 세로 고정', () => {
    const { cx, cy } = calculateAspectFitDimensions(1000, 1000, CELL_WIDTH, MAX_HEIGHT, MIN_HEIGHT);
    // naturalCy = cellWidth = 4,588,510 > MAX_HEIGHT(3,600,000) → max로 클램프
    expect(cy).toBe(MAX_HEIGHT);
    expect(cx).toBe(MAX_HEIGHT); // 1:1
  });

  it('파노라마 20:1 → 세로 하한 미만이면 세로 고정하고 가로 상한(cellWidth)', () => {
    const { cx, cy } = calculateAspectFitDimensions(4000, 200, CELL_WIDTH, MAX_HEIGHT, MIN_HEIGHT);
    // naturalCy = cellWidth * 200/4000 = 229,425 → MIN_HEIGHT 미만
    expect(cy).toBe(MIN_HEIGHT);
    // 가로는 cellWidth 상한 (이론적으론 MIN_HEIGHT × 20 = 21.6M이지만 clamp)
    expect(cx).toBe(CELL_WIDTH);
  });

  it('원본 치수 없음 → 4:3 fallback', () => {
    const { cx, cy } = calculateAspectFitDimensions(
      undefined,
      undefined,
      CELL_WIDTH,
      MAX_HEIGHT,
      MIN_HEIGHT
    );
    expect(cx).toBe(CELL_WIDTH);
    expect(cy).toBe(Math.round((CELL_WIDTH * 3) / 4));
  });

  it('원본 너비 0 (손상) → 4:3 fallback', () => {
    const { cx, cy } = calculateAspectFitDimensions(0, 1000, CELL_WIDTH, MAX_HEIGHT, MIN_HEIGHT);
    expect(cx).toBe(CELL_WIDTH);
    expect(cy).toBeGreaterThanOrEqual(MIN_HEIGHT);
    expect(cy).toBeLessThanOrEqual(MAX_HEIGHT);
  });

  it('원본 비율 완벽 보존 — 정상 범위 케이스에서 왜곡 0', () => {
    // 3:2 원본 (DSLR 표준)
    const originalRatio = 3 / 2;
    const { cx, cy } = calculateAspectFitDimensions(3000, 2000, CELL_WIDTH, MAX_HEIGHT, MIN_HEIGHT);
    expect(cx / cy).toBeCloseTo(originalRatio, 3); // 소수점 3자리 정확
  });
});
