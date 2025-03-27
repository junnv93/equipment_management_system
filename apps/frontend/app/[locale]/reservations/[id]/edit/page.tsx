import { notFound } from 'next/navigation';
import { getReservation } from '@/lib/api/server/reservations';
import { ReservationEditForm } from '@/components/reservations/ReservationEditForm';
import { PageHeader } from '@/components/shared/PageHeader';
import { getTranslations } from '@/lib/i18n/server';

interface ReservationEditPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function ReservationEditPage({ 
  params 
}: ReservationEditPageProps) {
  const { id, locale } = params;
  const t = await getTranslations({ locale, namespace: 'reservations' });
  
  try {
    const reservation = await getReservation(id);
    
    if (!reservation) {
      return notFound();
    }
    
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('edit.title')}
          subtitle={t('edit.subtitle')}
          backUrl={`/reservations/${id}`}
          backLabel={t('common.backToDetails')}
        />
        
        <ReservationEditForm 
          reservation={reservation} 
          locale={locale}
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return notFound();
  }
} 