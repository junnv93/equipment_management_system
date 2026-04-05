-- test_software 테이블에 등록자(createdBy) 컬럼 추가

ALTER TABLE test_software
  ADD COLUMN created_by UUID
    REFERENCES users(id)
    ON DELETE RESTRICT;
