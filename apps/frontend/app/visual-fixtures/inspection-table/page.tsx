/**
 * Visual Regression Fixture — inspection result table editor.
 *
 * Dev/test 전용 페이지. 중첩 점검 다이얼로그에서 사용하는 표 편집기의
 * toolbar, column delete affordance, empty cell 상태를 실제 브라우저에서 검증한다.
 */

import { notFound } from 'next/navigation';
import VisualTableEditorFixture from '@/components/inspections/result-sections/VisualTableEditorFixture';

export default function InspectionTableVisualFixturePage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-muted/30 p-8">
      <VisualTableEditorFixture />
    </main>
  );
}
