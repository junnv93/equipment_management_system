/**
 * 공용/렌탈 장비 임시등록 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component에서 세션 읽고 사용자 기본값을 Client Component로 전달
 * - Client bundle 분리를 통해 컴파일 성능 개선
 *
 * @see Vercel Best Practice: server-serialization
 */

import { getCurrentUser } from '@/lib/auth/server-session';
import CreateSharedEquipmentContent from './CreateSharedEquipmentContent';

export default async function CreateSharedEquipmentPage() {
  const user = await getCurrentUser();

  const userDefaults = {
    site: user?.site,
    teamId: user?.teamId,
  };

  return <CreateSharedEquipmentContent userDefaults={userDefaults} />;
}
