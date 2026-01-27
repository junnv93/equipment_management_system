import { Suspense } from 'react';
import { CalibrationRegisterContent } from './CalibrationRegisterContent';

export default function CalibrationRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">교정 등록 페이지를 불러오는 중...</p>
        </div>
      }
    >
      <CalibrationRegisterContent />
    </Suspense>
  );
}
