/**
 * checkout UI 전용 타입 SSOT
 *
 * checkout 도메인 UI 컴포넌트 간 공유 타입을 여기에 추가.
 * 컴포넌트 로컬 정의 금지 — 타입 분산 방지.
 */

/** 드롭다운 오버플로 액션 항목 — NextStepPanel + 호출처 공통 */
export interface OverflowAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}
