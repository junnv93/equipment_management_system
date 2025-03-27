import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAccessToken } from '@/lib/session';
import { ApiError } from '@/lib/exceptions';

/**
 * 예약 완료 및 장비 반납 처리 API 핸들러
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { message: '인증 토큰이 유효하지 않습니다.' },
        { status: 401 }
      );
    }

    // 백엔드 API 호출
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/reservations/${params.id}/complete`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // 응답 처리
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || '장비 반납 처리 중 오류가 발생했습니다.', response.status);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('장비 반납 처리 오류:', error);
    const status = error instanceof ApiError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json({ message }, { status });
  }
} 