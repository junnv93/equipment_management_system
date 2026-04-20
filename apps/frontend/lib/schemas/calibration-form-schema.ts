import { z } from 'zod';
import { CalibrationResultEnum, uuidString } from '@equipment-management/schemas';

/**
 * 교정 등록 폼 스키마 (프론트엔드 전용)
 *
 * ⚠️ z.instanceof(File)는 브라우저 전용 — packages/schemas에 넣지 않음.
 * 백엔드 multipart payload 검증은 apps/backend/.../calibration.dto.ts 참조.
 *
 * 모든 진입점(page / dialog / plan-item / resubmit)에서 이 단일 schema 사용.
 */
export const createCalibrationFormSchema = (t: (key: string) => string) =>
  z
    .object({
      equipmentId: uuidString(),
      calibrationDate: z.date({ error: t('calibration.form.dateRequired') }),
      nextCalibrationDate: z.date({ error: t('calibration.form.nextDateRequired') }),
      calibrationCycle: z.coerce
        .number({ error: t('calibration.form.cycleInvalid') })
        .int()
        .min(1)
        .max(60),
      calibrationAgency: z
        .string({ error: t('calibration.form.agencyRequired') })
        .min(1, t('calibration.form.agencyRequired'))
        .max(100),
      certificateNumber: z.string().max(100).optional(),
      certificateFile: z.instanceof(File, { error: t('calibration.form.fileRequired') }),
      result: CalibrationResultEnum,
      notes: z.string().optional(),
      intermediateCheckDate: z.date().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.nextCalibrationDate <= data.calibrationDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('calibration.form.nextDateMustBeAfter'),
          path: ['nextCalibrationDate'],
        });
      }
      if (
        data.intermediateCheckDate &&
        (data.intermediateCheckDate <= data.calibrationDate ||
          data.intermediateCheckDate >= data.nextCalibrationDate)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('calibration.form.intermediateCheckDateInvalid'),
          path: ['intermediateCheckDate'],
        });
      }
    });

export type CalibrationFormValues = z.input<ReturnType<typeof createCalibrationFormSchema>>;
export type CalibrationFormOutput = z.output<ReturnType<typeof createCalibrationFormSchema>>;
