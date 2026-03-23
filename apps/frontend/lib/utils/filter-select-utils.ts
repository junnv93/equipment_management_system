/**
 * URL-driven 필터 Select의 spurious onValueChange 방지 유틸리티
 *
 * 문제:
 *   Next.js App Router 클라이언트 네비게이션 중 useSearchParams()가 일시적으로
 *   이전 페이지의 빈 params를 반영 → Radix Select의 value가 센티널 값으로 변경 →
 *   onValueChange 발동 → updateURL({ teamId: '' }) → teamId=_all 설정 →
 *   서버가 "사용자 명시 전체 선택"으로 오인하여 팀 필터 미적용
 *
 * 해결:
 *   Radix Select의 open 상태를 추적하여, Select가 열려있을 때(사용자 상호작용)만
 *   onValueChange를 처리하고 닫혀있을 때(프로그래밍적 value 변경)는 무시.
 *   이것이 사용자 의도와 프로그래밍적 변경을 구분하는 유일한 신뢰할 수 있는 방법.
 *
 * @example
 * // 컴포넌트에서 사용
 * import { useFilterSelect } from '@/lib/utils/filter-select-utils';
 *
 * const teamSelect = useFilterSelect(filters.teamId, onTeamIdChange);
 * <Select {...teamSelect} disabled={isLoading}>
 *
 * // 다른 센티널 값 사용 시
 * const siteSelect = useFilterSelect(filters.site, updateSite, 'all');
 * <Select {...siteSelect}>
 */

import { useRef, useCallback } from 'react';

/**
 * URL-driven 필터용 Select props 훅.
 *
 * Radix Select의 open/close 상태를 ref로 추적하여,
 * 사용자가 드롭다운을 열고 선택한 경우에만 onChange를 호출합니다.
 * 프로그래밍적 value 변경(네비게이션 전환 등)에 의한 spurious onValueChange는 무시됩니다.
 *
 * @param currentValue - 현재 필터 값 (빈 문자열이면 미선택)
 * @param onChange - 값 변경 콜백 (필터 훅의 update 함수 또는 props 콜백)
 * @param sentinel - "전체 선택"을 나타내는 센티널 값 (기본: '_all')
 * @returns Select에 spread 가능한 { value, onValueChange, onOpenChange }
 */
export function useFilterSelect<T extends string = string>(
  currentValue: T | '',
  onChange: (value: T | '') => void,
  sentinel = '_all'
): {
  value: string;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
} {
  // ✅ Select가 사용자 상호작용으로 열렸는지 추적
  // ref 사용 — 렌더링에 영향 없이 최신 상태 보유, stale closure 문제 없음
  const userInteractedRef = useRef(false);

  const onOpenChange = useCallback((open: boolean) => {
    if (open) {
      userInteractedRef.current = true;
    }
    // close 시에는 리셋하지 않음 — onValueChange가 close 직후에 발생하므로
  }, []);

  const onValueChange = useCallback(
    (v: string) => {
      // ✅ 사용자가 드롭다운을 열지 않았으면 프로그래밍적 변경 → 무시
      if (!userInteractedRef.current) return;

      // 처리 후 리셋 (다음 프로그래밍적 변경을 차단하기 위해)
      userInteractedRef.current = false;

      const newValue = (v === sentinel ? '' : v) as T | '';
      onChange(newValue);
    },
    [onChange, sentinel]
  );

  return {
    value: currentValue || sentinel,
    onValueChange,
    onOpenChange,
  };
}
