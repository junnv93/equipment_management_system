# Pre-baseline 마이그레이션 아카이브

2026-04-07 baseline squash 시점(0000~0005 SQL 및 스냅샷들)의 스냅샷입니다.

이 폴더는 **감사/이력 추적 목적으로만 보존**됩니다. drizzle-kit은 이 폴더를 읽지 않습니다 (`../`의 `meta/_journal.json`만 사용).

- 왜 squash 했는지 + 업계 표준 비교 + 앞으로의 규칙: `docs/development/DRIZZLE_MIGRATIONS.md`
- 현재 활성 마이그레이션: `../0000_baseline.sql`

이 폴더를 삭제하지 마세요. 혹시라도 과거 마이그레이션 중 특정 변경(예: "언제 equipment.deputy_manager_id가 추가됐지?")을 추적해야 할 때 참고하는 유일한 기록입니다.
