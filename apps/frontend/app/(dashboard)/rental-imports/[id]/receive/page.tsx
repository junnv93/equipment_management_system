import ReceiveRentalImportClient from './ReceiveRentalImportClient';

export default async function ReceiveRentalImportPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <ReceiveRentalImportClient id={id} />;
}
