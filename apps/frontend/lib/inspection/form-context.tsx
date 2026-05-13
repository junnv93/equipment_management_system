'use client';

/**
 * Inspection Form Context — Phase 1A-b SSOT
 *
 * 점검 폼(중간점검/자체점검) 작성 중 *prefill 메타*와 *셀 provenance*를
 * 단일 reducer state로 통합 관리.
 *
 * 설계 원칙:
 * - SSOT: 분산 state(prefilled/prefillCounts/prefillBannerDismissed/previousInspectionApplied 등) 통합
 * - prop drilling 회피: 4-5 layer 깊이 (InspectionFormDialog → InlineResultSectionsEditor →
 *   ResultSectionFormDialog → VisualTableEditor) 컴포넌트가 Context Consumer로 동작
 * - Reusable: 1B Template Version Badge / 1C SoftForkDialog / 1D TemplateGallery에서도 동일 Context 활용
 * - Graceful no-op: Provider 부재 시 NO_OP_VALUE 반환 (ADR-0013-A) — VisualTableEditor 단독 사용 호환
 *   prefill 메타는 장식적(enrichment) Context이므로 graceful no-op 적용 (docs/adr/0013-graceful-no-op-context-consumer.md)
 *
 * 업계 표준: LIMS Template Snapshot의 cell-level provenance 추적 (LabWare/Veeva/Beamex)
 */

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { ExtractedStructure } from './template-utils';

// ============================================================================
// State shape
// ============================================================================

/** 직전 점검에서 prefill된 메타 + 사용자 수정 추적 */
export interface PrefillLatestState {
  applied: boolean;
  sourceInspectionId: string | null;
  sourceInspectionDate: string | null;
  counts: ExtractedStructure['counts'] | null;
  bannerDismissed: boolean;
  /** prefill로 생성된 sortOrder set (O(1) lookup) */
  prefilledSortOrders: ReadonlySet<number>;
  /**
   * 사용자가 수정한 셀 — sortOrder 별 cellKey set.
   * cellKey 형식: `${ri}:${ci}`
   */
  userModifiedCells: ReadonlyMap<number, ReadonlySet<string>>;
}

/** 장비 마스터 데이터에서 자동 입력된 폼 필드 추적 */
export type MasterPrefilledFields = ReadonlySet<string>;

/**
 * 현재 사용 중인 template 메타 — Phase 1B-D 도입.
 *
 * DialogHeader version badge 표시 + Phase 1B-E SoftFork 비교 base.
 * 부재(없음/시스템 auto-create 직전): null — UI는 "양식 부재" fallback 표시.
 */
export interface TemplateState {
  /** template entity id (UUID) — Phase 1B-E SoftFork upsert의 supersededBy 기준 */
  id: string;
  version: number;
  /** ISO date — DialogHeader 메타 표시 */
  createdAt: string;
  /** users.name — 시스템 auto-create는 null (UI에서 i18n "system" 라벨) */
  createdByName: string | null;
}

export interface InspectionFormState {
  latest: PrefillLatestState;
  master: MasterPrefilledFields;
  /** 현재 양식 — Phase 1B-D 추가. null = 신규 장비 (Phase 1B-F Gallery 노출 후보). */
  template: TemplateState | null;
}

const INITIAL_LATEST: PrefillLatestState = {
  applied: false,
  sourceInspectionId: null,
  sourceInspectionDate: null,
  counts: null,
  bannerDismissed: false,
  prefilledSortOrders: new Set(),
  userModifiedCells: new Map(),
};

const INITIAL_STATE: InspectionFormState = {
  latest: INITIAL_LATEST,
  master: new Set(),
  template: null,
};

// ============================================================================
// Actions
// ============================================================================

type Action =
  | {
      type: 'apply-latest';
      sourceInspectionId: string;
      sourceInspectionDate: string;
      counts: ExtractedStructure['counts'];
      sortOrders: number[];
    }
  | {
      /** Phase 1B-D: template snapshot prefill (1B-D 단독 source) */
      type: 'apply-template';
      template: TemplateState;
      counts: ExtractedStructure['counts'];
      sortOrders: number[];
    }
  | { type: 'reset-latest' }
  | { type: 'dismiss-banner' }
  | { type: 'mark-cell-modified'; sortOrder: number; ri: number; ci: number }
  | { type: 'mark-section-modified'; sortOrder: number }
  | { type: 'remove-section'; sortOrder: number }
  | { type: 'add-master-field'; field: string }
  | { type: 'remove-master-field'; field: string }
  | { type: 'set-master-fields'; fields: string[] }
  | { type: 'set-template'; template: TemplateState | null }
  | { type: 'reset-all' };

function reducer(state: InspectionFormState, action: Action): InspectionFormState {
  switch (action.type) {
    case 'apply-latest':
      return {
        ...state,
        latest: {
          applied: true,
          sourceInspectionId: action.sourceInspectionId,
          sourceInspectionDate: action.sourceInspectionDate,
          counts: action.counts,
          bannerDismissed: false,
          prefilledSortOrders: new Set(action.sortOrders),
          userModifiedCells: new Map(),
        },
      };
    case 'apply-template':
      // Phase 1B-D: template prefill — latest 흐름과 분리하지만 prefilled 셀 추적은 동일.
      // sourceInspectionId 자리에는 template.id를 기록 (provenance — banner SR text 활용).
      return {
        ...state,
        template: action.template,
        latest: {
          applied: true,
          sourceInspectionId: `template:${action.template.id}`,
          sourceInspectionDate: action.template.createdAt.slice(0, 10),
          counts: action.counts,
          bannerDismissed: false,
          prefilledSortOrders: new Set(action.sortOrders),
          userModifiedCells: new Map(),
        },
      };
    case 'set-template':
      return { ...state, template: action.template };
    case 'reset-latest':
      return { ...state, latest: INITIAL_LATEST };
    case 'dismiss-banner':
      return {
        ...state,
        latest: { ...state.latest, bannerDismissed: true },
      };
    case 'mark-cell-modified': {
      const { sortOrder, ri, ci } = action;
      // prefilled section이 아니면 추적할 의미 없음 (성능 — 모든 셀 수정 마다 set 갱신 회피)
      if (!state.latest.prefilledSortOrders.has(sortOrder)) return state;
      const cellKey = `${ri}:${ci}`;
      const existing = state.latest.userModifiedCells.get(sortOrder);
      if (existing?.has(cellKey)) return state; // 이미 marked — referential equality 유지
      const nextSet = new Set(existing ?? []);
      nextSet.add(cellKey);
      const nextMap = new Map(state.latest.userModifiedCells);
      nextMap.set(sortOrder, nextSet);
      return {
        ...state,
        latest: { ...state.latest, userModifiedCells: nextMap },
      };
    }
    case 'mark-section-modified': {
      const { sortOrder } = action;
      // 섹션 자체 변경 (헤더/타입/순서 변경) → prefilled 상태 해제
      if (!state.latest.prefilledSortOrders.has(sortOrder)) return state;
      const nextOrders = new Set(state.latest.prefilledSortOrders);
      nextOrders.delete(sortOrder);
      const nextMap = new Map(state.latest.userModifiedCells);
      nextMap.delete(sortOrder);
      return {
        ...state,
        latest: {
          ...state.latest,
          prefilledSortOrders: nextOrders,
          userModifiedCells: nextMap,
        },
      };
    }
    case 'remove-section': {
      const { sortOrder } = action;
      if (
        !state.latest.prefilledSortOrders.has(sortOrder) &&
        !state.latest.userModifiedCells.has(sortOrder)
      ) {
        return state;
      }
      const nextOrders = new Set(state.latest.prefilledSortOrders);
      nextOrders.delete(sortOrder);
      const nextMap = new Map(state.latest.userModifiedCells);
      nextMap.delete(sortOrder);
      return {
        ...state,
        latest: {
          ...state.latest,
          prefilledSortOrders: nextOrders,
          userModifiedCells: nextMap,
        },
      };
    }
    case 'add-master-field': {
      if (state.master.has(action.field)) return state; // referential equality 유지
      const next = new Set(state.master);
      next.add(action.field);
      return { ...state, master: next };
    }
    case 'remove-master-field': {
      if (!state.master.has(action.field)) return state;
      const next = new Set(state.master);
      next.delete(action.field);
      return { ...state, master: next };
    }
    case 'set-master-fields':
      return { ...state, master: new Set(action.fields) };
    case 'reset-all':
      return INITIAL_STATE;
    default:
      return state;
  }
}

// ============================================================================
// Context value
// ============================================================================

export interface InspectionFormContextValue {
  state: InspectionFormState;

  // ── prefill (직전 점검) actions ──
  applyLatestPrefill: (params: {
    sourceInspectionId: string;
    sourceInspectionDate: string;
    counts: ExtractedStructure['counts'];
    sortOrders: number[];
  }) => void;
  /** Phase 1B-D: template prefill — latestInspection 의존 제거 후 단독 source */
  applyTemplatePrefill: (params: {
    template: TemplateState;
    counts: ExtractedStructure['counts'];
    sortOrders: number[];
  }) => void;
  /** Template 메타만 설정 (prefill은 별도) — 1B-E divergence 추적 등 */
  setTemplate: (template: TemplateState | null) => void;
  resetLatestPrefill: () => void;
  dismissBanner: () => void;

  // ── provenance actions ──
  markCellModified: (sortOrder: number, ri: number, ci: number) => void;
  markSectionModified: (sortOrder: number) => void;
  removeSection: (sortOrder: number) => void;

  // ── master data actions ──
  setMasterPrefilledFields: (fields: string[]) => void;
  /** 단일 마스터 필드 prefilled 표시 (장비 마스터에서 자동 입력 시 호출) */
  addMasterPrefilledField: (field: string) => void;
  /** 단일 마스터 필드 prefilled 해제 (사용자가 직접 비웠거나 reset 시) */
  removeMasterPrefilledField: (field: string) => void;

  // ── lifecycle ──
  resetAll: () => void;

  // ── selectors ──
  isPrefilledSection: (sortOrder: number) => boolean;
  isUserModifiedCell: (sortOrder: number, ri: number, ci: number) => boolean;
  /** prefilled section + 사용자 미수정 셀 */
  isPrefilledCell: (sortOrder: number, ri: number, ci: number) => boolean;
  isMasterPrefilledField: (field: string) => boolean;
}

const InspectionFormContext = createContext<InspectionFormContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function InspectionFormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const applyLatestPrefill = useCallback<InspectionFormContextValue['applyLatestPrefill']>(
    (params) => dispatch({ type: 'apply-latest', ...params }),
    []
  );
  const applyTemplatePrefill = useCallback<InspectionFormContextValue['applyTemplatePrefill']>(
    (params) => dispatch({ type: 'apply-template', ...params }),
    []
  );
  const setTemplate = useCallback<InspectionFormContextValue['setTemplate']>(
    (template) => dispatch({ type: 'set-template', template }),
    []
  );
  const resetLatestPrefill = useCallback(() => dispatch({ type: 'reset-latest' }), []);
  const dismissBanner = useCallback(() => dispatch({ type: 'dismiss-banner' }), []);
  const markCellModified = useCallback<InspectionFormContextValue['markCellModified']>(
    (sortOrder, ri, ci) => dispatch({ type: 'mark-cell-modified', sortOrder, ri, ci }),
    []
  );
  const markSectionModified = useCallback<InspectionFormContextValue['markSectionModified']>(
    (sortOrder) => dispatch({ type: 'mark-section-modified', sortOrder }),
    []
  );
  const removeSection = useCallback<InspectionFormContextValue['removeSection']>(
    (sortOrder) => dispatch({ type: 'remove-section', sortOrder }),
    []
  );
  const setMasterPrefilledFields = useCallback<
    InspectionFormContextValue['setMasterPrefilledFields']
  >((fields) => dispatch({ type: 'set-master-fields', fields }), []);
  const addMasterPrefilledField = useCallback<
    InspectionFormContextValue['addMasterPrefilledField']
  >((field) => dispatch({ type: 'add-master-field', field }), []);
  const removeMasterPrefilledField = useCallback<
    InspectionFormContextValue['removeMasterPrefilledField']
  >((field) => dispatch({ type: 'remove-master-field', field }), []);
  const resetAll = useCallback(() => dispatch({ type: 'reset-all' }), []);

  // ── selectors (state-derived) ──
  const isPrefilledSection = useCallback(
    (sortOrder: number) => state.latest.prefilledSortOrders.has(sortOrder),
    [state.latest.prefilledSortOrders]
  );
  const isUserModifiedCell = useCallback(
    (sortOrder: number, ri: number, ci: number) =>
      state.latest.userModifiedCells.get(sortOrder)?.has(`${ri}:${ci}`) ?? false,
    [state.latest.userModifiedCells]
  );
  const isPrefilledCell = useCallback(
    (sortOrder: number, ri: number, ci: number) =>
      isPrefilledSection(sortOrder) && !isUserModifiedCell(sortOrder, ri, ci),
    [isPrefilledSection, isUserModifiedCell]
  );
  const isMasterPrefilledField = useCallback(
    (field: string) => state.master.has(field),
    [state.master]
  );

  const value = useMemo<InspectionFormContextValue>(
    () => ({
      state,
      applyLatestPrefill,
      applyTemplatePrefill,
      setTemplate,
      resetLatestPrefill,
      dismissBanner,
      markCellModified,
      markSectionModified,
      removeSection,
      setMasterPrefilledFields,
      addMasterPrefilledField,
      removeMasterPrefilledField,
      resetAll,
      isPrefilledSection,
      isUserModifiedCell,
      isPrefilledCell,
      isMasterPrefilledField,
    }),
    [
      state,
      applyLatestPrefill,
      applyTemplatePrefill,
      setTemplate,
      resetLatestPrefill,
      dismissBanner,
      markCellModified,
      markSectionModified,
      removeSection,
      setMasterPrefilledFields,
      addMasterPrefilledField,
      removeMasterPrefilledField,
      resetAll,
      isPrefilledSection,
      isUserModifiedCell,
      isPrefilledCell,
      isMasterPrefilledField,
    ]
  );

  return <InspectionFormContext.Provider value={value}>{children}</InspectionFormContext.Provider>;
}

// ============================================================================
// Graceful no-op (Provider 부재 시 — 단독 사용 호환)
// ============================================================================

const NO_OP_VALUE: InspectionFormContextValue = {
  state: INITIAL_STATE,
  applyLatestPrefill: () => {},
  applyTemplatePrefill: () => {},
  setTemplate: () => {},
  resetLatestPrefill: () => {},
  dismissBanner: () => {},
  markCellModified: () => {},
  markSectionModified: () => {},
  removeSection: () => {},
  setMasterPrefilledFields: () => {},
  addMasterPrefilledField: () => {},
  removeMasterPrefilledField: () => {},
  resetAll: () => {},
  isPrefilledSection: () => false,
  isUserModifiedCell: () => false,
  isPrefilledCell: () => false,
  isMasterPrefilledField: () => false,
};

/**
 * useInspectionForm — Context 훅.
 *
 * Provider 부재 시 NO_OP_VALUE 반환 (VisualTableEditor 단독 또는 다른 화면 재사용 가능).
 * SSOT: 모든 inspection 폼 컴포넌트는 이 훅을 통해서만 prefill/provenance state 접근.
 */
export function useInspectionForm(): InspectionFormContextValue {
  return useContext(InspectionFormContext) ?? NO_OP_VALUE;
}
