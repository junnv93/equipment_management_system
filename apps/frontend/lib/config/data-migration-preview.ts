/**
 * Data migration preview rendering limits.
 *
 * Excel preview can contain hundreds or thousands of rows. Keep the execution
 * payload complete, but render only a bounded window of rows at a time.
 */
export const DATA_MIGRATION_PREVIEW_PAGE_SIZE = 100 as const;
