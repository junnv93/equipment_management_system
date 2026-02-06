import SoftwareHistoryClient from './SoftwareHistoryClient';

/**
 * 소프트웨어 변경 이력 페이지 (Server Component)
 *
 * Next.js 16 패턴: params를 Promise로 받아 Client Component에 전달
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EquipmentSoftwareHistoryPage(props: PageProps) {
  const { id } = await props.params;

  return <SoftwareHistoryClient equipmentId={id} />;
}
