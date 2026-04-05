-- 유효성확인에 입수 일자 + 제작자 컬럼 추가 (UL-QP-18-09)

ALTER TABLE software_validations
  ADD COLUMN info_date TIMESTAMP,
  ADD COLUMN software_author VARCHAR(200);
