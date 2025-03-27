import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { ReservationList } from '@/components/reservations/ReservationList';
import { CalendarIcon, PlusIcon } from 'lucide-react';

interface ReservationsPageProps {
  params: {
    locale: string;
  };
}

export default async function ReservationsPage({ 
  params 
}: ReservationsPageProps) {
  const { locale } = params;
  const t = await getTranslations('reservations');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/reservations/calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t('actions.calendarView')}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/reservations/create">
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('actions.newReservation')}
            </Link>
          </Button>
        </div>
      </div>
      
      <ReservationList locale={locale} />
    </div>
  );
} 