/**
 * Backfill Inspection Form Templates — Phase 1B-C
 *
 * 기존 approved inspection들을 source로 inspection_form_templates에 첫 version 생성.
 * Build-Once Workflow 출시 후, 기존 데이터에 대해 한 번 실행하여 history backfill.
 *
 * Idempotent: 이미 template 존재하는 (equipmentId, type) pair는 skip.
 * Transaction: 각 template 생성을 트랜잭션으로 감싸 부분 실패 시 rollback.
 *
 * 실행:
 *   pnpm --filter backend exec ts-node scripts/backfill-inspection-templates.ts --dry-run
 *   pnpm --filter backend exec ts-node scripts/backfill-inspection-templates.ts
 *
 * 옵션:
 *   --dry-run        write 0, "would create N templates" 출력만
 *   --type=<type>    'intermediate' 또는 'self' 만 처리 (기본: 둘 다)
 *   --equipment-id=<uuid>   특정 장비만 처리 (디버그용)
 *   --verbose        상세 로그
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, desc, eq, isNull } from 'drizzle-orm';
import {
  intermediateInspections,
  intermediateInspectionItems,
  equipmentSelfInspections,
  selfInspectionItems,
  inspectionResultSections,
  inspectionFormTemplates,
} from '@equipment-management/db/schema';
import {
  extractStructureFromInspection,
  type InspectionType,
} from '@equipment-management/schemas';
import { loadMonorepoEnv, resolveDatabaseUrl } from '@equipment-management/db/load-env';

loadMonorepoEnv();

interface BackfillOptions {
  dryRun: boolean;
  typeFilter: InspectionType | null;
  equipmentIdFilter: string | null;
  verbose: boolean;
}

export interface BackfillResult {
  inspectionType: InspectionType;
  equipmentId: string;
  inspectionId: string;
  status: 'created' | 'skipped' | 'failed';
  reason?: string;
}

export function parseBackfillOptions(args = process.argv.slice(2)): BackfillOptions {
  const opts: BackfillOptions = {
    dryRun: args.includes('--dry-run'),
    typeFilter: null,
    equipmentIdFilter: null,
    verbose: args.includes('--verbose'),
  };

  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      const v = arg.split('=')[1];
      if (v === 'intermediate' || v === 'self') opts.typeFilter = v;
    }
    if (arg.startsWith('--equipment-id=')) {
      opts.equipmentIdFilter = arg.split('=')[1] ?? null;
    }
  }

  return opts;
}

export async function backfillIntermediate(
  db: ReturnType<typeof drizzle>,
  opts: BackfillOptions
): Promise<BackfillResult[]> {
  const results: BackfillResult[] = [];

  // 1. 모든 *approved* intermediate inspection 중 가장 최근 (per equipment) 추출
  //    DB-side window function 대신 application-side 그룹화 (rows 적은 것으로 가정).
  //    각 (equipmentId)에 대해 가장 최근 approvedAt 사용.
  const where = opts.equipmentIdFilter
    ? and(
        eq(intermediateInspections.approvalStatus, 'approved'),
        eq(intermediateInspections.equipmentId, opts.equipmentIdFilter)
      )
    : eq(intermediateInspections.approvalStatus, 'approved');

  const inspections = await db
    .select()
    .from(intermediateInspections)
    .where(where)
    .orderBy(desc(intermediateInspections.approvedAt));

  // group by equipmentId, take first (latest by approvedAt)
  const latestPerEquipment = new Map<string, (typeof inspections)[number]>();
  for (const insp of inspections) {
    if (!latestPerEquipment.has(insp.equipmentId)) {
      latestPerEquipment.set(insp.equipmentId, insp);
    }
  }

  if (opts.verbose) {
    console.log(
      `  [intermediate] ${inspections.length} approved inspections, ${latestPerEquipment.size} unique equipment`
    );
  }

  for (const [equipmentId, insp] of latestPerEquipment) {
    // 이미 template 존재 시 skip (idempotent)
    const [existing] = await db
      .select({ id: inspectionFormTemplates.id })
      .from(inspectionFormTemplates)
      .where(
        and(
          eq(inspectionFormTemplates.equipmentId, equipmentId),
          eq(inspectionFormTemplates.inspectionType, 'intermediate'),
          isNull(inspectionFormTemplates.supersededBy),
          isNull(inspectionFormTemplates.deletedAt)
        )
      )
      .limit(1);

    if (existing) {
      results.push({
        inspectionType: 'intermediate',
        equipmentId,
        inspectionId: insp.id,
        status: 'skipped',
        reason: 'template already exists',
      });
      continue;
    }

    // items + sections 조회
    const [items, sections] = await Promise.all([
      db
        .select()
        .from(intermediateInspectionItems)
        .where(eq(intermediateInspectionItems.inspectionId, insp.id))
        .orderBy(intermediateInspectionItems.itemNumber),
      db
        .select()
        .from(inspectionResultSections)
        .where(
          and(
            eq(inspectionResultSections.inspectionId, insp.id),
            eq(inspectionResultSections.inspectionType, 'intermediate')
          )
        )
        .orderBy(inspectionResultSections.sortOrder),
    ]);

    if (items.length === 0 && sections.length === 0) {
      results.push({
        inspectionType: 'intermediate',
        equipmentId,
        inspectionId: insp.id,
        status: 'skipped',
        reason: 'no items or sections (empty inspection)',
      });
      continue;
    }

    const structure = extractStructureFromInspection({ items, resultSections: sections });

    if (opts.dryRun) {
      results.push({
        inspectionType: 'intermediate',
        equipmentId,
        inspectionId: insp.id,
        status: 'created',
        reason: '[dry-run] would create',
      });
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        await tx.insert(inspectionFormTemplates).values({
          equipmentId,
          inspectionType: 'intermediate',
          version: 1,
          structure,
          sourceInspectionId: insp.id,
          createdBy: null, // 시스템 backfill
        });
      });
      results.push({
        inspectionType: 'intermediate',
        equipmentId,
        inspectionId: insp.id,
        status: 'created',
      });
    } catch (err) {
      results.push({
        inspectionType: 'intermediate',
        equipmentId,
        inspectionId: insp.id,
        status: 'failed',
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

export async function backfillSelf(
  db: ReturnType<typeof drizzle>,
  opts: BackfillOptions
): Promise<BackfillResult[]> {
  const results: BackfillResult[] = [];

  const where = opts.equipmentIdFilter
    ? and(
        eq(equipmentSelfInspections.approvalStatus, 'approved'),
        eq(equipmentSelfInspections.equipmentId, opts.equipmentIdFilter)
      )
    : eq(equipmentSelfInspections.approvalStatus, 'approved');

  const inspections = await db
    .select()
    .from(equipmentSelfInspections)
    .where(where)
    .orderBy(desc(equipmentSelfInspections.approvedAt));

  const latestPerEquipment = new Map<string, (typeof inspections)[number]>();
  for (const insp of inspections) {
    if (!latestPerEquipment.has(insp.equipmentId)) {
      latestPerEquipment.set(insp.equipmentId, insp);
    }
  }

  if (opts.verbose) {
    console.log(
      `  [self] ${inspections.length} approved inspections, ${latestPerEquipment.size} unique equipment`
    );
  }

  for (const [equipmentId, insp] of latestPerEquipment) {
    const [existing] = await db
      .select({ id: inspectionFormTemplates.id })
      .from(inspectionFormTemplates)
      .where(
        and(
          eq(inspectionFormTemplates.equipmentId, equipmentId),
          eq(inspectionFormTemplates.inspectionType, 'self'),
          isNull(inspectionFormTemplates.supersededBy),
          isNull(inspectionFormTemplates.deletedAt)
        )
      )
      .limit(1);

    if (existing) {
      results.push({
        inspectionType: 'self',
        equipmentId,
        inspectionId: insp.id,
        status: 'skipped',
        reason: 'template already exists',
      });
      continue;
    }

    const [items, sections] = await Promise.all([
      db
        .select()
        .from(selfInspectionItems)
        .where(eq(selfInspectionItems.inspectionId, insp.id))
        .orderBy(selfInspectionItems.itemNumber),
      db
        .select()
        .from(inspectionResultSections)
        .where(
          and(
            eq(inspectionResultSections.inspectionId, insp.id),
            eq(inspectionResultSections.inspectionType, 'self')
          )
        )
        .orderBy(inspectionResultSections.sortOrder),
    ]);

    if (items.length === 0 && sections.length === 0) {
      results.push({
        inspectionType: 'self',
        equipmentId,
        inspectionId: insp.id,
        status: 'skipped',
        reason: 'no items or sections',
      });
      continue;
    }

    const structure = extractStructureFromInspection({ items, resultSections: sections });

    if (opts.dryRun) {
      results.push({
        inspectionType: 'self',
        equipmentId,
        inspectionId: insp.id,
        status: 'created',
        reason: '[dry-run] would create',
      });
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        await tx.insert(inspectionFormTemplates).values({
          equipmentId,
          inspectionType: 'self',
          version: 1,
          structure,
          sourceInspectionId: insp.id,
          createdBy: null,
        });
      });
      results.push({
        inspectionType: 'self',
        equipmentId,
        inspectionId: insp.id,
        status: 'created',
      });
    } catch (err) {
      results.push({
        inspectionType: 'self',
        equipmentId,
        inspectionId: insp.id,
        status: 'failed',
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

async function main(): Promise<void> {
  const opts = parseBackfillOptions();

  console.log('🔄 Inspection Template Backfill 시작');
  console.log(
    `   모드: ${opts.dryRun ? 'DRY-RUN (write 0)' : 'EXECUTE (트랜잭션 적용)'}`
  );
  if (opts.typeFilter) console.log(`   타입 필터: ${opts.typeFilter}`);
  if (opts.equipmentIdFilter) console.log(`   장비 필터: ${opts.equipmentIdFilter}`);
  console.log();

  const pool = new Pool({ connectionString: resolveDatabaseUrl() });
  const db = drizzle(pool);

  try {
    const allResults: BackfillResult[] = [];

    if (!opts.typeFilter || opts.typeFilter === 'intermediate') {
      console.log('📋 intermediate inspection 처리 중...');
      const r = await backfillIntermediate(db, opts);
      allResults.push(...r);
    }

    if (!opts.typeFilter || opts.typeFilter === 'self') {
      console.log('📋 self inspection 처리 중...');
      const r = await backfillSelf(db, opts);
      allResults.push(...r);
    }

    // ─── 결과 요약 ───
    const created = allResults.filter((r) => r.status === 'created');
    const skipped = allResults.filter((r) => r.status === 'skipped');
    const failed = allResults.filter((r) => r.status === 'failed');

    console.log();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 결과 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ${opts.dryRun ? 'would create' : 'created'}: ${created.length}`);
    console.log(`⏭️  skipped:                       ${skipped.length}`);
    console.log(`❌ failed:                          ${failed.length}`);
    console.log();

    if (opts.verbose || failed.length > 0) {
      console.log('상세 결과:');
      for (const r of allResults) {
        const icon = r.status === 'created' ? '✅' : r.status === 'skipped' ? '⏭️ ' : '❌';
        console.log(
          `  ${icon} [${r.inspectionType}] equipment=${r.equipmentId.slice(0, 8)}... ` +
            `inspection=${r.inspectionId.slice(0, 8)}... ${r.reason ? `(${r.reason})` : ''}`
        );
      }
    }

    if (failed.length > 0) {
      console.log();
      console.log(`⚠️  ${failed.length}건 실패 — 위 로그 검토 후 재실행 (idempotent)`);
      process.exit(1);
    }
  } catch (err) {
    console.error('🚨 백필 실행 중 오류:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  void main();
}
