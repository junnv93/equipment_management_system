/**
 * 장비 등록 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component에서 세션 읽고 사용자 기본값을 Client Component로 전달
 * - Client bundle 분리를 통해 컴파일 성능 개선
 * - server-serialization: 최소한의 데이터만 직렬화하여 전달
 *
 * @see Vercel Best Practice: server-serialization
 */

import { getCurrentUser } from '@/lib/auth/server-session';
import CreateEquipmentContent from './CreateEquipmentContent';

export default async function CreateEquipmentPage() {
  // ✅ Server Component에서 세션 읽기 (동기적, 즉시 사용 가능)
  const user = await getCurrentUser();

  // Client Component에 전달할 사용자 기본값 (최소 직렬화)
  const userDefaults = {
    site: user?.site,
    teamId: user?.teamId,
  };

  return <CreateEquipmentContent userDefaults={userDefaults} />;
}
