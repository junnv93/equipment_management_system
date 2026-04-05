-- calibration_plans user FK 제약조건 추가 (누락분)

ALTER TABLE calibration_plans
  ADD CONSTRAINT calibration_plans_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT calibration_plans_reviewed_by_fk
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT calibration_plans_approved_by_fk
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT calibration_plans_rejected_by_fk
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE calibration_plan_items
  ADD CONSTRAINT calibration_plan_items_confirmed_by_fk
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE RESTRICT;
