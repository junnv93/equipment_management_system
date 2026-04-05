export { createInspectionSchema, CreateInspectionPipe } from './create-inspection.dto';
export type { CreateInspectionInput } from './create-inspection.dto';

export { updateInspectionSchema, UpdateInspectionPipe } from './update-inspection.dto';
export type { UpdateInspectionInput } from './update-inspection.dto';

export { submitInspectionSchema, SubmitInspectionPipe } from './submit-inspection.dto';
export type { SubmitInspectionInput } from './submit-inspection.dto';

export {
  approveInspectionSchema,
  ApproveInspectionPipe,
  rejectInspectionSchema,
  RejectInspectionPipe,
} from './approve-inspection.dto';
export type { ApproveInspectionInput, RejectInspectionInput } from './approve-inspection.dto';
