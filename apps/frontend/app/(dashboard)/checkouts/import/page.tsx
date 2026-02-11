import { redirect } from 'next/navigation';

/**
 * Equipment Import Selection
 * Redirects to rental import page (most common use case)
 *
 * For internal shared imports, use /checkouts/import/shared
 */
export default function ImportPage() {
  redirect('/checkouts/import/rental');
}
