import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  InspectionJudgmentEnum,
  InspectionResultEnum,
  InspectionResultSectionTypeEnum,
  EquipmentClassificationEnum,
  uuidString,
  VM,
} from '@equipment-management/schemas';

const inspectionItemSchema = z.object({
  itemNumber: z.number().int().min(1),
  checkItem: z.string().min(1, VM.required('점검 항목')).max(300, VM.string.max('점검 항목', 300)),
  checkCriteria: z
    .string()
    .min(1, VM.required('점검 기준'))
    .max(300, VM.string.max('점검 기준', 300)),
  checkResult: z.string().max(300, VM.string.max('점검 결과', 300)).optional(),
  detailedResult: z.string().optional(),
  judgment: InspectionJudgmentEnum.optional(),
});

const inspectionEquipmentSchema = z.object({
  equipmentId: uuidString(VM.uuid.invalid('장비')),
  calibrationDate: z.string().optional(), // ISO date string
});

const inlineResultSectionSchema = z.object({
  sortOrder: z.number().int().min(0),
  sectionType: InspectionResultSectionTypeEnum,
  title: z.string().max(200, VM.string.max('제목', 200)).optional(),
  content: z.string().optional(),
  tableData: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    })
    .optional(),
  richTableData: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(
        z.array(
          z.discriminatedUnion('type', [
            z.object({ type: z.literal('text'), value: z.string() }),
            z.object({
              type: z.literal('image'),
              documentId: uuidString(VM.uuid.invalid('문서')),
              widthCm: z.number().min(1).max(30).optional(),
              heightCm: z.number().min(1).max(30).optional(),
            }),
          ])
        )
      ),
    })
    .optional(),
  documentId: uuidString(VM.uuid.invalid('문서')).optional(),
  imageWidthCm: z.number().min(1).max(30).optional(),
  imageHeightCm: z.number().min(1).max(30).optional(),
});

export const createInspectionSchema = z.object({
  calibrationId: uuidString(VM.uuid.invalid('교정 기록')).optional(),
  inspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다'),
  classification: EquipmentClassificationEnum.optional(),
  inspectionCycle: z.string().max(20, VM.string.max('점검 주기', 20)).optional(),
  calibrationValidityPeriod: z.string().max(50, VM.string.max('교정 유효기간', 50)).optional(),
  overallResult: InspectionResultEnum.optional(),
  remarks: z.string().optional(),
  items: z.array(inspectionItemSchema).optional(),
  measurementEquipment: z.array(inspectionEquipmentSchema).optional(),
  resultSections: z.array(inlineResultSectionSchema).optional(),
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export const CreateInspectionPipe = new ZodValidationPipe(createInspectionSchema);
