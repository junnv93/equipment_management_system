import { useState, useEffect } from 'react';

/**
 * 값의 업데이트를 지정된 딜레이(ms)만큼 지연시킵니다.
 *
 * @param value - 디바운스할 값
 * @param delay - 밀리초 단위 딜레이 (기본 300ms)
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
