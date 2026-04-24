import { getSemanticContainerTextClasses, type SemanticColorKey } from '@/lib/design-tokens';

interface SparklineMiniProps {
  values: number[];
  /** 향후 선 색상/스타일 변형에 사용. 현재는 variant 색상만 적용. */
  trend?: 'up' | 'down' | 'flat';
  variant: SemanticColorKey;
  width?: number;
  height?: number;
}

function normalizeValues(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

export function SparklineMini({ values, variant, width = 64, height = 24 }: SparklineMiniProps) {
  if (values.length <= 1) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }

  const normalized = normalizeValues(values);
  const points = normalized
    .map((v, i) => {
      const x = i * (width / (values.length - 1));
      const y = (1 - v) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const colorClass = getSemanticContainerTextClasses(variant);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className={colorClass}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
