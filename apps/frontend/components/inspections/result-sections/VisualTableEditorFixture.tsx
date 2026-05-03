'use client';

import { useState } from 'react';
import VisualTableEditor from './VisualTableEditor';
import type { RichCell } from '@/lib/api/calibration-api';

const INITIAL_HEADERS = ['외관', '기준', '판정'];
const INITIAL_ROWS: RichCell[][] = [
  [
    { type: 'text', value: '' },
    { type: 'text', value: '' },
    { type: 'text', value: '' },
  ],
];

export default function VisualTableEditorFixture() {
  const [headers, setHeaders] = useState(INITIAL_HEADERS);
  const [rows, setRows] = useState(INITIAL_ROWS);

  return (
    <section
      data-testid="inspection-table-editor-fixture"
      className="w-full max-w-[840px] rounded-lg border bg-background p-4 shadow-xl sm:p-6"
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold">외관 검사 — 테이블</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          점검 결과에 포함할 표, 사진, 텍스트 또는 제목 섹션을 작성합니다.
        </p>
      </div>
      <VisualTableEditor
        headers={headers}
        rows={rows}
        onChange={(nextHeaders, nextRows) => {
          setHeaders(nextHeaders);
          setRows(nextRows);
        }}
        sortOrder={0}
      />
      <div className="mt-4 flex justify-end gap-2 border-t pt-4">
        <button type="button" className="rounded-md border px-4 py-2 text-sm text-muted-foreground">
          취소
        </button>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          저장
        </button>
      </div>
    </section>
  );
}
