import Link from 'next/link';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 팀 상세 Not Found 페이지
 */
export default function TeamNotFound() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
          <Users className="h-12 w-12 text-gray-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          팀을 찾을 수 없습니다
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          요청하신 팀이 존재하지 않거나 삭제되었을 수 있습니다.
          팀 ID를 확인해주세요.
        </p>

        <Button asChild className="gap-2">
          <Link href="/teams">
            <ArrowLeft className="h-4 w-4" />
            팀 목록으로 돌아가기
          </Link>
        </Button>
      </div>
    </div>
  );
}
