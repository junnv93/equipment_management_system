import { notFound } from 'next/navigation';
import { getReservation } from '@/lib/api/server/reservations';
import { ReservationDetails } from '@/components/reservations/ReservationDetails';
import { PageHeader } from '@/components/shared/PageHeader';
import { getTranslations } from '@/lib/i18n/server';

interface ReservationDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function ReservationDetailPage({ 
  params 
}: ReservationDetailPageProps) {
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
          title={t('detail.title')}
          subtitle={t('detail.subtitle')}
          backUrl="/reservations"
          backLabel={t('common.backToList')}
        />
        
        <ReservationDetails 
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