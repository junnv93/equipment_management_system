-- Pre-check: orphan guard.
-- 제약 추가 전, 기존 데이터에 dangling reference 가 존재하면 ADD CONSTRAINT 가
-- 크립틱한 에러로 중단된다. 명시적 RAISE 로 원인을 드러내어 운영 복구를 쉽게 한다.
-- (참고: 개발 main 에 최초 적용 시 0 orphans 확인됨)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count FROM (
    SELECT 1 FROM notifications n WHERE n.recipient_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = n.recipient_id)
    UNION ALL
    SELECT 1 FROM notifications n WHERE n.team_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = n.team_id)
    UNION ALL
    SELECT 1 FROM notifications n WHERE n.equipment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e.id = n.equipment_id)
    UNION ALL
    SELECT 1 FROM notifications n WHERE n.actor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = n.actor_id)
  ) AS orphans;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'notifications table has % dangling references. Clean them before applying FK constraints: DELETE FROM notifications WHERE <offending col> IS NOT NULL AND <offending col> NOT IN (SELECT id FROM <parent>);', orphan_count;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;