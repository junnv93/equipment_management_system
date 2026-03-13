-- checkout_items: 인덱스 전무 → 조인/조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS checkout_items_checkout_id_idx
  ON checkout_items(checkout_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS checkout_items_equipment_id_idx
  ON checkout_items(equipment_id);

-- checkouts: 기한 초과 탐지 최적화 (스케줄러 EVERY_HOUR)
CREATE INDEX CONCURRENTLY IF NOT EXISTS checkouts_status_expected_return_idx
  ON checkouts(status, expected_return_date);
