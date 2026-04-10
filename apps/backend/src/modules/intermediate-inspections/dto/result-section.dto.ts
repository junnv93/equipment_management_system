import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { InspectionResultSectionTypeEnum, uuidString, VM } from '@equipment-management/schemas';

const tableDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

const richCellSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({
    type: z.literal('image'),
    documentId: uuidString(VM.uuid.invalid('문서')),
    widthCm: z.number().min(1).max(30).optional(),
    heightCm: z.number().min(1).max(30).optional(),
  }),
]);

const richTableDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(richCellSchema)),
});

export const createResultSectionSchema = z.object({
  sortOrder: z.number().int().min(0),
  sectionType: InspectionResultSectionTypeEnum,
  title: z.string().max(200, VM.string.max('제목', 200)).optional(),
  content: z.string().optional(),
  tableData: tableDataSchema.optional(),
  richTableData: richTableDataSchema.optional(),
  documentId: uuidString(VM.uuid.invalid('문서')).optional(),
  imageWidthCm: z.number().min(1).max(30).optional(),
  imageHeightCm: z.number().min(1).max(30).optional(),
});

export type CreateResultSectionInput = z.infer<typeof createResultSectionSchema>;
export const CreateResultSectionPipe = new ZodValidationPipe(createResultSectionSchema);

export const updateResultSectionSchema = createResultSectionSchema.partial();

export type UpdateResultSectionInput = z.infer<typeof updateResultSectionSchema>;
export const UpdateResultSectionPipe = new ZodValidationPipe(updateResultSectionSchema);
