-- equipment_test_software 역방향 인덱스 추가
-- testSoftwareId 단독 조회 최적화: "이 SW가 사용되는 장비 목록" 쿼리
-- (unique idx equipment_test_software_unique_idx의 leading column이 equipment_id이므로
--  test_software_id 단독 WHERE 조회 시 full scan 발생 → 역방향 인덱스 필요)

CREATE INDEX IF NOT EXISTS "equipment_test_software_test_software_id_idx"
ON "equipment_test_software" USING btree ("test_software_id");
