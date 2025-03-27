import { Reservation } from '@/lib/types/reservation';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * 모든 예약 목록을 가져옵니다
 */
export async function getReservations(): Promise<Reservation[]> {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  const response = await fetch(`${API_URL}/api/v1/reservations`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reservations: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * 특정 ID의 예약 정보를 가져옵니다
 */
export async function getReservation(id: string): Promise<Reservation | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  const response = await fetch(`${API_URL}/api/v1/reservations/${id}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch reservation: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
} 