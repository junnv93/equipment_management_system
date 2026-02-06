import NonConformanceManagementClient from './NonConformanceManagementClient';

/**
 * 부적합 관리 페이지 (Server Component)
 *
 * Next.js 16 패턴: params를 Promise로 받아 Client Component에 전달
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NonConformanceManagementPage(props: PageProps) {
  const { id } = await props.params;

  return <NonConformanceManagementClient equipmentId={id} />;
}
