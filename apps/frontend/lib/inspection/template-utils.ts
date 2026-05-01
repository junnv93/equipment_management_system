/**
 * Inspection Template Utilities — Frontend Re-export Facade
 *
 * SSOT는 `packages/schemas/src/utils/inspection-template.ts` (Phase 1B-A 이전).
 * 본 파일은 frontend 기존 import 경로(`@/lib/inspection/template-utils`)를 보존하기 위한
 * re-export 파사드 — Generator Phase 1B-A에서 함수 본체는 packages로 이전됨.
 *
 * 신규 코드는 직접 `@equipment-management/schemas`에서 import 권장.
 * 기존 RTL 27 tests는 본 파사드를 통해 동일하게 동작.
 */

export {
  extractStructureFromInspection,
  describeStructureCounts,
  diffStructures,
} from '@equipment-management/schemas';

export type {
  ExtractedInspectionStructure as ExtractedStructure,
  InspectionItemFormShape,
  InspectionTemplateSource,
  StructureDiff,
  ForkChoice,
} from '@equipment-management/schemas';
