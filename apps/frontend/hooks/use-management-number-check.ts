/**
 * 관리번호 중복 검사 커스텀 훅
 *
 * 장비 등록/수정 폼에서 실시간으로 관리번호 중복 여부를 확인합니다.
 *
 * ⭐ Best Practices:
 * - Debounce: 타이핑 중 과도한 API 호출 방지 (300ms)
 * - 캐싱: React Query로 동일 관리번호 재검사 시 캐시 활용
 * - 에러 처리: 네트워크 에러 시에도 폼 제출 가능 (서버에서 최종 검증)
 *
 * @example
 * const { checkManagementNumber, isChecking, checkResult, error } = useManagementNumberCheck();
 *
 * // 입력 필드에서 사용
 * <Input
 *   onChange={(e) => checkManagementNumber(e.target.value)}
 *   className={checkResult?.available === false ? 'border-red-500' : ''}
 * />
 *
 * // 결과 메시지 표시
 * {checkResult && !checkResult.available && (
 *   <p className="text-red-500 text-sm">{checkResult.message}</p>
 * )}
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import equipmentApi, { ManagementNumberCheckResult } from '@/lib/api/equipment-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';

/** 디바운스 딜레이 (ms) */
const DEBOUNCE_DELAY = 300;

/** 최소 검사 문자 길이 */
const MIN_CHECK_LENGTH = 3;

interface UseManagementNumberCheckOptions {
  /** 수정 모드에서 제외할 장비 ID */
  excludeId?: string;
  /** 자동 검사 비활성화 (수동 검사만 사용) */
  disableAutoCheck?: boolean;
}

interface UseManagementNumberCheckReturn {
  /** 관리번호 검사 실행 (디바운스 적용) */
  checkManagementNumber: (managementNumber: string) => void;
  /** 즉시 검사 실행 (디바운스 없음, 폼 제출 전 최종 확인용) */
  checkManagementNumberImmediate: (
    managementNumber: string
  ) => Promise<ManagementNumberCheckResult | null>;
  /** 검사 중 여부 */
  isChecking: boolean;
  /** 검사 결과 */
  checkResult: ManagementNumberCheckResult | null;
  /** 에러 */
  error: Error | null;
  /** 현재 검사 중인 관리번호 */
  currentManagementNumber: string;
  /** 결과 초기화 */
  reset: () => void;
}

export function useManagementNumberCheck(
  options: UseManagementNumberCheckOptions = {}
): UseManagementNumberCheckReturn {
  const { excludeId, disableAutoCheck = false } = options;

  const [managementNumber, setManagementNumber] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // React Query로 중복 검사 수행
  const {
    data: checkResult,
    isLoading: isChecking,
    error,
    refetch: _refetch,
  } = useQuery({
    queryKey: queryKeys.equipment.managementNumberCheck(debouncedValue, excludeId),
    queryFn: async () => {
      if (!debouncedValue || debouncedValue.length < MIN_CHECK_LENGTH) {
        return null;
      }
      return equipmentApi.checkManagementNumber(debouncedValue, excludeId);
    },
    enabled: !disableAutoCheck && debouncedValue.length >= MIN_CHECK_LENGTH,
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.LONG,
    retry: 1, // 실패 시 1회만 재시도
  });

  // 디바운스 처리
  const checkManagementNumber = useCallback((value: string) => {
    setManagementNumber(value);

    // 기존 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 최소 길이 미만이면 결과 초기화
    if (!value || value.length < MIN_CHECK_LENGTH) {
      setDebouncedValue('');
      return;
    }

    // 디바운스 적용
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, DEBOUNCE_DELAY);
  }, []);

  // 즉시 검사 (폼 제출 전 최종 확인용)
  const checkManagementNumberImmediate = useCallback(
    async (value: string): Promise<ManagementNumberCheckResult | null> => {
      if (!value || value.length < MIN_CHECK_LENGTH) {
        return null;
      }

      try {
        // 캐시 확인
        const cachedData = queryClient.getQueryData<ManagementNumberCheckResult>(
          queryKeys.equipment.managementNumberCheck(value, excludeId)
        );

        if (cachedData) {
          return cachedData;
        }

        // 캐시 없으면 API 호출
        const result = await equipmentApi.checkManagementNumber(value, excludeId);

        // 결과 캐싱
        queryClient.setQueryData(
          queryKeys.equipment.managementNumberCheck(value, excludeId),
          result
        );

        return result;
      } catch (err) {
        console.error('Management number check failed:', err);
        // 네트워크 에러 시 null 반환 (서버에서 최종 검증)
        return null;
      }
    },
    [excludeId, queryClient]
  );

  // 결과 초기화
  const reset = useCallback(() => {
    setManagementNumber('');
    setDebouncedValue('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    checkManagementNumber,
    checkManagementNumberImmediate,
    isChecking,
    checkResult: checkResult ?? null,
    error: error as Error | null,
    currentManagementNumber: managementNumber,
    reset,
  };
}

export default useManagementNumberCheck;
