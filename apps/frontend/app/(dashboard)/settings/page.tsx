import { redirect } from 'next/navigation';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

export default function SettingsPage() {
  redirect(FRONTEND_ROUTES.SETTINGS.PROFILE);
}
