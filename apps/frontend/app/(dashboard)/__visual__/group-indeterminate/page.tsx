/**
 * Visual Regression Fixture — CheckoutGroupCard 헤더 indeterminate (Sprint 4.5 S3, TR-5 v2)
 *
 * **격리 검증** — 부모 통합(OutboundCheckoutsTab/InboundCheckoutsTab은 useBulkSelection 부재)
 * 없이도 그룹 헤더 indeterminate가 진짜 작동함을 e2e에서 증명한다.
 *
 * 본 페이지는 **개발/테스트 전용**. production 빌드에서는 `notFound()` 반환.
 *
 * SSOT 직접 import — 그룹 row id 추출/3-state 결정 로직은 `lib/checkouts/group-selection.ts`
 * 가 단일 SSOT. 본 fixture는 그 SSOT를 통해 토글 상태를 관리.
 */

'use client';

import { useState, useCallback } from 'react';
import { notFound } from 'next/navigation';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { getGroupRowIds } from '@/lib/checkouts/group-selection';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';
import type { Checkout } from '@/lib/api/checkout-api';

// ── Mock fixture group (3 row, 동일 destination) ─────────────────────────────

const FIXTURE_GROUP: CheckoutGroup = {
  key: '2026-04-30|fixture-lab',
  date: '2026-04-30',
  latestCreatedAt: '2026-04-30T00:00:00Z',
  dateLabel: 'checkouts.groupCard.checkoutDateLabel',
  dateLabelKey: 'checkouts.groupCard.checkoutDateLabel',
  destination: 'Fixture Lab',
  checkouts: [
    {
      id: 'fixture-c1',
      status: 'pending',
      purpose: 'calibration',
      user: { name: 'User A' },
      equipment: [{ id: 'eq1', name: 'Equipment 1', managementNumber: 'F-001' }],
      destination: 'Fixture Lab',
      meta: { availableActions: {} },
    },
    {
      id: 'fixture-c2',
      status: 'pending',
      purpose: 'calibration',
      user: { name: 'User B' },
      equipment: [{ id: 'eq2', name: 'Equipment 2', managementNumber: 'F-002' }],
      destination: 'Fixture Lab',
      meta: { availableActions: {} },
    },
    {
      id: 'fixture-c3',
      status: 'pending',
      purpose: 'calibration',
      user: { name: 'User C' },
      equipment: [{ id: 'eq3', name: 'Equipment 3', managementNumber: 'F-003' }],
      destination: 'Fixture Lab',
      meta: { availableActions: {} },
    },
  ] as unknown as Checkout[],
  totalEquipment: 3,
  statuses: [],
  purposes: ['calibration'],
};

export default function GroupIndeterminateFixturePage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const [selectedRowIds, setSelectedRowIds] = useState<ReadonlySet<string>>(() => new Set());

  const toggleRow = useCallback((id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onToggleGroup = useCallback((rowIds: readonly string[], allCurrentlySelected: boolean) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (allCurrentlySelected) {
        for (const id of rowIds) next.delete(id);
      } else {
        for (const id of rowIds) next.add(id);
      }
      return next;
    });
  }, []);

  const groupRowIds = getGroupRowIds(FIXTURE_GROUP);

  return (
    <main className="p-8 bg-background">
      <h1 className="text-base font-semibold mb-4">Group indeterminate fixture (Sprint 4.5 S3)</h1>
      <CheckoutGroupCard
        group={FIXTURE_GROUP}
        onCheckoutClick={() => undefined}
        selectedRowIds={selectedRowIds}
        onToggleGroup={onToggleGroup}
      />
      {/* 시뮬레이션 row 토글 버튼 — e2e가 row checkbox 미보유 환경에서 selection 변경 트리거 */}
      <section className="mt-6 flex flex-wrap gap-2" data-testid="row-toggle-buttons">
        {groupRowIds.map((id) => (
          <button
            key={id}
            type="button"
            data-testid={`toggle-row-${id}`}
            data-selected={selectedRowIds.has(id) ? 'true' : 'false'}
            onClick={() => toggleRow(id)}
            className="px-3 py-1.5 text-xs rounded-md border border-border bg-card hover:bg-muted"
          >
            Toggle {id} {selectedRowIds.has(id) ? '✓' : ''}
          </button>
        ))}
      </section>
      <p
        data-testid="selected-count"
        data-count={selectedRowIds.size}
        className="mt-4 text-xs text-muted-foreground"
      >
        Selected: {selectedRowIds.size} / {groupRowIds.length}
      </p>
    </main>
  );
}
