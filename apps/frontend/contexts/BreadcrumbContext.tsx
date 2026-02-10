'use client';

/**
 * Breadcrumb Context
 *
 * 동적 라우트의 브레드크럼 라벨을 관리하기 위한 Context입니다.
 * 각 상세 페이지에서 의미있는 라벨을 설정하면, Header가 이를 읽어 브레드크럼에 표시합니다.
 *
 * @example
 * // 장비 상세 페이지에서 사용:
 * function EquipmentDetailClient({ equipment }) {
 *   const { setDynamicLabel } = useBreadcrumb();
 *
 *   useEffect(() => {
 *     setDynamicLabel(equipment.id, `${equipment.name} (${equipment.managementNumber})`);
 *     return () => clearDynamicLabel(equipment.id);
 *   }, [equipment]);
 *
 *   return <div>...</div>;
 * }
 *
 * @module BreadcrumbContext
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Breadcrumb Context 타입
 */
interface BreadcrumbContextValue {
  /** 동적 라벨 맵 (key: UUID, value: 표시할 라벨) */
  dynamicLabels: Record<string, string>;
  /** 동적 라벨 설정 */
  setDynamicLabel: (id: string, label: string) => void;
  /** 동적 라벨 제거 */
  clearDynamicLabel: (id: string) => void;
  /** 모든 동적 라벨 초기화 */
  clearAllDynamicLabels: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(undefined);

/**
 * Breadcrumb Provider Props
 */
interface BreadcrumbProviderProps {
  children: ReactNode;
}

/**
 * Breadcrumb Provider
 *
 * 동적 라벨 상태를 관리하는 Provider입니다.
 */
export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  const setDynamicLabel = useCallback((id: string, label: string) => {
    setDynamicLabels((prev) => ({
      ...prev,
      [id]: label,
    }));
  }, []);

  const clearDynamicLabel = useCallback((id: string) => {
    setDynamicLabels((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearAllDynamicLabels = useCallback(() => {
    setDynamicLabels({});
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{
        dynamicLabels,
        setDynamicLabel,
        clearDynamicLabel,
        clearAllDynamicLabels,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * useBreadcrumb Hook
 *
 * Breadcrumb Context를 사용하기 위한 Hook입니다.
 *
 * @throws BreadcrumbProvider 외부에서 호출 시 에러 발생
 *
 * @example
 * const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();
 */
export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);

  if (!context) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }

  return context;
}
