'use client';

/**
 * Inspection Form Template hooks (Phase 1B-D)
 *
 * UL-QP-18-03/05 Build-Once Workflow — frontend SSOT for template fetch + mutation.
 *
 * Hooks:
 * - `useLatestTemplate(equipmentId, type, options?)` — current template (SSOT prefill source)
 * - `useUpsertTemplate(equipmentId)` — SoftFork apply_forward / admin 명시 수정 (Phase 1B-E)
 *
 * 캐싱:
 * - staleTime 5min — template은 자주 변경되지 않음 (LIMS 표준 — 양식 통제는 안정성 우선)
 * - 부재(404) 시 throwOnError=false로 graceful — 호출자가 "first inspection" 분기 (Gallery 노출 등)
 *
 * Cache invalidation:
 * - backend INSPECTION_TEMPLATE_* 이벤트 → registry listener → 본 query key prefix invalidate
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  getLatestTemplate,
  upsertTemplate,
  getTemplateGallery,
  type InspectionTemplateLatestResponse,
  type InspectionTemplateGalleryEntry,
  type UpsertInspectionTemplateBody,
  type UpsertInspectionTemplateResponse,
} from '@/lib/api/inspection-template-api';
import { isNotFoundError } from '@/lib/api/error';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';

/**
 * 현재 template 조회 — Phase 1B-D prefill SSOT.
 *
 * 반환:
 * - data: template object (성공 시)
 * - data: undefined + isError + error: ApiError(404) (template 부재 시)
 *   → 호출자는 `isNotFoundError(error)` 체크하여 "first inspection" 분기
 *
 * @param enabled — open=true && equipmentId 유효 시만 fetch (불필요 호출 방지)
 */
export function useLatestTemplate(
  equipmentId: string | null | undefined,
  type: 'intermediate' | 'self',
  options: { enabled?: boolean } = {}
) {
  const enabled = (options.enabled ?? true) && Boolean(equipmentId);

  return useQuery<InspectionTemplateLatestResponse>({
    queryKey: enabled
      ? queryKeys.inspectionTemplate.latest(equipmentId as string, type)
      : ['inspectionTemplate', 'latest', 'disabled'],
    queryFn: () => getLatestTemplate(equipmentId as string, type),
    enabled,
    // SSOT: QUERY_CONFIG.INSPECTION_TEMPLATE = REFETCH_STRATEGIES.STATIC
    // (template은 첫 승인 + admin 명시 수정 시에만 변경 — 거의 정적)
    ...QUERY_CONFIG.INSPECTION_TEMPLATE,
    // 404는 정상 분기 (template 부재 = first inspection) — STATIC 기본 retry(1) override
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) return false;
      return failureCount < 1;
    },
  });
}

/**
 * Template version+1 — SoftFork apply_forward (Phase 1B-E) 또는 admin 명시 수정.
 *
 * Backend CAS:
 * - body.supersededBy는 호출 시점의 latest.id이어야 함
 * - body.version은 latest.version + 1 (불일치 시 400 INSPECTION_TEMPLATE_INVALID_VERSION)
 * - 동시 수정 시 unique constraint 위반 → 409 INSPECTION_TEMPLATE_VERSION_CONFLICT
 *
 * ⚠️ Phase 1B-E TODO — useCasGuardedMutation 패턴 wrap:
 *   현재는 단순 useMutation — 호출자가 *직접* useLatestTemplate으로 fresh supersededBy/version 확보 후
 *   호출하는 구조. SoftForkDialog 통합 시 fetchCasVersion=getLatestTemplate(...).then(t => t.id)로
 *   fetch-before-mutate 패턴 적용 권장 (memory: useCasGuardedMutation SSOT).
 *   1B-D 시점에는 hook 정의만 — 호출자 0건.
 *
 * 호출자(SoftForkDialog 1B-E) 책임:
 * - 409 시 useToast + 사용자 안내 ("다른 사용자가 먼저 수정") — 계약 M-3.2
 * - onSuccess에서 inspection submit 진행
 *
 * onSettled cache invalidate: backend cache event(INSPECTION_TEMPLATE_VERSION_UP)와 함께 안전망.
 */
export function useUpsertTemplate(equipmentId: string) {
  const qc = useQueryClient();

  return useMutation<UpsertInspectionTemplateResponse, Error, UpsertInspectionTemplateBody>({
    mutationFn: (body) => upsertTemplate(equipmentId, body),
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.inspectionTemplate.latest(equipmentId, variables.inspectionType),
      });
    },
  });
}

/**
 * Template Gallery 조회 — Phase 1B-F.
 *
 * 비슷한 장비의 검증된 template 목록 (modelName / classificationCode 매칭).
 * 첫 점검 + template 부재 시 InspectionFormDialog가 자동 노출 trigger.
 *
 * SSOT:
 * - QUERY_CONFIG.INSPECTION_TEMPLATE = STATIC (gallery도 거의 변경 없음)
 * - queryKeys.inspectionTemplate.gallery — 호출자별 매칭 파라미터로 분리
 *
 * @param enabled — 호출자가 결정 (template 404 + Gallery 조건 만족 시만 fetch)
 */
export function useTemplateGallery(
  params: {
    inspectionType: 'intermediate' | 'self';
    modelName?: string;
    classificationCode?: string;
    limit?: number;
  },
  options: { enabled?: boolean } = {}
) {
  const enabled = options.enabled ?? true;

  return useQuery<{ items: InspectionTemplateGalleryEntry[] }>({
    queryKey: enabled
      ? queryKeys.inspectionTemplate.gallery(params)
      : ['inspectionTemplate', 'gallery', 'disabled'],
    queryFn: () => getTemplateGallery(params),
    enabled,
    ...QUERY_CONFIG.INSPECTION_TEMPLATE,
  });
}

/**
 * Template fetch 옵션 합성 (외부 useQuery에서 직접 사용 — gallery 등 다른 trigger와 합성 시).
 * 일반 사용은 useLatestTemplate 권장.
 */
export function buildLatestTemplateQueryOptions(
  equipmentId: string,
  type: 'intermediate' | 'self'
): UseQueryOptions<InspectionTemplateLatestResponse> {
  return {
    queryKey: [...queryKeys.inspectionTemplate.latest(equipmentId, type)],
    queryFn: () => getLatestTemplate(equipmentId, type),
    ...QUERY_CONFIG.INSPECTION_TEMPLATE,
  };
}
