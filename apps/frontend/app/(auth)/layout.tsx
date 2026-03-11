import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 - 장비 관리 시스템',
  description: '장비 관리 시스템에 로그인하여 장비 등록, 교정 관리, 대여/반출 기능을 이용하세요.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/50">{children}</div>;
}
