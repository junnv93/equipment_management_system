import { PageHeader } from '@/components/shared/PageHeader';
import { ReservationCalendar } from '@/components/reservations/ReservationCalendar';
import { getTranslations } from 'next-intl/server';

interface ReservationCalendarPageProps {
  params: {
    locale: string;
  };
}

export default async function ReservationCalendarPage({ 
  params 
}: ReservationCalendarPageProps) {
  const { locale } = params;
  const t = await getTranslations('reservations');
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('calendar.title')}
        subtitle={t('calendar.subtitle')}
        backUrl="/reservations"
        backLabel={t('common.backToList')}
      />
      
      <ReservationCalendar />
    </div>
  );
} 