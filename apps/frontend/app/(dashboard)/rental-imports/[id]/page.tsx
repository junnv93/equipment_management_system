import RentalImportDetailClient from './RentalImportDetailClient';

export default async function RentalImportDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <RentalImportDetailClient id={id} />;
}
