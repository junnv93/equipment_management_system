import { redirect } from 'next/navigation';

export default function RentalImportApprovalsPage() {
  redirect('/admin/approvals?tab=rental_import');
}
