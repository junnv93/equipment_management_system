-- 20260212_add_checkout_indexes.sql
-- B-3: checkouts 테이블 쿼리 성능 인덱스 추가

-- 내 반출 목록 조회 최적화 (WHERE requester_id = ?)
CREATE INDEX IF NOT EXISTS checkouts_requester_id_idx
  ON checkouts (requester_id);

-- 승인 대기 목록 필터 (WHERE status = ?)
CREATE INDEX IF NOT EXISTS checkouts_status_idx
  ON checkouts (status);

-- 최신순 정렬 + 상태 필터 (WHERE status = ? ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS checkouts_status_created_at_idx
  ON checkouts (status, created_at);
