import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import PageHeader from '@/components/shared/PageHeader';
import { ReservationCalendar } from '@/components/reservations/ReservationCalendar';
import { getCurrentUser } from '@/lib/auth/session';

export default async function CalendarPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  const t = await getTranslations('reservations');
  
  return (
    <div className="container mx-auto py-4 space-y-6">
      <PageHeader 
        title={t('title')} 
        subtitle={t('subtitle')}
        backUrl="/reservations"
        backLabel={t('common.backToList')}
      />
      
      <ReservationCalendar />
    </div>
  );
} 